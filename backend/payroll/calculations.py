"""
========================================================================================
PAYSPHERE CENTRALIZED PAYROLL & SALARY CALCULATION ENGINE
========================================================================================
File Location: backend/payroll/calculations.py

This module contains ALL industrial business logic and formulas for:
1. Attendance shift hours, break deductions, and overtime calculations.
2. Base wage component breakdown (Basic, DA, HRA, Allowances).
3. Overtime pay calculation based on normal hourly rate and multiplier.
4. Statutory deductions (PF, ESI, Professional Tax, TDS).
5. Advance deduction cap and net salary reconciliation.

TO MODIFY ANY FORMULA:
- Adjust the relevant function below.
- Changes made here automatically update all API calculations and payroll runs.
========================================================================================
"""

from decimal import Decimal, ROUND_HALF_UP
import re


def round_currency(value) -> Decimal:
    """
    Standard industrial currency rounding: rounds to 2 decimal places using ROUND_HALF_UP.
    """
    if value is None:
        return Decimal('0.00')
    d = Decimal(str(value))
    return d.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


# ========================================================================================
# 1. ATTENDANCE & WORKING HOURS FORMULA
# ========================================================================================
def parse_time_to_minutes(time_str: str):
    """
    Parses '08:00 AM', '5:00 PM', '08:00', or '17:00' into elapsed minutes from midnight.
    Returns integer minutes or None if invalid.
    """
    if not time_str or time_str.strip() in ('-', ''):
        return None

    s = time_str.strip().upper()
    is_pm = 'PM' in s
    is_am = 'AM' in s
    clean = re.sub(r'[^\d:]', '', s)
    parts = clean.split(':')
    if len(parts) < 2:
        return None

    try:
        hours = int(parts[0])
        minutes = int(parts[1])
    except ValueError:
        return None

    if is_pm and hours < 12:
        hours += 12
    if is_am and hours == 12:
        hours = 0

    return hours * 60 + minutes


def calculate_working_and_overtime(time_in_str: str, time_out_str: str, break_minutes: int = 60, standard_shift_hours: Decimal = Decimal('8.00')):
    """
    -------------------------------------------------------------------------------------
    FORMULA: Net Working Hours & Overtime
    -------------------------------------------------------------------------------------
    Elapsed Time = TimeOut - TimeIn (accounting for overnight shift if TimeOut < TimeIn)
    Net Working Minutes = Elapsed Time - Break Duration (if duration >= 9.5 hours, 60m break deducted)
    Net Working Hours = Net Working Minutes / 60.0
    Overtime Hours = max(0.00, Net Working Hours - Scheduled Shift Hours)
    -------------------------------------------------------------------------------------
    """
    in_m = parse_time_to_minutes(time_in_str)
    out_m = parse_time_to_minutes(time_out_str)

    if in_m is None or out_m is None:
        return {
            'working_hours': Decimal('0.00'),
            'overtime_hours': Decimal('0.00'),
            'working_hours_display': '-',
            'overtime_display': '-',
        }

    span = out_m - in_m
    if span < 0:
        span += 24 * 60  # Night shift crossing midnight

    # Deduct break (default 60 mins if shift is 9.5+ hrs, or configured break)
    net_mins = span - break_minutes if span >= (9.5 * 60) else span
    if net_mins < 0:
        net_mins = 0

    w_hours = Decimal(str(net_mins)) / Decimal('60.0')
    w_hours_rounded = round_currency(w_hours)

    std_hours = Decimal(str(standard_shift_hours))
    if w_hours_rounded > std_hours:
        ot_hours = round_currency(w_hours_rounded - std_hours)
    else:
        ot_hours = Decimal('0.00')

    # Display formats (e.g. "8h 30m")
    wh_h = int(net_mins // 60)
    wh_m = int(net_mins % 60)
    wh_display = f"{wh_h}h {wh_m:02d}m"

    ot_mins = int(ot_hours * 60)
    ot_h = int(ot_mins // 60)
    ot_m = int(ot_mins % 60)
    ot_display = f"{ot_h}h {ot_m:02d}m" if ot_hours > 0 else '-'

    return {
        'working_hours': w_hours_rounded,
        'overtime_hours': ot_hours,
        'working_hours_display': wh_display,
        'overtime_display': ot_display,
    }


# ========================================================================================
# 2. PAYABLE ATTENDANCE DAYS FORMULA
# ========================================================================================
def calculate_payable_days(present_days, half_days, leave_days=Decimal('0.00')) -> Decimal:
    """
    -------------------------------------------------------------------------------------
    FORMULA: Payable Days
    -------------------------------------------------------------------------------------
    Payable Days = Present Days + (Half Days * 0.5) + Approved Paid Leave Days
    -------------------------------------------------------------------------------------
    """
    p = Decimal(str(present_days or 0))
    h = Decimal(str(half_days or 0))
    l = Decimal(str(leave_days or 0))
    return round_currency(p + (h * Decimal('0.5')) + l)


# ========================================================================================
# 3. COMPLETE SALARY ENGINE FORMULA
# ========================================================================================
def calculate_worker_salary(
    base_wage: Decimal,
    wage_basis: str,
    payable_days: Decimal,
    approved_ot_hours: Decimal,
    advance_deduction: Decimal,
    rule_config=None,
    total_month_days: int = 26
):
    """
    -------------------------------------------------------------------------------------
    FORMULA: Complete Industrial Wage & Statutory Breakdown
    -------------------------------------------------------------------------------------
    1. Base Rate Conversion:
       - Monthly Basis: Daily Rate = Base Wage / standard_month_days (26)
       - Daily Basis: Daily Rate = Base Wage; Monthly Equivalent = Base Wage * 26
       - Hourly Basis: Hourly Rate = Base Wage; Daily Rate = Base Wage * 8

    2. Pro-Rata Earned Gross Base:
       Earned Base = Daily Rate * Payable Days

    3. Earnings Components:
       - Basic Salary = 50% of Earned Base
       - Dearness Allowance (DA) = 20% of Earned Base
       - House Rent Allowance (HRA) = 20% of Earned Base
       - Fixed Allowances (Conveyance + Medical) pro-rated by payable days
       - Special Allowance = Remaining balance to match Earned Base

    4. Overtime Earnings:
       - Hourly Rate = Daily Rate / standard_shift_hours (8.00)
       - Overtime Earnings = Hourly Rate * overtime_multiplier (2.0x) * Approved OT Hours

    5. Gross Earnings:
       Gross Earnings = Basic + DA + HRA + Allowances + Overtime Earnings

    6. Statutory Deductions:
       - Provident Fund (PF): 12% of min(Basic + DA, PF Ceiling: ₹15,000)
       - ESI: 0.75% of Gross Earnings (only if Gross <= ESI Gross Ceiling: ₹21,000)
       - Professional Tax (PT): ₹200.00 monthly flat slab
       - Advance Deduction: Deduction from approved advance schedules

    7. Net Payable:
       Net Payable = max(0.00, Gross Earnings - Total Deductions)
    -------------------------------------------------------------------------------------
    """
    base_wage = Decimal(str(base_wage or 0))
    payable_days = Decimal(str(payable_days or 0))
    approved_ot_hours = Decimal(str(approved_ot_hours or 0))
    advance_deduction = Decimal(str(advance_deduction or 0))

    # Configuration defaults
    std_days = Decimal(str(getattr(rule_config, 'standard_month_days', 26) or total_month_days or 26))
    std_shift_hours = Decimal(str(getattr(rule_config, 'standard_shift_hours', Decimal('8.00')) or Decimal('8.00')))
    ot_multiplier = Decimal(str(getattr(rule_config, 'overtime_multiplier', Decimal('2.00')) or Decimal('2.00')))

    basic_pct = Decimal(str(getattr(rule_config, 'basic_percentage', Decimal('50.00')) or Decimal('50.00'))) / Decimal('100.0')
    da_pct = Decimal(str(getattr(rule_config, 'da_percentage', Decimal('20.00')) or Decimal('20.00'))) / Decimal('100.0')
    hra_pct = Decimal(str(getattr(rule_config, 'hra_percentage', Decimal('20.00')) or Decimal('20.00'))) / Decimal('100.0')

    pf_rate = Decimal(str(getattr(rule_config, 'pf_employee_rate', Decimal('12.00')) or Decimal('12.00'))) / Decimal('100.0')
    pf_ceiling = Decimal(str(getattr(rule_config, 'pf_wage_ceiling', Decimal('15000.00')) or Decimal('15000.00')))

    esi_rate = Decimal(str(getattr(rule_config, 'esi_employee_rate', Decimal('0.75')) or Decimal('0.75'))) / Decimal('100.0')
    esi_ceiling = Decimal(str(getattr(rule_config, 'esi_gross_ceiling', Decimal('21000.00')) or Decimal('21000.00')))

    pt_flat = Decimal(str(getattr(rule_config, 'professional_tax_monthly', Decimal('200.00')) or Decimal('200.00')))

    # Daily rate conversion
    if wage_basis == 'Daily':
        daily_rate = base_wage
        monthly_base = daily_rate * std_days
    elif wage_basis == 'Hourly':
        hourly_rate = base_wage
        daily_rate = hourly_rate * std_shift_hours
        monthly_base = daily_rate * std_days
    else:  # Monthly
        monthly_base = base_wage
        daily_rate = (base_wage / std_days) if std_days > 0 else Decimal('0.00')

    daily_rate = round_currency(daily_rate)

    # 1. Earned Base for the period based on attendance
    attendance_ratio = (payable_days / std_days) if std_days > 0 else Decimal('0.00')
    earned_base = round_currency(daily_rate * payable_days)

    # 2. Components
    basic = round_currency(earned_base * basic_pct)
    da = round_currency(earned_base * da_pct)
    hra = round_currency(earned_base * hra_pct)

    # Fixed allowances pro-rated
    conveyance = round_currency(Decimal('1600.00') * attendance_ratio)
    medical = round_currency(Decimal('1250.00') * attendance_ratio)
    special_allowance = max(Decimal('0.00'), earned_base - (basic + da + hra))
    total_allowances = round_currency(conveyance + medical + special_allowance)

    # 3. Overtime calculation
    normal_hourly_rate = (daily_rate / std_shift_hours) if std_shift_hours > 0 else Decimal('0.00')
    ot_hourly_rate = round_currency(normal_hourly_rate * ot_multiplier)
    overtime_amount = round_currency(ot_hourly_rate * approved_ot_hours)

    # 4. Gross Earnings
    gross_earnings = round_currency(basic + da + hra + total_allowances + overtime_amount)

    # 5. Statutory Deductions
    # Provident fund: 12% on min(Basic + DA, 15000)
    pf_eligible_wage = min(basic + da, pf_ceiling)
    pf_deduction = round_currency(pf_eligible_wage * pf_rate)

    # ESI: 0.75% on gross (only if full-time equivalent gross <= 21000)
    if monthly_base <= esi_ceiling:
        esi_deduction = round_currency(gross_earnings * esi_rate)
    else:
        esi_deduction = Decimal('0.00')

    # Professional Tax
    pt_deduction = pt_flat if earned_base > Decimal('10000.00') else Decimal('0.00')

    # 6. Advance Deduction (capped so net doesn't become negative)
    statutory_total = pf_deduction + esi_deduction + pt_deduction
    max_advance_recovery = max(Decimal('0.00'), gross_earnings - statutory_total)
    actual_advance_deduction = min(advance_deduction, max_advance_recovery)

    # 7. Total Deductions & Net Payable
    total_deductions = round_currency(statutory_total + actual_advance_deduction)
    net_payable = round_currency(max(Decimal('0.00'), gross_earnings - total_deductions))

    return {
        'daily_rate': daily_rate,
        'monthly_base': monthly_base,
        'payable_days': payable_days,
        'basic_salary': basic,
        'da': da,
        'hra': hra,
        'allowances': total_allowances,
        'overtime_amount': overtime_amount,
        'ot_hourly_rate': ot_hourly_rate,
        'gross_earnings': gross_earnings,
        'pf_deduction': pf_deduction,
        'esi_deduction': esi_deduction,
        'pt_deduction': pt_deduction,
        'advance_deduction': actual_advance_deduction,
        'total_deductions': total_deductions,
        'net_payable': net_payable,
    }
