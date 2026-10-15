import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  X,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  SlidersHorizontal,
  HelpCircle,
  RotateCcw,
  CalendarCheck2
} from 'lucide-react';

// Sample worker photos
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

// Helper to generate monthly records for Fixed Salary Workers
// Rules:
// 1. Fixed monthly salary regardless of daily hours.
// 2. Tracks Absent days and Half days.
// 3. Paid leave quota (e.g. 2 days allowed per month).
// 4. Sunday / Holiday duties:
//    - If worker has absent days, the Sunday/Holiday duty replaces (offsets) the absent day so no salary is cut!
//    - If worker was present on all regular days, the Sunday/Holiday duty is paid as Overtime (extra day salary)!
const generateFixedWorkerLogs = (workerIndex, monthlySalary, allowedLeaves = 2, config = {}) => {
  const daysInMonth = 31; // October 2026
  const perDayRate = Math.round(monthlySalary / 30);
  const days = [];

  const absentsSet = new Set(config.absentDays || []);
  const halfDaysSet = new Set(config.halfDays || []);
  const sundayWorkSet = new Set(config.sundayWorkDays || []);

  // Holiday in October: e.g. Oct 2 (Gandhi Jayanti) or Oct 20 (Dussehra/Diwali season)
  const officialHolidays = [2, 20];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;
    const isOfficialHoliday = officialHolidays.includes(day);

    if (isSunday) {
      const workedSunday = sundayWorkSet.has(day);

      if (workedSunday) {
        days.push({
          day,
          date: dateStr,
          dayName: 'Sunday',
          isSunday: true,
          isHoliday: false,
          status: 'Sunday Duty',
          inTime: '09:00 AM',
          outTime: '05:00 PM',
          leaveCategory: 'Sunday Work',
          salaryImpact: 'Overtime or Offset Eligible',
          note: 'Worked on Sunday (Eligible to replace absent day or receive OT)'
        });
      } else {
        days.push({
          day,
          date: dateStr,
          dayName: 'Sunday',
          isSunday: true,
          isHoliday: false,
          status: 'Sunday Off',
          inTime: '-',
          outTime: '-',
          leaveCategory: 'Weekly Off',
          salaryImpact: 'Paid Weekend',
          note: 'Standard Weekly Off'
        });
      }
      continue;
    }

    if (isOfficialHoliday) {
      const workedHoliday = config.workedHoliday === day;
      if (workedHoliday) {
        days.push({
          day,
          date: dateStr,
          dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          isSunday: false,
          isHoliday: true,
          status: 'Holiday Duty',
          inTime: '09:30 AM',
          outTime: '04:30 PM',
          leaveCategory: 'Holiday Work',
          salaryImpact: 'Overtime or Offset Eligible',
          note: 'Worked on Public Holiday (Eligible to replace absent day or receive OT)'
        });
      } else {
        days.push({
          day,
          date: dateStr,
          dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          isSunday: false,
          isHoliday: true,
          status: 'Gazetted Holiday',
          inTime: '-',
          outTime: '-',
          leaveCategory: 'Paid Holiday',
          salaryImpact: 'Paid Holiday',
          note: day === 2 ? 'Mahatma Gandhi Jayanti' : 'Dussehra / Festival Holiday'
        });
      }
      continue;
    }

    // Check Absent
    if (absentsSet.has(day)) {
      days.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isSunday: false,
        isHoliday: false,
        status: 'Absent',
        inTime: '-',
        outTime: '-',
        leaveCategory: 'Unscheduled Absence',
        salaryImpact: 'Absent Day',
        note: 'Absent on regular workday'
      });
      continue;
    }

    // Check Half Day
    if (halfDaysSet.has(day)) {
      days.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isSunday: false,
        isHoliday: false,
        status: 'Half Day',
        inTime: '09:00 AM',
        outTime: '01:30 PM',
        leaveCategory: 'Half Day (0.5d)',
        salaryImpact: 'Half Day Check',
        note: 'Left after first half (0.5 day duty logged)'
      });
      continue;
    }

    // Standard present day
    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      isSunday: false,
      isHoliday: false,
      status: 'Present',
      inTime: '09:00 AM',
      outTime: '06:00 PM',
      leaveCategory: 'Normal Duty',
      salaryImpact: 'Full Fixed Pay',
      note: 'Regular Full Day Salaried Presence'
    });
  }

  return days;
};

// Initial Fixed Salary Workers (empty, ready for user testing)
const INITIAL_FIXED_WORKERS = [];

export default function FixedSalaryWorkersPage({ onBackToSalaryModules }) {
  const [workers, setWorkers] = useState(() => {
    return INITIAL_FIXED_WORKERS.map(w => ({
      ...w,
      dailyLogs: generateFixedWorkerLogs(0, w.monthlySalary, w.allowedLeaves, w.config)
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSyncAttendance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Attendance records synced! Absents, half-days, and Sunday/Holiday compensations re-evaluated.');
    }, 850);
  };

  // Comprehensive calculation engine for a Fixed Salary Worker:
  // - Fixed Base Salary
  // - Daily Wage equivalent = Monthly Salary / 30
  // - Allowed Paid Leaves quota = allowedLeaves (default 2)
  // - Counts: Absents (1.0d each), Half Days (0.5d each)
  // - Sundays Worked & Holidays Worked
  // - Policy Rule:
  //    1. Absent days up to allowed quota are Excused (Paid Leave).
  //    2. Any Unexcused Absents / Half Days are first REPLACED/OFFSET by Sundays or Holidays worked!
  //    3. Any remaining Sundays or Holidays worked (when worker is present on all days or after offsetting)
  //       are paid as Overtime Pay (Day equivalent rate)!
  //    4. Any remaining unexcused absents are deducted from the fixed salary.
  const calculateWorkerSummary = (worker) => {
    const logs = worker.dailyLogs || [];
    const monthlySalary = worker.monthlySalary || 0;
    const perDayRate = Math.round(monthlySalary / 30);
    const halfDayRate = Math.round(perDayRate / 2);

    // Counts from logs
    const rawAbsentCount = logs.filter(l => l.status === 'Absent').length;
    const rawHalfDayCount = logs.filter(l => l.status === 'Half Day').length;
    const sundaysWorkedCount = logs.filter(l => l.status === 'Sunday Duty').length;
    const holidaysWorkedCount = logs.filter(l => l.status === 'Holiday Duty').length;
    const totalExtraDuties = sundaysWorkedCount + holidaysWorkedCount; // Sundays + Holidays worked

    // Total absent day penalty units before quota
    const totalAbsentUnits = rawAbsentCount + (rawHalfDayCount * 0.5);

    // Apply allowed paid leave quota
    const allowedLeaves = worker.allowedLeaves || 2;
    const quotaCovered = Math.min(totalAbsentUnits, allowedLeaves);
    let remainingAbsentUnits = Math.max(0, totalAbsentUnits - quotaCovered);

    // Rule: Replace / Offset Absent day with Sunday or Holiday work
    // Each Sunday/Holiday worked can offset 1.0 unit of absent day!
    const offsetUnits = Math.min(remainingAbsentUnits, totalExtraDuties);
    remainingAbsentUnits -= offsetUnits;

    // Remaining Sunday/Holiday duties that were not used to offset absents are paid as OVERTIME!
    const surplusOvertimeDuties = totalExtraDuties - offsetUnits;
    const sundayHolidayOTPay = Math.round(surplusOvertimeDuties * perDayRate);

    // Deductions for any still unexcused absent units
    const unexcusedDeduction = Math.round(remainingAbsentUnits * perDayRate);

    // Other deductions
    const advanceDeduction = worker.advanceDeduction || 0;
    const statutoryPF = worker.statutoryPF || 0;
    const totalDeductions = unexcusedDeduction + advanceDeduction + statutoryPF;

    // Final Net Salary
    const grossSalary = monthlySalary + sundayHolidayOTPay;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      monthlySalary,
      perDayRate,
      rawAbsentCount,
      rawHalfDayCount,
      totalAbsentUnits,
      allowedLeaves,
      quotaCovered,
      totalExtraDuties,
      sundaysWorkedCount,
      holidaysWorkedCount,
      offsetUnits, // number of days replaced by Sunday/Holiday
      surplusOvertimeDuties, // duties paid as Overtime
      sundayHolidayOTPay,
      unexcusedDeduction,
      advanceDeduction,
      statutoryPF,
      totalDeductions,
      grossSalary,
      netSalary
    };
  };

  // Overall totals across all fixed salary workers
  const overallStats = useMemo(() => {
    let grandFixedPayroll = 0;
    let grandGross = 0;
    let grandNet = 0;
    let grandOffsetDays = 0;
    let grandOTPay = 0;

    workers.forEach(w => {
      const s = calculateWorkerSummary(w);
      grandFixedPayroll += s.monthlySalary;
      grandGross += s.grossSalary;
      grandNet += s.netSalary;
      grandOffsetDays += s.offsetUnits;
      grandOTPay += s.sundayHolidayOTPay;
    });

    return {
      totalStaff: workers.length,
      grandFixedPayroll,
      grandGross,
      grandNet,
      grandOffsetDays,
      grandOTPay
    };
  }, [workers]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const list = Array.from(new Set(workers.map(w => w.department)));
    return ['All', ...list];
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.department.toLowerCase().includes(q) || w.designation.toLowerCase().includes(q);
      const matchesDept = selectedDept === 'All' || w.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [workers, searchQuery, selectedDept]);

  // Selected worker summary
  const selectedWorkerSummary = useMemo(() => {
    if (!selectedWorkerForDetails) return null;
    return calculateWorkerSummary(selectedWorkerForDetails);
  }, [selectedWorkerForDetails]);

  return (
    <div className="flex flex-col min-h-full bg-[#fafbfc]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP SUB-HEADER & BREADCRUMB */}
      <div className="px-8 lg:px-10 py-5 bg-white border-b border-slate-200/80 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSalaryModules}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Salary Categories"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Salary Cards</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Fixed Salary Workers
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Monthly Retainer & Comp-Off Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Fixed pay &bull; Leave & half-day quotas &bull; Sunday/holiday overtime & absent day replacement
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Attendance Button */}
            <button
              type="button"
              onClick={handleSyncAttendance}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Checking Attendance...' : 'Re-check Absents & Sundays'}</span>
            </button>

            {/* Print Payroll */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Sheet</span>
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={() => showToast('Fixed salary monthly register exported.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Fixed Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* FIXED SALARY RULES BANNER */}
        <div className="bg-linear-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">Fixed Salary Management Policy</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Fixed Monthly Pay
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  2 Paid Leaves / Month
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Sunday Offsets Absent Day
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Surplus Sunday = Overtime
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Fixed salary is paid monthly. The system checks allowed leaves & half-days. If a worker worked on Sunday or Holiday, it automatically <strong>replaces / offsets absent days</strong> to prevent salary cuts. If all days are present, Sunday/Holiday duty is rewarded as <strong>Overtime</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto text-xs bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/80">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-medium">Payroll Cycle:</span>
            <span className="font-bold text-slate-800">October 2026 (Fixed Retainer)</span>
          </div>
        </div>

        {/* 4 TOP SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Fixed Salaried Staff</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {overallStats.totalStaff} <span className="text-xs font-medium text-slate-400">staff</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Supervisors, leads & management</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Base Fixed Retainer</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                ₹ {overallStats.grandFixedPayroll.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Configured baseline monthly pay</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Absents Saved via Sunday/Holiday</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-800">
                {overallStats.grandOffsetDays} <span className="text-xs font-medium text-slate-400">days offset</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">Deductions averted by comp-duty</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Disbursable Salary</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹ {overallStats.grandNet.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-600 mt-1">Includes +₹{overallStats.grandOTPay.toLocaleString('en-IN')} surplus OT</p>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by worker name, ID, role or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 self-center">
            Showing <strong className="text-slate-800">{filteredWorkers.length}</strong> of {workers.length} fixed salaried workers
          </div>
        </div>

        {/* FIXED SALARY WORKERS MASTER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Fixed Salary Staff Register & Attendance Compensations (October 2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly fixed pay &bull; Leave quota verified &bull; Sunday/Holiday replacement & OT computed
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
              Click row to inspect whole month
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Staff Profile</th>
                  <th className="py-3.5 px-3">Dept / Role</th>
                  <th className="py-3.5 px-3 text-right">Fixed Monthly Pay</th>
                  <th className="py-3.5 px-3 text-center">Absent / Half Day</th>
                  <th className="py-3.5 px-3 text-center">Sunday / Holiday Work</th>
                  <th className="py-3.5 px-3 text-center">Absent Offset (Comp)</th>
                  <th className="py-3.5 px-3 text-right">Sunday/Holiday OT</th>
                  <th className="py-3.5 px-3 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.map((worker) => {
                  const summary = calculateWorkerSummary(worker);

                  return (
                    <tr
                      key={worker.id}
                      onClick={() => setSelectedWorkerForDetails(worker)}
                      className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Staff Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={worker.photo}
                            alt={worker.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                              {worker.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {worker.id} &bull; {worker.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{worker.department}</span>
                        <div className="text-[10px] text-slate-400">Fixed Retainer</div>
                      </td>

                      {/* Fixed Monthly Pay */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-extrabold text-slate-900">₹ {worker.monthlySalary.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">~₹{summary.perDayRate}/day</div>
                      </td>

                      {/* Absent / Half day status */}
                      <td className="py-3 px-3 text-center">
                        {summary.totalAbsentUnits === 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3" /> Full Duty
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              {summary.rawAbsentCount > 0 ? `${summary.rawAbsentCount}d Abs` : ''}
                              {summary.rawHalfDayCount > 0 ? ` ${summary.rawHalfDayCount} Half-d` : ''}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Quota: {summary.allowedLeaves}d paid
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Sunday / Holiday Work */}
                      <td className="py-3 px-3 text-center">
                        {summary.totalExtraDuties > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            +{summary.totalExtraDuties} Duty Days
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Absent Offset (Replacement) */}
                      <td className="py-3 px-3 text-center">
                        {summary.offsetUnits > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-300">
                            <RotateCcw className="w-3 h-3 text-amber-600" />
                            {summary.offsetUnits}d Replaced
                          </span>
                        ) : summary.totalAbsentUnits > 0 && summary.quotaCovered >= summary.totalAbsentUnits ? (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Paid Quota
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Offset</span>
                        )}
                      </td>

                      {/* Sunday/Holiday OT */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                        {summary.sundayHolidayOTPay > 0 ? (
                          <>
                            <div>+₹ {summary.sundayHolidayOTPay.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-indigo-600 font-normal">
                              ({summary.surplusOvertimeDuties} extra day OT)
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-3 text-right font-mono">
                        {summary.totalDeductions > 0 ? (
                          <>
                            <div className="text-rose-600 font-bold">-₹ {summary.totalDeductions.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-slate-400">
                              {summary.unexcusedDeduction > 0 ? `Unexcused: ₹${summary.unexcusedDeduction}` : `PF/Adv: ₹${summary.advanceDeduction + summary.statutoryPF}`}
                            </div>
                          </>
                        ) : (
                          <span className="text-emerald-600 font-semibold">₹ 0</span>
                        )}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-800 font-mono block">
                          ₹ {summary.netSalary.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Approved
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkerForDetails(worker);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Full Month</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* WHOLE MONTH DETAILS MODAL (CLICK ON WORKER) */}
      {/* ============================================================== */}
      {selectedWorkerForDetails && selectedWorkerSummary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedWorkerForDetails.photo}
                  alt={selectedWorkerForDetails.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {selectedWorkerForDetails.name}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {selectedWorkerForDetails.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>ID: <strong className="text-white font-mono">{selectedWorkerForDetails.id}</strong></span>
                    <span>&bull;</span>
                    <span>Designation: {selectedWorkerForDetails.designation}</span>
                    <span>&bull;</span>
                    <span>Fixed Monthly Retainer: <strong className="text-emerald-400 font-mono">₹{selectedWorkerForDetails.monthlySalary.toLocaleString('en-IN')}</strong></span>
                    <span>&bull;</span>
                    <span>Leave Quota: {selectedWorkerForDetails.allowedLeaves} days/mo</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5"
                  title="Print Salary Slip"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkerForDetails(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* KPI Cards Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5 bg-slate-50 border-b border-slate-200/80 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Base Fixed Salary</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                  ₹ {selectedWorkerSummary.monthlySalary.toLocaleString('en-IN')}
                  <span className="text-[10px] text-slate-400 font-normal block">(₹{selectedWorkerSummary.perDayRate}/day)</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Absents & Half Days</span>
                <span className="text-base font-bold text-rose-700 mt-0.5 block font-mono">
                  {selectedWorkerSummary.rawAbsentCount} Abs &bull; {selectedWorkerSummary.rawHalfDayCount} Half-d
                  <span className="text-[10px] text-slate-500 font-normal block">{selectedWorkerSummary.quotaCovered} covered by quota</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Sunday/Holiday Replaced</span>
                <span className="text-base font-bold text-amber-700 mt-0.5 block font-mono">
                  {selectedWorkerSummary.offsetUnits} Days Saved
                  <span className="text-[10px] text-amber-600 font-normal block">Absent offset applied</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Surplus Overtime Pay</span>
                <span className="text-base font-bold text-indigo-700 mt-0.5 block font-mono">
                  +₹ {selectedWorkerSummary.sundayHolidayOTPay.toLocaleString('en-IN')}
                  <span className="text-[10px] text-indigo-600 font-normal block">{selectedWorkerSummary.surplusOvertimeDuties} days OT payout</span>
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-emerald-700 block text-[10px] font-bold uppercase">Net Payable Salary</span>
                <span className="text-base font-extrabold text-emerald-800 mt-0.5 block font-mono">
                  ₹ {selectedWorkerSummary.netSalary.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 block">After deductions & OT</span>
              </div>
            </div>

            {/* Whole Month Day-by-Day Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Full Month Register & Leave Replacement Breakdown (October 2026)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Fixed monthly pay &bull; Comp-Off offsets absent day &bull; Surplus Sunday as OT
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timings</th>
                      <th className="py-2.5 px-3">Leave Category</th>
                      <th className="py-2.5 px-3">Salary Impact Rule</th>
                      <th className="py-2.5 px-3">Daily Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedWorkerForDetails.dailyLogs.map((log) => {
                      const isAbsent = log.status === 'Absent';
                      const isHalf = log.status === 'Half Day';
                      const isSunDuty = log.status === 'Sunday Duty';
                      const isHolDuty = log.status === 'Holiday Duty';
                      const isSunOff = log.status === 'Sunday Off';
                      const isHol = log.status === 'Gazetted Holiday';

                      return (
                        <tr
                          key={log.day}
                          className={`${
                            isSunOff
                              ? 'bg-slate-50/70 text-slate-400'
                              : isHol
                              ? 'bg-purple-50/40 text-purple-900'
                              : isSunDuty || isHolDuty
                              ? 'bg-amber-50/50 text-slate-900 font-medium'
                              : isAbsent
                              ? 'bg-rose-50/40 text-rose-900'
                              : isHalf
                              ? 'bg-amber-50/30 text-amber-900'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Date */}
                          <td className="py-2 px-3 font-medium whitespace-nowrap">
                            <span className="font-mono">{log.date}</span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              {log.dayName}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isSunOff
                                  ? 'bg-slate-200/80 text-slate-600'
                                  : isHol
                                  ? 'bg-purple-100 text-purple-800'
                                  : isSunDuty || isHolDuty
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                  : isAbsent
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isHalf
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* Timings */}
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                            {log.inTime !== '-' ? `${log.inTime} - ${log.outTime}` : '-'}
                          </td>

                          {/* Leave Category */}
                          <td className="py-2 px-3">
                            <span className="font-medium text-slate-800">{log.leaveCategory}</span>
                          </td>

                          {/* Salary Impact */}
                          <td className="py-2 px-3 font-mono">
                            {isSunDuty || isHolDuty ? (
                              <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                Overtime / Offset Eligible
                              </span>
                            ) : isAbsent ? (
                              <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Checked against Quota & Sunday
                              </span>
                            ) : isHalf ? (
                              <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                0.5d Check
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                Full Fixed Pay
                              </span>
                            )}
                          </td>

                          {/* Note */}
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {log.note}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Compensatory off rules & Sunday duty replacements comply with factory executive salary guidelines.
              </span>
              <button
                type="button"
                onClick={() => setSelectedWorkerForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
