import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  HardHat,
  Banknote,
  HandCoins,
  FileBarChart,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Table,
  BadgeCheck,
  TrendingUp,
  Clock,
  DollarSign,
  Wallet,
  Scissors,
  Weight,
  Factory,
  Briefcase,
  X
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

// ==========================================
// SAMPLE DATASETS FOR THE 6 REPORT ENTITIES
// ==========================================

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

// Raw datasets (empty, ready for user testing and real records)
const RAW_WORKERS_DATA = [];
const RAW_DEPARTMENT_DATA = [];
const RAW_ATTENDANCE_DATA = [];
const RAW_SALARY_DATA = [];
const RAW_ADVANCE_DATA = [];
const RAW_CONTRACTOR_DATA = [];

// ==========================================
// CONFIGURATION FOR THE 6 REPORT CARDS
// ==========================================

const REPORT_CARDS_CONFIG = [
  {
    id: 'worker',
    title: 'Worker Report',
    category: 'Human Resources & Workforce',
    icon: Users,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200/80',
    badgeBg: 'bg-indigo-100/70 text-indigo-800 border-indigo-200',
    borderAccent: 'border-l-4 border-l-indigo-500',
    availableColumns: [
      { key: 'id', label: 'Worker ID', default: true },
      { key: 'name', label: 'Worker Name', default: true },
      { key: 'department', label: 'Department', default: true },
      { key: 'designation', label: 'Designation / Role', default: true },
      { key: 'wageType', label: 'Wage Type', default: true },
      { key: 'rate', label: 'Agreed Rate / Base Pay', default: true },
      { key: 'joiningDate', label: 'Joining Date', default: false },
      { key: 'phone', label: 'Phone Number', default: false },
      { key: 'bankAccount', label: 'Bank Account Number', default: true },
      { key: 'ifsc', label: 'IFSC Code', default: false },
      { key: 'shift', label: 'Assigned Shift', default: true },
      { key: 'status', label: 'Employment Status', default: true },
    ],
    dataset: RAW_WORKERS_DATA
  },
  {
    id: 'department',
    title: 'Department Report',
    category: 'Plant Operations & Allocation',
    icon: Building2,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50 border-sky-200/80',
    badgeBg: 'bg-sky-100/70 text-sky-800 border-sky-200',
    borderAccent: 'border-l-4 border-l-sky-500',
    availableColumns: [
      { key: 'code', label: 'Dept Code', default: true },
      { key: 'name', label: 'Department Name', default: true },
      { key: 'head', label: 'Department Head / Lead', default: true },
      { key: 'totalStaff', label: 'Total Deployed Staff', default: true },
      { key: 'activeToday', label: 'Active Present Today', default: true },
      { key: 'monthlyHours', label: 'Monthly Hours Logged', default: true },
      { key: 'monthlyBudget', label: 'Department Budget', default: false },
      { key: 'totalWagesPaid', label: 'Total Wages Paid', default: true },
      { key: 'efficiency', label: 'Bay Efficiency Rate', default: true },
      { key: 'bayLocation', label: 'Shopfloor Bay Location', default: false },
    ],
    dataset: RAW_DEPARTMENT_DATA
  },
  {
    id: 'attendance',
    title: 'Attendance Report',
    category: 'Time Office & Muster Roll',
    icon: Calendar,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200/80',
    badgeBg: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
    borderAccent: 'border-l-4 border-l-emerald-500',
    availableColumns: [
      { key: 'id', label: 'Worker ID', default: true },
      { key: 'name', label: 'Worker Name', default: true },
      { key: 'department', label: 'Department', default: true },
      { key: 'totalWorkingDays', label: 'Total Working Days', default: false },
      { key: 'presentDays', label: 'Present Days', default: true },
      { key: 'absentDays', label: 'Absent Days', default: true },
      { key: 'halfDays', label: 'Half Days', default: false },
      { key: 'leaves', label: 'Leaves Taken', default: false },
      { key: 'normalHours', label: 'Normal Hours (8h)', default: true },
      { key: 'overtimeHours', label: 'Overtime Hours (OT)', default: true },
      { key: 'sundayDuties', label: 'Sunday Duties Paid', default: true },
      { key: 'avgInTime', label: 'Avg Clock-In', default: false },
      { key: 'avgOutTime', label: 'Avg Clock-Out', default: false },
      { key: 'attendanceRate', label: 'Attendance %', default: true },
    ],
    dataset: RAW_ATTENDANCE_DATA
  },
  {
    id: 'salary',
    title: 'Salary Report',
    category: 'Payroll & Wage Disbursal',
    icon: Banknote,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200/80',
    badgeBg: 'bg-amber-100/70 text-amber-800 border-amber-200',
    borderAccent: 'border-l-4 border-l-amber-500',
    availableColumns: [
      { key: 'id', label: 'Staff / Con ID', default: true },
      { key: 'name', label: 'Worker / Agency Name', default: true },
      { key: 'department', label: 'Department / Agency', default: true },
      { key: 'model', label: 'Salary Calculation Model', default: true },
      { key: 'baseEarnings', label: 'Base Wages (₹)', default: true },
      { key: 'otEarnings', label: 'Overtime Pay (₹)', default: true },
      { key: 'bonus', label: 'Attendance Bonus (₹)', default: false },
      { key: 'grossSalary', label: 'Gross Salary (₹)', default: true },
      { key: 'pfDeduction', label: 'PF Deduction (₹)', default: false },
      { key: 'advanceDeduction', label: 'Advance Deducted (₹)', default: true },
      { key: 'fixedLoanEmi', label: 'Fixed Loan EMI (₹)', default: false },
      { key: 'totalDeductions', label: 'Total Deductions (₹)', default: true },
      { key: 'netSalary', label: 'Net Disbursed Pay (₹)', default: true },
      { key: 'paymentMode', label: 'Payment Channel', default: false },
      { key: 'status', label: 'Disbursement Status', default: true },
    ],
    dataset: RAW_SALARY_DATA
  },
  {
    id: 'advance',
    title: 'Advance Report',
    category: 'Advances & Loan Portfolio',
    icon: HandCoins,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200/80',
    badgeBg: 'bg-rose-100/70 text-rose-800 border-rose-200',
    borderAccent: 'border-l-4 border-l-rose-500',
    availableColumns: [
      { key: 'refId', label: 'Voucher / Loan Ref', default: true },
      { key: 'workerId', label: 'Worker ID', default: true },
      { key: 'name', label: 'Worker Name', default: true },
      { key: 'department', label: 'Department', default: true },
      { key: 'advanceType', label: 'Advance Type / Category', default: true },
      { key: 'date', label: 'Disbursement Date', default: true },
      { key: 'amount', label: 'Advance / Loan Amount (₹)', default: true },
      { key: 'emiMonthly', label: 'Monthly Fixed EMI', default: false },
      { key: 'recoveredSoFar', label: 'Recovered So Far (₹)', default: true },
      { key: 'balanceRemaining', label: 'Outstanding Balance (₹)', default: true },
      { key: 'paymentMode', label: 'Disbursement Mode', default: false },
      { key: 'purpose', label: 'Reason / Purpose', default: true },
      { key: 'status', label: 'Settlement Status', default: true },
    ],
    dataset: RAW_ADVANCE_DATA
  },
  {
    id: 'contractor',
    title: 'Contractor Report',
    category: 'Outsourced Manpower Agencies',
    icon: HardHat,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50 border-violet-200/80',
    badgeBg: 'bg-violet-100/70 text-violet-800 border-violet-200',
    borderAccent: 'border-l-4 border-l-violet-500',
    availableColumns: [
      { key: 'contractorCode', label: 'Contractor Code', default: true },
      { key: 'name', label: 'Contractor Name', default: true },
      { key: 'agencyFirm', label: 'Agency / Firm Title', default: true },
      { key: 'model', label: 'Billing Engine Model', default: true },
      { key: 'workersDeployed', label: 'Workers Deployed', default: true },
      { key: 'metricQuantity', label: 'Total Volume / Hours', default: true },
      { key: 'agreedRate', label: 'Agreed Contract Rate', default: true },
      { key: 'grossBilling', label: 'Gross Invoiced Amount (₹)', default: true },
      { key: 'tdsAmount', label: 'TDS Withheld @ 2% (₹)', default: false },
      { key: 'advancePaid', label: 'Advance Deducted (₹)', default: false },
      { key: 'totalDeductions', label: 'Total Deductions (₹)', default: true },
      { key: 'netPayable', label: 'Net Payable Amount (₹)', default: true },
      { key: 'gstin', label: 'GSTIN Number', default: false },
      { key: 'invoiceStatus', label: 'Invoice Status', default: true },
    ],
    dataset: RAW_CONTRACTOR_DATA
  }
];

export default function ReportsPage({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigateAdministration,
  onLogout
}) {
  const [activeNav, setActiveNav] = useState('Reports');
  // 'worker', 'department', 'attendance', 'salary', 'advance', 'contractor', or null for 6-cards overview
  const [activeReportId, setActiveReportId] = useState(null);

  // Filter & Generation State for individual report generator
  const [selectedPeriod, setSelectedPeriod] = useState('October 2026');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-31');
  const [selectedColumnKeys, setSelectedColumnKeys] = useState({});
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [generatedTimestamp, setGeneratedTimestamp] = useState(null);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Nav items matching all pages
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Workers', icon: Users },
    { name: 'Department', icon: Building2 },
    { name: 'Attendance', icon: Calendar },
    { name: 'Contractor', icon: HardHat },
    { name: 'Salary', icon: Banknote },
    { name: 'Advance', icon: HandCoins },
    { name: 'Reports', icon: FileBarChart },
    { name: 'Administration Setting', icon: Settings },
  ];

  // Active Report Config
  const activeReport = useMemo(() => {
    return REPORT_CARDS_CONFIG.find((c) => c.id === activeReportId) || null;
  }, [activeReportId]);

  // Handle Opening a Report Card
  const handleOpenReport = (reportId) => {
    const reportObj = REPORT_CARDS_CONFIG.find((c) => c.id === reportId);
    if (!reportObj) return;

    // Initialize selected columns with their defaults
    const initialCols = {};
    reportObj.availableColumns.forEach((col) => {
      if (col.default) {
        initialCols[col.key] = true;
      }
    });

    setSelectedColumnKeys(initialCols);
    setSelectedPeriod('October 2026');
    setTableSearchQuery('');
    setIsReportGenerated(true); // Automatically pre-generate with defaults
    setGeneratedTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    setActiveReportId(reportId);
  };

  // Toggle Column Selection
  const handleToggleColumn = (key) => {
    setSelectedColumnKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Select All Columns
  const handleSelectAllColumns = () => {
    if (!activeReport) return;
    const allCols = {};
    activeReport.availableColumns.forEach((c) => {
      allCols[c.key] = true;
    });
    setSelectedColumnKeys(allCols);
    showToast('All columns selected for report view.');
  };

  // Deselect All
  const handleDeselectAllColumns = () => {
    setSelectedColumnKeys({});
    showToast('All columns cleared.');
  };

  // Reset to Default Columns
  const handleResetColumns = () => {
    if (!activeReport) return;
    const defCols = {};
    activeReport.availableColumns.forEach((c) => {
      if (c.default) defCols[c.key] = true;
    });
    setSelectedColumnKeys(defCols);
    showToast('Reset to recommended default columns.');
  };

  // Trigger Report Generation
  const handleGenerateReport = () => {
    const activeCount = Object.values(selectedColumnKeys).filter(Boolean).length;
    if (activeCount === 0) {
      showToast('⚠️ Please select at least one column to generate report!');
      return;
    }
    setIsReportGenerated(true);
    setGeneratedTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    showToast(`Report generated with ${activeCount} columns for period: ${selectedPeriod}`);
  };

  // Filtered and Active Columns to Render
  const visibleColumns = useMemo(() => {
    if (!activeReport) return [];
    return activeReport.availableColumns.filter((col) => selectedColumnKeys[col.key]);
  }, [activeReport, selectedColumnKeys]);

  // Filtered Table Rows by search query
  const tableRows = useMemo(() => {
    if (!activeReport || !isReportGenerated) return [];
    if (!tableSearchQuery.trim()) return activeReport.dataset;

    const q = tableSearchQuery.toLowerCase();
    return activeReport.dataset.filter((row) => {
      return Object.values(row).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [activeReport, isReportGenerated, tableSearchQuery]);

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 lg:w-72 bg-[#11133c] text-white flex flex-col justify-between shrink-0 h-full border-r border-[#1a1e52] z-20 select-none">
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Logo Header */}
          <div className="px-6 py-6 flex items-center gap-3">
            <PaySphereLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-tight">PaySphere</span>
              <span className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-medium">Boparai Industries</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-4 mb-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 flex items-center justify-center font-semibold text-base shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate leading-tight">Ashmeet</span>
                <span className="text-xs text-indigo-300/70 font-normal mt-0.5">Admin</span>
              </div>
            </div>
          </div>

          {/* Navigation Label */}
          <div className="px-6 pt-3 pb-2 text-[11px] font-semibold text-indigo-200/40 uppercase tracking-widest">
            Navigation
          </div>

          {/* Navigation Menu Links */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.name);
                    if (item.name === 'Dashboard' && onNavigateDashboard) {
                      onNavigateDashboard();
                    } else if (item.name === 'Workers' && onNavigateWorkers) {
                      onNavigateWorkers();
                    } else if (item.name === 'Department' && onNavigateDepartment) {
                      onNavigateDepartment();
                    } else if (item.name === 'Attendance' && onNavigateAttendance) {
                      onNavigateAttendance();
                    } else if (item.name === 'Contractor' && onNavigateContractor) {
                      onNavigateContractor();
                    } else if (item.name === 'Salary' && onNavigateSalary) {
                      onNavigateSalary();
                    } else if (item.name === 'Advance' && onNavigateAdvance) {
                      onNavigateAdvance();
                    } else if (item.name === 'Reports') {
                      setActiveReportId(null);
                    } else if (item.name === 'Administration Setting' && onNavigateAdministration) {
                      onNavigateAdministration();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? 'bg-[#1b1f54] text-white shadow-inner shadow-indigo-950/40'
                      : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-indigo-300/60 group-hover:text-white'
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Log Out */}
        <div className="p-4 border-t border-white/5">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-300 transition-colors" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {activeReport ? (
          /* ============================================================== */
          /* REPORT GENERATOR VIEW FOR SELECTED ENTITY */
          /* ============================================================== */
          <div className="flex flex-col min-h-full">
            {/* Top Sub-Header & Breadcrumb */}
            <div className="px-8 lg:px-10 py-5 bg-white border-b border-slate-200/80 sticky top-0 z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveReportId(null)}
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group flex items-center gap-1.5 text-xs font-semibold"
                    title="Return to Reports Cards"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Report Cards</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${activeReport.iconBg} ${activeReport.iconColor}`}>
                      <activeReport.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                        {activeReport.title} Generator
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${activeReport.badgeBg}`}>
                          {activeReport.category}
                        </span>
                      </h1>
                      <p className="text-xs text-slate-500">
                        Configure reporting period and choose custom columns to generate output
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Quick Action Toolbar */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast(`${activeReport.title} exported as Excel successfully.`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* GENERATOR CONFIGURATION SECTION */}
            <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                        Report Parameters & Column Selector
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Choose the reporting duration period and toggle only the columns you wish to display
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-500">
                    Step 1: Choose Period &bull; Step 2: Choose Columns &bull; Step 3: Generate
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* STEP 1: CHOOSE PERIOD */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Step 1: Choose Reporting Period</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        'October 2026',
                        'September 2026',
                        'Q3 2026 (Jul-Sep)',
                        'FY 2026-27 (YTD)',
                        'Custom Date Range'
                      ].map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setSelectedPeriod(period)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            selectedPeriod === period
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>

                    {/* Custom Date Inputs if Custom Selected */}
                    {selectedPeriod === 'Custom Date Range' && (
                      <div className="mt-3.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">From Date:</span>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-700"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">To Date:</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-700"
                          />
                        </div>
                        <span className="text-[11px] text-indigo-800">
                          Active Range: {customStartDate} to {customEndDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: CHOOSE REQUIRED COLUMNS */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Step 2: Choose Required Columns to See</span>
                        <span className="text-[11px] font-normal text-slate-500 normal-case ml-1">
                          ({visibleColumns.length} of {activeReport.availableColumns.length} columns active)
                        </span>
                      </label>

                      {/* Bulk Column Selection Tools */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllColumns}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllColumns}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleResetColumns}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Default</span>
                        </button>
                      </div>
                    </div>

                    {/* Column Checkbox Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {activeReport.availableColumns.map((col) => {
                        const isSelected = !!selectedColumnKeys[col.key];

                        return (
                          <div
                            key={col.key}
                            onClick={() => handleToggleColumn(col.key)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2">{col.label}</span>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: GENERATE OPTION BUTTON */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Target: <strong>{activeReport.title}</strong> &bull; Period: <strong>{selectedPeriod}</strong> &bull; Columns: <strong>{visibleColumns.length}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Generate Report Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GENERATED REPORT OUTPUT TABLE */}
              {isReportGenerated && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Table Control Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {activeReport.title} Output
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Period: {selectedPeriod}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Generated at {generatedTimestamp} &bull; Showing {tableRows.length} total records across {visibleColumns.length} active columns
                      </p>
                    </div>

                    {/* In-table search filter */}
                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search within report..."
                        value={tableSearchQuery}
                        onChange={(e) => setTableSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  {/* Dynamic Table with only chosen columns */}
                  {visibleColumns.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No columns selected. Please toggle at least one column above and click "Generate Report Now".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                            {visibleColumns.map((col) => (
                              <th key={col.key} className="py-3 px-3.5 whitespace-nowrap">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {tableRows.length === 0 ? (
                            <tr>
                              <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-400">
                                <FileBarChart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-700">No records available for this reporting period</p>
                                <p className="text-xs text-slate-400 mt-0.5">As real data is added in the system, report entries will appear here.</p>
                              </td>
                            </tr>
                          ) : (
                            tableRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              {visibleColumns.map((col) => {
                                const val = row[col.key];

                                return (
                                  <td key={col.key} className="py-2.5 px-3.5 whitespace-nowrap">
                                    {col.key === 'id' || col.key === 'code' || col.key === 'refId' || col.key === 'contractorCode' ? (
                                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                        {val}
                                      </span>
                                    ) : col.key === 'status' || col.key === 'invoiceStatus' ? (
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        String(val).includes('Active') || String(val).includes('Disbursed') || String(val).includes('Verified') || String(val).includes('Deducted')
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {val}
                                      </span>
                                    ) : typeof val === 'number' && (col.key.toLowerCase().includes('salary') || col.key.toLowerCase().includes('billing') || col.key.toLowerCase().includes('wages') || col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('net') || col.key.toLowerCase().includes('gross') || col.key.toLowerCase().includes('deduction')) ? (
                                      <span className="font-mono font-bold text-slate-900">
                                        ₹ {val.toLocaleString('en-IN')}
                                      </span>
                                    ) : (
                                      <span className="font-medium text-slate-800">
                                        {val !== undefined && val !== null ? String(val) : '-'}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Table Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                    <span>
                      PaySphere Automated Report Engine &bull; Boparai Industries &bull; Generated for <strong>{selectedPeriod}</strong>
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      Total Records: {tableRows.length} &bull; Columns Displayed: {visibleColumns.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* MAIN 6-CARDS OVERVIEW FOR GENERATE REPORTS */
          /* ============================================================== */
          <>
            {/* Top Header */}
            <header className="px-8 lg:px-10 pt-8 pb-6 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Reports & Analytics
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Select a report below to filter period, customize columns, and export data
                  </p>
                </div>
              </div>
            </header>

            {/* Main Content: The 6 Report Cards */}
            <main className="px-8 lg:px-10 py-8 flex-1 max-w-7xl w-full">
              {/* The 6 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {REPORT_CARDS_CONFIG.map((card) => {
                  const IconComponent = card.icon;

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleOpenReport(card.id)}
                      className={`bg-white rounded-2xl border shadow-xs p-6 relative flex flex-col justify-between transition-all select-none cursor-pointer group hover:shadow-md hover:border-indigo-400 ${card.borderAccent}`}
                    >
                      <div>
                        {/* Header & Icon */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-2xs ${card.iconBg} ${card.iconColor} group-hover:scale-105 transition-transform`}>
                            <IconComponent className="w-6 h-6" strokeWidth={2} />
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${card.badgeBg}`}>
                            {card.category}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {card.availableColumns.length} exportable columns
                        </p>
                      </div>

                      {/* Footer CTA */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-slate-400">
                          Custom reporting
                        </span>
                        <span className="text-xs font-semibold text-indigo-700 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Generate &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
