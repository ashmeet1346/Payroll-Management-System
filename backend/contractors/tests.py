from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Contractor, Contract, ContractorWorkerAssignment, ContractorBill
from workers.models import Worker
from departments.models import Department


class ContractorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testadmin', password='Password@123')
        self.client.force_authenticate(user=self.user)
        self.dept = Department.objects.create(name='Forging Plant')
        self.worker = Worker.objects.create(
            worker_id='W-TEST-1',
            name='Ramesh Kumar',
            department=self.dept,
            status='Active'
        )

    def test_create_contractor_success(self):
        payload = {
            'contractor_id': 'CON-001',
            'name': 'Apex Manpower Agency',
            'contact_person': 'Suresh Sharma',
            'phone': '9876543210',
            'email': 'suresh@apex.com',
            'is_active': True
        }
        res = self.client.post('/api/contractors/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['contractor_id'], 'CON-001')
        self.assertEqual(res.data['name'], 'Apex Manpower Agency')

    def test_duplicate_contractor_id_rejected(self):
        Contractor.objects.create(contractor_id='CON-001', name='Apex Manpower')
        res = self.client.post('/api/contractors/', {
            'contractor_id': 'CON-001',
            'name': 'Duplicate Agency'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contractor_worker_assignment(self):
        contractor = Contractor.objects.create(contractor_id='CON-002', name='Zenith Workers')
        res = self.client.post('/api/contractors/assignments/', {
            'contractor': contractor.id,
            'worker': self.worker.id,
            'department': self.dept.id,
            'start_date': '2026-01-01',
            'is_active': True
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(contractor.total_assigned_workers, 1)

    def test_contractor_bill_workflow(self):
        contractor = Contractor.objects.create(contractor_id='CON-003', name='Delta Works')
        bill = ContractorBill.objects.create(
            invoice_number='INV-2026-001',
            invoice_date='2026-10-15',
            billing_period_start='2026-10-01',
            billing_period_end='2026-10-15',
            contractor=contractor,
            total_man_days=Decimal('100.00'),
            agreed_rate=Decimal('600.00'),
            base_amount=Decimal('60000.00'),
            tax_amount=Decimal('10800.00'),
            approved_amount=Decimal('70800.00'),
            status=ContractorBill.STATUS_DRAFT
        )

        # 1. Approve bill
        res_appr = self.client.post(f'/api/contractors/bills/{bill.id}/approve/', {
            'approved_amount': '70800.00'
        })
        self.assertEqual(res_appr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_appr.data['status'], 'Approved')

        # 2. Record partial payment
        res_pay = self.client.post(f'/api/contractors/bills/{bill.id}/pay/', {
            'amount': '35400.00',
            'payment_reference': 'NEFT-12345'
        })
        self.assertEqual(res_pay.status_code, status.HTTP_200_OK)
        bill.refresh_from_db()
        self.assertEqual(bill.payment_amount, Decimal('35400.00'))
        self.assertEqual(bill.outstanding_balance, Decimal('35400.00'))

        # 3. Prevent overpayment
        res_overpay = self.client.post(f'/api/contractors/bills/{bill.id}/pay/', {
            'amount': '50000.00'
        })
        self.assertEqual(res_overpay.status_code, status.HTTP_400_BAD_REQUEST)
