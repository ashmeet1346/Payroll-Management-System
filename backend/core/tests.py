from django.test import TestCase
from django.db import connection
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class DatabaseConnectivityTests(TestCase):
    """
    Tests for live database connectivity and test queries.
    """
    def test_database_connection_and_query(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row[0], 1)


class CoreAPITests(APITestCase):
    """
    Tests for Health check and Authentication endpoints.
    """
    def setUp(self):
        self.user = User.objects.create_user(
            username='ashmeet123',
            password='Ashmeet@123',
            email='ashmeet@paysphere.local'
        )

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertTrue(response.data['database']['connected'])

    def test_auth_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'ashmeet123',
            'password': 'Ashmeet@123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'ashmeet123')

    def test_auth_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'ashmeet123',
            'password': 'WrongPassword999'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_auth_me_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'ashmeet123')

    def test_auth_me_unauthenticated(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
