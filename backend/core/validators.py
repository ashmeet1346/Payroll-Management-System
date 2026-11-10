"""
Core Validators for PaySphere HR & Payroll Management System.
Provides strict, professional, and consistent validation across all Django backend apps.
"""

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from rest_framework import serializers

# ---------------------------------------------------------------------------
# Verhoeff Algorithm Tables for Aadhaar Checksum Validation
# ---------------------------------------------------------------------------
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff(num_str: str) -> bool:
    """Validate a numeric string using the Verhoeff checksum algorithm."""
    if not num_str or not num_str.isdigit():
        return False
    c = 0
    reversed_digits = [int(x) for x in reversed(num_str)]
    for i, digit in enumerate(reversed_digits):
        p_val = VERHOEFF_P[i % 8][digit]
        c = VERHOEFF_D[c][p_val]
    return c == 0


# ---------------------------------------------------------------------------
# General & Personal Information Validators
# ---------------------------------------------------------------------------

NAME_REGEX = re.compile(r"^[A-Za-z]+([A-Za-z\s'\.\-]*[A-Za-z\.])$")


def validate_name_string(value, field_name="Name", min_len=2, max_len=100, required=True):
    """
    Validate full name, father's name, or owner name.
    Accepts alphabets, spaces, apostrophes, hyphens, and dots.
    Rejects numbers and arbitrary special characters.
    """
    if value is None:
        cleaned = ""
    else:
        cleaned = str(value).strip()

    if not cleaned:
        if required:
            raise serializers.ValidationError(f"{field_name} cannot be blank.")
        return ""

    # Reject any numeric characters first
    if any(ch.isdigit() for ch in cleaned):
        raise serializers.ValidationError(f"Numeric values are not allowed in {field_name.lower()}.")

    if len(cleaned) < min_len or len(cleaned) > max_len:
        raise serializers.ValidationError(
            f"{field_name} must be between {min_len} and {max_len} characters long."
        )

    # Match allowed characters
    if not NAME_REGEX.match(cleaned):
        raise serializers.ValidationError(
            f"{field_name} can only contain letters, spaces, hyphens, and apostrophes."
        )

    return cleaned


def validate_indian_mobile(value, field_name="Mobile number", required=True):
    """
    Validate 10-digit Indian mobile number.
    Must start with 6, 7, 8, or 9.
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    # Remove standard prefixes/symbols like +91, -, space
    cleaned = re.sub(r"[\s\-\(\)\.]", "", raw)
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]

    if not cleaned:
        if required:
            raise serializers.ValidationError(f"{field_name} is required.")
        return ""

    if not cleaned.isdigit():
        raise serializers.ValidationError(f"{field_name} must contain only numeric digits.")

    if len(cleaned) != 10:
        raise serializers.ValidationError(
            f"{field_name} must be exactly 10 digits (got {len(cleaned)})."
        )

    if cleaned[0] not in "6789":
        raise serializers.ValidationError(
            f"{field_name} must start with 6, 7, 8, or 9 for a valid Indian mobile number."
        )

    return cleaned


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_email_address(value, required=False):
    """Validate email address format."""
    if value is None:
        cleaned = ""
    else:
        cleaned = str(value).strip()

    if not cleaned:
        if required:
            raise serializers.ValidationError("Email address is required.")
        return ""

    if not EMAIL_REGEX.match(cleaned):
        raise serializers.ValidationError("Enter a valid email address.")

    return cleaned.lower()


def validate_age_value(value, min_age=18, max_age=100):
    """Validate whole number age between min_age and max_age."""
    if value is None or str(value).strip() == "":
        return None

    try:
        age_int = int(value)
    except (ValueError, TypeError):
        raise serializers.ValidationError("Age must be a whole number.")

    if age_int < min_age or age_int > max_age:
        raise serializers.ValidationError(f"Age must be between {min_age} and {max_age}.")

    return age_int


def parse_date_safe(val):
    """Parse flexible date formats into a date object."""
    if not val or val == "N/A":
        return None
    if isinstance(val, date):
        return val
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d %b %Y", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d %B %Y"):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def validate_date_not_future(val, field_name="Date"):
    """Ensure date is valid and not in the future."""
    d = parse_date_safe(val)
    if not d:
        raise serializers.ValidationError(f"Invalid date format for {field_name}.")
    if d > date.today():
        raise serializers.ValidationError(f"{field_name} cannot be a future date.")
    return d


def validate_dob_and_calculate_age(val, min_age=18, max_age=100):
    """Validate Date of Birth and ensure worker is at least min_age."""
    if not val:
        return None, None
    d = validate_date_not_future(val, field_name="Date of birth")
    today = date.today()
    calculated_age = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    if calculated_age < min_age or calculated_age > max_age:
        raise serializers.ValidationError(
            f"Age calculated from Date of Birth ({calculated_age} years) must be between {min_age} and {max_age}."
        )
    return d, calculated_age


# ---------------------------------------------------------------------------
# Indian Government ID Validators
# ---------------------------------------------------------------------------


def validate_aadhaar_number(value, required=False):
    """
    Validate 12-digit Indian Aadhaar Number.
    Checks numeric-only, 12 digits, non-repeating, and Verhoeff checksum.
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    cleaned = re.sub(r"[\s\-]", "", raw)
    if not cleaned:
        if required:
            raise serializers.ValidationError("Aadhaar number is required.")
        return ""

    if not cleaned.isdigit():
        raise serializers.ValidationError("Aadhaar number must contain only numeric digits.")

    if len(cleaned) != 12:
        raise serializers.ValidationError("Aadhaar number must be exactly 12 digits.")

    # Reject repetitive dummy numbers like 000000000000, 111111111111
    if len(set(cleaned)) == 1:
        raise serializers.ValidationError("Aadhaar number cannot consist of repeated identical digits.")

    if cleaned in ("123412341234", "123456789012"):
        raise serializers.ValidationError("Enter a valid Aadhaar number (placeholder numbers are rejected).")

    if not validate_verhoeff(cleaned):
        raise serializers.ValidationError("Invalid Aadhaar number checksum. Please check the digits entered.")

    return cleaned


def mask_aadhaar(value):
    """Mask Aadhaar number to display as •••• •••• 1234."""
    if not value or len(str(value)) < 4:
        return value
    clean = re.sub(r"[\s\-]", "", str(value))
    if len(clean) == 12:
        return f"•••• •••• {clean[-4:]}"
    return f"•••• {clean[-4:]}"


PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")


def validate_pan_number(value, required=False):
    """
    Validate 10-character Indian PAN Number.
    Format: 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    cleaned = re.sub(r"[\s\-]", "", raw).upper()
    if not cleaned:
        if required:
            raise serializers.ValidationError("PAN number is required.")
        return ""

    if len(cleaned) != 10 or not PAN_REGEX.match(cleaned):
        raise serializers.ValidationError(
            "Enter a valid 10-character PAN number in standard format (e.g. ABCDE1234F)."
        )

    return cleaned


# ---------------------------------------------------------------------------
# Bank Account Validators
# ---------------------------------------------------------------------------


def validate_bank_account_number(value, required=False):
    """
    Validate Bank Account Number.
    Must be numbers only, 9 to 18 digits.
    Stored as string to preserve leading zeroes.
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    cleaned = re.sub(r"[\s\-]", "", raw)
    if not cleaned:
        if required:
            raise serializers.ValidationError("Bank account number is required.")
        return ""

    if not cleaned.isdigit():
        raise serializers.ValidationError("Bank account number must contain only numeric digits.")

    if len(cleaned) < 9 or len(cleaned) > 18:
        raise serializers.ValidationError(
            f"Bank account number must be between 9 and 18 digits (got {len(cleaned)})."
        )

    return cleaned


def mask_bank_account(value):
    """Mask Bank Account number to display as ••••••••1234."""
    if not value or len(str(value)) < 4:
        return value
    clean = str(value).strip()
    return f"{'•' * (len(clean) - 4)}{clean[-4:]}"


IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


def validate_ifsc_code(value, required=False):
    """
    Validate 11-character Indian IFSC code.
    Format: 4 letters, 0, 6 alphanumeric (e.g. SBIN0001234).
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    cleaned = re.sub(r"[\s\-]", "", raw).upper()
    if not cleaned:
        if required:
            raise serializers.ValidationError("IFSC code is required.")
        return ""

    if len(cleaned) != 11 or not IFSC_REGEX.match(cleaned):
        raise serializers.ValidationError(
            "Enter a valid 11-character IFSC code (e.g. SBIN0001234 or HDFC0001234)."
        )

    return cleaned


def validate_bank_name_string(value, required=False):
    """Validate Bank Name. Allows letters, spaces, dots, hyphens. Rejects numbers alone."""
    if value is None:
        cleaned = ""
    else:
        cleaned = str(value).strip()

    if not cleaned:
        if required:
            raise serializers.ValidationError("Bank name is required.")
        return ""

    # Reject numbers alone
    if cleaned.isdigit():
        raise serializers.ValidationError("Bank name cannot be numeric only.")

    return cleaned


# ---------------------------------------------------------------------------
# Code Format Validator (Department, Designation, Contractor)
# ---------------------------------------------------------------------------

CODE_REGEX = re.compile(r"^[A-Z]{3}[0-9]{3}$")


def validate_entity_code(value, field_name="Code", required=True):
    """
    Validate entity code (Department, Designation, Contractor).
    Must consist of exactly 3 alphabetic characters followed by 3 numeric digits.
    Example: DEP001, ACT001, CON001.
    """
    if value is None:
        raw = ""
    else:
        raw = str(value).strip()

    cleaned = raw.upper()
    if not cleaned:
        if required:
            raise serializers.ValidationError(f"{field_name} is required.")
        return ""

    if not CODE_REGEX.match(cleaned):
        raise serializers.ValidationError(
            f"{field_name} must consist of exactly 3 alphabetic letters followed by 3 numeric digits (e.g. DEP001)."
        )

    return cleaned


# ---------------------------------------------------------------------------
# Salary & Financial Validators
# ---------------------------------------------------------------------------


def validate_positive_amount(value, field_name="Amount", allow_zero=False):
    """Validate monetary amount (salary, advance, rate). Must be non-negative with max 2 decimals."""
    if value is None or str(value).strip() == "":
        raise serializers.ValidationError(f"{field_name} is required.")

    try:
        val_dec = Decimal(str(value).strip())
    except (InvalidOperation, ValueError, TypeError):
        raise serializers.ValidationError(f"{field_name} must be a valid numeric amount.")

    if not allow_zero and val_dec <= Decimal("0.00"):
        raise serializers.ValidationError(f"{field_name} must be greater than zero.")

    if val_dec < Decimal("0.00"):
        raise serializers.ValidationError(f"{field_name} cannot be negative.")

    # Check decimal places
    if val_dec.as_tuple().exponent < -2:
        raise serializers.ValidationError(f"{field_name} cannot have more than 2 decimal places.")

    return val_dec


# ---------------------------------------------------------------------------
# Attendance Validators
# ---------------------------------------------------------------------------

ATTENDANCE_STATUS_CHOICES = [
    "Present",
    "Absent",
    "Half Day",
    "Paid Leave",
    "Weekly Off",
    "Holiday",
]


def validate_attendance_status_choice(value):
    """Validate attendance status choice."""
    if not value or str(value).strip() not in ATTENDANCE_STATUS_CHOICES:
        raise serializers.ValidationError(
            f"Invalid attendance status. Allowed values are: {', '.join(ATTENDANCE_STATUS_CHOICES)}."
        )
    return str(value).strip()


def validate_working_hours_range(value):
    """Validate working hours between 0.00 and 24.00."""
    try:
        hrs = Decimal(str(value).strip())
    except (InvalidOperation, ValueError, TypeError):
        raise serializers.ValidationError("Working hours must be a valid numeric value.")

    if hrs < Decimal("0.00") or hrs > Decimal("24.00"):
        raise serializers.ValidationError("Working hours must be between 0 and 24 hours.")

    return hrs
