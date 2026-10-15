"""
========================================================================================
PAYSPHERE CENTRALIZED ADVANCES CALCULATION ENGINE
========================================================================================
File Location: backend/advances/calculations.py

This module contains ALL industrial business logic and formulas for:
1. Salary Advance (short-term) and Fixed Advance (multi-month) recovery schedules.
2. Advance balance computation and repayment validation.
3. Monthly payroll recovery caps and safeguards against duplicate deductions.

TO MODIFY ANY ADVANCE FORMULA:
- Adjust the relevant function below.
- Changes made here automatically update advance issuance, repayments, and payroll line recoveries.
========================================================================================
"""

from decimal import Decimal, ROUND_HALF_UP


def round_currency(value) -> Decimal:
    if value is None:
        return Decimal('0.00')
    d = Decimal(str(value))
    return d.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_monthly_advance_recovery(advance) -> Decimal:
    """
    -------------------------------------------------------------------------------------
    FORMULA: Monthly Advance Payroll Deduction
    -------------------------------------------------------------------------------------
    If Advance Status is not 'Approved': Deduction = 0.00
    If Outstanding Balance <= 0.00: Deduction = 0.00
    Otherwise:
       Deduction = min(monthly_deduction, outstanding_balance)
    -------------------------------------------------------------------------------------
    """
    if getattr(advance, 'status', None) != 'Approved':
        return Decimal('0.00')

    balance = Decimal(str(getattr(advance, 'outstanding_balance', 0) or 0))
    if balance <= Decimal('0.00'):
        return Decimal('0.00')

    monthly_rate = Decimal(str(getattr(advance, 'monthly_deduction', 0) or 0))
    if monthly_rate <= Decimal('0.00'):
        # If monthly deduction is not specified, recover entire balance (typical for short-term salary advance)
        return balance

    return min(monthly_rate, balance)


def calculate_total_worker_advance_recovery(worker) -> Decimal:
    """
    -------------------------------------------------------------------------------------
    FORMULA: Total Worker Monthly Advance Recovery
    -------------------------------------------------------------------------------------
    Sums monthly recovery across all active approved advances (both Regular & Fixed)
    for a given worker.
    -------------------------------------------------------------------------------------
    """
    total = Decimal('0.00')
    active_advances = worker.advances.filter(status='Approved', outstanding_balance__gt=0)
    for adv in active_advances:
        total += calculate_monthly_advance_recovery(adv)
    return round_currency(total)


def validate_repayment_amount(advance, repayment_amount: Decimal) -> Decimal:
    """
    -------------------------------------------------------------------------------------
    FORMULA / RULE: Advance Repayment Validation
    -------------------------------------------------------------------------------------
    1. Repayment amount must be strictly > 0.
    2. Repayment amount cannot exceed the current outstanding balance.
    -------------------------------------------------------------------------------------
    """
    amount = Decimal(str(repayment_amount or 0))
    balance = Decimal(str(getattr(advance, 'outstanding_balance', 0) or 0))

    if amount <= Decimal('0.00'):
        raise ValueError("Repayment amount must be strictly greater than 0.")
    if amount > balance:
        raise ValueError(
            f"Repayment amount (₹{amount}) cannot exceed current outstanding balance (₹{balance})."
        )
    return round_currency(amount)
