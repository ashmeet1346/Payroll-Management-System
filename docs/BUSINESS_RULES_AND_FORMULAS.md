# PaySphere Business Rules & Calculation Formulas

This document details all formulas, logic, and configurations implemented in the PaySphere backend.

> **PRIMARY CODE LOCATION FOR FORMULAS:**
> - Salary & Attendance Formulas: [`backend/payroll/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/payroll/calculations.py)
> - Advance & Recovery Formulas: [`backend/advances/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/advances/calculations.py)
> - Configurable Statutory Rates Database Table: [`SalaryRuleConfig`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/payroll/models.py) (`/api/payroll/config/`)

---

## 1. Salary Calculation Formulas

### A. Base Wage & Daily Rate Conversion
Depending on how the worker is compensated (`wage_basis`):

1. **Monthly Salaried Worker:**
   $$\text{Daily Rate} = \frac{\text{Base Wage}}{\text{Standard Days per Month (Default: 26)}}$$
   Example: If monthly base is ₹26,000, Daily Rate = $\frac{26,000}{26} = ₹1,000.00/\text{day}$.

2. **Daily Wage Worker:**
   $$\text{Daily Rate} = \text{Base Wage}$$
   $$\text{Monthly Equivalent} = \text{Daily Rate} \times 26$$

3. **Hourly Wage Worker:**
   $$\text{Daily Rate} = \text{Base Wage} \times \text{Standard Shift Hours (8.0)}$$

---

### B. Pro-Rata Earned Gross Base
$$\text{Earned Base} = \text{Daily Rate} \times \text{Payable Days}$$

Where:
$$\text{Payable Days} = \text{Present Days} + (\text{Half Days} \times 0.5) + \text{Approved Paid Leave Days}$$

*Example:* A worker with Daily Rate of ₹1,000 who worked 24 days + 2 half days has $24 + 1 = 25$ payable days:
$$\text{Earned Base} = 1,000 \times 25 = ₹25,000.00$$

---

### C. Salary Earnings Components Breakdown
Configurable under `SalaryRuleConfig`:

| Component | Default Formula / Percentage | Example on ₹25,000 Earned Base |
| :--- | :--- | :--- |
| **Basic Salary** | $50.0\%$ of Earned Base | $₹12,500.00$ |
| **Dearness Allowance (DA)** | $20.0\%$ of Earned Base | $₹5,000.00$ |
| **House Rent Allowance (HRA)**| $20.0\%$ of Earned Base | $₹5,000.00$ |
| **Fixed Allowances** | Conveyance (₹1600) + Medical (₹1250) pro-rated | $₹2,740.38$ |
| **Special Allowance** | $\max(0, \text{Earned Base} - (\text{Basic} + \text{DA} + \text{HRA}))$ | $₹2,500.00$ |

---

### D. Overtime (OT) Pay Formula
$$\text{Normal Hourly Rate} = \frac{\text{Daily Rate}}{\text{Standard Shift Hours (8.0)}}$$
$$\text{Overtime Hourly Rate} = \text{Normal Hourly Rate} \times \text{Overtime Multiplier (Default: 2.0x)}$$
$$\text{Overtime Earnings} = \text{Overtime Hourly Rate} \times \text{Approved OT Hours}$$

*Example:* For Daily Rate ₹1,000:
- Normal Hourly Rate = $1000 / 8 = ₹125.00/\text{hr}$
- OT Rate = $125 \times 2.0 = ₹250.00/\text{hr}$
- For 6 approved OT hours = $250 \times 6 = ₹1,500.00$

---

### E. Statutory Deductions Formulas

1. **Provident Fund (PF):**
   $$\text{PF Eligible Wage} = \min(\text{Basic} + \text{DA}, \text{PF Ceiling (₹15,000)})$$
   $$\text{Employee PF Deduction} = \text{PF Eligible Wage} \times 12\%$$
   *Example:* If Basic + DA = $12,500 + 5,000 = ₹17,500$, PF is capped at ₹15,000:
   $$\text{PF} = 15,000 \times 0.12 = ₹1,800.00$$

2. **Employee State Insurance (ESI):**
   - Applicable **only** if Monthly Gross $\le$ ESI Ceiling (₹21,000):
   $$\text{ESI Deduction} = \begin{cases} \text{Gross Earnings} \times 0.75\%, & \text{if Monthly Base} \le ₹21,000 \\ ₹0.00, & \text{if Monthly Base} > ₹21,000 \end{cases}$$

3. **Professional Tax (PT):**
   - Standard slab: ₹200.00 monthly if Earned Base > ₹10,000.00.

---

### F. Advance Deduction & Net Salary Formula

$$\text{Total Statutory Deductions} = \text{PF} + \text{ESI} + \text{PT}$$
$$\text{Max Allowable Advance Recovery} = \max(0, \text{Gross Earnings} - \text{Total Statutory Deductions})$$
$$\text{Actual Advance Deducted} = \min(\text{Scheduled Monthly Advance Due}, \text{Max Allowable Advance Recovery})$$

$$\text{Total Deductions} = \text{Total Statutory Deductions} + \text{Actual Advance Deducted}$$
$$\mathbf{Net\ Payable\ Salary} = \mathbf{Gross\ Earnings} - \mathbf{Total\ Deductions}$$
$$\mathbf{Outstanding\ Salary\ Balance} = \mathbf{Net\ Payable} - \mathbf{Recorded\ Salary\ Payments}$$

---

## 2. Advance Calculation Formulas

### A. Salary Advance vs Fixed Advance
- **Salary Advance:** Short-term emergency advance. Default schedule recovers the entire outstanding balance in the next payroll run unless a specific monthly deduction is set.
- **Fixed Advance:** Long-term loan / welfare assistance recovered over multiple months via fixed monthly installments (`monthly_deduction`).

### B. Monthly Recovery Calculation
$$\text{Monthly Recovery} = \min(\text{Monthly Deduction}, \text{Current Outstanding Balance})$$

### C. Repayment & Ledger Safety Rule
$$\text{New Outstanding Balance} = \text{Previous Outstanding Balance} - \text{Repayment Amount}$$
- Repayment must be strictly $> 0$.
- Repayment **cannot exceed** the current outstanding balance.
- When `New Outstanding Balance == 0`, advance status is automatically marked as `Completed`.

---

## 3. Attendance & Working Hours Formulas

### A. Elapsed Working Time
$$\text{Elapsed Time} = \begin{cases} \text{TimeOut} - \text{TimeIn}, & \text{if TimeOut} \ge \text{TimeIn} \\ (\text{TimeOut} + 24\text{h}) - \text{TimeIn}, & \text{if Night Shift (TimeOut} < \text{TimeIn}) \end{cases}$$

### B. Break Deduction
- If shift span is 9.5 hours or longer, a 60-minute unpaid lunch/rest break is deducted:
$$\text{Net Working Minutes} = \begin{cases} \text{Elapsed Minutes} - \text{Break Minutes (60m)}, & \text{if Elapsed Minutes} \ge 9.5 \times 60 \\ \text{Elapsed Minutes}, & \text{otherwise} \end{cases}$$
$$\text{Net Working Hours} = \frac{\text{Net Working Minutes}}{60}$$

### C. Eligible Overtime Hours
$$\text{Overtime Hours} = \max(0, \text{Net Working Hours} - \text{Scheduled Shift Hours (8.0)})$$

---

## 4. How to Change Any Formula

All calculations are cleanly decoupled from views and serializers. You can modify them in two ways:

### Method 1: Change Configuration Rates in Database or Admin Panel (No code changes)
You can change percentages without modifying Python code by navigating to:
1. **Django Admin** -> **Payroll** -> **Salary Rule Configurations** (`/admin/payroll/salaryruleconfig/`)
2. Or calling the API endpoint: `PUT /api/payroll/config/` with:
```json
{
  "basic_percentage": "50.00",
  "da_percentage": "20.00",
  "hra_percentage": "20.00",
  "overtime_multiplier": "2.00",
  "pf_employee_rate": "12.00",
  "pf_wage_ceiling": "15000.00",
  "esi_employee_rate": "0.75",
  "esi_gross_ceiling": "21000.00",
  "professional_tax_monthly": "200.00",
  "standard_month_days": 26
}
```

### Method 2: Change Mathematical Formulas in Python (Custom Logic)
Open [`backend/payroll/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/payroll/calculations.py):

1. **To change the Overtime Multiplier or Break Rule:**
   - Locate function `calculate_working_and_overtime` (lines 75-135).
   - Change the `break_minutes` condition or threshold.

2. **To change how Basic, DA, or HRA is calculated:**
   - Locate function `calculate_worker_salary` (lines 145-245).
   - Edit the percentage breakdown or add new allowances:
   ```python
   # Example: Change Basic to 60% and DA to 10%
   basic_pct = Decimal('0.60')
   da_pct = Decimal('0.10')
   ```

3. **To change Advance Recovery rules:**
   - Open [`backend/advances/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/advances/calculations.py).
   - Edit `calculate_monthly_advance_recovery` to enforce maximum percentages of worker salary (e.g., maximum 30% recovery cap per month).
