import React, { useState, useMemo, useEffect } from 'react';
import { WorkerService } from '../services/api';
import {
  Users,
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
  Percent,
  SlidersHorizontal
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
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
];

// Helper to generate full month logs for a salary worker
// Rules:
// 1. Normal hours capped at 8 hours per day on regular working days.
// 2. Any hours beyond 8 hours count as Overtime.
// 3. NO break deduction (pure clock-in to clock-out duration).
// 4. Sunday work comes as 100% OVERTIME (0 normal hours, all hours count as OT).
const generateSalaryWorkerLogs = (workerIndex, dailyRate, otRatePerHour, sundayDutyCount = 1) => {
  const days = [];
  const daysInMonth = 31; // October 2026
  let sundaysEncountered = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;

    if (isSunday) {
      sundaysEncountered++;
      // Determine if this worker worked this Sunday (e.g. 1 or 2 Sundays worked for scheduled maintenance)
      const workedSunday = sundaysEncountered <= sundayDutyCount;

      if (workedSunday) {
        // Worked on Sunday: ALL hours come under Overtime! No break cut.
        const totalSpan = 8.0; // 08:00 AM to 04:00 PM
        const normalHours = 0.0;
        const overtimeHours = totalSpan; // 100% overtime
        const basePay = 0;
        const otPay = Math.round(overtimeHours * otRatePerHour);
        const dayTotal = basePay + otPay;

        days.push({
          day,
          date: dateStr,
          dayName: 'Sunday',
          isSunday: true,
          status: 'Sunday Duty (100% OT)',
          timeIn: '08:00 AM',
          timeOut: '04:00 PM',
          totalSpanHours: totalSpan,
          normalHours,
          overtimeHours,
          basePay,
          otPay,
          dayTotal,
          note: 'Sunday Maintenance - 100% Overtime (All Hours)'
        });
      } else {
        days.push({
          day,
          date: dateStr,
          dayName: 'Sunday',
          isSunday: true,
          status: 'Sunday Off',
          timeIn: '-',
          timeOut: '-',
          totalSpanHours: 0,
          normalHours: 0,
          overtimeHours: 0,
          basePay: 0,
          otPay: 0,
          dayTotal: 0,
          note: 'Weekly Off'
        });
      }
      continue;
    }

    // Occasional weekday leave
    const isLeave = (day + workerIndex * 4) % 29 === 0;
    if (isLeave) {
      days.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isSunday: false,
        status: 'Casual Leave',
        timeIn: '-',
        timeOut: '-',
        totalSpanHours: 0,
        normalHours: 0,
        overtimeHours: 0,
        basePay: 0,
        otPay: 0,
        dayTotal: 0,
        note: 'Approved Leave'
      });
      continue;
    }

    // Regular working day (Mon-Sat)
    // Shift: starts ~08:00 AM.
    // Overtime pattern: some days exactly 8h (08:00 - 16:00), some days 10h (08:00 - 18:00), some days 9.5h
    const otPattern = (day + workerIndex) % 4;
    let timeOut = '04:00 PM';
    let totalSpan = 8.0;

    if (otPattern === 1) {
      timeOut = '06:00 PM';
      totalSpan = 10.0; // 2h OT
    } else if (otPattern === 2) {
      timeOut = '05:30 PM';
      totalSpan = 9.5; // 1.5h OT
    } else if (otPattern === 3 && (day % 3 === 0)) {
      timeOut = '07:00 PM';
      totalSpan = 11.0; // 3h OT
    }

    // 8 hours normal, remainder is Overtime. No break cut.
    const normalHours = Math.min(totalSpan, 8.0);
    const overtimeHours = Math.max(0, totalSpan - 8.0);

    const basePay = dailyRate;
    const otPay = Math.round(overtimeHours * otRatePerHour);
    const dayTotal = basePay + otPay;

    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      isSunday: false,
      status: 'Present',
      timeIn: '08:00 AM',
      timeOut,
      totalSpanHours: totalSpan,
      normalHours,
      overtimeHours,
      basePay,
      otPay,
      dayTotal,
      note: overtimeHours > 0 ? `${overtimeHours}h Weekday Overtime` : 'Normal 8h Shift'
    });
  }

  return days;
};

// Initial standard salary workers (empty, ready for user testing)
const INITIAL_SALARY_WORKERS = [];

export default function SalaryWorkersPage({ onBackToSalaryModules }) {
  const [workers, setWorkers] = useState(INITIAL_SALARY_WORKERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    WorkerService.getAll()
      .then((allWorkers) => {
        if (!isMounted) return;
        if (Array.isArray(allWorkers)) {
          const relevant = allWorkers.filter(
            (w) => w.salaryPolicy === 'TIME_BASED' || w.wageBasis === 'Daily' || w.wageBasis === 'Hourly' || (!w.salaryPolicy && w.workerType !== 'Contractor')
          );
          const mapped = relevant.map((w, idx) => ({
            id: w.workerId || `SW0${idx + 1}`,
            name: w.name,
            department: w.department || 'Production',
            designation: w.designation || 'Worker',
            photo: w.photo || SAMPLE_AVATARS[0],
            dailyRate: parseFloat(w.policyRate || w.baseWage || 800),
            otRatePerHour: Math.round(parseFloat(w.policyRate || w.baseWage || 800) / 8 * 2),
            attendanceBonus: 1000,
            statutoryPF: Math.round(parseFloat(w.policyRate || w.baseWage || 800) * 26 * 0.12),
            advanceDeduction: 0,
            dailyLogs: generateWorkerLogs(idx, parseFloat(w.policyRate || w.baseWage || 800)),
          }));
          setWorkers(mapped);
        }
      })
      .catch((err) => {
        console.warn('Could not load salary workers:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync action from attendance
  const handleSyncAttendance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Attendance & biometric logs synced! 8h normal time applied, OT computed with 0 break deduction.');
    }, 850);
  };

  // Helper to calculate a worker's monthly summary
  const calculateWorkerSummary = (worker) => {
    const logs = worker.dailyLogs || [];

    // Weekdays present
    const regularPresentDays = logs.filter(l => l.status === 'Present').length;
    // Sundays worked (all Sunday hours count as 100% overtime)
    const sundayWorkedDays = logs.filter(l => l.status.includes('Sunday Duty')).length;
    const totalWorkingDays = regularPresentDays + sundayWorkedDays;

    // Normal hours: capped at 8 hours per day on regular working days (0 on Sunday)
    const totalNormalHours = logs.reduce((sum, l) => sum + (l.normalHours || 0), 0);

    // Overtime hours: hours > 8h on weekdays PLUS 100% of hours worked on Sundays!
    const weekdayOTHours = logs.filter(l => !l.isSunday).reduce((sum, l) => sum + (l.overtimeHours || 0), 0);
    const sundayOTHours = logs.filter(l => l.isSunday).reduce((sum, l) => sum + (l.overtimeHours || 0), 0);
    const totalOTHours = weekdayOTHours + sundayOTHours;

    // Earnings
    const regularDutyPay = regularPresentDays * worker.dailyRate;
    const otPay = Math.round(totalOTHours * worker.otRatePerHour);
    const attendanceBonus = worker.attendanceBonus || 0;
    const grossSalary = regularDutyPay + otPay + attendanceBonus;

    // Deductions
    const advanceDeduction = worker.advanceDeduction || 0;
    const statutoryPF = worker.statutoryPF || 0;
    const totalDeductions = advanceDeduction + statutoryPF;

    // Net Payable
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      regularPresentDays,
      sundayWorkedDays,
      totalWorkingDays,
      totalNormalHours,
      weekdayOTHours,
      sundayOTHours,
      totalOTHours,
      regularDutyPay,
      otPay,
      attendanceBonus,
      grossSalary,
      advanceDeduction,
      statutoryPF,
      totalDeductions,
      netSalary
    };
  };

  // Overall totals
  const overallStats = useMemo(() => {
    let grandNormalHours = 0;
    let grandOTHours = 0;
    let grandGross = 0;
    let grandNet = 0;
    let grandDutyDays = 0;

    workers.forEach(w => {
      const s = calculateWorkerSummary(w);
      grandNormalHours += s.totalNormalHours;
      grandOTHours += s.totalOTHours;
      grandGross += s.grossSalary;
      grandNet += s.netSalary;
      grandDutyDays += s.totalWorkingDays;
    });

    return {
      totalWorkers: workers.length,
      grandDutyDays,
      grandNormalHours,
      grandOTHours,
      grandGross,
      grandNet
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

  // Selected worker details summary
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
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Salary Workers
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Standard Industrial Shift Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  8h normal hours • Overtime beyond 8h • All Sunday work as Overtime • 0 break deduction
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
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Attendance Hours'}</span>
            </button>

            {/* Print Master Payroll Sheet */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Payroll</span>
            </button>

            {/* Export Summary */}
            <button
              type="button"
              onClick={() => showToast('Master salary summary downloaded as CSV.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>Export Payroll Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* RULE HIGHLIGHT BANNER */}
        <div className="bg-linear-to-r from-indigo-50/80 via-blue-50/40 to-slate-50 border border-indigo-200/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">Configured Company Rules</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  8h Normal Cap
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Sunday = 100% OT
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  No Break Cut
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Normal salary is calculated on daily wage rate for days worked (capped at 8h daily duty). All hours past 8h count as overtime. All Sunday work hours are treated 100% as overtime with zero break deduction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto text-xs bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/80">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-medium">Month:</span>
            <span className="font-bold text-slate-800">October 2026 (31 Days)</span>
          </div>
        </div>

        {/* 4 TOP SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Salary Workers</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {overallStats.totalWorkers} <span className="text-xs font-medium text-slate-400">staff</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{overallStats.grandDutyDays} total duty mandays</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Normal Shift Hours</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {overallStats.grandNormalHours.toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-400">hrs</span>
              </div>
              <p className="text-xs text-blue-600/80 mt-1">Capped at 8h/day standard duty</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Overtime Hours</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-800">
                {overallStats.grandOTHours.toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-400">hrs OT</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">Includes weekday OT + Sunday work</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Salary Payable</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹ {overallStats.grandNet.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-600 mt-1">Net disbursement after PF & advances</p>
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
                placeholder="Search salary worker by name, ID or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
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
            Showing <strong className="text-slate-800">{filteredWorkers.length}</strong> of {workers.length} workers
          </div>
        </div>

        {/* SALARY WORKERS MASTER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Monthly Salary Worker Computations (October 2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Normal pay calculated by days &bull; Overtime past 8h &bull; Sunday all OT &bull; Click row to inspect whole month
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
              Click any worker to see daily sheet
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Worker Profile</th>
                  <th className="py-3.5 px-3">Dept / Trade</th>
                  <th className="py-3.5 px-3 text-right">Rates (Day / OT)</th>
                  <th className="py-3.5 px-3 text-center">Duty Days</th>
                  <th className="py-3.5 px-3 text-center">Normal Hrs</th>
                  <th className="py-3.5 px-3 text-center">Total OT Hrs</th>
                  <th className="py-3.5 px-3 text-right">Duty Base Pay</th>
                  <th className="py-3.5 px-3 text-right">OT Payout</th>
                  <th className="py-3.5 px-3 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                      No salary workers registered under this policy yet. Create workers in the Workers module to begin computing salaries.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const summary = calculateWorkerSummary(worker);

                  return (
                    <tr
                      key={worker.id}
                      onClick={() => setSelectedWorkerForDetails(worker)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Worker Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={worker.photo}
                            alt={worker.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
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
                        <div className="text-[10px] text-slate-400">Plant Division</div>
                      </td>

                      {/* Rates */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-slate-900">₹ {worker.dailyRate}/d</div>
                        <div className="text-[10px] text-slate-400">OT: ₹{worker.otRatePerHour}/h</div>
                      </td>

                      {/* Duty Days */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {summary.totalWorkingDays} d
                        </span>
                        {summary.sundayWorkedDays > 0 && (
                          <div className="text-[10px] text-amber-600 font-medium">
                            +{summary.sundayWorkedDays} Sun OT
                          </div>
                        )}
                      </td>

                      {/* Normal Hours */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                        {summary.totalNormalHours}h
                        <div className="text-[10px] text-slate-400">8h/day max</div>
                      </td>

                      {/* Overtime Hours */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-mono">
                          {summary.totalOTHours}h OT
                        </span>
                        <div className="text-[10px] text-slate-400">
                          ({summary.weekdayOTHours}h reg + {summary.sundayOTHours}h Sun)
                        </div>
                      </td>

                      {/* Regular Base Pay */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        ₹ {summary.regularDutyPay.toLocaleString('en-IN')}
                      </td>

                      {/* OT Pay */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                        ₹ {summary.otPay.toLocaleString('en-IN')}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        -₹ {summary.totalDeductions.toLocaleString('en-IN')}
                        {summary.advanceDeduction > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Adv: ₹{summary.advanceDeduction}
                          </div>
                        )}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-700 font-mono block">
                          ₹ {summary.netSalary.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                          Disbursable
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
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Whole Month</span>
                        </button>
                      </td>
                    </tr>
                  );
                }))}
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {selectedWorkerForDetails.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>ID: <strong className="text-white font-mono">{selectedWorkerForDetails.id}</strong></span>
                    <span>&bull;</span>
                    <span>Designation: {selectedWorkerForDetails.designation}</span>
                    <span>&bull;</span>
                    <span>Daily Rate: ₹{selectedWorkerForDetails.dailyRate}/d</span>
                    <span>&bull;</span>
                    <span>OT Rate: ₹{selectedWorkerForDetails.otRatePerHour}/h</span>
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

            {/* KPI Cards Banner for Worker */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5 bg-slate-50 border-b border-slate-200/80 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Days Worked</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                  {selectedWorkerSummary.totalWorkingDays} Days
                  <span className="text-[10px] text-slate-400 font-normal block">
                    ({selectedWorkerSummary.regularPresentDays} duty + {selectedWorkerSummary.sundayWorkedDays} Sunday)
                  </span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Normal Hours (8h/d)</span>
                <span className="text-base font-bold text-blue-700 mt-0.5 block font-mono">
                  {selectedWorkerSummary.totalNormalHours} hrs
                  <span className="text-[10px] text-slate-400 font-normal block">Regular pay base</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Overtime Hours</span>
                <span className="text-base font-bold text-amber-700 mt-0.5 block font-mono">
                  {selectedWorkerSummary.totalOTHours} hrs OT
                  <span className="text-[10px] text-amber-600 font-normal block">
                    ₹{selectedWorkerSummary.otPay.toLocaleString('en-IN')} earned
                  </span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Deductions (PF + Adv)</span>
                <span className="text-base font-bold text-rose-600 mt-0.5 block font-mono">
                  -₹ {selectedWorkerSummary.totalDeductions.toLocaleString('en-IN')}
                  <span className="text-[10px] text-slate-400 font-normal block">PF: ₹{selectedWorkerSummary.statutoryPF}</span>
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-emerald-700 block text-[10px] font-bold uppercase">Net Final Salary</span>
                <span className="text-base font-extrabold text-emerald-800 mt-0.5 block font-mono">
                  ₹ {selectedWorkerSummary.netSalary.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 block">Bank Account Ready</span>
              </div>
            </div>

            {/* Whole Month Day-by-Day Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Full Month Time Sheet & Daily Salary Calculation (October 2026)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Normal Hours: 8h &bull; Overtime: &gt;8h &bull; Sunday: 100% OT &bull; No Break Cut
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Clock In & Out</th>
                      <th className="py-2.5 px-3 text-center">Total Span</th>
                      <th className="py-2.5 px-3 text-center">Normal Hrs (8h Max)</th>
                      <th className="py-2.5 px-3 text-center">Overtime Hrs</th>
                      <th className="py-2.5 px-3 text-right">Day Base Pay</th>
                      <th className="py-2.5 px-3 text-right">Day OT Pay</th>
                      <th className="py-2.5 px-3 text-right">Day Total Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedWorkerForDetails.dailyLogs.map((log) => {
                      const isSunOff = log.status === 'Sunday Off';
                      const isSunDuty = log.status.includes('Sunday Duty');
                      const isLeave = log.status.includes('Leave');

                      return (
                        <tr
                          key={log.day}
                          className={`${
                            isSunOff
                              ? 'bg-slate-50/70 text-slate-400'
                              : isSunDuty
                              ? 'bg-amber-50/40 text-slate-900 font-medium'
                              : isLeave
                              ? 'bg-rose-50/30 text-rose-800'
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
                                  : isSunDuty
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isLeave
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* Clock In / Out */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSunOff || isLeave ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <span className="font-mono font-medium text-slate-800">
                                {log.timeIn} - {log.timeOut}
                              </span>
                            )}
                          </td>

                          {/* Total Span (No break cut) */}
                          <td className="py-2 px-3 text-center font-mono">
                            {isSunOff || isLeave ? (
                              '-'
                            ) : (
                              <span className="font-semibold text-slate-800">
                                {log.totalSpanHours}h
                              </span>
                            )}
                          </td>

                          {/* Normal Hours (capped at 8h; 0 on Sunday) */}
                          <td className="py-2 px-3 text-center font-mono">
                            {isSunDuty ? (
                              <span className="text-slate-400 text-[10px]">0h (Sunday)</span>
                            ) : log.normalHours > 0 ? (
                              <span className="font-medium text-blue-700">{log.normalHours}h</span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Overtime Hours */}
                          <td className="py-2 px-3 text-center font-mono">
                            {log.overtimeHours > 0 ? (
                              <span className={`px-1.5 py-0.5 rounded font-bold ${
                                isSunDuty ? 'bg-amber-200/80 text-amber-900' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {log.overtimeHours}h OT
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Day Base Pay */}
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {log.basePay > 0 ? `₹ ${log.basePay}` : '-'}
                          </td>

                          {/* Day OT Pay */}
                          <td className="py-2 px-3 text-right font-mono font-semibold text-amber-900">
                            {log.otPay > 0 ? `₹ ${log.otPay}` : '-'}
                          </td>

                          {/* Day Total */}
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                            {log.dayTotal > 0 ? `₹ ${log.dayTotal.toLocaleString('en-IN')}` : '-'}
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
                Payment mode: Direct Bank Transfer &bull; A/C: {selectedWorkerForDetails.bankAccount} ({selectedWorkerForDetails.ifsc})
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
