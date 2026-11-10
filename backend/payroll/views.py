import csv
from decimal import Decimal
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    SalaryRuleConfig,
    PayrollPeriod,
    PayrollLine,
    SalaryPayment,
    BankAccount,
    PaymentVoucher,
    JournalEntry,
    JournalEntryLine,
)
from .serializers import (
    SalaryRuleConfigSerializer,
    PayrollPeriodSerializer,
    PayrollLineSerializer,
    SalaryPaymentSerializer,
    BankAccountSerializer,
    PaymentVoucherSerializer,
    JournalEntrySerializer,
)
from .calculations import (
    calculate_payable_days,
    calculate_worker_salary,
    round_currency,
)
from workers.models import Worker
from attendance.models import AttendanceRecord
from advances.models import Advance, AdvanceTransaction
from advances.calculations import calculate_total_worker_advance_recovery
from core.models import AuditLog


class SalaryRuleConfigView(APIView):
    """
    Get or update active payroll calculation rules & statutory percentage rates.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = SalaryRuleConfig.objects.filter(is_active=True).first()
        if not config:
            config = SalaryRuleConfig.objects.create()
        return Response(SalaryRuleConfigSerializer(config).data)

    def put(self, request):
        config = SalaryRuleConfig.objects.filter(is_active=True).first()
        if not config:
            config = SalaryRuleConfig.objects.create()
        serializer = SalaryRuleConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            action='UPDATE',
            model_name='SalaryRuleConfig',
            record_id=str(config.id),
            details=request.data,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(serializer.data)


class PayrollPeriodListCreateView(generics.ListCreateAPIView):
    queryset = PayrollPeriod.objects.all().order_by('-year', '-month', '-run_number')
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PayrollPeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PayrollPeriod.objects.all()
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]


class PayrollCalculateView(APIView):
    """
    Compute full payroll sheet for all active workers for the given period.
    Aggregates approved attendance, computes statutory deductions, applies advances.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        if period.status in (PayrollPeriod.STATUS_LOCKED, PayrollPeriod.STATUS_PAID):
            return Response({'error': f'Cannot recalculate payroll in {period.status} status.'}, status=status.HTTP_400_BAD_REQUEST)

        rule_config = SalaryRuleConfig.objects.filter(is_active=True).first()
        workers = Worker.objects.filter(status='Active')

        total_gross = Decimal('0.00')
        total_deductions = Decimal('0.00')
        total_net = Decimal('0.00')

        with transaction.atomic():
            for worker in workers:
                # 1. Aggregate attendance for period
                records = AttendanceRecord.objects.filter(
                    worker=worker,
                    attendance_date__range=[period.start_date, period.end_date]
                )

                present_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_PRESENT).count()))
                absent_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_ABSENT).count()))
                half_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_HALF_DAY).count()))
                leave_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_LEAVE).count()))

                payable_days = calculate_payable_days(present_days, half_days, leave_days)

                # Approved overtime hours only
                approved_ot_records = records.filter(approval_status=AttendanceRecord.APPROVAL_APPROVED)
                ot_hours = sum(r.overtime_hours for r in approved_ot_records)

                # 2. Advance recovery scheduled for this month
                advance_due = calculate_total_worker_advance_recovery(worker)

                # 3. Compute salary breakdown
                calc = calculate_worker_salary(
                    base_wage=worker.base_wage,
                    wage_basis=worker.wage_basis,
                    payable_days=payable_days,
                    approved_ot_hours=ot_hours,
                    advance_deduction=advance_due,
                    rule_config=rule_config
                )

                # 4. Save or update payroll line
                line, _ = PayrollLine.objects.get_or_create(
                    payroll_period=period,
                    worker=worker,
                    defaults={
                        'wage_basis': worker.wage_basis,
                        'base_rate': worker.base_wage,
                    }
                )

                line.wage_basis = worker.wage_basis
                line.base_rate = worker.base_wage
                line.present_days = present_days
                line.absent_days = absent_days
                line.half_days = half_days
                line.leave_days = leave_days
                line.payable_days = payable_days
                line.approved_overtime_hours = ot_hours

                line.basic_salary = calc['basic_salary']
                line.da = calc['da']
                line.hra = calc['hra']
                line.allowances = calc['allowances']
                line.overtime_amount = calc['overtime_amount']
                line.gross_earnings = calc['gross_earnings']

                line.pf_deduction = calc['pf_deduction']
                line.esi_deduction = calc['esi_deduction']
                line.pt_deduction = calc['pt_deduction']
                line.advance_deduction = calc['advance_deduction']
                line.total_deductions = calc['total_deductions']

                line.net_payable = calc['net_payable']
                line.outstanding_balance = max(Decimal('0.00'), line.net_payable - line.paid_amount)
                line.payslip_number = f"PAY-{period.year}{period.month:02d}-{worker.worker_id}"
                line.calculation_snapshot = {
                    'calculated_at': timezone.now().isoformat(),
                    'rule_config_name': rule_config.name if rule_config else 'Default',
                    'ot_hourly_rate': str(calc['ot_hourly_rate']),
                    'daily_rate': str(calc['daily_rate']),
                }
                line.save()

                total_gross += calc['gross_earnings']
                total_deductions += calc['total_deductions']
                total_net += calc['net_payable']

            period.total_gross = total_gross
            period.total_deductions = total_deductions
            period.total_net_payable = total_net
            period.status = PayrollPeriod.STATUS_CALCULATED
            period.save()

        AuditLog.objects.create(
            actor=request.user,
            action='UPDATE',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Calculated', 'total_net': str(total_net), 'worker_count': workers.count()},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Successfully calculated payroll for {workers.count()} workers.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollApproveView(APIView):
    """
    Approve payroll cycle and post advance deductions to the advance ledger.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            period.status = PayrollPeriod.STATUS_APPROVED
            period.approved_by = request.user
            period.approved_at = timezone.now()
            period.save()

            # Post advance deductions to Advance ledger
            for line in period.lines.filter(advance_deduction__gt=0):
                remaining_deduction = line.advance_deduction
                active_advances = line.worker.advances.filter(status='Approved', outstanding_balance__gt=0).order_by('issue_date')
                for adv in active_advances:
                    if remaining_deduction <= 0:
                        break
                    deduct = min(adv.outstanding_balance, remaining_deduction)
                    adv.record_repayment(
                        amount=deduct,
                        transaction_type=AdvanceTransaction.TYPE_PAYROLL_DEDUCTION,
                        reference_no=f"PAYROLL-{period.name}",
                        notes=f"Auto recovery via approved payroll run {period.name}",
                        user=request.user
                    )
                    remaining_deduction -= deduct

        AuditLog.objects.create(
            actor=request.user,
            action='APPROVE',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Approved', 'total_net': str(period.total_net_payable)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Payroll period {period.name} approved successfully.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollLockView(APIView):
    """
    Lock approved payroll against any further changes and freeze corresponding attendance.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            period.status = PayrollPeriod.STATUS_LOCKED
            period.save()

            # Lock all attendance records in period range
            AttendanceRecord.objects.filter(
                attendance_date__range=[period.start_date, period.end_date]
            ).update(approval_status=AttendanceRecord.APPROVAL_LOCKED)

        AuditLog.objects.create(
            actor=request.user,
            action='LOCK',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Locked'},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Payroll period {period.name} locked successfully.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollLineListView(generics.ListAPIView):
    serializer_class = PayrollLineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = PayrollLine.objects.select_related('worker', 'worker__department', 'payroll_period')
        period_id = self.request.query_params.get('period')
        if period_id:
            qs = qs.filter(payroll_period_id=period_id)

        dept = self.request.query_params.get('department')
        if dept and dept != 'All':
            qs = qs.filter(worker__department__name__iexact=dept)

        payment_status = self.request.query_params.get('payment_status')
        if payment_status and payment_status != 'All':
            qs = qs.filter(payment_status=payment_status)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(worker__name__icontains=search) | qs.filter(worker__worker_id__icontains=search)

        return qs.order_by('worker__worker_id')


class PayrollLineDetailView(generics.RetrieveAPIView):
    queryset = PayrollLine.objects.all()
    serializer_class = PayrollLineSerializer
    permission_classes = [IsAuthenticated]


class SalaryPaymentCreateView(APIView):
    """
    Record full or partial payment against a worker's payroll line.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, line_pk):
        try:
            line = PayrollLine.objects.get(pk=line_pk)
        except PayrollLine.DoesNotExist:
            return Response({'error': 'Payroll line not found.'}, status=status.HTTP_404_NOT_FOUND)

        amount_raw = request.data.get('amount')
        try:
            amount = Decimal(str(amount_raw or 0))
        except Exception:
            return Response({'error': 'Invalid payment amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        new_total_paid = line.paid_amount + amount
        if new_total_paid > line.net_payable:
            return Response({
                'error': f'Total payment (₹{new_total_paid}) cannot exceed net payable (₹{line.net_payable}).'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            line.paid_amount = new_total_paid
            line.outstanding_balance = max(Decimal('0.00'), line.net_payable - new_total_paid)
            line.payment_status = (
                PayrollLine.STATUS_PAID if line.outstanding_balance == 0
                else PayrollLine.STATUS_PARTIAL_PAID
            )
            line.payment_date = request.data.get('payment_date') or timezone.localdate()
            line.payment_method = request.data.get('payment_method', 'Bank Transfer')
            line.reference_no = request.data.get('reference_number', '')
            line.save()

            payment = SalaryPayment.objects.create(
                payroll_line=line,
                worker=line.worker,
                amount_paid=amount,
                payment_date=line.payment_date,
                payment_method=line.payment_method,
                reference_number=line.reference_no,
                notes=request.data.get('notes', ''),
                recorded_by=request.user
            )

            # Update period total paid
            period = line.payroll_period
            period.total_paid = sum(l.paid_amount for l in period.lines.all())
            if period.total_paid >= period.total_net_payable and period.total_net_payable > 0:
                period.status = PayrollPeriod.STATUS_PAID
            elif period.total_paid > 0:
                period.status = PayrollPeriod.STATUS_PARTIAL_PAID
            period.save()

        AuditLog.objects.create(
            actor=request.user,
            action='PAY',
            model_name='PayrollLine',
            record_id=f'{line.worker.worker_id} - ₹{amount}',
            details={'amount': str(amount), 'reference': line.reference_no},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Recorded payment of ₹{amount} for {line.worker.name}.',
            'line': PayrollLineSerializer(line).data
        }, status=status.HTTP_200_OK)


class PayslipDownloadView(APIView):
    """
    Get detailed printable payslip payload for a worker's payroll line.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, line_pk):
        try:
            line = PayrollLine.objects.select_related('worker', 'worker__department', 'payroll_period').get(pk=line_pk)
        except PayrollLine.DoesNotExist:
            return Response({'error': 'Payroll line not found.'}, status=status.HTTP_404_NOT_FOUND)

        w = line.worker
        p = line.payroll_period

        data = {
            'payslip_number': line.payslip_number,
            'period_name': p.name,
            'period_start': p.start_date,
            'period_end': p.end_date,
            'worker': {
                'worker_id': w.worker_id,
                'name': w.name,
                'designation': w.designation,
                'department': w.department.name if w.department else 'N/A',
                'joining_date': w.joining_date,
                'bank_account': w.bank_account,
                'ifsc_code': w.ifsc_code,
                'pan_number': w.pan_number,
                'aadhar_number': w.aadhar_number,
            },
            'attendance': {
                'present_days': float(line.present_days),
                'absent_days': float(line.absent_days),
                'half_days': float(line.half_days),
                'leave_days': float(line.leave_days),
                'payable_days': float(line.payable_days),
                'overtime_hours': float(line.approved_overtime_hours),
            },
            'earnings': {
                'basic_salary': float(line.basic_salary),
                'dearness_allowance': float(line.da),
                'hra': float(line.hra),
                'other_allowances': float(line.allowances),
                'overtime_earnings': float(line.overtime_amount),
                'gross_earnings': float(line.gross_earnings),
            },
            'deductions': {
                'provident_fund': float(line.pf_deduction),
                'esi': float(line.esi_deduction),
                'professional_tax': float(line.pt_deduction),
                'advance_recovery': float(line.advance_deduction),
                'other_deductions': float(line.other_deductions),
                'total_deductions': float(line.total_deductions),
            },
            'net_payable': float(line.net_payable),
            'paid_amount': float(line.paid_amount),
            'outstanding_balance': float(line.outstanding_balance),
            'payment_status': line.payment_status,
            'payment_method': line.payment_method,
            'payment_date': line.payment_date,
        }
        return Response(data, status=status.HTTP_200_OK)


class PayrollExportView(APIView):
    """
    Export complete monthly payroll sheet to CSV.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        lines = period.lines.select_related('worker', 'worker__department').order_by('worker__worker_id')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_{period.name.replace(" ", "_")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Worker ID', 'Name', 'Department', 'Wage Basis', 'Base Rate',
            'Present Days', 'Payable Days', 'OT Hours',
            'Basic', 'DA', 'HRA', 'Allowances', 'OT Amount', 'Gross Earnings',
            'PF', 'ESI', 'PT', 'Advance Recovery', 'Total Deductions',
            'Net Payable', 'Paid Amount', 'Balance', 'Status'
        ])

        for line in lines:
            writer.writerow([
                line.worker.worker_id,
                line.worker.name,
                line.worker.department.name if line.worker.department else 'N/A',
                line.wage_basis,
                line.base_rate,
                line.present_days,
                line.payable_days,
                line.approved_overtime_hours,
                line.basic_salary,
                line.da,
                line.hra,
                line.allowances,
                line.overtime_amount,
                line.gross_earnings,
                line.pf_deduction,
                line.esi_deduction,
                line.pt_deduction,
                line.advance_deduction,
                line.total_deductions,
                line.net_payable,
                line.paid_amount,
                line.outstanding_balance,
                line.payment_status
            ])

        return response


# ==============================================================================
# BANK ACCOUNTS & WORKER PAYMENT MANAGEMENT
# ==============================================================================

def ensure_default_bank_accounts():
    """
    Ensure standard company disbursal and cash accounts exist with realistic opening balances.
    """
    if BankAccount.objects.count() == 0:
        BankAccount.objects.create(
            account_name='HDFC Bank - Disbursal A/C',
            account_type=BankAccount.ACCOUNT_TYPE_BANK,
            bank_name='HDFC Bank Ltd.',
            account_number='50100482910482',
            ifsc_code='HDFC0001234',
            opening_balance=Decimal('1250000.00'),
            current_balance=Decimal('1250000.00'),
            is_active=True,
            is_default=True,
        )
        BankAccount.objects.create(
            account_name='ICICI Bank - Operations A/C',
            account_type=BankAccount.ACCOUNT_TYPE_BANK,
            bank_name='ICICI Bank Ltd.',
            account_number='001205018392',
            ifsc_code='ICIC0000012',
            opening_balance=Decimal('820000.00'),
            current_balance=Decimal('820000.00'),
            is_active=True,
            is_default=False,
        )
        BankAccount.objects.create(
            account_name='Cash in Hand - Plant Office',
            account_type=BankAccount.ACCOUNT_TYPE_CASH,
            bank_name='Cash Office',
            account_number='CASH-PLANT-01',
            ifsc_code='',
            opening_balance=Decimal('150000.00'),
            current_balance=Decimal('150000.00'),
            is_active=True,
            is_default=False,
        )
        BankAccount.objects.create(
            account_name='State Bank of India - Wage A/C',
            account_type=BankAccount.ACCOUNT_TYPE_BANK,
            bank_name='State Bank of India',
            account_number='38920194821',
            ifsc_code='SBIN0004821',
            opening_balance=Decimal('575000.00'),
            current_balance=Decimal('575000.00'),
            is_active=True,
            is_default=False,
        )


def generate_next_voucher_number():
    """
    Generates standard unique payment voucher code: PAY-YYYYMM-XXXX
    """
    now = timezone.now()
    prefix = f"PAY-{now.strftime('%Y%m')}-"
    latest = PaymentVoucher.objects.filter(voucher_number__startswith=prefix).order_by('-voucher_number').first()
    if latest:
        try:
            seq_num = int(latest.voucher_number.split('-')[-1]) + 1
        except Exception:
            seq_num = 1
    else:
        seq_num = 1
    return f"{prefix}{seq_num:04d}"


class BankAccountListCreateView(APIView):
    """
    List and create company Bank and Cash accounts for disbursals.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_default_bank_accounts()
        accounts = BankAccount.objects.filter(is_active=True).order_by('-is_default', 'account_name')
        serializer = BankAccountSerializer(accounts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BankAccountSerializer(data=request.data)
        if serializer.is_valid():
            account = serializer.save()
            # If default, unset previous defaults
            if account.is_default:
                BankAccount.objects.exclude(id=account.id).update(is_default=False)
            AuditLog.objects.create(
                actor=request.user,
                action='CREATE',
                model_name='BankAccount',
                record_id=str(account.id),
                details={'account_name': account.account_name, 'balance': str(account.current_balance)},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentVoucherNextNumberView(APIView):
    """
    Provides the next anticipated voucher number.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        next_num = generate_next_voucher_number()
        return Response({'next_voucher_number': next_num})


class PaymentVoucherListCreateView(APIView):
    """
    List payment history and record new worker payments with full accounting & balance sync.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PaymentVoucher.objects.select_related('worker', 'worker__department', 'bank_account', 'created_by', 'journal_entry').prefetch_related('journal_entry__lines')

        # Filters
        worker_id = request.query_params.get('worker_id')
        if worker_id:
            qs = qs.filter(worker__id=worker_id) | qs.filter(worker__worker_id=worker_id)

        status_param = request.query_params.get('status')
        if status_param and status_param != 'All':
            qs = qs.filter(status=status_param)

        mode = request.query_params.get('payment_mode')
        if mode and mode != 'All':
            qs = qs.filter(payment_mode=mode)

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                models.Q(voucher_number__icontains=search) |
                models.Q(worker__name__icontains=search) |
                models.Q(worker__worker_id__icontains=search) |
                models.Q(transaction_reference__icontains=search) |
                models.Q(cheque_number__icontains=search)
            )

        start_date = request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(payment_date__gte=start_date)

        end_date = request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(payment_date__lte=end_date)

        serializer = PaymentVoucherSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data

        # 1. Validate Worker
        worker_id_val = data.get('worker_id') or data.get('worker')
        if not worker_id_val:
            return Response({'error': 'Worker selection is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if str(worker_id_val).isdigit():
                worker = Worker.objects.get(pk=int(worker_id_val))
            else:
                worker = Worker.objects.get(worker_id=str(worker_id_val))
        except Worker.DoesNotExist:
            return Response({'error': f'Worker "{worker_id_val}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Validate Bank / Cash Account
        bank_account_id = data.get('bank_account_id') or data.get('bank_account')
        if not bank_account_id:
            return Response({'error': 'Please select a company Bank or Cash account to pay from.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bank_account = BankAccount.objects.get(pk=bank_account_id, is_active=True)
        except BankAccount.DoesNotExist:
            return Response({'error': 'Selected Bank or Cash account was not found or is inactive.'}, status=status.HTTP_404_NOT_FOUND)

        # 3. Validate Payment Amount
        amount_raw = data.get('amount_paid') or data.get('amount')
        try:
            amount_paid = Decimal(str(amount_raw or 0))
        except Exception:
            return Response({'error': 'Invalid payment amount specified.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_paid <= Decimal('0.00'):
            return Response({'error': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Check Bank Account Balance
        if bank_account.current_balance < amount_paid:
            return Response({
                'error': f'Insufficient balance in {bank_account.account_name}. Available: ₹{bank_account.current_balance:,.2f}, Requested: ₹{amount_paid:,.2f}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 5. Settlement Period & Balance Calculation
        settlement_period = (data.get('settlement_period') or 'Current Settlement').strip()
        payroll_line_id = data.get('payroll_line_id')
        line = None

        if payroll_line_id:
            try:
                line = PayrollLine.objects.get(pk=payroll_line_id, worker=worker)
            except PayrollLine.DoesNotExist:
                return Response({'error': 'Specified payroll line does not belong to this worker.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Look for active line matching this settlement period
            line = PayrollLine.objects.filter(worker=worker, payroll_period__name__iexact=settlement_period).first()
            if not line:
                # Or latest active payroll line
                line = PayrollLine.objects.filter(worker=worker).order_by('-payroll_period__year', '-payroll_period__month').first()

        if line:
            total_payable = line.net_payable
            previously_paid = line.paid_amount
            outstanding_before = max(Decimal('0.00'), line.net_payable - line.paid_amount)
            if not settlement_period or settlement_period == 'Current Settlement':
                settlement_period = line.payroll_period.name
        else:
            # Base wage fallback
            total_payable = worker.base_wage
            # Sum completed past vouchers for this period
            past_vouchers = PaymentVoucher.objects.filter(
                worker=worker,
                settlement_period=settlement_period,
                status=PaymentVoucher.STATUS_COMPLETED
            )
            previously_paid = sum((v.amount_paid for v in past_vouchers), Decimal('0.00'))
            outstanding_before = max(Decimal('0.00'), total_payable - previously_paid)

        # Strict Overpayment Check
        if amount_paid > outstanding_before:
            return Response({
                'error': f'Payment amount (₹{amount_paid:,.2f}) cannot exceed the outstanding balance (₹{outstanding_before:,.2f}) for {worker.name}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        outstanding_after = max(Decimal('0.00'), outstanding_before - amount_paid)
        payment_date = data.get('payment_date') or timezone.now().date()
        payment_mode = data.get('payment_mode') or PaymentVoucher.MODE_BANK_TRANSFER
        transaction_reference = (data.get('transaction_reference') or data.get('reference_number') or '').strip()
        cheque_number = (data.get('cheque_number') or '').strip()
        cheque_date = data.get('cheque_date') or None
        drawn_on = (data.get('drawn_on') or '').strip()
        narration = (data.get('narration') or data.get('notes') or '').strip()
        payment_proof = data.get('payment_proof') or ''

        # Atomic Execution: Voucher + Bank Deduction + Payroll Line Sync + Journal Double Entry
        with transaction.atomic():
            voucher_number = generate_next_voucher_number()

            voucher = PaymentVoucher.objects.create(
                voucher_number=voucher_number,
                payment_date=payment_date,
                worker=worker,
                payroll_line=line,
                settlement_period=settlement_period,
                total_payable=total_payable,
                previously_paid=previously_paid,
                amount_paid=amount_paid,
                outstanding_after=outstanding_after,
                payment_mode=payment_mode,
                bank_account=bank_account,
                transaction_reference=transaction_reference,
                cheque_number=cheque_number,
                cheque_date=cheque_date,
                drawn_on=drawn_on,
                narration=narration,
                payment_proof=payment_proof,
                status=PaymentVoucher.STATUS_COMPLETED,
                created_by=request.user
            )

            # Deduct from company bank / cash balance
            bank_account.current_balance -= amount_paid
            bank_account.save(update_fields=['current_balance', 'updated_at'])

            # Update payroll line and period if present
            if line:
                line.paid_amount += amount_paid
                line.outstanding_balance = max(Decimal('0.00'), line.net_payable - line.paid_amount)
                line.payment_status = (
                    PayrollLine.STATUS_PAID if line.outstanding_balance == Decimal('0.00')
                    else PayrollLine.STATUS_PARTIAL_PAID
                )
                line.payment_date = payment_date
                line.payment_method = payment_mode
                line.reference_no = transaction_reference or cheque_number or voucher_number
                line.save()

                period = line.payroll_period
                total_period_paid = sum((l.paid_amount for l in period.lines.all()), Decimal('0.00'))
                period.total_paid = total_period_paid
                if period.total_paid >= period.total_net_payable and period.total_net_payable > 0:
                    period.status = PayrollPeriod.STATUS_PAID
                elif period.total_paid > 0:
                    period.status = PayrollPeriod.STATUS_PARTIAL_PAID
                period.save()

                SalaryPayment.objects.create(
                    payroll_line=line,
                    worker=worker,
                    amount_paid=amount_paid,
                    payment_date=payment_date,
                    payment_method=payment_mode,
                    reference_number=transaction_reference or voucher_number,
                    status='Completed',
                    notes=narration or f'Voucher {voucher_number}',
                    recorded_by=request.user
                )

            # Create Double-Entry Accounting Journal Entry
            journal_entry = JournalEntry.objects.create(
                voucher=voucher,
                entry_number=f"JE-{voucher_number}",
                entry_date=payment_date,
                reference=transaction_reference or cheque_number or voucher_number,
                description=f"Worker wage disbursal to {worker.name} ({worker.worker_id}) for {settlement_period} via {payment_mode}"
            )

            # Debit: Worker Payable (Liability reduced)
            JournalEntryLine.objects.create(
                journal_entry=journal_entry,
                account_name='Worker Payable',
                entry_type=JournalEntryLine.TYPE_DEBIT,
                amount=amount_paid
            )

            # Credit: Bank Account / Cash (Asset reduced)
            JournalEntryLine.objects.create(
                journal_entry=journal_entry,
                account_name=bank_account.account_name,
                entry_type=JournalEntryLine.TYPE_CREDIT,
                amount=amount_paid
            )

            # Audit Log
            AuditLog.objects.create(
                actor=request.user,
                action='PAY',
                model_name='PaymentVoucher',
                record_id=voucher.voucher_number,
                details={
                    'worker_id': worker.worker_id,
                    'worker_name': worker.name,
                    'amount_paid': str(amount_paid),
                    'payment_mode': payment_mode,
                    'bank_account': bank_account.account_name,
                    'settlement_period': settlement_period,
                    'outstanding_after': str(outstanding_after),
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )

        return Response(PaymentVoucherSerializer(voucher).data, status=status.HTTP_201_CREATED)


class PaymentVoucherDetailView(APIView):
    """
    Retrieve single voucher details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            voucher = PaymentVoucher.objects.select_related('worker', 'worker__department', 'bank_account', 'created_by', 'journal_entry').prefetch_related('journal_entry__lines').get(pk=pk)
        except PaymentVoucher.DoesNotExist:
            return Response({'error': 'Payment voucher not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(PaymentVoucherSerializer(voucher).data, status=status.HTTP_200_OK)


class PaymentVoucherReverseView(APIView):
    """
    Non-destructive payment cancellation / reversal with financial reversal audit trail.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            voucher = PaymentVoucher.objects.select_related('bank_account', 'payroll_line', 'worker', 'journal_entry').get(pk=pk)
        except PaymentVoucher.DoesNotExist:
            return Response({'error': 'Payment voucher not found.'}, status=status.HTTP_404_NOT_FOUND)

        if voucher.status == PaymentVoucher.STATUS_CANCELLED:
            return Response({'error': 'This payment voucher has already been cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get('reason') or 'Reversed by authorized user').strip()

        with transaction.atomic():
            voucher.status = PaymentVoucher.STATUS_CANCELLED
            voucher.cancellation_reason = reason
            voucher.cancelled_at = timezone.now()
            voucher.cancelled_by = request.user
            voucher.save()

            # Refund Bank Account balance
            voucher.bank_account.current_balance += voucher.amount_paid
            voucher.bank_account.save(update_fields=['current_balance', 'updated_at'])

            # Restore PayrollLine balance if linked
            if voucher.payroll_line:
                line = voucher.payroll_line
                line.paid_amount = max(Decimal('0.00'), line.paid_amount - voucher.amount_paid)
                line.outstanding_balance = max(Decimal('0.00'), line.net_payable - line.paid_amount)
                if line.paid_amount == Decimal('0.00'):
                    line.payment_status = PayrollLine.STATUS_UNPAID
                elif line.outstanding_balance == Decimal('0.00'):
                    line.payment_status = PayrollLine.STATUS_PAID
                else:
                    line.payment_status = PayrollLine.STATUS_PARTIAL_PAID
                line.save()

                period = line.payroll_period
                period.total_paid = max(Decimal('0.00'), period.total_paid - voucher.amount_paid)
                if period.total_paid == Decimal('0.00'):
                    period.status = PayrollPeriod.STATUS_APPROVED
                elif period.total_paid < period.total_net_payable:
                    period.status = PayrollPeriod.STATUS_PARTIAL_PAID
                period.save()

            # Mark Journal Entry as reversed
            if hasattr(voucher, 'journal_entry') and voucher.journal_entry:
                voucher.journal_entry.is_reversed = True
                voucher.journal_entry.save(update_fields=['is_reversed', 'updated_at'])

            # Log Audit Trail
            AuditLog.objects.create(
                actor=request.user,
                action='REVERSE',
                model_name='PaymentVoucher',
                record_id=voucher.voucher_number,
                details={
                    'worker_id': voucher.worker.worker_id,
                    'amount_reversed': str(voucher.amount_paid),
                    'reason': reason,
                    'bank_account': voucher.bank_account.account_name,
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )

        return Response({
            'message': f'Payment voucher {voucher.voucher_number} reversed successfully.',
            'voucher': PaymentVoucherSerializer(voucher).data
        }, status=status.HTTP_200_OK)


class WorkerPayableSummaryView(APIView):
    """
    Fetch comprehensive payable summary for a specific worker.
    Includes active payroll lines, previous payments, and current outstanding balance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, worker_id):
        try:
            if str(worker_id).isdigit():
                worker = Worker.objects.select_related('department').get(pk=int(worker_id))
            else:
                worker = Worker.objects.select_related('department').get(worker_id=str(worker_id))
        except Worker.DoesNotExist:
            return Response({'error': f'Worker "{worker_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get payroll lines for worker
        lines = PayrollLine.objects.filter(worker=worker).select_related('payroll_period').order_by('-payroll_period__year', '-payroll_period__month')

        settlement_options = []
        for line in lines:
            settlement_options.append({
                'payroll_line_id': line.id,
                'period_name': line.payroll_period.name,
                'period_id': line.payroll_period.id,
                'period_status': line.payroll_period.status,
                'net_payable': line.net_payable,
                'paid_amount': line.paid_amount,
                'outstanding_balance': line.outstanding_balance,
                'payment_status': line.payment_status,
                'present_days': line.present_days,
                'payable_days': line.payable_days,
            })

        # If no lines exist, provide default base wage settlement
        if not settlement_options:
            default_period = timezone.now().strftime('%B %Y')
            past_vouchers = PaymentVoucher.objects.filter(
                worker=worker,
                settlement_period=default_period,
                status=PaymentVoucher.STATUS_COMPLETED
            )
            prev_paid = sum((v.amount_paid for v in past_vouchers), Decimal('0.00'))
            outstanding = max(Decimal('0.00'), worker.base_wage - prev_paid)
            settlement_options.append({
                'payroll_line_id': None,
                'period_name': default_period,
                'period_id': None,
                'period_status': 'Direct',
                'net_payable': worker.base_wage,
                'paid_amount': prev_paid,
                'outstanding_balance': outstanding,
                'payment_status': 'Paid' if outstanding == 0 else ('Partially Paid' if prev_paid > 0 else 'Pending'),
                'present_days': 26,
                'payable_days': 26,
            })

        # Recent payment history for this worker
        recent_vouchers = PaymentVoucher.objects.filter(worker=worker).select_related('bank_account')[:10]
        recent_data = PaymentVoucherSerializer(recent_vouchers, many=True).data

        # Overall worker outstanding balance sum
        total_outstanding = sum((Decimal(str(s['outstanding_balance'])) for s in settlement_options), Decimal('0.00'))

        return Response({
            'worker': {
                'id': worker.id,
                'worker_id': worker.worker_id,
                'name': worker.name,
                'department': worker.department.name if worker.department else 'General',
                'designation': worker.designation,
                'phone': worker.phone,
                'bank_account': worker.bank_account,
                'bank_name': getattr(worker, 'bank_name', '') or 'Scheduled Commercial Bank',
                'ifsc_code': worker.ifsc_code,
                'base_wage': worker.base_wage,
                'wage_basis': worker.wage_basis,
                'worker_type': worker.worker_type,
            },
            'settlements': settlement_options,
            'total_outstanding': total_outstanding,
            'recent_payments': recent_data
        }, status=status.HTTP_200_OK)

