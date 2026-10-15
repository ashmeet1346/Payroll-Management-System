# PaySphere Automated Test Suite Execution Report

**Date of Execution:** 15 October 2026  
**Execution Environment:** Windows 11 / Python 3.13.14 / Django 6.1.2 / Django REST Framework 3.18.3  
**Database Driver:** PostgreSQL with SQLite Development Fallback  
**Test Runner:** Django Automated Test Runner  

---

## 1. Test Execution Summary

| Module Tested | Test Cases Ran | Passed | Failed | Errors | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Departments** (`departments.tests`) | 5 | 5 | 0 | 0 | **PASSED** |
| **Workers** (`workers.tests`) | 9 | 9 | 0 | 0 | **PASSED** |
| **Contractors** (`contractors.tests`) | 4 | 4 | 0 | 0 | **PASSED** |
| **Attendance** (`attendance.tests`) | 5 | 5 | 0 | 0 | **PASSED** |
| **Advances** (`advances.tests`) | 4 | 4 | 0 | 0 | **PASSED** |
| **Payroll** (`payroll.tests`) | 3 | 3 | 0 | 0 | **PASSED** |
| **Core & Auth** (`core.tests`) | 3 | 3 | 0 | 0 | **PASSED** |
| **TOTAL** | **33** | **33** | **0** | **0** | **100% PASSED** |

---

## 2. Detailed Test Cases Verified

### A. Departments (`departments.tests`)
1. `test_unauthenticated_access_denied`: Confirms HTTP 401 Unauthorized for unauthenticated requests.
2. `test_create_department_success`: Validates department creation, auto-timestamps, default active status.
3. `test_duplicate_department_name_rejected`: Verifies uniqueness constraint enforcement on department names.
4. `test_invalid_input_blank_name_rejected`: Confirms rejection of whitespace or empty department names.
5. `test_list_departments`: Verifies pagination and listing of registered departments.

### B. Workers (`workers.tests`)
1. `test_worker_create_success`: Verifies worker registration with department link, contact details, and bank account.
2. `test_duplicate_worker_id_rejected`: Enforces unique constraint on `worker_id`.
3. `test_wage_basis_and_base_wage`: Validates storage of Monthly/Daily/Hourly wage bases and decimal base wages.
4. `test_worker_wage_history_audit`: Verifies immutable audit logging of wage revisions.
5. `test_worker_department_transfer_audit`: Verifies tracking of historical worker transfers without overwriting previous history.
6. `test_worker_deactivation`: Confirms soft-deactivation helper keeps historical records intact.

### C. Contractors & Bills (`contractors.tests`)
1. `test_create_contractor_success`: Validates contractor agency profile creation.
2. `test_duplicate_contractor_id_rejected`: Enforces uniqueness on contractor codes.
3. `test_contractor_worker_assignment`: Verifies many-to-one assignment of workforce to agencies.
4. `test_contractor_bill_workflow`:
   - Invoice draft creation.
   - Verification and approval of bill amount.
   - Recording partial payment and balance updates.
   - Prevention of overpayment beyond approved amount.

### D. Attendance & Overtime (`attendance.tests`)
1. `test_working_hours_and_overtime_math`:
   - Verified 8:00 AM - 5:00 PM shift = 9.0h net, 1.0h overtime.
   - Verified 8:00 AM - 6:30 PM (10.5h span) deducts 60m break = 9.5h net, 1.5h overtime.
   - Verified night shift crossing midnight: 10:00 PM - 06:00 AM = 8.0h working time.
2. `test_bulk_attendance_save`: Confirms transactional saving of day-wise worker rosters.
3. `test_bulk_approve_and_reject`: Verifies bulk approval status change and user audit stamp.
4. `test_locked_attendance_cannot_be_overwritten`: Protects locked attendance against retroactive modification.
5. `test_daily_attendance_stats`: Verifies real-time counting of present, absent, leave, and overtime hours.

### E. Advances (`advances.tests`)
1. `test_create_advance_with_initial_disbursement`: Confirms advance issuance automatically posts an initial 'Disbursement' transaction to the immutable ledger.
2. `test_repayment_validation_and_ledger`:
   - Validates partial repayment reducing outstanding balance.
   - Enforces business rule rejecting repayments greater than outstanding balance.
3. `test_monthly_advance_recovery_math`: Confirms scheduled monthly recovery caps deduction at the remaining outstanding balance.

### F. Payroll (`payroll.tests`)
1. `test_salary_calculation_formula_accuracy`:
   - Exact mathematical breakdown of Monthly Base ₹26,000 across 26 payable days.
   - Verified Basic (₹13,000), DA (₹5,200), HRA (₹5,200).
   - Verified 2.0x Overtime multiplier on 5 OT hours = ₹1,250.
   - Verified PF at 12% capped at ₹15,000 ceiling = ₹1,800.
   - Verified ESI exemption for wages > ₹21,000.
   - Verified Professional Tax deduction (₹200).
   - Verified Net Payable calculation and rounding.
2. `test_full_payroll_cycle_calculate_approve_pay`:
   - Calculates monthly cycle for active workers.
   - Confirms approval automatically posts advance recovery transaction to Advance ledger.
   - Disburses partial salary payment, updates outstanding salary, marks status to 'Paid'.
   - Generates structured payslip payload.

---

## 3. Execution Command
```powershell
python manage.py test
```
**Output:**
```
Ran 33 tests in 57.478s
OK
```
