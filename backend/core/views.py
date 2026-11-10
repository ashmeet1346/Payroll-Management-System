from decimal import Decimal
from django.db import connection
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Company, AuditLog, DataStore
from .serializers import LoginSerializer, UserSerializer, CompanySerializer, AuditLogSerializer


class HealthCheckView(APIView):
    """
    Check the health of the API and verify database connectivity.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        db_connected = False
        db_error = None
        db_engine = connection.settings_dict.get('ENGINE', 'unknown')

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1;')
                row = cursor.fetchone()
                if row and row[0] == 1:
                    db_connected = True
        except Exception as exc:
            db_connected = False
            db_error = str(exc)

        data = {
            'status': 'healthy' if db_connected else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'database': {
                'connected': db_connected,
                'engine': db_engine,
                'error': db_error,
            },
            'service': 'PaySphere Backend API',
        }
        return Response(
            data,
            status=status.HTTP_200_OK if db_connected else status.HTTP_503_SERVICE_UNAVAILABLE
        )


class AuthLoginView(APIView):
    """
    Authenticate user credentials and return an authentication token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        # Audit login
        try:
            AuditLog.objects.create(
                actor=user,
                action='LOGIN',
                model_name='User',
                record_id=str(user.id),
                details={'username': user.username},
                ip_address=request.META.get('REMOTE_ADDR')
            )
        except Exception:
            pass

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful.',
        }, status=status.HTTP_200_OK)


class AuthLogoutView(APIView):
    """
    Revoke current user authentication token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Token.objects.filter(user=request.user).delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    Return profile data of the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class UserListCreateView(generics.ListCreateAPIView):
    """
    Manage system users (Super Admin / HR Admin).
    """
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class CompanyView(APIView):
    """
    Retrieve or update company organization settings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(
                name='PaySphere Forging Industries Ltd.',
                legal_name='PaySphere Forging Pvt. Ltd.',
                tax_id='27AAACP0123M1Z2'
            )
        return Response(CompanySerializer(company).data)

    def put(self, request):
        company = Company.objects.first()
        if not company:
            company = Company.objects.create()
        serializer = CompanySerializer(company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AuditLogListView(generics.ListAPIView):
    """
    Audit log list endpoint with filters.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['action', 'model_name']
    search_fields = ['record_id', 'action', 'model_name']


class DataStoreView(APIView):
    """
    Get or update persistent module collections in the database.
    Supports Contractors, Advances, Attendance, and other custom data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, key):
        entry = DataStore.objects.filter(key=key).first()
        data = entry.data if entry else []
        return Response({'key': key, 'data': data}, status=status.HTTP_200_OK)

    def post(self, request, key):
        payload = request.data.get('data') if (isinstance(request.data, dict) and 'data' in request.data) else request.data
        entry, _ = DataStore.objects.get_or_create(key=key)
        entry.data = payload
        entry.save()
        return Response({'key': key, 'data': entry.data, 'message': 'Data saved to database.'}, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    Aggregated enterprise metrics for the Executive Dashboard.
    Reconciles real counts from Worker, Attendance, Payroll, and Advance models.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from workers.models import Worker
        from attendance.models import AttendanceRecord
        from payroll.models import PayrollPeriod
        from advances.models import Advance
        from contractors.models import Contractor

        today = timezone.localdate()

        # 1. Workforce totals
        total_workers = Worker.objects.count()
        active_workers = Worker.objects.filter(status='Active').count()
        contractors_count = Contractor.objects.filter(is_active=True).count()

        # 2. Today's Attendance
        today_records = AttendanceRecord.objects.filter(attendance_date=today)
        if today_records.exists():
            present_today = today_records.filter(status='Present').count()
            absent_today = today_records.filter(status='Absent').count()
            leave_today = today_records.filter(status='Leave').count()
        else:
            # Check latest available attendance date if today hasn't been marked yet
            latest_date_entry = AttendanceRecord.objects.order_by('-attendance_date').first()
            if latest_date_entry:
                records = AttendanceRecord.objects.filter(attendance_date=latest_date_entry.attendance_date)
                present_today = records.filter(status='Present').count()
                absent_today = records.filter(status='Absent').count()
                leave_today = records.filter(status='Leave').count()
            else:
                present_today = 0
                absent_today = 0
                leave_today = 0

        # 3. Payroll Totals
        latest_payroll = PayrollPeriod.objects.order_by('-year', '-month', '-run_number').first()
        if latest_payroll:
            payroll_month = latest_payroll.name
            total_salary = float(latest_payroll.total_gross)
            total_deductions = float(latest_payroll.total_deductions)
            net_salary = float(latest_payroll.total_net_payable)
            total_paid = float(latest_payroll.total_paid)
            outstanding_salary = float(latest_payroll.outstanding_salary)
        else:
            payroll_month = 'None'
            total_salary = 0.0
            total_deductions = 0.0
            net_salary = 0.0
            total_paid = 0.0
            outstanding_salary = 0.0

        # Cumulative salary generated till date across all payroll periods
        all_payrolls = PayrollPeriod.objects.exclude(status=PayrollPeriod.STATUS_REVERSED)
        total_salary_till_date = float(sum(p.total_gross for p in all_payrolls))
        if total_salary_till_date == 0.0 and total_salary > 0.0:
            total_salary_till_date = total_salary

        # 4. Total Outstanding Advances (Reconciled from both Advance ORM and persistent DataStore)
        import json
        from core.models import DataStore

        active_advances = Advance.objects.filter(status='Approved', outstanding_balance__gt=0)
        total_advances_outstanding = float(sum(adv.outstanding_balance for adv in active_advances))
        this_month_advances = float(sum(adv.principal_amount for adv in Advance.objects.filter(issue_date__month=today.month, issue_date__year=today.year)))
        fixed_advance_balance = float(sum(adv.outstanding_balance for adv in active_advances.filter(advance_type=Advance.TYPE_FIXED_ADVANCE)))

        # Sync from DataStore 'advances_regular'
        try:
            ds_reg = DataStore.objects.filter(key='advances_regular').first()
            if ds_reg and ds_reg.data:
                reg_data = ds_reg.data if isinstance(ds_reg.data, list) else json.loads(ds_reg.data) if isinstance(ds_reg.data, str) else []
                for w in reg_data:
                    for tx in w.get('transactions', []):
                        amt = float(tx.get('amount') or 0)
                        this_month_advances += amt
                        if tx.get('status') != 'Deducted in Salary':
                            total_advances_outstanding += amt
        except Exception:
            pass

        # Sync from DataStore 'advances_fixed'
        try:
            ds_fix = DataStore.objects.filter(key='advances_fixed').first()
            if ds_fix and ds_fix.data:
                fix_data = ds_fix.data if isinstance(ds_fix.data, list) else json.loads(ds_fix.data) if isinstance(ds_fix.data, str) else []
                for l in fix_data:
                    p_amt = float(l.get('principalAmount') or 0)
                    rec = sum(float(r.get('emiAmount') or 0) for r in l.get('repayments', []))
                    rem = max(0.0, p_amt - rec)
                    fixed_advance_balance += rem
                    total_advances_outstanding += rem
        except Exception:
            pass

        return Response({
            'total_workers': total_workers,
            'active_workers': active_workers,
            'contractors_count': contractors_count,
            'present_today': present_today,
            'absent_today': absent_today,
            'leave_today': leave_today,
            'payroll_month': payroll_month,
            'total_salary': total_salary,
            'total_salary_till_date': total_salary_till_date,
            'total_salary_generated': total_salary_till_date,
            'total_deductions': total_deductions,
            'net_salary': net_salary,
            'total_paid': total_paid,
            'outstanding_salary': outstanding_salary,
            'total_advances_outstanding': total_advances_outstanding,
            'this_month_advances': this_month_advances,
            'fixed_advance_balance': fixed_advance_balance,
        }, status=status.HTTP_200_OK)

