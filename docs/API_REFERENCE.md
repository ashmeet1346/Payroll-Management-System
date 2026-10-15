# PaySphere REST API Reference

The PaySphere backend exposes fully authenticated, versioned RESTful APIs with OpenAPI 3.0 specifications.

> **Interactive Swagger UI:** `http://127.0.0.1:8000/api/docs/`  
> **ReDoc Documentation:** `http://127.0.0.1:8000/api/redoc/`  
> **OpenAPI Schema (YAML/JSON):** `http://127.0.0.1:8000/api/schema/`

---

## 1. Authentication
Include the authentication token in the `Authorization` header of all requests:
```http
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
Content-Type: application/json
```

---

## 2. API Endpoints Summary

### A. Authentication & Core
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | Authenticate with username/password, returns auth token |
| `POST` | `/api/auth/logout/` | Revoke current user token |
| `GET` | `/api/auth/me/` | Get current logged-in user profile |
| `GET` | `/api/dashboard/stats/` | Real-time workforce, attendance, and payroll aggregates |
| `GET`/`PUT` | `/api/company/` | Company profile & configuration |
| `GET` | `/api/audit-logs/` | System audit trail (filterable by action, model) |
| `GET`/`POST`| `/api/datastore/<key>/` | Module JSON data storage & persistence |

---

### B. Departments & Workers
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`POST` | `/api/departments/` | List and create departments |
| `GET`/`PATCH`/`DELETE` | `/api/departments/<id>/` | Retrieve, update, deactivate department |
| `GET`/`POST` | `/api/workers/` | List and register workers (supports search, department filter) |
| `GET`/`PATCH`/`DELETE` | `/api/workers/<id>/` | Retrieve, update, delete worker |
| `POST` | `/api/workers/<id>/deactivate/` | Authorised worker deactivation |

---

### C. Attendance & Import
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`POST` | `/api/attendance/records/` | Filter by `date`, `department`, `status`, `approval_status` |
| `POST` | `/api/attendance/bulk/` | Bulk mark attendance across workers (Draft/Submit) |
| `POST` | `/api/attendance/approve-bulk/` | Bulk approve or reject attendance records |
| `GET` | `/api/attendance/stats/daily/` | Daily counters: total, present, absent, leave, OT hours |
| `POST` | `/api/attendance/import/` | Upload CSV/Excel attendance sheet with validation |
| `GET` | `/api/attendance/import/batches/` | List previous import batches and error logs |
| `GET` | `/api/attendance/export/` | Download CSV attendance muster roll |

---

### D. Contractors & Contracts
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`POST` | `/api/contractors/` | List and create contractor agencies |
| `GET`/`PATCH`| `/api/contractors/<id>/` | Retrieve/update contractor agency |
| `GET`/`POST` | `/api/contractors/contracts/` | Contractor contracts and agreed unit rates |
| `GET`/`POST` | `/api/contractors/assignments/`| Contractor worker assignments |
| `GET`/`POST` | `/api/contractors/bills/` | Contractor invoices |
| `POST` | `/api/contractors/bills/<id>/approve/` | Approve contractor invoice |
| `POST` | `/api/contractors/bills/<id>/pay/` | Record payment against invoice |

---

### E. Advances
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`POST` | `/api/advances/` | List and issue Salary/Fixed Advances |
| `GET` | `/api/advances/<id>/` | Advance details with complete transaction history |
| `POST` | `/api/advances/<id>/repay/` | Record manual repayment (enforces balance validation) |
| `POST` | `/api/advances/<id>/approve/` | Approve sanctioned advance |

---

### F. Payroll & Payslips
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`PUT` | `/api/payroll/config/` | View and edit calculation percentages & statutory rates |
| `GET`/`POST` | `/api/payroll/periods/` | List and create monthly payroll cycles |
| `POST` | `/api/payroll/periods/<id>/calculate/`| Auto-calculate wages, deductions & net pay across workforce |
| `POST` | `/api/payroll/periods/<id>/approve/` | Approve payroll & post advance deductions to ledger |
| `POST` | `/api/payroll/periods/<id>/lock/` | Lock payroll and freeze attendance |
| `GET` | `/api/payroll/periods/<id>/export/` | Export monthly payroll register to CSV |
| `GET` | `/api/payroll/lines/` | Filter wage lines by period, department, payment status |
| `POST` | `/api/payroll/lines/<id>/pay/` | Disburse partial or full salary payment |
| `GET` | `/api/payroll/lines/<id>/payslip/` | Generate printable employee payslip |

---

## 3. Sample Requests & Responses

### 1. Calculate Payroll for Month
`POST /api/payroll/periods/1/calculate/`
```json
// Response: HTTP 200 OK
{
  "message": "Successfully calculated payroll for 48 workers.",
  "period": {
    "id": 1,
    "name": "October 2026",
    "month": 10,
    "year": 2026,
    "status": "Calculated",
    "total_gross": "1248000.00",
    "total_deductions": "144000.00",
    "total_net_payable": "1104000.00",
    "total_paid": "0.00",
    "outstanding_salary": "1104000.00",
    "lines_count": 48
  }
}
```

### 2. Record Partial Salary Payment
`POST /api/payroll/lines/10/pay/`
```json
// Request:
{
  "amount": "25000.00",
  "payment_method": "Bank Transfer",
  "reference_number": "UTR-AXIS-991283"
}

// Response: HTTP 200 OK
{
  "message": "Recorded payment of ₹25000.00 for Rajesh Kumar.",
  "line": {
    "id": 10,
    "worker": 5,
    "worker_id_code": "W005",
    "worker_name": "Rajesh Kumar",
    "net_payable": "28500.00",
    "paid_amount": "25000.00",
    "outstanding_balance": "3500.00",
    "payment_status": "Partially Paid"
  }
}
```
