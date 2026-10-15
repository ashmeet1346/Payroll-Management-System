from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from departments.models import Department
from .models import Worker


class WorkerAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='ashmeet123',
            password='Ashmeet@123'
        )
        self.client.force_authenticate(user=self.user)
        self.dept_prod = Department.objects.create(name='Production')
        self.dept_maint = Department.objects.create(name='Maintenance')

    def test_unauthenticated_worker_access_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/workers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_worker_success(self):
        payload = {
            'worker_id': 'W001',
            'name': 'Rajesh Kumar',
            'department_id': self.dept_prod.id,
            'designation': 'Senior Forging Master',
            'phone': '+91 98765 43201',
            'joining_date': '2024-01-12',
            'status': 'Active',
            'worker_type': 'Permanent'
        }
        response = self.client.post('/api/workers/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['worker_id'], 'W001')
        self.assertEqual(response.data['name'], 'Rajesh Kumar')
        self.assertEqual(response.data['department_name'], 'Production')
        self.assertTrue(Worker.objects.filter(worker_id='W001').exists())

    def test_duplicate_worker_id_rejected(self):
        Worker.objects.create(
            worker_id='W002',
            name='Sunil Yadav',
            department=self.dept_maint
        )
        payload = {
            'worker_id': 'W002',  # Duplicate ID
            'name': 'Duplicate Worker',
            'department_id': self.dept_maint.id
        }
        response = self.client.post('/api/workers/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('worker_id', response.data)

    def test_invalid_input_blank_worker_id_and_name_rejected(self):
        payload = {
            'worker_id': '   ',
            'name': '   ',
        }
        response = self.client.post('/api/workers/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('worker_id', response.data)
        self.assertIn('name', response.data)

    def test_invalid_status_rejected(self):
        payload = {
            'worker_id': 'W005',
            'name': 'Test Worker',
            'status': 'NonExistentStatus'
        }
        response = self.client.post('/api/workers/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_authorised_worker_deactivation(self):
        worker = Worker.objects.create(
            worker_id='W003',
            name='Amit Singh',
            status=Worker.STATUS_ACTIVE,
            department=self.dept_prod
        )
        response = self.client.post(f'/api/workers/{worker.id}/deactivate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        worker.refresh_from_db()
        self.assertEqual(worker.status, Worker.STATUS_INACTIVE)
        self.assertIn('deactivated', response.data['detail'])

    def test_worker_search_and_department_filtering(self):
        w1 = Worker.objects.create(
            worker_id='W010',
            name='Harpreet Singh',
            department=self.dept_prod,
            designation='Lathe Specialist'
        )
        w2 = Worker.objects.create(
            worker_id='W020',
            name='Gurpreet Kaur',
            department=self.dept_maint,
            designation='Electrician'
        )

        # Search by name query
        response = self.client.get('/api/workers/?search=Harpreet')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['worker_id'], 'W010')

        # Filter by department id
        response_dept = self.client.get(f'/api/workers/?department={self.dept_maint.id}')
        self.assertEqual(response_dept.status_code, status.HTTP_200_OK)
        results_dept = response_dept.data.get('results', response_dept.data)
        self.assertEqual(len(results_dept), 1)
        self.assertEqual(results_dept[0]['worker_id'], 'W020')

    def test_dynamic_department_worker_count(self):
        Worker.objects.create(
            worker_id='W031',
            name='Worker One',
            department=self.dept_prod,
            status=Worker.STATUS_ACTIVE
        )
        Worker.objects.create(
            worker_id='W032',
            name='Worker Two',
            department=self.dept_prod,
            status=Worker.STATUS_INACTIVE
        )

        response = self.client.get(f'/api/departments/{self.dept_prod.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only active workers counted dynamically
        self.assertEqual(response.data['total_workers'], 1)
