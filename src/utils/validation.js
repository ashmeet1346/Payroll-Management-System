/**
 * Central Form Validation Utility for PaySphere HR & Payroll Management System.
 * Implements strict, user-friendly, and consistent validation rules matching backend logic.
 */

// ---------------------------------------------------------------------------
// Verhoeff Algorithm Tables for Aadhaar Checksum Validation
// ---------------------------------------------------------------------------
const VERHOEFF_D = [
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
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const validateVerhoeff = (numStr) => {
  if (!numStr || !/^\d+$/.test(numStr)) return false;
  let c = 0;
  const digits = numStr.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
};

// ---------------------------------------------------------------------------
// Personal & Worker Information Validators
// ---------------------------------------------------------------------------

export const validateName = (name, fieldName = 'Full Name', minLen = 2, maxLen = 100, isRequired = true, allowNumbers = false) => {
  const val = (name || '').trim();
  if (!val) {
    return isRequired ? `${fieldName} cannot be blank.` : null;
  }
  if (!allowNumbers && /\d/.test(val)) {
    return `Numeric values are not allowed in ${fieldName.toLowerCase()}.`;
  }
  if (val.length < minLen || val.length > maxLen) {
    return `${fieldName} must be between ${minLen} and ${maxLen} characters long.`;
  }
  // Allow alphabets, spaces, dots, hyphens, and apostrophes (and numbers/symbols if allowNumbers is true)
  const nameRegex = allowNumbers
    ? /^[A-Za-z0-9][A-Za-z0-9\s'\.\-\/\&\(\)]*$/
    : /^[A-Za-z]+([A-Za-z\s'\.\-]*[A-Za-z\.])$/;
  if (!nameRegex.test(val)) {
    return allowNumbers
      ? `${fieldName} contains invalid characters.`
      : `${fieldName} can only contain letters, spaces, hyphens, and apostrophes.`;
  }
  return null;
};

export const validateWorkAreaName = (name, isRequired = true) => {
  return validateName(name, 'Work Area Name', 2, 100, isRequired, true);
};

export const validateFatherName = (name, isRequired = false) => {
  return validateName(name, "Father's Name", 2, 100, isRequired);
};

export const validateMobile = (mobile, fieldName = 'Mobile number', isRequired = true) => {
  const raw = (mobile || '').trim();
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '').replace(/^\+91/, '');
  if (!cleaned) {
    return isRequired ? `${fieldName} is required.` : null;
  }
  if (!/^\d+$/.test(cleaned)) {
    return `${fieldName} must contain only numeric digits.`;
  }
  if (cleaned.length !== 10) {
    return `${fieldName} must be exactly 10 digits.`;
  }
  if (!/^[6-9]/.test(cleaned)) {
    return `${fieldName} must start with 6, 7, 8, or 9 for a valid Indian mobile number.`;
  }
  return null;
};

export const validateAlternateMobile = (mobile) => {
  if (!mobile || !mobile.trim()) return null;
  return validateMobile(mobile, 'Alternate Mobile number', false);
};

export const validateEmail = (email, isRequired = false) => {
  const val = (email || '').trim();
  if (!val) {
    return isRequired ? 'Email address is required.' : null;
  }
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!emailRegex.test(val)) {
    return 'Enter a valid email address.';
  }
  return null;
};

export const validateAge = (age, minAge = 18, maxAge = 100) => {
  if (age === null || age === undefined || String(age).trim() === '') {
    return 'Age is required.';
  }
  const num = Number(age);
  if (!Number.isInteger(num)) {
    return 'Age must be a whole number.';
  }
  if (num < minAge || num > maxAge) {
    return `Age must be between ${minAge} and ${maxAge}.`;
  }
  return null;
};

export const calculateAgeFromDOB = (dobStr) => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

export const validateDate = (dateVal, fieldName = 'Date', allowFuture = false) => {
  if (!dateVal || !String(dateVal).trim()) {
    return `${fieldName} is required.`;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return `Please enter a valid date for ${fieldName}.`;
  }
  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) {
      return `${fieldName} cannot be a future date.`;
    }
  }
  return null;
};

export const validateDOB = (dobVal, minAge = 18, maxAge = 100) => {
  if (!dobVal || !String(dobVal).trim()) return null;
  const dateErr = validateDate(dobVal, 'Date of birth', false);
  if (dateErr) return dateErr;
  const calculatedAge = calculateAgeFromDOB(dobVal);
  if (calculatedAge === null || calculatedAge < minAge || calculatedAge > maxAge) {
    return `Age calculated from Date of Birth (${calculatedAge ?? 'invalid'} years) must be between ${minAge} and ${maxAge}.`;
  }
  return null;
};

export const validateDateOfJoining = (dojVal, allowFuture = false) => {
  return validateDate(dojVal, 'Date of joining', allowFuture);
};

export const formatDateForInput = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  if (!s || s === 'N/A' || s === 'null' || s === 'undefined') return '';
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // If ISO string with T (e.g. 2024-03-15T00:00:00)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.split('T')[0];
  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Try Date.parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

export const formatDateDisplay = (val) => {
  if (!val) return '—';
  const s = String(val).trim();
  if (!s || s === 'N/A') return '—';
  // Check if DD Mon YYYY already
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Indian Government ID Validators
// ---------------------------------------------------------------------------

export const validateAadhaar = (aadhaar, isRequired = false) => {
  const raw = (aadhaar || '').trim();
  const cleaned = raw.replace(/[\s\-]/g, '');
  if (!cleaned) {
    return isRequired ? 'Aadhaar number is required.' : null;
  }
  if (!/^\d+$/.test(cleaned)) {
    return 'Aadhaar number must contain only numeric digits.';
  }
  if (cleaned.length !== 12) {
    return 'Aadhaar number must be exactly 12 digits.';
  }
  // Reject identical repeating digits
  if (new Set(cleaned.split('')).size === 1) {
    return 'Aadhaar number cannot consist of repeated identical digits.';
  }
  if (['123412341234', '123456789012'].includes(cleaned)) {
    return 'Enter a valid Aadhaar number (placeholder numbers are rejected).';
  }
  if (!validateVerhoeff(cleaned)) {
    return 'Invalid Aadhaar number checksum. Please check the digits entered.';
  }
  return null;
};

export const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '';
  const cleaned = String(aadhaar).replace(/[\s\-]/g, '');
  if (cleaned.length === 12) {
    return `•••• •••• ${cleaned.slice(-4)}`;
  }
  return cleaned.length > 4 ? `•••• ${cleaned.slice(-4)}` : cleaned;
};

export const validatePAN = (pan, isRequired = false) => {
  const raw = (pan || '').trim().toUpperCase();
  if (!raw) {
    return isRequired ? 'PAN number is required.' : null;
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (raw.length !== 10 || !panRegex.test(raw)) {
    return 'Enter a valid 10-character PAN number (e.g. ABCDE1234F).';
  }
  return null;
};

// ---------------------------------------------------------------------------
// Bank Account Validators
// ---------------------------------------------------------------------------

export const validateBankAccount = (accountNo, isRequired = false) => {
  const raw = (accountNo || '').trim();
  const cleaned = raw.replace(/[\s\-]/g, '');
  if (!cleaned) {
    return isRequired ? 'Bank account number is required.' : null;
  }
  if (!/^\d+$/.test(cleaned)) {
    return 'Bank account number must contain only numeric digits.';
  }
  if (cleaned.length < 9 || cleaned.length > 18) {
    return `Bank account number must be between 9 and 18 digits (got ${cleaned.length}).`;
  }
  return null;
};

export const maskBankAccount = (accountNo) => {
  if (!accountNo) return '';
  const str = String(accountNo).trim();
  if (str.length <= 4) return str;
  return `${'•'.repeat(Math.max(4, str.length - 4))}${str.slice(-4)}`;
};

export const validateIFSC = (ifsc, isRequired = false) => {
  const raw = (ifsc || '').trim().toUpperCase();
  if (!raw) {
    return isRequired ? 'IFSC code is required.' : null;
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (raw.length !== 11 || !ifscRegex.test(raw)) {
    return 'Enter a valid 11-character IFSC code (e.g. SBIN0001234 or HDFC0001234).';
  }
  return null;
};

export const validateBankName = (name, isRequired = false) => {
  const val = (name || '').trim();
  if (!val) {
    return isRequired ? 'Bank name is required.' : null;
  }
  if (/^\d+$/.test(val)) {
    return 'Bank name cannot be numeric only.';
  }
  return null;
};

// ---------------------------------------------------------------------------
// Entity Code Validator (Department, Designation, Contractor)
// ---------------------------------------------------------------------------

export const validateCode = (code, fieldName = 'Code', isRequired = true) => {
  const val = (code || '').trim().toUpperCase();
  if (!val) {
    return isRequired ? `${fieldName} is required.` : null;
  }
  const codeRegex = /^[A-Z]{3}[0-9]{3}$/;
  if (!codeRegex.test(val)) {
    return `${fieldName} must consist of exactly 3 alphabetic letters followed by 3 numeric digits (e.g. DEP001).`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Financial & Salary Validators
// ---------------------------------------------------------------------------

export const validateSalary = (amount, fieldName = 'Salary', isRequired = true, allowZero = false) => {
  if (amount === null || amount === undefined || String(amount).trim() === '') {
    return isRequired ? `${fieldName} is required.` : null;
  }
  const num = Number(amount);
  if (isNaN(num)) {
    return `${fieldName} must be a valid numeric amount.`;
  }
  if (!allowZero && num <= 0) {
    return `${fieldName} must be greater than zero.`;
  }
  if (num < 0) {
    return `${fieldName} cannot be negative.`;
  }
  const parts = String(amount).split('.');
  if (parts.length > 1 && parts[1].length > 2) {
    return `${fieldName} cannot have more than 2 decimal places.`;
  }
  return null;
};

export const validateAdvance = (amount, availableBalance = null, fieldName = 'Advance Amount') => {
  const err = validateSalary(amount, fieldName, true, false);
  if (err) return err;
  const num = Number(amount);
  if (availableBalance !== null && availableBalance !== undefined && num > Number(availableBalance)) {
    return `${fieldName} (₹${num.toLocaleString('en-IN')}) cannot exceed available balance / limit of ₹${Number(availableBalance).toLocaleString('en-IN')}.`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Attendance Validators
// ---------------------------------------------------------------------------

export const validateWorkingHours = (hours) => {
  if (hours === null || hours === undefined || String(hours).trim() === '') {
    return 'Working hours are required.';
  }
  const num = Number(hours);
  if (isNaN(num)) {
    return 'Working hours must be a valid numeric value.';
  }
  if (num < 0 || num > 24) {
    return 'Working hours must be between 0 and 24 hours.';
  }
  return null;
};

export const ATTENDANCE_STATUSES = [
  'Present',
  'Absent',
  'Half Day',
  'Paid Leave',
  'Weekly Off',
  'Holiday',
];

export const validateAttendanceStatus = (status) => {
  if (!status || !ATTENDANCE_STATUSES.includes(status)) {
    return `Invalid status. Must be one of: ${ATTENDANCE_STATUSES.join(', ')}.`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Input Sanitization & Real-time Typing Helpers
// ---------------------------------------------------------------------------

export const sanitizeNameInput = (val) => {
  if (!val) return '';
  // Preserve entered value (without stripping numbers) so validation errors can be triggered and displayed
  return val;
};

export const sanitizeNumericInput = (val, maxLen = null) => {
  if (!val) return '';
  const digitsOnly = val.replace(/\D/g, '');
  return maxLen ? digitsOnly.slice(0, maxLen) : digitsOnly;
};

export const sanitizeAlphaNumericUpper = (val, maxLen = null) => {
  if (!val) return '';
  const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return maxLen ? cleaned.slice(0, maxLen) : cleaned;
};

export const getNextWorkerId = (workersList = []) => {
  let maxNum = 0;
  (workersList || []).forEach((w) => {
    const idStr = w.worker_id || w.workerId || w.id || '';
    const match = String(idStr).match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  return `W${String(nextNum).padStart(3, '0')}`;
};
