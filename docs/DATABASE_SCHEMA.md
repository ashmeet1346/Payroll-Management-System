# PaySphere Database Schema & ERD Specification

This document details the complete relational database architecture designed for the PaySphere HR, Attendance, Contractor, and Payroll Management System.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    COMPANY ||--o{ AUDIT_LOG : "has audits"
    DEPARTMENT ||--o{ WORKER : "contains"
    DEPARTMENT ||--o{ CONTRACTOR_WORKER_ASSIGNMENT : "allocated in"
    
    WORKER ||--o{ WORKER_WAGE_HISTORY : "tracks wage changes"
    WORKER ||--o{ WORKER_DEPT_HISTORY : "tracks transfers"
    WORKER ||--o{ ATTENDANCE_RECORD : "records daily"
    WORKER ||--o{ ADVANCE : "receives"
    WORKER ||--o{ PAYROLL_LINE : "receives wage line"
    WORKER ||--o{ SALARY_PAYMENT : "receives payment"
    
    SHIFT ||--o{ ATTENDANCE_RECORD : "defines schedule"
    
    CONTRACTOR ||--o{ CONTRACT : "holds"
    CONTRACTOR ||--o{ CONTRACTOR_WORKER_ASSIGNMENT : "supplies"
    CONTRACTOR ||--o{ CONTRACTOR_BILL : "bills"
    
    ADVANCE ||--o{ ADVANCE_TRANSACTION : "ledger entries"
    
    PAYROLL_PERIOD ||--o{ PAYROLL_LINE : "contains lines"
    PAYROLL_LINE ||--o{ SALARY_PAYMENT : "paid through"
    SALARY_RULE_CONFIG ||--o{ PAYROLL_PERIOD : "configures"

    DEPARTMENT {
        bigint id PK
        varchar name "unique"
        text description
        boolean is_active
        varchar head
        varchar location
        timestamp created_at
        timestamp updated_at
    }

    WORKER {
        bigint id PK
        varchar worker_id "unique"
        varchar name
        bigint department_id FK
        varchar designation
        varchar phone
        varchar email
        date joining_date
        varchar status "Active, Inactive, On Leave, Terminated"
        varchar worker_type "Permanent, Contractor"
        varchar wage_basis "Monthly, Daily, Hourly"
        decimal base_wage
        boolean overtime_eligible
        varchar bank_account
        varchar ifsc_code
        varchar aadhar_number
        varchar pan_number
        text photo
    }

    SHIFT {
        bigint id PK
        varchar name
        varchar code "unique"
        time start_time
        time end_time
        integer break_duration_minutes
        decimal standard_hours
        boolean is_night_shift
        boolean is_active
    }

    ATTENDANCE_RECORD {
        bigint id PK
        bigint worker_id FK
        date attendance_date
        bigint shift_id FK
        varchar status "Present, Absent, Leave, Half Day"
        varchar time_in
        varchar time_out
        integer break_minutes
        decimal working_hours
        decimal overtime_hours
        varchar approval_status "Draft, Pending Review, Approved, Rejected, Locked"
        text remarks
        varchar source "manual, imported"
    }

    CONTRACTOR {
        bigint id PK
        varchar contractor_id "unique"
        varchar name
        varchar contact_person
        varchar phone
        varchar email
        varchar pan_number
        varchar gst_number
        boolean is_active
    }

    CONTRACT {
        bigint id PK
        bigint contractor_id FK
        varchar contract_number "unique"
        date start_date
        date end_date
        varchar billing_basis "Per Day, Per Hour, Piece Rate, Fixed Monthly"
        decimal agreed_rate
        decimal overtime_rate
        varchar status "Active, Expired, Terminated"
    }

    CONTRACTOR_BILL {
        bigint id PK
        bigint contractor_id FK
        varchar invoice_number "unique"
        date invoice_date
        date billing_period_start
        date billing_period_end
        decimal total_man_days
        decimal agreed_rate
        decimal base_amount
        decimal overtime_amount
        decimal tax_amount
        decimal deductions
        decimal approved_amount
        decimal payment_amount
        varchar status "Draft, Under Review, Approved, Paid, Rejected"
    }

    ADVANCE {
        bigint id PK
        varchar advance_id "unique"
        bigint worker_id FK
        varchar advance_type "Salary Advance, Fixed Advance"
        decimal principal_amount
        decimal monthly_deduction
        decimal outstanding_balance
        date issue_date
        varchar status "Pending, Approved, Rejected, Completed"
    }

    ADVANCE_TRANSACTION {
        bigint id PK
        bigint advance_id FK
        varchar transaction_type "Disbursement, Payroll Deduction, Manual Repayment, Adjustment"
        decimal amount
        decimal balance_after
        date transaction_date
        varchar reference_number
    }

    PAYROLL_PERIOD {
        bigint id PK
        varchar name
        integer month
        integer year
        integer run_number
        date start_date
        date end_date
        varchar status "Draft, Calculated, Under Review, Approved, Locked, Partially Paid, Paid"
        decimal total_gross
        decimal total_deductions
        decimal total_net_payable
        decimal total_paid
    }

    PAYROLL_LINE {
        bigint id PK
        bigint payroll_period_id FK
        bigint worker_id FK
        varchar wage_basis
        decimal base_rate
        decimal payable_days
        decimal approved_overtime_hours
        decimal basic_salary
        decimal da
        decimal hra
        decimal allowances
        decimal overtime_amount
        decimal gross_earnings
        decimal pf_deduction
        decimal esi_deduction
        decimal pt_deduction
        decimal advance_deduction
        decimal total_deductions
        decimal net_payable
        decimal paid_amount
        decimal outstanding_balance
        varchar payment_status "Unpaid, Partially Paid, Paid"
    }

    SALARY_PAYMENT {
        bigint id PK
        bigint payroll_line_id FK
        bigint worker_id FK
        decimal amount_paid
        date payment_date
        varchar payment_method
        varchar reference_number
        varchar status "Completed, Pending, Failed"
    }
```

---

## 2. Table Specifications & Constraints

### 1. `departments_department`
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigAutoField | Primary Key | Auto-increment identifier |
| `name` | CharField(100) | Unique, Not Null | Unique Department Name |
| `description` | TextField | Blank, Default '' | Department description |
| `is_active` | BooleanField | Default True | Active status |
| `head` | CharField(150) | Blank, Default '' | Department Head / In-charge |
| `location` | CharField(200) | Blank, Default '' | Plant Bay, Floor, or physical unit |
| `created_at` | DateTimeField | auto_now_add | Creation timestamp |
| `updated_at` | DateTimeField | auto_now | Last modification timestamp |

---

### 2. `workers_worker`
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigAutoField | Primary Key | Auto-increment identifier |
| `worker_id` | CharField(50) | Unique, Indexed | Unique Worker Code (e.g. W001) |
| `name` | CharField(150) | Not Null | Full legal name |
| `department_id` | ForeignKey | Null, on_delete=SET_NULL | Assigned Department |
| `designation` | CharField(100) | Blank, Default '' | Job role |
| `phone` | CharField(25) | Blank, Default '' | Contact phone number |
| `email` | EmailField | Blank, Default '' | Contact email address |
| `joining_date` | DateField | Null, Blank | Organization joining date |
| `status` | CharField(20) | Choices, Default 'Active' | Active, Inactive, On Leave, Terminated |
| `worker_type` | CharField(50) | Choices, Default 'Permanent' | Permanent or Contractor |
| `wage_basis` | CharField(20) | Choices, Default 'Monthly' | Monthly, Daily, or Hourly |
| `base_wage` | DecimalField(10,2) | Default 25000.00 | Base monthly or daily wage |
| `overtime_eligible` | BooleanField | Default True | Overtime pay eligibility |
| `bank_account` | CharField(50) | Blank, Default '' | Bank account number |
| `ifsc_code` | CharField(20) | Blank, Default '' | Bank IFSC code |
| `aadhar_number` | CharField(30) | Blank, Default '' | Government Aadhar identity |
| `pan_number` | CharField(20) | Blank, Default '' | Income Tax PAN number |

---

### 3. `attendance_attendancerecord`
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigAutoField | Primary Key | Auto-increment identifier |
| `worker_id` | ForeignKey | on_delete=CASCADE | Worker link |
| `attendance_date`| DateField | Indexed | Date of attendance |
| `shift_id` | ForeignKey | Null, on_delete=SET_NULL | Applicable Shift |
| `status` | CharField(20) | Choices | Present, Absent, Leave, Half Day |
| `time_in` | CharField(20) | Blank | Clock in time (e.g. '08:00 AM') |
| `time_out` | CharField(20) | Blank | Clock out time (e.g. '05:00 PM') |
| `break_minutes` | IntegerField | Default 60 | Unpaid break duration |
| `working_hours` | DecimalField(5,2)| Default 0.00 | Calculated net working hours |
| `overtime_hours`| DecimalField(5,2)| Default 0.00 | Approved eligible overtime hours |
| `approval_status`| CharField(20) | Choices, Indexed | Draft, Pending Review, Approved, Locked |
| `source` | CharField(20) | Choices | 'manual' or 'imported' |
| `approved_by_id`| ForeignKey | Null, on_delete=SET_NULL | User who approved |
| **Unique Constraint** | `[worker_id, attendance_date]` | Unique index | Prevents duplicate worker entries per date |

---

### 4. `payroll_payrollperiod` & `payroll_payrollline`
- `payroll_payrollperiod`:
  - **Unique Constraint:** `[month, year, run_number]`
  - Fields: `total_gross`, `total_deductions`, `total_net_payable`, `total_paid`, `status`
- `payroll_payrollline`:
  - **Unique Constraint:** `[payroll_period_id, worker_id]`
  - Fields: `payable_days`, `approved_overtime_hours`, `basic_salary`, `da`, `hra`, `allowances`, `overtime_amount`, `gross_earnings`, `pf_deduction`, `esi_deduction`, `pt_deduction`, `advance_deduction`, `total_deductions`, `net_payable`, `paid_amount`, `outstanding_balance`, `payment_status`.

---

### 5. `advances_advance` & `advances_advancetransaction`
- `advances_advance`:
  - Unique field: `advance_id`
  - Balance safety: `record_repayment()` prevents repayment > `outstanding_balance`.
- `advances_advancetransaction`:
  - Immutable audit ledger tracking every disbursement, payroll recovery, and adjustment with `balance_after`.
