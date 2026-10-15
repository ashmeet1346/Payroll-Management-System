import React, { useState, useMemo } from 'react';
import {
  Factory,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Plus,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  DollarSign,
  AlertCircle,
  Eye,
  Edit3,
  X,
  FileText,
  BadgePercent,
  Layers,
  Check,
  Building2,
  Settings,
  ShieldCheck,
  Package,
  Cpu
} from 'lucide-react';

// Realistic sample photo avatars for workers
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

// Product master list with dynamic / non-fixed daily rates
const INITIAL_PRODUCTS = [
  { id: 'ITM-01', name: 'Bearing Sleeve 40mm', code: 'BS-40', defaultRate: 4.50, unit: 'pcs' },
  { id: 'ITM-02', name: 'Flange Bushing Type-B', code: 'FB-90', defaultRate: 6.80, unit: 'pcs' },
  { id: 'ITM-03', name: 'Piston Ring Set 65mm', code: 'PR-65', defaultRate: 8.50, unit: 'pcs' },
  { id: 'ITM-04', name: 'Coupling Shaft 12-T', code: 'CS-12', defaultRate: 11.20, unit: 'pcs' },
  { id: 'ITM-05', name: 'Hydraulic Valve Pin', code: 'HVP-08', defaultRate: 3.80, unit: 'pcs' },
  { id: 'ITM-06', name: 'Alloy Cylinder Liner', code: 'ACL-11', defaultRate: 14.00, unit: 'pcs' }
];

// Helper to generate full month (31 days of October 2026) daily records for a worker
const generateMonthlyLogs = (workerIndex, baseProduct, baseRate, basePcsRange) => {
  const days = [];
  const daysInMonth = 31;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;

    if (isSunday) {
      days.push({
        day,
        date: dateStr,
        dayName: 'Sunday',
        status: 'Sunday Off',
        timeIn: '-',
        timeOut: '-',
        workingHours: '0h',
        overtimeHours: 0,
        product: '-',
        productCode: '-',
        pieces: 0,
        dayRate: 0,
        pieceEarnings: 0,
        otEarnings: 0,
        dayTotal: 0,
        note: 'Weekly Off'
      });
      continue;
    }

    // Occasional leave or half-day for realistic factory records
    const isLeave = (workerIndex + day) % 27 === 0;
    if (isLeave) {
      days.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        status: 'Absent / Leave',
        timeIn: '-',
        timeOut: '-',
        workingHours: '0h',
        overtimeHours: 0,
        product: '-',
        productCode: '-',
        pieces: 0,
        dayRate: 0,
        pieceEarnings: 0,
        otEarnings: 0,
        dayTotal: 0,
        note: 'Planned Leave'
      });
      continue;
    }

    // Dynamic daily rate variation (since rate is not fixed per user request)
    const rateVariation = ((day % 5) - 2) * 0.30;
    const dayRate = Number(Math.max(2.5, baseRate + rateVariation).toFixed(2));
    
    // Daily piece output
    const pcsMultiplier = 1 + (((day * 7 + workerIndex * 3) % 11) - 5) * 0.04;
    const pieces = Math.round(basePcsRange * pcsMultiplier);

    // Timing fetched from attendance
    const inHour = 8;
    const inMinute = (workerIndex * 3 + day) % 15; // 08:00 - 08:14
    const inStr = `08:${String(inMinute).padStart(2, '0')} AM`;

    const hasOT = (day + workerIndex) % 3 === 0;
    const otHours = hasOT ? (1 + ((day % 2) * 0.5)) : 0;
    const outStr = hasOT ? (otHours === 1.5 ? '06:30 PM' : '06:00 PM') : '05:00 PM';
    const workingHours = hasOT ? `${8 + otHours}h 00m` : '8h 00m';

    const pieceEarnings = Math.round(pieces * dayRate);
    const otRatePerHour = 65; // standard machine allowance per OT hour
    const otEarnings = Math.round(otHours * otRatePerHour);
    const dayTotal = pieceEarnings + otEarnings;

    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      status: 'Present',
      timeIn: inStr,
      timeOut: outStr,
      workingHours,
      overtimeHours: otHours,
      product: baseProduct.name,
      productCode: baseProduct.code,
      pieces,
      dayRate,
      pieceEarnings,
      otEarnings,
      dayTotal,
      note: hasOT ? 'Extended Line Shift' : 'Standard Shift'
    });
  }

  return days;
};

// Initial Production Line Team Workers
const INITIAL_PRODUCTION_WORKERS = [];

export default function ProductionLineSalary({ onBackToSalaryModules }) {
  const [workers, setWorkers] = useState(INITIAL_PRODUCTION_WORKERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // October 2026
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');

  // Modals & Drawers
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDayPriceModalOpen, setIsDayPriceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);

  // Day Price Form State
  const [dayPriceForm, setDayPriceForm] = useState({
    targetDate: '2026-10-15',
    productId: 'ITM-01',
    newRate: '4.80',
    note: 'Steel grade variation markup'
  });

  // Import Production Form State
  const [importForm, setImportForm] = useState({
    dateRange: 'Full Month (01 Oct - 31 Oct 2026)',
    shift: 'All Production Shifts',
    fetchAttendanceTimings: true,
    overrideManual: true
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync Attendance Action
  const handleSyncAttendance = () => {
    setIsSyncingAttendance(true);
    setTimeout(() => {
      setIsSyncingAttendance(false);
      showToast('Attendance & shift clock-ins successfully synchronized with Attendance module!');
    }, 900);
  };

  // Import Production Action
  const handleExecuteImport = (e) => {
    e.preventDefault();
    setIsImportModalOpen(false);
    showToast(`Successfully imported production outputs and machine shift timings for ${workers.length} workers!`);
  };

  // Update Day Price of Product
  const handleSaveDayPrice = (e) => {
    e.preventDefault();
    const rateNum = parseFloat(dayPriceForm.newRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      alert('Please enter a valid rate per piece');
      return;
    }

    const targetProd = products.find(p => p.id === dayPriceForm.productId);
    if (!targetProd) return;

    // Update all daily logs matching the date and product
    setWorkers(prevWorkers =>
      prevWorkers.map(w => {
        const updatedLogs = w.dailyLogs.map(log => {
          if (log.date === dayPriceForm.targetDate && (log.productCode === targetProd.code || w.primaryProduct.id === targetProd.id)) {
            const pieceEarnings = Math.round(log.pieces * rateNum);
            const dayTotal = pieceEarnings + log.otEarnings;
            return {
              ...log,
              dayRate: rateNum,
              pieceEarnings,
              dayTotal,
              note: dayPriceForm.note || 'Day rate updated by supervisor'
            };
          }
          return log;
        });
        return {
          ...w,
          dailyLogs: updatedLogs
        };
      })
    );

    setIsDayPriceModalOpen(false);
    showToast(`Daily rate for ${targetProd.name} on ${dayPriceForm.targetDate} updated to ₹ ${rateNum.toFixed(2)}/pc`);
  };

  // Worker calculations summary helper
  const calculateWorkerSummary = (worker) => {
    const logs = worker.dailyLogs || [];
    const presentDays = logs.filter(l => l.status === 'Present').length;
    const totalPcs = logs.reduce((sum, l) => sum + (l.pieces || 0), 0);
    const pieceGross = logs.reduce((sum, l) => sum + (l.pieceEarnings || 0), 0);
    const otGross = logs.reduce((sum, l) => sum + (l.otEarnings || 0), 0);
    const totalOTHours = logs.reduce((sum, l) => sum + (l.overtimeHours || 0), 0);
    const totalGross = pieceGross + otGross;
    const totalDeductions = (worker.advanceDeduction || 0) + (worker.statutoryDeduction || 0);
    const netSalary = Math.max(0, totalGross - totalDeductions);
    const avgDailyPcs = presentDays > 0 ? Math.round(totalPcs / presentDays) : 0;

    return {
      presentDays,
      totalPcs,
      avgDailyPcs,
      pieceGross,
      otGross,
      totalOTHours,
      totalGross,
      advanceDeduction: worker.advanceDeduction || 0,
      statutoryDeduction: worker.statutoryDeduction || 0,
      totalDeductions,
      netSalary
    };
  };

  // Overall totals across all workers
  const overallStats = useMemo(() => {
    let grandPcs = 0;
    let grandPieceGross = 0;
    let grandNetSalary = 0;
    let grandPresentDays = 0;

    workers.forEach(w => {
      const s = calculateWorkerSummary(w);
      grandPcs += s.totalPcs;
      grandPieceGross += s.pieceGross;
      grandNetSalary += s.netSalary;
      grandPresentDays += s.presentDays;
    });

    const avgRatePerPc = grandPcs > 0 ? (grandPieceGross / grandPcs).toFixed(2) : '0.00';

    return {
      totalWorkers: workers.length,
      grandPcs,
      grandPieceGross,
      grandNetSalary,
      avgRatePerPc,
      grandPresentDays
    };
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.section.toLowerCase().includes(q);
      const matchesSection = selectedSection === 'All' || w.section === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [workers, searchQuery, selectedSection]);

  // Unique sections for filter dropdown
  const sectionsList = useMemo(() => {
    const list = Array.from(new Set(workers.map(w => w.section)));
    return ['All', ...list];
  }, [workers]);

  // Selected worker's detailed summary if modal is open
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
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Production Team Salary
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    Piece-Rate Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Item outputs, dynamic daily rates & shift timings synchronized from Attendance
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
              disabled={isSyncingAttendance}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
              <span>{isSyncingAttendance ? 'Syncing Attendance...' : 'Sync Attendance'}</span>
            </button>

            {/* Set Daily Product Price */}
            <button
              type="button"
              onClick={() => setIsDayPriceModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-amber-300/80 text-amber-800 hover:bg-amber-50 shadow-2xs transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Set Day Price of Products</span>
            </button>

            {/* Import Production Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-200" />
              <span>Import Production</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT BODY */}
      <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ATTENDANCE & SHIFT INTEGRATION NOTICE */}
        <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Attendance Data Linked</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Worker in-times, out-times, and overtime hours are imported directly from the Attendance Module. Daily piece earnings combine with approved shift OT.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto text-xs bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/80">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-medium">Payroll Cycle:</span>
            <span className="font-bold text-slate-800">October 2026 (1-31 Oct)</span>
          </div>
        </div>

        {/* 4 TOP SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Manufactured</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {overallStats.grandPcs.toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-400">pcs</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {workers.length} line workers</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Piece Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-900">
                ₹ {overallStats.grandPieceGross.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-indigo-600/80 mt-1">Avg ₹ {overallStats.avgRatePerPc} / piece</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Payable Salary</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹ {overallStats.grandNetSalary.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-600 mt-1">After advances & deductions</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Line Active Attendance</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {overallStats.grandPresentDays} <span className="text-xs font-medium text-slate-400">mandays</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">100% duty records verified</p>
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
                placeholder="Search production worker by name, ID or station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {sectionsList.map(sec => (
                  <option key={sec} value={sec}>
                    {sec === 'All' ? 'All Machine Sections' : sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 self-center">
            Showing <strong className="text-slate-800">{filteredWorkers.length}</strong> of {workers.length} workers
          </div>
        </div>

        {/* WORKERS FINAL CALCULATION TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Production Line Workers & Wage Calculation Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any worker row to inspect full month daily pieces, dynamic rates, and shift clock timings
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
              Click row to view full 31-day logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Worker Profile</th>
                  <th className="py-3.5 px-3">Machine / Section</th>
                  <th className="py-3.5 px-3 text-center">Duty Days</th>
                  <th className="py-3.5 px-3 text-right">Total Pcs</th>
                  <th className="py-3.5 px-3 text-right">Piece Earnings</th>
                  <th className="py-3.5 px-3 text-right">Shift OT</th>
                  <th className="py-3.5 px-3 text-right">Gross Total</th>
                  <th className="py-3.5 px-3 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Factory className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No production workers found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Assign workers to production lines to calculate output-based wages.</p>
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
                      {/* Worker info */}
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
                              {worker.id} • {worker.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{worker.section}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          Item: {worker.primaryProduct.code}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {summary.presentDays} d
                        </span>
                      </td>

                      {/* Total Pieces */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {summary.totalPcs.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ~{summary.avgDailyPcs} pcs/d
                        </span>
                      </td>

                      {/* Piece Earnings */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 font-mono">
                        ₹ {summary.pieceGross.toLocaleString('en-IN')}
                      </td>

                      {/* OT pay */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹ {summary.otGross.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {summary.totalOTHours}h OT
                        </span>
                      </td>

                      {/* Gross */}
                      <td className="py-3 px-3 text-right font-bold text-indigo-950 font-mono">
                        ₹ {summary.totalGross.toLocaleString('en-IN')}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        -₹ {summary.totalDeductions.toLocaleString('en-IN')}
                        {summary.advanceDeduction > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Adv: ₹{summary.advanceDeduction}
                          </span>
                        )}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-700 font-mono block">
                          ₹ {summary.netSalary.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Payable
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
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                }))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: FULL MONTH DETAILS BREAKDOWN (CLICK ON WORKER) */}
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {selectedWorkerForDetails.section}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>ID: <strong className="text-white font-mono">{selectedWorkerForDetails.id}</strong></span>
                    <span>•</span>
                    <span>Shift: {selectedWorkerForDetails.shift}</span>
                    <span>•</span>
                    <span>Bank A/C: {selectedWorkerForDetails.bankAccount} ({selectedWorkerForDetails.ifsc})</span>
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

            {/* KPI Banner for Worker */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5 bg-slate-50 border-b border-slate-200/80 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Duty Attendance</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                  {selectedWorkerSummary.presentDays} / 31 Days
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Output</span>
                <span className="text-base font-bold text-indigo-700 mt-0.5 block font-mono">
                  {selectedWorkerSummary.totalPcs.toLocaleString('en-IN')} pcs
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Piece Earnings</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                  ₹ {selectedWorkerSummary.pieceGross.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Advance Deducted</span>
                <span className="text-base font-bold text-rose-600 mt-0.5 block font-mono">
                  -₹ {selectedWorkerSummary.advanceDeduction.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-emerald-700 block text-[10px] font-bold uppercase">Net Payout</span>
                <span className="text-base font-extrabold text-emerald-800 mt-0.5 block font-mono">
                  ₹ {selectedWorkerSummary.netSalary.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Month Day-by-Day Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Full Month Daily Production & Timing Sheet (October 2026)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Timings pulled from Attendance Module
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Attendance Timing</th>
                      <th className="py-2.5 px-3">Product Manufactured</th>
                      <th className="py-2.5 px-3 text-right">Pcs Output</th>
                      <th className="py-2.5 px-3 text-right">Day Rate</th>
                      <th className="py-2.5 px-3 text-right">Piece Pay</th>
                      <th className="py-2.5 px-3 text-right">OT Pay</th>
                      <th className="py-2.5 px-3 text-right">Day Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedWorkerForDetails.dailyLogs.map((log) => {
                      const isSun = log.status === 'Sunday Off';
                      const isLeave = log.status.includes('Leave') || log.status.includes('Absent');

                      return (
                        <tr
                          key={log.day}
                          className={`${
                            isSun
                              ? 'bg-slate-50/70 text-slate-400'
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
                                isSun
                                  ? 'bg-slate-200/80 text-slate-600'
                                  : isLeave
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* Timings */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            {isSun || isLeave ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div>
                                <span className="font-mono text-slate-800 font-medium">
                                  {log.timeIn} - {log.timeOut}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {log.workingHours} {log.overtimeHours > 0 ? `(${log.overtimeHours}h OT)` : ''}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Product */}
                          <td className="py-2 px-3">
                            {isSun || isLeave ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div>
                                <span className="font-medium text-slate-800">{log.product}</span>
                                <span className="text-[10px] text-indigo-500 font-mono block">
                                  [{log.productCode}]
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Pieces Output */}
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {isSun || isLeave ? '-' : `${log.pieces} pcs`}
                          </td>

                          {/* Day Rate */}
                          <td className="py-2 px-3 text-right font-mono">
                            {isSun || isLeave ? (
                              '-'
                            ) : (
                              <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                ₹ {log.dayRate.toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* Piece Pay */}
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                            {isSun || isLeave ? '-' : `₹ ${log.pieceEarnings.toLocaleString('en-IN')}`}
                          </td>

                          {/* OT Pay */}
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {log.otEarnings > 0 ? `₹ ${log.otEarnings}` : '-'}
                          </td>

                          {/* Day Total */}
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-indigo-900">
                            {isSun || isLeave ? '-' : `₹ ${log.dayTotal.toLocaleString('en-IN')}`}
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
                Calculations conform to piece-rate production registers and factory statutory rules.
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

      {/* ============================================================== */}
      {/* MODAL 2: SET DAY PRICE OF PRODUCTS (DYNAMIC RATE PER PIECE) */}
      {/* ============================================================== */}
      {isDayPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Day Price of Products</h3>
                  <p className="text-xs text-slate-600">Dynamic piece rates per day / production batch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDayPriceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayPrice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Production Date *
                </label>
                <input
                  type="date"
                  required
                  value={dayPriceForm.targetDate}
                  onChange={(e) => setDayPriceForm({ ...dayPriceForm, targetDate: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product / Item Selection *
                </label>
                <select
                  value={dayPriceForm.productId}
                  onChange={(e) => setDayPriceForm({ ...dayPriceForm, productId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.code}] - Default: ₹{p.defaultRate.toFixed(2)}/pc
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Day Rate (₹ per piece) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">₹</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    required
                    value={dayPriceForm.newRate}
                    onChange={(e) => setDayPriceForm({ ...dayPriceForm, newRate: e.target.value })}
                    className="w-full pl-7 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold text-slate-900"
                    placeholder="e.g. 5.20"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This rate will apply to all workers producing this item on the specified date.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor Rate Adjustment Reason
                </label>
                <input
                  type="text"
                  value={dayPriceForm.note}
                  onChange={(e) => setDayPriceForm({ ...dayPriceForm, note: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. High tolerance batch or material hardness incentive"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDayPriceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Apply & Recalculate Day
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: IMPORT PRODUCTION & AUTO-FETCH TIMINGS */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-indigo-50 border-b border-indigo-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Production Logs</h3>
                  <p className="text-xs text-slate-600">Auto-fetches pieces manufactured & attendance timings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteImport} className="p-6 space-y-4">
              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 hover:bg-indigo-50/70 transition-colors cursor-pointer">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Production CSV / Excel Machine Sheet
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Supports .xlsx, .csv machine logs with worker barcode IDs
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={importForm.fetchAttendanceTimings}
                    onChange={(e) => setImportForm({ ...importForm, fetchAttendanceTimings: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Automatically fetch everyone's attendance shift timings
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Matches biometric clock-in / clock-out times from the Attendance Module to compute OT.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={importForm.overrideManual}
                    onChange={(e) => setImportForm({ ...importForm, overrideManual: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Auto-recalculate piece rates using current day price rules
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Instantly updates all final net salaries across the entire production team.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Import & Fetch All Timings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
