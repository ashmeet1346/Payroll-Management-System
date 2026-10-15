from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Advance, AdvanceTransaction
from .calculations import calculate_monthly_advance_recovery, calculate_total_worker_advance_recovery
from workers.models import Worker
from departments.models import Department


class AdvanceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='adv_admin', password='Password@123')
        self.client.force_authenticate(user=self.user)
        self.dept = Department.objects.create(name='Heat Treatment')
        self.worker = Worker.objects.create(worker_id='W-ADV-1', name='Mukesh Joshi', department=self.dept)

    def test_create_advance_with_initial_disbursement(self):
        payload = {
            'advance_id': 'ADV-101',
            'worker': self.worker.id,
            'advance_type': 'Salary Advance',
            'principal_amount': '5000.00',
            'monthly_deduction': '5000.00',
            'issue_date': '2026-10-01',
            'reason': 'Medical emergency'
        }
        res = self.client.post('/api/advances/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        advance = Advance.objects.get(advance_id='ADV-101')
        self.assertEqual(advance.outstanding_balance, Decimal('5000.00'))
        self.assertEqual(advance.transactions.count(), 1)
        self.assertEqual(advance.transactions.first().transaction_type, 'Disbursement')

    def test_repayment_validation_and_ledger(self):
        advance = Advance.objects.create(
            advance_id='FA-201',
            worker=self.worker,
            advance_type='Fixed Advance',
            principal_amount=Decimal('10000.00'),
            monthly_deduction=Decimal('2000.00'),
            issue_date='2026-09-01',
            outstanding_balance=Decimal('10000.00'),
            status='Approved'
        )

        # 1. Successful partial repayment
        res1 = self.client.post(f'/api/advances/{advance.id}/repay/', {
            'amount': '2000.00',
            'reference_number': 'REC-001',
            'notes': 'Monthly cash repayment'
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        advance.refresh_from_db()
        self.assertEqual(advance.outstanding_balance, Decimal('8000.00'))
        self.assertEqual(advance.transactions.count(), 1)
        self.assertEqual(advance.transactions.first().balance_after, Decimal('8000.00'))

        # 2. Reject repayment exceeding balance
        res2 = self.client.post(f'/api/advances/{advance.id}/repay/', {
            'amount': '15000.00'
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        advance.refresh_from_db()
        self.assertEqual(advance.outstanding_balance, Decimal('8000.00'))

    def test_monthly_advance_recovery_math(self):
        advance = Advance.objects.create(
            advance_id='FA-301',
            worker=self.worker,
            advance_type='Fixed Advance',
            principal_amount=Decimal('3000.00'),
            monthly_deduction=Decimal('2000.00'),
            issue_date='2026-10-01',
            outstanding_balance=Decimal('1500.00'),  # Less than monthly recovery
            status='Approved'
        )
        # Should cap recovery at outstanding balance (1500.00), not full monthly deduction (2000.00)
        recovery = calculate_monthly_advance_recovery(advance)
        self.assertEqual(recovery, Decimal('1500.00'))
