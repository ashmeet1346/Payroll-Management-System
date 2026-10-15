from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Department


class DepartmentAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='ashmeet123',
            password='Ashmeet@123'
        )
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_access_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/departments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_department_success(self):
        payload = {
            'name': 'Production',
            'description': 'Forging and machining floor',
            'head': 'Rajesh Kumar',
            'location': 'Bay 1'
        }
        response = self.client.post('/api/departments/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Production')
        self.assertEqual(response.data['status'], 'Active')
        self.assertEqual(response.data['total_workers'], 0)
        self.assertTrue(Department.objects.filter(name='Production').exists())

    def test_duplicate_department_name_rejected(self):
        Department.objects.create(name='Quality', description='Quality control')
        payload = {
            'name': 'Quality',
            'description': 'Duplicate quality department'
        }
        response = self.client.post('/api/departments/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_invalid_input_blank_name_rejected(self):
        payload = {
            'name': '   ',
            'description': 'Blank name'
        }
        response = self.client.post('/api/departments/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_list_departments(self):
        Department.objects.create(name='Maintenance')
        Department.objects.create(name='Store')
        response = self.client.get('/api/departments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Results can be in results key if paginated or direct list
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
