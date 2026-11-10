import React, { useState, useEffect, useMemo } from 'react';
import {
  DataStoreService,
  WorkerService,
  PaymentService,
  AttendanceService,
  PayrollService,
} from '../services/api';
import PaymentForumModal from './PaymentForumModal';
import { maskBankAccount, maskAadhaar, calculateAgeFromDOB } from '../utils/validation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  ShieldCheck,
  HardHat,
  Banknote,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Printer,
  Download,
  Wallet,
  TrendingUp,
  Percent,
  Coins,
  History,
  CreditCard,
  Building,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

export default function WorkerFullProfileView({
  worker,
  onBack,
  onEdit,
  onWorkerUpdated,
  contractorName = null,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendance' | 'salary' | 'payments' | 'advances'
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showAadhaarNumber, setShowAadhaarNumber] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);

  // Live aggregated datasets for this worker
  const [paymentVouchers, setPaymentVouchers] = useState([]);
  const [regularAdvances, setRegularAdvances] = useState([]);
  const [fixedLoans, setFixedLoans] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const workerId = worker?.worker_id || worker?.workerId || worker?.id || '';
  const workerName = worker?.name || 'Worker Profile';

  // Load complete historical data from Day 1 across datastores
  const loadWorkerHistory = async () => {
    setIsLoading(true);
    try {
      const [vouchers, regAdv, fixLoans, attList] = await Promise.all([
        DataStoreService.get('payment_vouchers', []).catch(() => []),
        DataStoreService.get('advances_regular', []).catch(() => []),
        DataStoreService.get('advances_fixed', []).catch(() => []),
        AttendanceService.getRecords({ worker_id: workerId }).catch(() => []),
      ]);

      // Filter payment vouchers for this worker
      const myVouchers = (Array.isArray(vouchers) ? vouchers : []).filter((v) => {
        const vId = String(v.worker_id || v.workerId || v.worker_id_code || '');
        const vName = (v.worker_name || v.workerName || '').trim().toLowerCase();
        return vId === String(workerId) || (workerName && vName === workerName.trim().toLowerCase());
      });
      setPaymentVouchers(myVouchers);

      // Find Regular Advances for this worker
      const myRegEntry = (Array.isArray(regAdv) ? regAdv : []).find(
        (w) => String(w.workerId || w.worker_id) === String(workerId)
      );
      setRegularAdvances(myRegEntry?.transactions || []);

      // Find Fixed Loans for this worker
      const myLoans = (Array.isArray(fixLoans) ? fixLoans : []).filter(
        (l) => String(l.workerId || l.worker_id) === String(workerId)
      );
      setFixedLoans(myLoans);

      setAttendanceRecords(Array.isArray(attList) ? attList : []);
    } catch (err) {
      console.warn('Error loading worker history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerHistory();

    const handlePaymentCompleted = (e) => {
      const v = e.detail;
      const vId = String(v?.worker_id || v?.workerId || '');
      const vName = (v?.worker_name || v?.workerName || '').trim().toLowerCase();
      if (!vId || vId === String(workerId) || (workerName && vName === workerName.trim().toLowerCase())) {
        loadWorkerHistory();
      }
    };
    window.addEventListener('paysphere-payment-completed', handlePaymentCompleted);
    window.addEventListener('paysphere-advance-updated', handlePaymentCompleted);

    return () => {
      window.removeEventListener('paysphere-payment-completed', handlePaymentCompleted);
      window.removeEventListener('paysphere-advance-updated', handlePaymentCompleted);
    };
  }, [workerId, workerName]);

  // Determine Employee Type & Agency
  const isContractor =
    worker?.workerType === 'Contractor' ||
    worker?.worker_type === 'Contractor' ||
    Boolean(worker?.contractorAgency || worker?.contractor_agency || contractorName);

  const agencyName =
    worker?.contractorAgency ||
    worker?.contractor_agency ||
    contractorName ||
    (isContractor ? 'Contractor Agency' : '');

  // Calculate Tenure from Joining Date
  const joinDate = worker?.joinDate || worker?.date_of_joining || worker?.created_at?.split('T')[0] || '';
  const tenureText = useMemo(() => {
    if (!joinDate) return null;
    const start = new Date(joinDate);
    if (isNaN(start.getTime())) return null;
    const now = new Date();
    const diffMonths = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
    if (diffMonths === 0) return 'Joined recently';
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} with company`;
  }, [joinDate]);

  // Outstanding advance balance
  const activeAdvanceBalance = useMemo(() => {
    const regBal = regularAdvances
      .filter((t) => t.status === 'Pending Deduction')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const loanBal = fixedLoans.reduce((s, l) => {
      const recovered = (l.repayments || []).reduce((sum, r) => sum + (Number(r.emiAmount) || 0), 0);
      return s + Math.max(0, (Number(l.principalAmount) || 0) - recovered);
    }, 0);

    return regBal + loanBal;
  }, [regularAdvances, fixedLoans]);

  // Real Attendance metrics derived strictly from actual attendance records
  const attendanceStats = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { total: 0, present: 0, absent: 0, leaves: 0, overtime: 0, pct: 'N/A' };
    }
    const total = attendanceRecords.length;
    let present = 0;
    let absent = 0;
    let leaves = 0;
    let overtime = 0;

    attendanceRecords.forEach((r) => {
      const st = String(r.status || '').toLowerCase();
      if (st === 'present' || st === 'p') present++;
      else if (st === 'absent' || st === 'a') absent++;
      else if (st === 'leave' || st === 'half day' || st === 'half-day' || st === 'h') leaves++;

      overtime += Number(r.overtime_hours || r.overtime || 0);
    });

    const pct = total > 0 ? `${Math.round((present / total) * 100)}%` : 'N/A';
    return { total, present, absent, leaves, overtime, pct };
  }, [attendanceRecords]);

  // Derived Month-by-Month Attendance Breakdown from actual records
  const monthlyAttendanceHistory = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return [];

    const groups = {};
    attendanceRecords.forEach((rec) => {
      const d = rec.date || rec.attendance_date || rec.created_at;
      if (!d) return;
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return;
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = {
          month: monthName,
          key,
          totalDays: 0,
          present: 0,
          absent: 0,
          leaves: 0,
          overtimeHrs: 0,
        };
      }
      groups[key].totalDays += 1;
      const st = String(rec.status || '').toLowerCase();
      if (st === 'present' || st === 'p') groups[key].present += 1;
      else if (st === 'absent' || st === 'a') groups[key].absent += 1;
      else if (st === 'leave' || st === 'half day' || st === 'half-day' || st === 'h') groups[key].leaves += 1;
      groups[key].overtimeHrs += Number(rec.overtime_hours || rec.overtime || 0);
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [attendanceRecords]);

  // Derived Salary Disbursals from actual payment vouchers where category is Salary
  const monthlySalaryHistory = useMemo(() => {
    const salaryVouchers = paymentVouchers.filter(
      (v) => (v.payment_type || v.category || '').toLowerCase() === 'salary'
    );
    return salaryVouchers.map((v) => ({
      cycle: v.voucher_number || v.id,
      date: v.payment_date,
      amount: Number(v.amount_paid || 0),
      mode: v.payment_mode || 'Bank Transfer',
      account: v.bank_account_name || 'ICICI 1',
      voucher: v.voucher_number || v.id,
      narration: v.narration || 'Salary Wage Disbursal',
      status: 'Disbursed',
    }));
  }, [paymentVouchers]);

  const age = worker?.dob ? calculateAgeFromDOB(worker?.dob) : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#fafbfc] overflow-y-auto">
      {/* ===================== TOP NAVIGATION & ACTIONS BAR ===================== */}
      <header className="px-8 lg:px-10 py-5 bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Back Button & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer group"
              title="Return to list"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Workers Directory</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900">{workerName}</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-semibold">
                {workerId}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Pay Worker Action */}
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>Make Payment</span>
            </button>

            {/* Edit Worker */}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(worker)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            )}

            {/* Print Dossier */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================== HERO PROFILE CARD ===================== */}
      <section className="px-8 lg:px-10 pt-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 lg:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Avatar + Identity Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center">
                  {worker?.photo ? (
                    <img
                      src={worker.photo}
                      alt={workerName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=11133c&color=fff&size=150`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#11133c] text-indigo-200 font-bold text-3xl flex items-center justify-center">
                      {workerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white ${
                    worker?.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  title={worker?.status || 'Active'}
                />
              </div>

              {/* Title & Metadata */}
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{workerName}</h1>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                    {workerId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      worker?.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        worker?.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    {worker?.status || 'Active'}
                  </span>
                </div>

                {/* Subtitle: Role, Department, Type */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    {worker?.designation || 'Staff'}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {typeof worker?.department === 'string'
                      ? worker.department
                      : worker?.department?.name || worker?.department_name || 'Production'}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-800 font-semibold text-xs">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Work Area: {worker?.workArea || worker?.work_area || 'Unassigned'}</span>
                  </span>
                  <span>&bull;</span>
                  {isContractor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs">
                      <HardHat className="w-3.5 h-3.5 text-amber-600" />
                      <span>Contractor Agency: {agencyName}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Permanent Staff</span>
                    </span>
                  )}
                </div>

                {/* Tenure and Join Date */}
                {joinDate ? (
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Date of Joining: <strong className="text-slate-700">{joinDate}</strong>
                      {tenureText ? ` (${tenureText})` : ''}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date of Joining: <span className="text-slate-500">Not Specified</span></span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Advances & Attendance Snapshot (LIFETIME EARNINGS CARD REMOVED AS REQUESTED) */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
              {/* Outstanding Advances / Loans */}
              <div className="bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Advances Balance
                </span>
                <span className="text-lg font-black font-mono text-amber-900 mt-0.5 block">
                  ₹ {activeAdvanceBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Pending Recovery</span>
              </div>

              {/* Attendance Reliability */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                  Reliability
                </span>
                <span className="text-lg font-black font-mono text-indigo-900 mt-0.5 block">
                  {attendanceStats.pct}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">
                  {attendanceStats.present} Shifts Clocked
                </span>
              </div>
            </div>
          </div>

          {/* ===================== DOSSIER TAB NAVIGATION ===================== */}
          <div className="flex items-center gap-6 mt-8 border-b border-slate-200 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs font-bold transition relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>General Details & Dossier</span>
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 text-xs font-bold transition relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>
                Attendance History {monthlyAttendanceHistory.length > 0 ? `(${monthlyAttendanceHistory.length} Months)` : ''}
              </span>
              {activeTab === 'attendance' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('salary')}
              className={`pb-3 text-xs font-bold transition relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'salary' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Salary & Wage Structure</span>
              {activeTab === 'salary' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`pb-3 text-xs font-bold transition relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'payments' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Payment & Disbursal Ledger ({paymentVouchers.length})</span>
              {activeTab === 'payments' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('advances')}
              className={`pb-3 text-xs font-bold transition relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'advances' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Advances & Loan Register</span>
              {activeTab === 'advances' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ===================== TAB CONTENT SECTIONS ===================== */}
      <main className="px-8 lg:px-10 py-6 space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: GENERAL DETAILS & DOSSIER                                */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Grid: Personal Details + Address + Compliance + Banking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Personal & Contact Information */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Personal & Family Details</h3>
                    <p className="text-[11px] text-slate-400">Demographics and emergency contact records</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                    <span className="font-bold text-slate-800 mt-1 block">{worker?.gender || 'Not Specified'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
                    <span className="font-bold text-slate-800 mt-1 block font-mono">
                      {worker?.dob || <span className="text-slate-400 font-normal">Not Specified</span>}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculated Age</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {age ? `${age} Years` : <span className="text-slate-400 font-normal">Not Specified</span>}
                    </span>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">Assigned Work Area</span>
                    <span className="font-bold text-indigo-900 mt-1 block truncate">
                      {worker?.workArea || worker?.work_area || 'Unassigned'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Phone</span>
                    <span className="font-bold text-indigo-700 font-mono mt-1 block">
                      {worker?.phone || <span className="text-slate-400 font-normal">Not Provided</span>}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                    <span className="font-bold text-rose-600 font-mono mt-1 block">
                      {worker?.emergencyContact || worker?.emergency_contact || (
                        <span className="text-slate-400 font-normal">Not Provided</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Residential Addresses */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Local Address</span>
                      <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                        {worker?.address || <span className="text-slate-400 font-normal">Not Provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Permanent Hometown Address</span>
                      <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                        {worker?.permanentAddress || worker?.permanent_address || (
                          <span className="text-slate-400 font-normal">Not Provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Identity Verification & Government Documents */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Identity & Statutory Compliance</h3>
                    <p className="text-[11px] text-slate-400">Aadhaar, PAN & KYC verification documents</p>
                  </div>
                </div>

                {/* Aadhaar Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                      UID
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Aadhaar Number</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {worker?.aadharNumber || worker?.aadhar_number ? (
                          showAadhaarNumber
                            ? worker?.aadharNumber || worker?.aadhar_number
                            : maskAadhaar(worker?.aadharNumber || worker?.aadhar_number)
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">Not Provided</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(worker?.aadharNumber || worker?.aadhar_number) && (
                      <button
                        type="button"
                        onClick={() => setShowAadhaarNumber(!showAadhaarNumber)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                        title={showAadhaarNumber ? 'Mask Aadhaar' : 'Reveal Aadhaar'}
                      >
                        {showAadhaarNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {(worker?.aadharDoc || worker?.aadhar_doc) && (
                      <button
                        type="button"
                        onClick={() =>
                          setDocPreview({
                            title: `${workerName} - Aadhaar Document`,
                            data: worker?.aadharDoc || worker?.aadhar_doc,
                          })
                        }
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition cursor-pointer"
                      >
                        View Doc
                      </button>
                    )}
                  </div>
                </div>

                {/* PAN Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      PAN
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PAN Number</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block uppercase">
                        {worker?.panNumber || worker?.pan_number || (
                          <span className="text-slate-400 font-normal text-xs lowercase">Not Provided</span>
                        )}
                      </span>
                    </div>
                  </div>
                  {(worker?.panDoc || worker?.pan_doc) && (
                    <button
                      type="button"
                      onClick={() =>
                        setDocPreview({
                          title: `${workerName} - PAN Card Document`,
                          data: worker?.panDoc || worker?.pan_doc,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    >
                      View Doc
                    </button>
                  )}
                </div>

                {/* Banking Disbursal Account */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Direct Salary Bank Account</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {worker?.bankName || worker?.bank_name || 'Bank Details'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {worker?.bankAccount || worker?.bank_account ? (
                            showBankDetails
                              ? worker?.bankAccount || worker?.bank_account
                              : maskBankAccount(worker?.bankAccount || worker?.bank_account)
                          ) : (
                            <span className="text-slate-400 font-normal">Not Provided</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                        IFSC: {worker?.ifscCode || worker?.ifsc_code || 'Not Provided'}
                      </span>
                    </div>
                  </div>
                  {(worker?.bankAccount || worker?.bank_account) && (
                    <button
                      type="button"
                      onClick={() => setShowBankDetails(!showBankDetails)}
                      className="p-1.5 text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 rounded-lg transition cursor-pointer"
                      title={showBankDetails ? 'Mask Bank A/C' : 'Reveal Bank A/C'}
                    >
                      {showBankDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ATTENDANCE HISTORY (FROM DAY 1)                         */}
        {/* ============================================================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Attendance Metrics Top Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Shifts Clocked
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {attendanceStats.present} Shifts
                </span>
                <p className="text-xs text-slate-500 mt-1">Logged in attendance records</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Tracked Days
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                  {attendanceStats.total} Days
                </span>
                <p className="text-xs text-emerald-600 mt-1">Registered roster entries</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cumulative Overtime
                </span>
                <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
                  {attendanceStats.overtime} Hours
                </span>
                <p className="text-xs text-indigo-600 mt-1">Clocked excess hours</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shift Schedule
                </span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {worker?.shift || 'General Shift'}
                </span>
                <p className="text-xs text-slate-500 mt-1">Assigned work timing</p>
              </div>
            </div>

            {/* Monthly Attendance Breakdown Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Register</h3>
                  <p className="text-xs text-slate-500">Month-by-month attendance records and overtime tracking</p>
                </div>
                {attendanceStats.pct !== 'N/A' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {attendanceStats.pct} Presence Rate
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Billing Month</th>
                      <th className="px-6 py-3.5 text-center">Calendar Working Days</th>
                      <th className="px-6 py-3.5 text-center text-emerald-700">Present Shifts</th>
                      <th className="px-6 py-3.5 text-center text-rose-600">Absent Days</th>
                      <th className="px-6 py-3.5 text-center text-amber-600">Paid Leave / Half</th>
                      <th className="px-6 py-3.5 text-center text-indigo-700">Overtime Logged</th>
                      <th className="px-6 py-3.5 text-right font-bold">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {monthlyAttendanceHistory.length > 0 ? (
                      monthlyAttendanceHistory.map((m) => {
                        const attPct = m.totalDays > 0 ? Math.round((m.present / m.totalDays) * 100) : 0;
                        return (
                          <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{m.month}</td>
                            <td className="px-6 py-4 text-center font-mono text-slate-700">{m.totalDays} days</td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-emerald-700">
                              {m.present} days
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-semibold text-rose-600">
                              {m.absent}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-amber-600">{m.leaves}</td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">
                              +{m.overtimeHrs} hrs
                            </td>
                            <td className="px-6 py-4 text-right font-bold font-mono text-slate-900">{attPct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No attendance records logged yet</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Daily shifts marked in Attendance module will automatically be registered here.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SALARY & WAGE STRUCTURE                                  */}
        {/* ============================================================== */}
        {activeTab === 'salary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Compensation Configuration Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Contract & Compensation Policy</h3>
              <p className="text-xs text-slate-500 mb-5">Current compensation agreement and wage rate rules</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Wage Calculation Policy</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">
                    {worker?.salaryPolicy || (isContractor ? 'Per Day / Shift Rate' : 'Monthly Fixed Salary')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Approved at onboarding</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Agreed Base Rate</span>
                  <span className="font-black font-mono text-indigo-900 text-xl mt-1 block">
                    ₹ {Number(worker?.dailyRate || worker?.policyRate || worker?.base_wage || 0).toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {Number(worker?.dailyRate || worker?.policyRate || worker?.base_wage || 0) < 3000 ? '/ shift' : '/ month'}
                    </span>
                  </span>
                  <span className="text-[11px] text-indigo-600 mt-0.5 block">Standard shift rate</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Overtime Multiplier</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">1.5× Normal Hourly Wage</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Calculated on excess clocked time</span>
                </div>
              </div>
            </div>

            {/* Historical Monthly Wage Slips */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Historical Salary Slips & Wage Disbursements</h3>
                  <p className="text-xs text-slate-500">Generated pay slips and wage disbursements</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Voucher Reference</th>
                      <th className="px-6 py-3.5">Disbursal Date</th>
                      <th className="px-6 py-3.5">Disbursed From</th>
                      <th className="px-6 py-3.5">Mode</th>
                      <th className="px-6 py-3.5">Narration</th>
                      <th className="px-6 py-3.5 text-right font-bold text-slate-900">Amount Disbursed</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {monthlySalaryHistory.length > 0 ? (
                      monthlySalaryHistory.map((slip) => (
                        <tr key={slip.cycle} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-700">{slip.cycle}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{slip.date}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{slip.account}</td>
                          <td className="px-6 py-4 text-slate-700">{slip.mode}</td>
                          <td className="px-6 py-4 text-slate-600">{slip.narration}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                            ₹ {slip.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No salary slips generated yet</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Wage disbursals processed via Payment Forum or Payroll will record here automatically.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PAYMENT & DISBURSAL LEDGER (FROM DAY 1)                  */}
        {/* ============================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Make Payment Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment & Disbursal Register</h3>
                <p className="text-xs text-slate-500">
                  Every payment transaction and disbursal voucher recorded for {workerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Issue New Payment</span>
              </button>
            </div>

            {/* Vouchers Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Voucher Number</th>
                      <th className="px-6 py-3.5">Disbursal Date</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Disbursed From</th>
                      <th className="px-6 py-3.5">Payment Mode</th>
                      <th className="px-6 py-3.5">Narration / Ref</th>
                      <th className="px-6 py-3.5 text-right text-emerald-700 font-bold">Amount Paid</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paymentVouchers.length > 0 ? (
                      paymentVouchers.map((vch) => (
                        <tr key={vch.id || vch.voucher_number} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                            {vch.voucher_number || vch.id}
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium">{vch.payment_date}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {vch.payment_type || 'Salary'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {/* STRICTLY NO BALANCE DISPLAYED */}
                            {vch.bank_account_name || 'ICICI 1'}
                          </td>
                          <td className="px-6 py-4 text-slate-700">{vch.payment_mode || 'Bank Transfer'}</td>
                          <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={vch.narration}>
                            {vch.narration || vch.transaction_reference || 'Disbursal payment'}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                            ₹ {Number(vch.amount_paid || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No payment vouchers recorded yet</p>
                          <p className="text-xs text-slate-400 mt-0.5">Click "Issue New Payment" above to disburse via the universal payment forum.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ADVANCES & LOANS REGISTER                               */}
        {/* ============================================================== */}
        {activeTab === 'advances' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Monthly Regular Advances Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Regular Monthly Salary Advances</h3>
                  <p className="text-xs text-slate-500">Short-term salary advances deducted in current payroll cycle</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Advance ID</th>
                      <th className="px-6 py-3.5">Disbursal Date</th>
                      <th className="px-6 py-3.5">Purpose</th>
                      <th className="px-6 py-3.5">Mode</th>
                      <th className="px-6 py-3.5 text-right font-bold">Advance Amount</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {regularAdvances.length > 0 ? (
                      regularAdvances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-700">{adv.id}</td>
                          <td className="px-6 py-4 text-slate-800 font-medium">{adv.date}</td>
                          <td className="px-6 py-4 text-slate-700">{adv.purpose || 'Salary Advance'}</td>
                          <td className="px-6 py-4 text-slate-600">{adv.mode || 'Cash'}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-amber-700 text-sm">
                            ₹ {Number(adv.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                adv.status === 'Deducted from Salary' || adv.status === 'Cleared'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {adv.status || 'Pending Deduction'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No regular advances active for this worker.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fixed Long-Term Loans & EMI Schedules */}
            {fixedLoans.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Fixed Advance Loans & Monthly EMI Schedule</h3>
                  <p className="text-xs text-slate-500">Long-term staff welfare loans recovered across monthly payrolls</p>
                </div>

                <div className="p-6 space-y-4">
                  {fixedLoans.map((loan) => {
                    const recovered = (loan.repayments || []).reduce((s, r) => s + (Number(r.emiAmount) || 0), 0);
                    const remaining = Math.max(0, (Number(loan.principalAmount) || 0) - recovered);
                    return (
                      <div key={loan.loanId} className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-md">
                              {loan.loanId}
                            </span>
                            <span className="text-xs text-slate-700 font-semibold ml-2.5">
                              Purpose: {loan.purpose}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Monthly EMI: <strong className="text-slate-900 font-mono">₹ {loan.monthlyEmi}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sanctioned</span>
                            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                              ₹ {loan.principalAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Recovered to Date</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                              ₹ {recovered.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                            <span className="font-mono font-bold text-amber-800 text-sm mt-0.5 block">
                              ₹ {remaining.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== MODAL: UNIVERSAL PAYMENT FORUM ===================== */}
      {isPayModalOpen && (
        <PaymentForumModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          initialWorker={worker}
          initialCategory="Salary"
          title={`Make Payment to ${workerName}`}
          onSuccess={() => {
            setIsPayModalOpen(false);
            loadWorkerHistory();
            if (onWorkerUpdated) onWorkerUpdated();
          }}
        />
      )}

      {/* ===================== MODAL: DOCUMENT PREVIEW ===================== */}
      {docPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold">{docPreview.title}</h3>
              <button
                type="button"
                onClick={() => setDocPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-slate-100 max-h-[70vh] overflow-y-auto">
              {docPreview.data ? (
                <img src={docPreview.data} alt="Document" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md" />
              ) : (
                <p className="text-xs text-slate-400">Document preview unavailable</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
