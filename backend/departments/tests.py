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
            'code': 'PRD001',
            'description': 'Forging and machining floor',
            'head': 'Rajesh Kumar',
            'location': 'Bay 1'
        }
        response = self.client.post('/api/departments/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Production')
        self.assertEqual(response.data['code'], 'PRD001')
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


class DesignationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='ashmeet_desig',
            password='Ashmeet@123'
        )
        self.client.force_authenticate(user=self.user)
        self.department = Department.objects.create(name='Tool Room', description='Tool room machining')

    def test_create_designation_success(self):
        payload = {
            'title': 'CNC Operator',
            'code': 'CNO001',
            'department': self.department.id,
            'description': 'Operates CNC turning machine'
        }
        response = self.client.post('/api/departments/designations/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'CNC Operator')
        self.assertEqual(response.data['code'], 'CNO001')
        self.assertEqual(response.data['department_name'], 'Tool Room')

    def test_department_invalid_code_format_rejected(self):
        # Code must be exactly 3 letters + 3 numbers
        for bad_code in ('DEP-01', '123456', 'DEPT01', 'DP001', 'DEP0001'):
            res = self.client.post('/api/departments/', {'name': f'Dept {bad_code}', 'code': bad_code})
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('code', res.data)

    def test_duplicate_designation_in_same_department_rejected(self):
        from .models import Designation
        Designation.objects.create(title='Lathe Operator', code='LTH001', department=self.department)
        payload = {
            'title': 'Lathe Operator',
            'code': 'LTH002',
            'department': self.department.id,
            'description': 'Duplicate operator'
        }
        response = self.client.post('/api/departments/designations/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_designations_filter_by_department(self):
        from .models import Designation
        dept2 = Department.objects.create(name='Assembly')
        Designation.objects.create(title='Fitter', code='FIT001', department=self.department)
        Designation.objects.create(title='Assembler', code='ASM001', department=dept2)

        response = self.client.get(f'/api/departments/designations/?department={self.department.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Fitter')

    def test_department_code_collision_with_department_or_designation(self):
        from .models import Designation
        Department.objects.create(name='Dept Existing', code='ALF001')
        Designation.objects.create(title='Desig Existing', code='BET001', department=self.department)

        # Department trying to use another department's code
        res1 = self.client.post('/api/departments/', {'name': 'New Dept 1', 'code': 'alf001'})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', res1.data)

        # Department trying to use a designation's code
        res2 = self.client.post('/api/departments/', {'name': 'New Dept 2', 'code': 'BET001'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', res2.data)

    def test_designation_code_collision_with_department_or_designation(self):
        from .models import Designation
        Department.objects.create(name='Dept Sec', code='SEC088')
        Designation.objects.create(title='Desig Guard', code='GRD088', department=self.department)

        # Designation trying to use a department's code
        res1 = self.client.post('/api/departments/designations/', {
            'title': 'New Desig 1',
            'code': 'sec088',
            'department': self.department.id
        })
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', res1.data)

        # Designation trying to use another designation's code
        res2 = self.client.post('/api/departments/designations/', {
            'title': 'New Desig 2',
            'code': 'GRD088',
            'department': self.department.id
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', res2.data)

