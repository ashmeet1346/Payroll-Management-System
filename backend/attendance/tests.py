from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Shift, AttendanceRecord, AttendanceImportBatch
from workers.models import Worker
from departments.models import Department
from payroll.calculations import calculate_working_and_overtime


class AttendanceCalculationAndWorkflowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='att_admin', password='Password@123')
        self.client.force_authenticate(user=self.user)
        self.dept = Department.objects.create(name='Machining')
        self.worker1 = Worker.objects.create(worker_id='W-ATT-1', name='Anil Sharma', department=self.dept)
        self.worker2 = Worker.objects.create(worker_id='W-ATT-2', name='Sunil Verma', department=self.dept)

    def test_working_hours_and_overtime_math(self):
        # 8:00 AM to 5:00 PM is 9 hours span -> 9 hours total, net 9.0h (break is 60m if span >= 9.5h)
        calc1 = calculate_working_and_overtime('08:00 AM', '05:00 PM')
        self.assertEqual(calc1['working_hours'], Decimal('9.00'))
        self.assertEqual(calc1['overtime_hours'], Decimal('1.00'))

        # 8:00 AM to 6:30 PM is 10.5h span -> Deducts 60m break -> 9.5h net -> 1.5h OT
        calc2 = calculate_working_and_overtime('08:00 AM', '06:30 PM')
        self.assertEqual(calc2['working_hours'], Decimal('9.50'))
        self.assertEqual(calc2['overtime_hours'], Decimal('1.50'))

        # Night shift crossing midnight: 10:00 PM to 06:00 AM (8h)
        calc3 = calculate_working_and_overtime('10:00 PM', '06:00 AM')
        self.assertEqual(calc3['working_hours'], Decimal('8.00'))
        self.assertEqual(calc3['overtime_hours'], Decimal('0.00'))

    def test_bulk_attendance_save(self):
        payload = {
            'date': '2026-10-15',
            'records': [
                {
                    'workerId': 'W-ATT-1',
                    'status': 'Present',
                    'timeIn': '08:00 AM',
                    'timeOut': '05:00 PM',
                    'breakMinutes': 60
                },
                {
                    'workerId': 'W-ATT-2',
                    'status': 'Absent',
                    'timeIn': '',
                    'timeOut': '',
                }
            ]
        }
        res = self.client.post('/api/attendance/bulk/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)

        rec1 = AttendanceRecord.objects.get(worker=self.worker1, attendance_date='2026-10-15')
        self.assertEqual(rec1.status, 'Present')
        self.assertEqual(rec1.working_hours, Decimal('9.00'))

        rec2 = AttendanceRecord.objects.get(worker=self.worker2, attendance_date='2026-10-15')
        self.assertEqual(rec2.status, 'Absent')
        self.assertEqual(rec2.working_hours, Decimal('0.00'))

    def test_bulk_approve_and_reject(self):
        rec1 = AttendanceRecord.objects.create(worker=self.worker1, attendance_date='2026-10-12', status='Present')
        rec2 = AttendanceRecord.objects.create(worker=self.worker2, attendance_date='2026-10-12', status='Absent')

        # Approve records
        res = self.client.post('/api/attendance/approve-bulk/', {
            'record_ids': [rec1.id, rec2.id],
            'action': 'Approved',
            'reason': 'Verified by shift supervisor'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['updated_count'], 2)

        rec1.refresh_from_db()
        self.assertEqual(rec1.approval_status, 'Approved')
        self.assertEqual(rec1.approved_by, self.user)

    def test_locked_attendance_cannot_be_overwritten(self):
        rec = AttendanceRecord.objects.create(
            worker=self.worker1,
            attendance_date='2026-10-10',
            status='Present',
            approval_status=AttendanceRecord.APPROVAL_LOCKED
        )
        res = self.client.patch(f'/api/attendance/records/{rec.id}/', {
            'status': 'Absent'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        rec.refresh_from_db()
        self.assertEqual(rec.status, 'Present')

    def test_daily_attendance_stats(self):
        AttendanceRecord.objects.create(worker=self.worker1, attendance_date='2026-10-14', status='Present', overtime_hours=Decimal('2.00'))
        AttendanceRecord.objects.create(worker=self.worker2, attendance_date='2026-10-14', status='Absent')

        res = self.client.get('/api/attendance/stats/daily/?date=2026-10-14')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['present'], 1)
        self.assertEqual(res.data['absent'], 1)
        self.assertEqual(res.data['total_overtime_hours'], 2.0)

    def test_attendance_punch_creation_and_listing(self):
        payload = {
            'worker': self.worker1.id,
            'punch_time': '2026-10-15T08:05:00Z',
            'punch_type': 'IN',
            'device_id': 'BIO-GATE-TEST',
            'location': 'Gate 1'
        }
        res = self.client.post('/api/attendance/punches/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['worker_id_code'], self.worker1.worker_id)
        self.assertEqual(res.data['punch_type'], 'IN')

        res_list = self.client.get(f'/api/attendance/punches/?worker={self.worker1.worker_id}')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        results = res_list.data if isinstance(res_list.data, list) else res_list.data.get('results', [])
        self.assertEqual(len(results), 1)
