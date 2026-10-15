from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import SalaryRuleConfig, PayrollPeriod, PayrollLine, SalaryPayment
from .calculations import calculate_worker_salary, calculate_payable_days
from workers.models import Worker
from departments.models import Department
from attendance.models import AttendanceRecord
from advances.models import Advance


class PayrollCalculationAndWorkflowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='payroll_admin', password='Password@123')
        self.client.force_authenticate(user=self.user)
        self.dept = Department.objects.create(name='Die Shop')
        self.worker = Worker.objects.create(
            worker_id='W-PAY-1',
            name='Dinesh Rathore',
            department=self.dept,
            wage_basis='Monthly',
            base_wage=Decimal('26000.00'),
            status='Active'
        )
        self.rule = SalaryRuleConfig.objects.create(name='Test Rules', standard_month_days=26)

    def test_salary_calculation_formula_accuracy(self):
        # 26 days month, base 26000 -> 1000/day
        # 26 payable days, 5 hours approved OT, 1000 advance deduction
        res = calculate_worker_salary(
            base_wage=Decimal('26000.00'),
            wage_basis='Monthly',
            payable_days=Decimal('26.00'),
            approved_ot_hours=Decimal('5.00'),
            advance_deduction=Decimal('1000.00'),
            rule_config=self.rule,
            total_month_days=26
        )

        # Basic = 50% of 26000 = 13000
        self.assertEqual(res['basic_salary'], Decimal('13000.00'))
        # DA = 20% of 26000 = 5200
        self.assertEqual(res['da'], Decimal('5200.00'))
        # HRA = 20% of 26000 = 5200
        self.assertEqual(res['hra'], Decimal('5200.00'))

        # Daily rate = 1000, 8h shift -> normal hourly = 125.00 -> 2x OT rate = 250.00
        # 5h OT * 250.00 = 1250.00
        self.assertEqual(res['overtime_amount'], Decimal('1250.00'))

        # PF = 12% on min(Basic+DA, 15000) -> 12% of 15000 = 1800.00
        self.assertEqual(res['pf_deduction'], Decimal('1800.00'))

        # ESI = 0 because monthly base (26000) > ESI ceiling (21000)
        self.assertEqual(res['esi_deduction'], Decimal('0.00'))

        # Professional Tax = 200.00
        self.assertEqual(res['pt_deduction'], Decimal('200.00'))

        # Advance deduction = 1000.00
        self.assertEqual(res['advance_deduction'], Decimal('1000.00'))

        # Total deductions = 1800 + 200 + 1000 = 3000.00
        self.assertEqual(res['total_deductions'], Decimal('3000.00'))

    def test_full_payroll_cycle_calculate_approve_pay(self):
        # 1. Create attendance for period
        AttendanceRecord.objects.create(
            worker=self.worker,
            attendance_date='2026-10-01',
            status='Present',
            approval_status='Approved',
            overtime_hours=Decimal('2.00')
        )
        AttendanceRecord.objects.create(
            worker=self.worker,
            attendance_date='2026-10-02',
            status='Present',
            approval_status='Approved'
        )

        # 2. Create advance for worker
        advance = Advance.objects.create(
            advance_id='ADV-PAY-1',
            worker=self.worker,
            advance_type='Salary Advance',
            principal_amount=Decimal('500.00'),
            monthly_deduction=Decimal('500.00'),
            outstanding_balance=Decimal('500.00'),
            issue_date='2026-10-01',
            status='Approved'
        )

        # 3. Create payroll period
        period = PayrollPeriod.objects.create(
            name='October 2026',
            month=10,
            year=2026,
            start_date='2026-10-01',
            end_date='2026-10-31'
        )

        # 4. Trigger calculation
        res_calc = self.client.post(f'/api/payroll/periods/{period.id}/calculate/')
        self.assertEqual(res_calc.status_code, status.HTTP_200_OK)
        period.refresh_from_db()
        self.assertEqual(period.status, 'Calculated')
        self.assertTrue(period.total_net_payable > 0)

        line = period.lines.first()
        self.assertIsNotNone(line)
        self.assertEqual(line.advance_deduction, Decimal('500.00'))

        # 5. Approve payroll -> posts advance deduction to advance ledger
        res_appr = self.client.post(f'/api/payroll/periods/{period.id}/approve/')
        self.assertEqual(res_appr.status_code, status.HTTP_200_OK)
        period.refresh_from_db()
        self.assertEqual(period.status, 'Approved')

        advance.refresh_from_db()
        self.assertEqual(advance.outstanding_balance, Decimal('0.00'))
        self.assertEqual(advance.status, 'Completed')

        # 6. Record payment against payroll line
        res_pay = self.client.post(f'/api/payroll/lines/{line.id}/pay/', {
            'amount': str(line.net_payable),
            'payment_method': 'Bank Transfer',
            'reference_number': 'SAL-OCT-001'
        })
        self.assertEqual(res_pay.status_code, status.HTTP_200_OK)
        line.refresh_from_db()
        self.assertEqual(line.payment_status, 'Paid')
        self.assertEqual(line.outstanding_balance, Decimal('0.00'))

        # 7. Check payslip endpoint
        res_slip = self.client.get(f'/api/payroll/lines/{line.id}/payslip/')
        self.assertEqual(res_slip.status_code, status.HTTP_200_OK)
        self.assertEqual(res_slip.data['worker']['worker_id'], 'W-PAY-1')
        self.assertEqual(res_slip.data['net_payable'], float(line.net_payable))
