import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)  # 16:9 Widescreen
prs.slide_height = Inches(7.5)

# Color Palette
DARK_NAVY = RGBColor(15, 23, 42)       # #0F172A
CARD_BG = RGBColor(248, 250, 252)      # #F8FAFC
CARD_BORDER = RGBColor(203, 213, 225)  # #CBD5E1
PRIMARY_BLUE = RGBColor(37, 99, 235)   # #2563EB
TEXT_DARK = RGBColor(30, 41, 59)       # #1E293B
TEXT_MUTED = RGBColor(71, 85, 105)     # #475569
WHITE = RGBColor(255, 255, 255)
ACCENT_TEAL = RGBColor(13, 148, 136)   # #0D9488

slides_data = [
    {
        "title": "PaySphere (BR-PMS)",
        "subtitle": "Industrial Workforce Payroll & Attendance Management System",
        "tagline": "A Modern Full-Stack ERP Solution for Manufacturing & Forging Plants",
        "type": "title",
        "bullets": [
            "Project Title: PaySphere — Industrial Workforce Payroll & Attendance Management ERP",
            "Domain: Enterprise Resource Planning (ERP), Industrial HR & Statutory Compliance",
            "Technology Stack: React 19, Tailwind CSS v4, Django REST Framework, PostgreSQL / SQLite",
            "Key Capabilities: Biometric Punch Integration, 7 Industrial Wage Models, EPF/ESIC Compliance, Loan Ledgers"
        ],
        "notes": "Good morning respected teachers and fellow classmates. Today, I am proud to present our project: PaySphere (BR-PMS) — an Industrial Workforce Payroll and Attendance Management System designed specifically to tackle the real-world operational challenges of manufacturing and forging plants."
    },
    {
        "title": "1. Introduction & Problem Statement",
        "subtitle": "Challenges in Traditional Industrial Workforce Management",
        "type": "split",
        "left_title": "The Industry Reality",
        "left_items": [
            "Heavy manufacturing plants employ hundreds of permanent and contract laborers.",
            "Workforces operate across rotating 24x7 shifts with extensive overtime demands.",
            "Heavy reliance on paper registers, manual punch cards, and disconnected spreadsheets.",
            "Widespread calculation mistakes in overtime, leave adjustments, and advance recoveries."
        ],
        "right_title": "Core Pain Points & Financial Leaks",
        "right_items": [
            "Attendance manipulation and 'buddy punching' causing unearned salary payouts.",
            "Discrepancies in contractor agency invoices with zero verified plant floor audit.",
            "Risk of statutory non-compliance penalties under the Indian Factories Act, EPF, and ESIC.",
            "Manual payroll cycles taking 7 to 10 days every single month."
        ],
        "notes": "Let's examine why this software is needed. In manufacturing industries like steel forging and CNC machining, plants manage hundreds of daily-wage, piece-rate, and contract workers across day and night shifts. Tracking these workers on paper or spreadsheets results in massive financial leakages—from unearned overtime to contractor billing disputes and government compliance penalties. Our goal was to replace this chaos with a unified, transparent ERP."
    },
    {
        "title": "2. Project Objectives & Vision",
        "subtitle": "Designing an Intelligent, Auditable Industrial ERP",
        "type": "cards",
        "cards": [
            {"title": "Automated Biometric Attendance", "desc": "Capture biometric punches in real-time, aggregate shift hours, calculate overtime automatically, and enforce multi-stage approval (Draft -> Approved -> Locked)."},
            {"title": "Industrial Wage Engine (7 Policies)", "desc": "Support diverse wage contracts: Fixed salary, Piece rate, Rs per ton, Rs per kg, Hourly, and Daily rates tailored for factory production floors."},
            {"title": "100% Statutory Compliance", "desc": "Automated Indian statutory compliance: EPF (12% up to ₹15,000 ceiling), ESIC (0.75%), Professional Tax, and Factories Act Overtime (2.0x)."},
            {"title": "Advance Ledgers & Contractor Audit", "desc": "Double-entry employee advance recovery system and cross-auditing contractor bills directly against biometric man-days."}
        ],
        "notes": "The primary objectives of PaySphere are four-fold: 1) Completely automate attendance from biometric hardware to a tamper-proof locked state. 2) Provide a specialized industrial wage engine supporting 7 manufacturing-specific salary policies. 3) Automatically calculate all statutory deductions like EPF and ESIC to the exact rupee. And 4) Manage worker cash loans and verify third-party contractor invoices against verified biometric logs."
    },
    {
        "title": "3. System Architecture & Tech Stack",
        "subtitle": "Decoupled Modern Client-Server Architecture",
        "type": "split",
        "left_title": "Frontend (Single-Page App)",
        "left_items": [
            "Framework: React 19 (Component-driven SPA architecture)",
            "Styling: Tailwind CSS v4 for clean, high-performance responsive UI",
            "Iconography: Lucide React for consistent industrial visual hierarchy",
            "Build Tooling: Vite 6 for ultra-fast Hot Module Replacement & bundling",
            "Modular State & API Services: Centralized REST client abstraction"
        ],
        "right_title": "Backend (RESTful Core)",
        "right_items": [
            "Framework: Django 5 & Django REST Framework (DRF)",
            "Database: PostgreSQL for production, automatic fallback to SQLite",
            "API Documentation: drf-spectacular generating OpenAPI 3.0 & Swagger UI",
            "Security: Django Token Authentication & granular role-based permissions",
            "Modular Apps: core, workers, departments, attendance, advances, payroll, contractors"
        ],
        "notes": "Our system follows a decoupled Single Page Application (SPA) architecture. The client is built with React 19, Tailwind CSS 4, and Vite 6, giving plant supervisors an instantaneous, mobile-friendly interface. On the backend, we utilized Django 5 and Django REST Framework. Django was chosen for its battle-tested security, robust ORM, and enterprise-grade relational modeling. The backend also supports an automatic fallback from PostgreSQL to SQLite, ensuring zero friction during local deployment."
    },
    {
        "title": "4. Database Schema & Data Modeling",
        "subtitle": "Relational Integrity, Audit Trails & Multi-Tenancy",
        "type": "cards",
        "cards": [
            {"title": "Organization & Master Data", "desc": "Company profile, Plant Departments (Production, CNC, Tool Room, Dispatch), and job Designations defining workforce organizational structure."},
            {"title": "Workforce & Historization", "desc": "Worker master profiles with immutable WorkerWageHistory and WorkerDepartmentHistory, preventing retroactive data corruption during audits."},
            {"title": "Biometric & Shifts", "desc": "Shift configurations (Day/Night, unpaid breaks), raw hardware AttendancePunches, and date-wise locked AttendanceRecord entities."},
            {"title": "Payroll, Advances & Billing", "desc": "PayrollPeriod monthly cycles, snapshot-preserved PayrollLine entities, AdvanceTransaction ledgers, and ContractorBill verification."}
        ],
        "notes": "A critical technical highlight of our database schema is historization and immutability. When an employee receives a salary increase or shifts departments, rather than simply mutating the worker record, the backend generates an immutable historical entry in WorkerWageHistory. When payroll is calculated, each PayrollLine captures a complete JSON snapshot of all rules applied. Even if company statutory rules change years later, historical payroll audits remain 100% accurate."
    },
    {
        "title": "5. Workforce & Department Management",
        "subtitle": "Flexible Profiles for Permanent & Contractor Staff",
        "type": "split",
        "left_title": "Comprehensive Worker Onboarding",
        "left_items": [
            "Unique Worker ID generation (e.g., W001, EMP-101, CON-501).",
            "Dual worker classification: Permanent Staff vs Contractor Agency Personnel.",
            "KYC and Compliance storage: Aadhaar, PAN card, bank details, and photo.",
            "Wage basis assignment: Monthly, Daily, or Hourly pay rates."
        ],
        "right_title": "Manufacturing Plant Department Structure",
        "right_items": [
            "Modeled around plant bays: Security, Production, Tool Room, CNC Machining, Cutting, Shot Blasting, Dispatch, and Accounts.",
            "Real-time dynamic headcount tracking active floor personnel.",
            "Designation mapping linking job roles to plant departments.",
            "Safe worker deactivation preserving full attendance & salary history."
        ],
        "notes": "Our workforce management module handles the full lifecycle of plant staff. Both permanent enterprise employees and third-party contractor workers are registered with unique IDs, KYC documents (Aadhaar, PAN, and Bank IFSC), and assigned plant departments like CNC Machining, Tool Room, or Dispatch. Plant managers have a real-time visual headcount of active workers per department at any moment."
    },
    {
        "title": "6. Shift & Biometric Attendance Lifecycle",
        "subtitle": "Hardware Punch Ingestion to Locked Approval Workflow",
        "type": "cards",
        "cards": [
            {"title": "1. Shift Scheduling", "desc": "Configurable shifts (Day Shift 8 AM - 5 PM, Night Shift crossing midnight) with standard 8.0h work rules and unpaid breaks."},
            {"title": "2. Biometric Ingestion", "desc": "Direct API punch ingestion from biometric fingerprint/face scanners via AttendancePunch, plus batch Excel/CSV imports with syntax validation."},
            {"title": "3. Automated Daily Synthesis", "desc": "Calculates net working hours, half-day conditions, and overtime hours automatically against scheduled shift standard hours."},
            {"title": "4. Multi-Stage Approval", "desc": "Rigorous approval stages: Draft -> Pending Review -> Approved -> Locked. Freezes records so no post-approval tampering can occur."}
        ],
        "notes": "Here we see our automated attendance pipeline. Raw time logs from biometric hardware hit our AttendancePunch model. The backend automatically synthesizes these punches into AttendanceRecord entries, accounting for break times and calculating overtime. Most importantly, attendance follows a four-step lifecycle: Draft, Pending, Approved, and Locked. Once marked Locked by the HR manager, the data is frozen, guaranteeing that attendance cannot be falsified prior to salary calculation."
    },
    {
        "title": "7. Industrial Wage Engine: 7 Salary Policies",
        "subtitle": "Specialized Wage Models for Manufacturing & Production",
        "type": "split",
        "left_title": "Attendance & Time-Based Policies",
        "left_items": [
            "1. Fixed Salary with Absent Deduction: Monthly pay pro-rated by working days; deductions for unpaid absences.",
            "2. Fixed with Holiday / Sunday OT: Monthly pay plus premium multipliers for plant weekend and emergency shifts.",
            "3. Basic Time-Based: Direct hours-worked compensation for floating operators.",
            "4. Piece Rate (Pcs): Direct compensation per finished machined component."
        ],
        "right_title": "Tonnage & Metric-Based Pay",
        "right_items": [
            "5. Rs Per Tonnage: Standard in steel forging; workers are paid per metric ton of metal forged or moved.",
            "6. Rs Per Kg: Precision fabrication and finishing pay based on total weight processed.",
            "7. Rs Per Hour: Standard contractor hourly billing models.",
            "Each worker profile stores their specific policy and rate for zero manual intervention."
        ],
        "notes": "A standout feature that distinguishes PaySphere from generic corporate HR software is our 7 industrial wage engines. In a forging or casting facility, workers are not just on fixed salaries. Helpers in cutting shops are often paid per ton of steel processed. Grinding operators are paid per kilogram. Machine specialists receive piece rates per component. PaySphere supports all these industrial payment methods directly out of the box."
    },
    {
        "title": "8. Statutory Compliance & Salary Calculations",
        "subtitle": "Automated Indian Labor Law & EPF / ESIC Rules",
        "type": "cards",
        "cards": [
            {"title": "Salary Structure Breakdown", "desc": "Basic Salary (50% of earned base), Dearness Allowance (20%), HRA (20%), Conveyance & Medical allowances, and balancing Special Allowance."},
            {"title": "Employees' Provident Fund (EPF)", "desc": "12% statutory employee contribution on (Basic + DA), capped automatically at the government statutory ceiling of ₹15,000."},
            {"title": "Employees' State Insurance (ESIC)", "desc": "0.75% statutory deduction on Gross Earnings for workers earning up to the gross ceiling of ₹21,000 per month."},
            {"title": "Factories Act Overtime (2.0x)", "desc": "Strict compliance with Indian labor law: Overtime Hourly Rate = (Daily Rate / 8.0) * 2.0x for all approved overtime hours."}
        ],
        "notes": "Slide 8 details our statutory calculations. PaySphere complies strictly with the Indian Factories Act of 1948, which mandates that overtime must be paid at double the normal hourly wage. The backend breaks gross pay into Basic, DA, and HRA, and calculates EPF at 12% capped at the ₹15,000 ceiling, ESIC at 0.75% under the ₹21,000 threshold, and standard Professional Tax. All percentage rates are dynamic and configurable in our SalaryRuleConfig table."
    },
    {
        "title": "9. Worker Advances & Loan Recovery",
        "subtitle": "Dual-Type Advance Management & Automatic Recovery",
        "type": "split",
        "left_title": "Dual Advance Architecture",
        "left_items": [
            "1. Salary Advance: Short-term emergency cash advances disbursed mid-month; recovered in full in next payroll.",
            "2. Fixed Advance (Multi-Month Loan): Sanctioned medical or festival loans recovered in agreed monthly installments (EMIs).",
            "Multi-stage status: Pending -> Approved -> Rejected -> Completed.",
            "Automated protection: Repayment cannot exceed net earned pay."
        ],
        "right_title": "Double-Entry Transaction Ledger",
        "right_items": [
            "Every advance is backed by an immutable AdvanceTransaction ledger.",
            "Tracks Disbursements, Payroll Deductions, Manual Repayments, and Adjustments.",
            "Real-time balance tracking automatically terminates loan when balance hits ₹0.00.",
            "Complete audit trail showing which manager sanctioned or adjusted the advance."
        ],
        "notes": "In factory environments, workers frequently need cash advances for medical emergencies or festival expenses. Tracking advances on paper registers frequently causes forgotten deductions or disputes. PaySphere introduces a dual-advance architecture: short-term Salary Advances that deduct on the next payday, and multi-month Fixed Advances with structured monthly EMIs. Every transaction is tracked in an immutable double-entry ledger that automatically closes when the balance hits zero."
    },
    {
        "title": "10. Contractor & Agency Workforce Billing",
        "subtitle": "Eliminating Billing Fraud via Automated Attendance Auditing",
        "type": "cards",
        "cards": [
            {"title": "Contractor Agency Onboarding", "desc": "Full agency profile management with Labour License numbers, GSTIN, PAN, and assigned plant department contracts."},
            {"title": "Contract Validity & Agreed Rates", "desc": "Defines valid agreement periods, agreed daily man-day rates (e.g., ₹650/day), agreed overtime rates, and billing basis."},
            {"title": "Worker Assignment Tracking", "desc": "Maps individual contract laborers to specific agencies and department bays with active deployment dates."},
            {"title": "Automated Bill Reconciliation", "desc": "Audits contractor invoice claims against actual biometric attendance man-days and overtime before approving payout."}
        ],
        "notes": "Contractor workforce billing is often where factories suffer substantial financial losses. Third-party labor suppliers often bill for 500 man-days when only 420 days were actually worked. In PaySphere, contractor bills are automatically audited against the verified AttendanceRecord database. If an agency's claimed hours don't match the biometric logs, the system flags the variance, preventing overpayment and ensuring complete transparency."
    },
    {
        "title": "11. Payroll Processing Cycle & Payslips",
        "subtitle": "End-to-End Monthly Run from Attendance to Disbursement",
        "type": "split",
        "left_title": "Monthly Processing Workflow",
        "left_items": [
            "Phase 1: Attendance Freeze & Verification: Ensures all shift hours and overtime are approved and locked.",
            "Phase 2: One-Click Batch Calculation: Computes gross earnings, statutory deductions, and active advance recoveries.",
            "Phase 3: Pre-Payroll Review: HR reviews department salary summaries and validates net totals.",
            "Phase 4: Locking & Disbursement: Period is marked Approved and Locked; bank payment vouchers are recorded."
        ],
        "right_title": "Payroll Line & Payslip Snapshot",
        "right_items": [
            "Individual PayrollLine generated per worker per monthly cycle.",
            "Saves calculation_snapshot JSON field preserving exact tax laws and formulas applied during that specific run.",
            "Comprehensive line item breakdown: present days, leave days, overtime pay, PF, ESI, and advance deductions.",
            "Instant one-click printable payslip generation for factory workers."
        ],
        "notes": "Here is the complete monthly payroll workflow. At month-end, the attendance records are locked. With a single click, our batch calculation engine processes all active workers in seconds. It creates a PayrollLine for each worker, complete with earnings, deductions, and advance recoveries. Each line saves a calculation_snapshot JSON field, preserving the exact statutory rules applied, and generates clean printable payslips for workers."
    },
    {
        "title": "12. Security, Role-Based Access & Audit Trail",
        "subtitle": "Enterprise Governance & Tamper-Proof Operations",
        "type": "cards",
        "cards": [
            {"title": "Token-Based Authentication", "desc": "Secure Django REST Framework token authentication with protected endpoints, CSRF validation, and secure session management."},
            {"title": "Role-Based Access Control", "desc": "Distinct roles: Gate Operators (Punch Logging), Shift Supervisors (Attendance Review), HR Managers (Payroll Execution), Plant Directors (Executive Reports)."},
            {"title": "System-Wide AuditLog Table", "desc": "Every sensitive event (CREATE, APPROVE, REJECT, LOCK, PAY, REVERSE) logs the actor ID, target model, timestamp, and IP address."},
            {"title": "Resilient Data Persistence", "desc": "Includes persistent key-value DataStore synchronization, preventing work loss during unexpected plant power or network drops."}
        ],
        "notes": "Security is paramount when handling enterprise finances and payroll. PaySphere utilizes token-based authentication and role-based permissions so gate operators cannot access salary figures, and supervisors cannot modify approved payroll. Every critical operation—approving an advance, reversing a salary run, or locking an attendance cycle—is automatically logged into an immutable AuditLog table with user ID, action, and IP address."
    },
    {
        "title": "13. User Interface & Dashboard Experience",
        "subtitle": "Industrial Ergonomics Built with React & Tailwind CSS",
        "type": "split",
        "left_title": "Key User Interface Screens",
        "left_items": [
            "Executive Dashboard: Instant visual KPIs (Active Headcount, Attendance Rate, Outstanding Advances, Total Payroll).",
            "Workforce Directory: Dynamic search, department filter pills, status badges, and full KYC profile modals.",
            "Daily Attendance Grid: Color-coded status badges (Present, Absent, Leave, Half Day) with inline overtime approvals.",
            "Payroll Matrix: Interactive monthly wage sheet with line-item drill-downs and one-click payslip generation."
        ],
        "right_title": "Design & Usability Highlights",
        "right_items": [
            "High-contrast industrial design optimized for plant floor desktop terminals and supervisor tablets.",
            "Fast search and multi-criteria filtering across worker IDs, names, contractor agencies, and plant departments.",
            "Lucide React iconography providing an intuitive, clutter-free user experience.",
            "Built-in data export for Excel auditing and management reporting."
        ],
        "notes": "Moving to the frontend user experience, PaySphere is designed for simplicity on the plant floor. The Executive Dashboard provides immediate KPI cards showing today's attendance turnout, overtime hours, pending advances, and payroll totals. The attendance grid features color-coded status pills and inline overtime approvals. The interface is high-contrast and fully responsive, ensuring smooth operation on both shop-floor PCs and supervisor tablets."
    },
    {
        "title": "14. Testing, Validation & Verification",
        "subtitle": "Ensuring Accuracy Across Edge Cases & Industrial Scenarios",
        "type": "cards",
        "cards": [
            {"title": "Salary Calculation Validation", "desc": "Validated zero-error calculations across monthly, daily, and hourly wage bases, confirming 2.0x overtime formulas and pro-rata absent deductions."},
            {"title": "Statutory Threshold Testing", "desc": "Confirmed PF capping at the statutory ₹15,000 ceiling and verified ESIC cut-offs at ₹21,000 gross across various worker salary brackets."},
            {"title": "Advance Recovery Edge Cases", "desc": "Guaranteed repayments cannot exceed outstanding loan balances and confirmed auto-status transitions to 'Completed' upon final payment."},
            {"title": "Concurrent Punch Benchmarks", "desc": "Simulated simultaneous shift-change biometric punches, verifying zero deadlocks and sub-second API response times."}
        ],
        "notes": "We tested PaySphere extensively to guarantee zero calculation discrepancies. We verified statutory PF and ESI formulas against government compliance standards, validated that overtime matches the Factories Act formula to the exact penny, and confirmed that loan repayments safely terminate when the balance hits zero without taking excess money from workers. Shift-change biometric punches were also stress-tested to ensure high concurrency."
    },
    {
        "title": "15. Conclusion & Future Roadmap",
        "subtitle": "Delivering Measurable Impact to Industrial Manufacturing",
        "type": "split",
        "left_title": "Measurable Business Impact",
        "left_items": [
            "Processing Efficiency: Slashed monthly payroll preparation time from 7+ business days to under 15 minutes.",
            "Financial Accuracy: Eliminated ghost worker fraud and contractor over-billing through verified biometric auditing.",
            "Compliance Assurance: 100% audit readiness for EPF, ESIC, Professional Tax, and Factories Act inspections.",
            "Worker Trust: Accurate, transparent payslips delivered on time every single month."
        ],
        "right_title": "Future Roadmap & Questions",
        "right_items": [
            "Worker Self-Service Mobile App: Allowing workers to check attendance, view payslips, and request advances on Android/iOS.",
            "AI Shift & Fatigue Analytics: Predictive machine learning models to identify worker fatigue and optimize shift rosters.",
            "Facial Recognition Edge Camera: Seamless walk-through gate attendance via edge-computed computer vision.",
            "Thank you! Questions and feedback are welcome."
        ],
        "notes": "In conclusion, PaySphere transforms industrial workforce management from a slow, error-prone manual chore into an automated, auditable, and transparent digital ERP. It saves days of administrative overhead, protects factories from financial leakages, and guarantees regulatory compliance. For our future roadmap, we plan to develop a worker mobile app and AI-driven shift fatigue analytics. Thank you for your attention, and I am now ready to take your questions!"
    }
]

blank_layout = prs.slide_layouts[6]

for idx, data in enumerate(slides_data):
    slide = prs.slides.add_slide(blank_layout)
    
    # Speaker Notes
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = data["notes"]
    
    if data["type"] == "title":
        # Full Dark Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = DARK_NAVY
        bg.line.fill.background()
        
        # Blue Accent Bar
        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(1.4), Inches(0.2), Inches(4.5))
        accent.fill.solid()
        accent.fill.fore_color.rgb = PRIMARY_BLUE
        accent.line.fill.background()
        
        # Title Box
        tb = slide.shapes.add_textbox(Inches(1.6), Inches(1.2), Inches(10.5), Inches(2.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = data["title"]
        p.font.size = Pt(44)
        p.font.bold = True
        p.font.color.rgb = WHITE
        
        p2 = tf.add_paragraph()
        p2.text = data["subtitle"]
        p2.font.size = Pt(22)
        p2.font.color.rgb = RGBColor(147, 197, 253)
        p2.space_before = Pt(8)
        
        p3 = tf.add_paragraph()
        p3.text = data["tagline"]
        p3.font.size = Pt(16)
        p3.font.color.rgb = RGBColor(203, 213, 225)
        p3.space_before = Pt(6)
        
        # Bullet info box
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.6), Inches(3.8), Inches(10.5), Inches(2.5))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(30, 41, 59)
        card.line.color.rgb = RGBColor(51, 65, 85)
        
        ctb = slide.shapes.add_textbox(Inches(1.8), Inches(3.9), Inches(10.1), Inches(2.3))
        ctf = ctb.text_frame
        ctf.word_wrap = True
        for b_idx, bullet in enumerate(data["bullets"]):
            bp = ctf.add_paragraph() if b_idx > 0 else ctf.paragraphs[0]
            bp.text = f"•  {bullet}"
            bp.font.size = Pt(16)
            bp.font.color.rgb = WHITE
            bp.space_before = Pt(8)

    else:
        # Standard Header Banner
        header = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(1.3))
        header.fill.solid()
        header.fill.fore_color.rgb = DARK_NAVY
        header.line.fill.background()
        
        # Blue accent line underneath header
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(1.3), Inches(13.333), Inches(0.06))
        line.fill.solid()
        line.fill.fore_color.rgb = PRIMARY_BLUE
        line.line.fill.background()
        
        # Header Text
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.15), Inches(11.0), Inches(1.0))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = data["title"]
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = WHITE
        
        p2 = tf.add_paragraph()
        p2.text = data["subtitle"]
        p2.font.size = Pt(14)
        p2.font.color.rgb = RGBColor(147, 197, 253)
        p2.space_before = Pt(2)
        
        # Slide Number Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(12.0), Inches(0.35), Inches(0.9), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = PRIMARY_BLUE
        badge.line.fill.background()
        btf = badge.text_frame
        bp = btf.paragraphs[0]
        bp.alignment = PP_ALIGN.CENTER
        bp.text = f"{idx+1}/15"
        bp.font.size = Pt(14)
        bp.font.bold = True
        bp.font.color.rgb = WHITE
        
        # Content Layout
        if data["type"] == "split":
            # Left Card
            left_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.3))
            left_bg.fill.solid()
            left_bg.fill.fore_color.rgb = CARD_BG
            left_bg.line.color.rgb = CARD_BORDER
            
            # Left Header Banner
            lt_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.7), Inches(5.6), Inches(0.7))
            lt_bar.fill.solid()
            lt_bar.fill.fore_color.rgb = RGBColor(226, 232, 240)
            lt_bar.line.fill.background()
            lt_tf = lt_bar.text_frame
            lt_p = lt_tf.paragraphs[0]
            lt_p.text = data["left_title"]
            lt_p.font.size = Pt(16)
            lt_p.font.bold = True
            lt_p.font.color.rgb = DARK_NAVY
            lt_p.alignment = PP_ALIGN.CENTER
            
            # Left Items
            ltb = slide.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(5.2), Inches(4.3))
            ltf = ltb.text_frame
            ltf.word_wrap = True
            for i_idx, item in enumerate(data["left_items"]):
                ip = ltf.add_paragraph() if i_idx > 0 else ltf.paragraphs[0]
                ip.text = f"✔  {item}"
                ip.font.size = Pt(14)
                ip.font.color.rgb = TEXT_DARK
                ip.space_before = Pt(12)
            
            # Right Card
            right_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.3))
            right_bg.fill.solid()
            right_bg.fill.fore_color.rgb = CARD_BG
            right_bg.line.color.rgb = CARD_BORDER
            
            # Right Header Banner
            rt_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.7), Inches(5.7), Inches(0.7))
            rt_bar.fill.solid()
            rt_bar.fill.fore_color.rgb = RGBColor(226, 232, 240)
            rt_bar.line.fill.background()
            rt_tf = rt_bar.text_frame
            rt_p = rt_tf.paragraphs[0]
            rt_p.text = data["right_title"]
            rt_p.font.size = Pt(16)
            rt_p.font.bold = True
            rt_p.font.color.rgb = DARK_NAVY
            rt_p.alignment = PP_ALIGN.CENTER
            
            # Right Items
            rtb = slide.shapes.add_textbox(Inches(7.0), Inches(2.5), Inches(5.3), Inches(4.3))
            rtf = rtb.text_frame
            rtf.word_wrap = True
            for i_idx, item in enumerate(data["right_items"]):
                ip = rtf.add_paragraph() if i_idx > 0 else rtf.paragraphs[0]
                ip.text = f"✔  {item}"
                ip.font.size = Pt(14)
                ip.font.color.rgb = TEXT_DARK
                ip.space_before = Pt(12)

        elif data["type"] == "cards":
            card_coords = [
                (Inches(0.8), Inches(1.7)),
                (Inches(6.8), Inches(1.7)),
                (Inches(0.8), Inches(4.5)),
                (Inches(6.8), Inches(4.5))
            ]
            for c_idx, card_data in enumerate(data["cards"]):
                cx, cy = card_coords[c_idx]
                c_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, Inches(5.7), Inches(2.5))
                c_box.fill.solid()
                c_box.fill.fore_color.rgb = CARD_BG
                c_box.line.color.rgb = CARD_BORDER
                
                # Top accent line for card
                bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, cy, Inches(5.7), Inches(0.12))
                bar.fill.solid()
                bar.fill.fore_color.rgb = PRIMARY_BLUE if c_idx % 2 == 0 else ACCENT_TEAL
                bar.line.fill.background()
                
                # Card content
                ctb = slide.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.25), Inches(5.3), Inches(2.0))
                ctf = ctb.text_frame
                ctf.word_wrap = True
                
                cp1 = ctf.paragraphs[0]
                cp1.text = card_data["title"]
                cp1.font.size = Pt(16)
                cp1.font.bold = True
                cp1.font.color.rgb = DARK_NAVY
                
                cp2 = ctf.add_paragraph()
                cp2.text = card_data["desc"]
                cp2.font.size = Pt(13)
                cp2.font.color.rgb = TEXT_MUTED
                cp2.space_before = Pt(8)

output_path = "PaySphere_Project_Presentation.pptx"
prs.save(output_path)
print(f"Presentation successfully saved to {output_path}")
