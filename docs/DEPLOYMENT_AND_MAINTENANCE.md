# PaySphere Deployment & Maintenance Guide

This beginner-friendly guide walks you through maintaining, running, testing, backing up, and deploying the PaySphere system.

---

## 1. Project Folder Structure

```
BR-PMS/
├── backend/                        # Django REST Framework Backend
│   ├── manage.py                   # Django CLI tool
│   ├── .env                        # Local backend environment secrets
│   ├── .env.example                # Sample environment template
│   ├── requirements.txt            # Python dependencies
│   ├── venv/                       # Python virtual environment
│   ├── paysphere/                  # Project configuration & settings
│   │   ├── settings.py             # Database, CORS, JWT, Apps config
│   │   ├── urls.py                 # Root URL router & Swagger docs
│   │   └── wsgi.py                 # Production WSGI entry point
│   ├── core/                       # Company, Users, AuditLog, Dashboard
│   ├── departments/                # Department models, serializers, views
│   ├── workers/                    # Worker profiles & Wage/Dept history
│   ├── contractors/                # Contractors, contracts, assignments, bills
│   ├── attendance/                 # Shifts, attendance records, Excel import
│   ├── advances/                   # Salary & Fixed Advances, ledger transactions
│   │   └── calculations.py         # Centralized Advance recovery formulas
│   └── payroll/                    # Payroll periods, lines, payslips, payments
│       └── calculations.py         # Centralized Salary & OT calculation engine
├── src/                            # React + Vite Frontend Application
│   ├── pages/                      # Page components (Attendance, Workers, etc.)
│   ├── services/                   # Centralized API service (`api.js`)
│   ├── components/                 # Reusable UI widgets
│   ├── App.jsx                     # Root navigation & route dispatcher
│   └── main.jsx                    # Vite entry point
├── docs/                           # Comprehensive technical documentation
├── .env.example                    # Root environment variable template
└── package.json                    # Node dependencies & Vite build scripts
```

---

## 2. Starting the Application Locally

### Step 1: Start the Backend (Terminal 1)
```powershell
# Open terminal inside the backend directory:
cd C:\Users\ashme\OneDrive\Desktop\BR-PMS\backend

# Activate virtual environment:
.\venv\Scripts\Activate.ps1

# Run database migrations:
python manage.py migrate

# Start the Django development server:
python manage.py runserver 127.0.0.1:8000
```
*Backend runs at:* `http://127.0.0.1:8000/`  
*Swagger UI docs:* `http://127.0.0.1:8000/api/docs/`  
*Django Admin panel:* `http://127.0.0.1:8000/admin/`

### Step 2: Start the Frontend (Terminal 2)
```powershell
# Open terminal in project root:
cd C:\Users\ashme\OneDrive\Desktop\BR-PMS

# Run Vite dev server:
npm run dev
```
*Frontend runs at:* `http://localhost:5173/`

---

## 3. How to Run Automated Tests

To run the complete test suite across all 7 backend modules:
```powershell
cd C:\Users\ashme\OneDrive\Desktop\BR-PMS\backend
.\venv\Scripts\python.exe manage.py test
```

To run tests for an individual module:
```powershell
.\venv\Scripts\python.exe manage.py test payroll.tests
.\venv\Scripts\python.exe manage.py test attendance.tests
.\venv\Scripts\python.exe manage.py test advances.tests
```

---

## 4. How to Safely Modify or Add a Model

When you need to add new fields to any database table:

1. **Edit the Model:**
   Open the respective `models.py` (e.g. `backend/workers/models.py`) and add your field:
   ```python
   emergency_contact = models.CharField(max_length=50, blank=True, default='')
   ```
2. **Generate Migration:**
   ```powershell
   python manage.py makemigrations
   ```
3. **Inspect the Migration File:**
   Review the generated file under `migrations/` to verify it will not drop existing data.
4. **Apply Migration:**
   ```powershell
   python manage.py migrate
   ```
5. **Update Serializer:**
   Add the new field to `serializers.py` in the relevant app so the API returns and accepts it.

---

## 5. How to Change Formulas Safely

All business formulas are decoupled in:
- [`backend/payroll/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/payroll/calculations.py)
- [`backend/advances/calculations.py`](file:///C:/Users/ashme/OneDrive/Desktop/BR-PMS/backend/advances/calculations.py)

1. Make your adjustment in the calculation file.
2. Run automated tests to verify arithmetic consistency:
   ```powershell
   python manage.py test payroll.tests
   ```
3. Any future payroll runs or attendance calculations will immediately use the updated logic.

---

## 6. PostgreSQL Backup and Restore

### Backup (Dump Database):
```powershell
# Windows PowerShell command using pg_dump:
pg_dump -h 127.0.0.1 -U paysphere_user -d paysphere_db -F c -b -v -f "C:\backups\paysphere_backup_$(Get-Date -Format 'yyyyMMdd_HHmm').dump"
```

### Restore Database:
```powershell
pg_restore -h 127.0.0.1 -U paysphere_user -d paysphere_db -v "C:\backups\your_backup_file.dump"
```

---

## 7. Creating Users and Assigning Roles

Run this command to create administrative accounts:
```powershell
cd backend
python manage.py createsuperuser
```
Follow prompts to enter username, email, and password.  
You can then log into `http://127.0.0.1:8000/admin/` or `http://localhost:5173/login` using these credentials.
