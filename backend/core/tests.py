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


class CoreValidatorsTests(TestCase):
    """
    Exhaustive tests for the central validation suite.
    """
    def test_name_validation(self):
        from core.validators import validate_name_string
        from rest_framework.exceptions import ValidationError

        # Valid names
        self.assertEqual(validate_name_string('Rahul Kumar'), 'Rahul Kumar')
        self.assertEqual(validate_name_string("Amit O'Connor"), "Amit O'Connor")
        self.assertEqual(validate_name_string('Gurpreet Singh-Gill'), 'Gurpreet Singh-Gill')
        self.assertEqual(validate_name_string('Dr. Ramesh Rao'), 'Dr. Ramesh Rao')

        # Invalid names
        with self.assertRaises(ValidationError):
            validate_name_string('Rahul123')
        with self.assertRaises(ValidationError):
            validate_name_string('12345')
        with self.assertRaises(ValidationError):
            validate_name_string('@#$Rahul')
        with self.assertRaises(ValidationError):
            validate_name_string('A')  # too short
        with self.assertRaises(ValidationError):
            validate_name_string('   ')

    def test_mobile_validation(self):
        from core.validators import validate_indian_mobile
        from rest_framework.exceptions import ValidationError

        # Valid Indian mobiles (must start with 6, 7, 8, or 9)
        self.assertEqual(validate_indian_mobile('9876543210'), '9876543210')
        self.assertEqual(validate_indian_mobile('+91 8123456789'), '8123456789')
        self.assertEqual(validate_indian_mobile('7006543210'), '7006543210')
        self.assertEqual(validate_indian_mobile('6234567890'), '6234567890')

        # Invalid mobiles
        with self.assertRaises(ValidationError):
            validate_indian_mobile('5123456789')  # Starts with 5
        with self.assertRaises(ValidationError):
            validate_indian_mobile('987654321')  # 9 digits
        with self.assertRaises(ValidationError):
            validate_indian_mobile('98765432100')  # 11 digits
        with self.assertRaises(ValidationError):
            validate_indian_mobile('98765ABCD0')  # contains letters

    def test_email_validation(self):
        from core.validators import validate_email_address
        from rest_framework.exceptions import ValidationError

        self.assertEqual(validate_email_address('Worker@domain.com'), 'worker@domain.com')
        with self.assertRaises(ValidationError):
            validate_email_address('invalid-email-string', required=True)

    def test_aadhaar_validation_and_masking(self):
        from core.validators import validate_aadhaar_number, mask_aadhaar, validate_verhoeff
        from rest_framework.exceptions import ValidationError

        # Verhoeff check
        # Generating a valid test Aadhaar number with correct Verhoeff checksum
        # Example valid Verhoeff number: 209736518429
        self.assertTrue(validate_verhoeff('209736518429'))
        self.assertEqual(validate_aadhaar_number('2097-3651-8429'), '209736518429')
        self.assertEqual(mask_aadhaar('209736518429'), '•••• •••• 8429')

        # Rejects repeated identical digits
        with self.assertRaises(ValidationError):
            validate_aadhaar_number('111111111111')
        with self.assertRaises(ValidationError):
            validate_aadhaar_number('000000000000')

        # Rejects non-numeric / incorrect length
        with self.assertRaises(ValidationError):
            validate_aadhaar_number('20973651842')  # 11 digits
        with self.assertRaises(ValidationError):
            validate_aadhaar_number('2097365184200')  # 13 digits
        with self.assertRaises(ValidationError):
            validate_aadhaar_number('20973651842A')

    def test_pan_validation(self):
        from core.validators import validate_pan_number
        from rest_framework.exceptions import ValidationError

        self.assertEqual(validate_pan_number('abcde1234f'), 'ABCDE1234F')
        self.assertEqual(validate_pan_number('BKRPK1234Z'), 'BKRPK1234Z')

        with self.assertRaises(ValidationError):
            validate_pan_number('ABCD12345F')  # 4 letters, 5 numbers
        with self.assertRaises(ValidationError):
            validate_pan_number('12345ABCDE')
        with self.assertRaises(ValidationError):
            validate_pan_number('ABCDE12345')

    def test_bank_account_and_ifsc(self):
        from core.validators import validate_bank_account_number, mask_bank_account, validate_ifsc_code
        from rest_framework.exceptions import ValidationError

        self.assertEqual(validate_bank_account_number('001234567890'), '001234567890')
        self.assertEqual(mask_bank_account('001234567890'), '••••••••7890')

        with self.assertRaises(ValidationError):
            validate_bank_account_number('12345')  # < 9 digits
        with self.assertRaises(ValidationError):
            validate_bank_account_number('1234567890123456789')  # > 18 digits

        self.assertEqual(validate_ifsc_code('sbin0001234'), 'SBIN0001234')
        self.assertEqual(validate_ifsc_code('HDFC0004321'), 'HDFC0004321')

        with self.assertRaises(ValidationError):
            validate_ifsc_code('SBIN1001234')  # 5th char must be 0
        with self.assertRaises(ValidationError):
            validate_ifsc_code('SBI0001234')  # < 11 chars

    def test_entity_code_validation(self):
        from core.validators import validate_entity_code
        from rest_framework.exceptions import ValidationError

        # Exactly 3 letters + 3 digits
        self.assertEqual(validate_entity_code('dep001'), 'DEP001')
        self.assertEqual(validate_entity_code('ACT102'), 'ACT102')
        self.assertEqual(validate_entity_code('CON001'), 'CON001')

        with self.assertRaises(ValidationError):
            validate_entity_code('DEP-01')
        with self.assertRaises(ValidationError):
            validate_entity_code('DE001')
        with self.assertRaises(ValidationError):
            validate_entity_code('DEP0001')
        with self.assertRaises(ValidationError):
            validate_entity_code('123DEP')
