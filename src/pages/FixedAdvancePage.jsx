import React, { useState, useMemo, useEffect } from 'react';
import { DataStoreService, WorkerService } from '../services/api';
import {
  Wallet,
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
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  UserCheck,
  ArrowDownRight,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  PiggyBank,
  BadgePercent,
  CheckCircle,
  SlidersHorizontal,
  Landmark
} from 'lucide-react';

// Sample worker photos matching PaySphere roster
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

// Helper to generate monthly EMI repayment schedule for a fixed loan
const generateLoanRepayments = (startMonthIndex, principal, emi, monthsPaid) => {
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
  const schedule = [];
  let balance = principal;

  for (let i = 0; i < monthsPaid; i++) {
    const monthName = months[startMonthIndex + i] || `Month ${i + 1}`;
    balance = Math.max(0, balance - emi);
    schedule.push({
      monthIndex: i + 1,
      monthName,
      salaryCycle: `SAL-2026-${String(startMonthIndex + i + 1).padStart(2, '0')}`,
      emiAmount: emi,
      balanceAfter: balance,
      status: 'Deducted from Salary',
      voucher: `EMI-REC-${1000 + i * 37}`,
      paymentDate: `2026-${String(startMonthIndex + i + 1).padStart(2, '0')}-07`
    });
  }
  return schedule;
};

// Initial Fixed Advance Loans (empty, ready for actual user testing)
const INITIAL_FIXED_LOANS = [];

export default function FixedAdvancePage({ onBackToAdvanceCards, onSwitchToRegularAdvance }) {
  const [loans, setLoans] = useState(INITIAL_FIXED_LOANS);
  const [registeredWorkers, setRegisteredWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLoanForModal, setSelectedLoanForModal] = useState(null);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Loan Sanction Form State
  const [sanctionForm, setSanctionForm] = useState({
    workerId: '',
    workerName: '',
    department: 'Production',
    sanctionDate: '2026-10-15',
    principalAmount: 50000,
    monthlyEmi: 3000,
    purpose: 'House Construction & Renovation',
    guarantor: 'Sukhwinder (Plant Head)',
    bankAccount: '',
    ifsc: ''
  });

  // Load loans from datastore and registered workers
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      DataStoreService.get('advances_fixed', []),
      WorkerService.getAll().catch(() => []),
    ]).then(([savedLoans, workers]) => {
      if (!isMounted) return;
      if (Array.isArray(savedLoans)) {
        setLoans(savedLoans);
      }
      if (Array.isArray(workers)) {
        setRegisteredWorkers(workers);
        if (workers.length > 0) {
          setSanctionForm((prev) => ({
            ...prev,
            workerId: workers[0].workerId,
            workerName: workers[0].name,
            department: workers[0].department || 'Production',
            bankAccount: workers[0].bankAccount || '',
            ifsc: workers[0].ifscCode || '',
          }));
        }
      }
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

  // Compute Overall Fixed Advance Portfolio Metrics
  const portfolioStats = useMemo(() => {
    let totalPrincipal = 0;
    let totalRecovered = 0;
    let totalMonthlyEmi = 0;

    loans.forEach((loan) => {
      totalPrincipal += loan.principalAmount;
      const recoveredForThisLoan = loan.repayments.reduce((s, r) => s + r.emiAmount, 0);
      totalRecovered += recoveredForThisLoan;
      totalMonthlyEmi += loan.monthlyEmi;
    });

    const totalOutstanding = Math.max(0, totalPrincipal - totalRecovered);

    return {
      totalPrincipal,
      totalRecovered,
      totalOutstanding,
      totalMonthlyEmi,
      activeLoansCount: loans.filter((l) => l.status.includes('Active')).length,
      recoveryPercentage: Math.round((totalRecovered / totalPrincipal) * 100)
    };
  }, [loans]);

  // Departments list for filter
  const departments = useMemo(() => {
    const deps = new Set(loans.map((l) => l.department));
    return ['All', ...Array.from(deps)];
  }, [loans]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.purpose.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = departmentFilter === 'All' || l.department === departmentFilter;

      let matchStatus = true;
      if (statusFilter === 'Active') matchStatus = l.status.includes('Active');
      if (statusFilter === 'Closing Soon') {
        const recovered = l.repayments.reduce((s, r) => s + r.emiAmount, 0);
        const rem = l.principalAmount - recovered;
        matchStatus = rem <= l.monthlyEmi * 3;
      }

      return matchSearch && matchDept && matchStatus;
    });
  }, [loans, searchQuery, departmentFilter, statusFilter]);

  // Handle Sanction Loan Form Submit
  const handleSanctionLoan = (e) => {
    e.preventDefault();
    const principal = Number(sanctionForm.principalAmount);
    const emi = Number(sanctionForm.monthlyEmi);
    const totalTenureMonths = Math.ceil(principal / emi);

    const newLoan = {
      loanId: `FL-2026-00${loans.length + 1}`,
      workerId: sanctionForm.workerId,
      name: sanctionForm.workerName,
      designation: 'Staff Associate',
      department: sanctionForm.department,
      photo: SAMPLE_AVATARS[loans.length % SAMPLE_AVATARS.length],
      sanctionDate: sanctionForm.sanctionDate,
      principalAmount: principal,
      monthlyEmi: emi,
      purpose: sanctionForm.purpose,
      guarantor: sanctionForm.guarantor,
      bankAccount: sanctionForm.bankAccount,
      ifsc: sanctionForm.ifsc,
      monthsPaid: 1, // October 2026 initial EMI deduction
      totalTenureMonths,
      status: 'Active (In Repayment)',
      repayments: [
        {
          monthIndex: 1,
          monthName: 'Oct 2026',
          salaryCycle: 'SAL-2026-10',
          emiAmount: emi,
          balanceAfter: principal - emi,
          status: 'Deducted from Salary',
          voucher: `EMI-REC-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentDate: '2026-10-15'
        }
      ]
    };

    const updated = [newLoan, ...loans];
    setLoans(updated);
    DataStoreService.save('advances_fixed', updated).catch((err) => {
      console.warn('Failed to save fixed loans to datastore:', err);
    });

    setIsSanctionModalOpen(false);
    showToast(`Fixed advance of ₹${principal.toLocaleString('en-IN')} sanctioned for ${sanctionForm.workerName}!`);
  };

  // Simulate Bulk Loan EMI Import
  const handleSimulateImport = () => {
    setIsImportModalOpen(false);
    showToast('Fixed advance EMI repayment ledger successfully imported & reconciled with bank statements!');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#fafbfc]">
      {/* Toast Alert */}
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
              onClick={onBackToAdvanceCards}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Advance Cards"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Advance Cards</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Fixed Advance & Long-Term Loans
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Monthly EMI Recovery
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Fixed monthly installments deducted across payroll cycles until full recovery
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToRegularAdvance && (
              <button
                type="button"
                onClick={onSwitchToRegularAdvance}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
              >
                <span>Switch to Monthly Advance</span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-600" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSanctionModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Sanction Fixed Loan</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import EMI Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => showToast('Fixed loan portfolio exported as Excel.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Fixed Advance Balance
            </span>
            <span className="text-2xl font-extrabold text-indigo-900 font-mono mt-1 block">
              ₹ {portfolioStats.totalOutstanding.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Outstanding across {portfolioStats.activeLoansCount} active loans
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Principal Sanctioned
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
              ₹ {portfolioStats.totalPrincipal.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              0% Interest staff welfare assistance
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Recovered to Date
            </span>
            <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
              ₹ {portfolioStats.totalRecovered.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-emerald-600 mt-1">
              {portfolioStats.recoveryPercentage}% recovered via payroll EMIs
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              October Monthly EMI Target
            </span>
            <span className="text-2xl font-extrabold text-violet-900 font-mono mt-1 block">
              ₹ {portfolioStats.totalMonthlyEmi.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Deducted in October salary cycle
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by worker name, loan ID, purpose, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Dept:</span>
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Loan Statuses</option>
              <option value="Active">Active In Repayment</option>
              <option value="Closing Soon">Closing Soon (&le;3 EMIs)</option>
            </select>
          </div>
        </div>

        {/* FIXED ADVANCE LOANS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Fixed Advance & Staff Loan Master Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Principal sanctioned &bull; Fixed monthly EMI deduction schedule &bull; Real-time remaining balance tracker
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {filteredLoans.length} Loans Active &bull; Click row to inspect complete repayment ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Worker Profile</th>
                  <th className="py-3 px-3">Loan Account</th>
                  <th className="py-3 px-3 text-right">Principal Sanctioned</th>
                  <th className="py-3 px-3 text-right">Monthly Fixed EMI</th>
                  <th className="py-3 px-3 text-center">Progress / Tenure</th>
                  <th className="py-3 px-3 text-right">Recovered to Date</th>
                  <th className="py-3 px-3 text-right">Remaining Balance</th>
                  <th className="py-3 px-3 text-center">October Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLoans.map((loan) => {
                  const recovered = loan.repayments.reduce((s, r) => s + r.emiAmount, 0);
                  const balance = Math.max(0, loan.principalAmount - recovered);
                  const progressPct = Math.min(100, Math.round((recovered / loan.principalAmount) * 100));

                  return (
                    <tr
                      key={loan.loanId}
                      onClick={() => setSelectedLoanForModal(loan)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={loan.photo}
                            alt={loan.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{loan.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loan.workerId} &bull; {loan.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-indigo-900 font-bold">{loan.loanId}</div>
                        <div className="text-[10px] text-slate-400">{loan.sanctionDate}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹ {loan.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                        ₹ {loan.monthlyEmi.toLocaleString('en-IN')} / mo
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="w-28 mx-auto">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>{loan.monthsPaid}/{loan.totalTenureMonths} EMIs</span>
                            <span className="font-bold">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        ₹ {recovered.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-950 text-sm">
                        ₹ {balance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 whitespace-nowrap">
                          ₹{loan.monthlyEmi} Deducted
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoanForModal(loan);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Ledger</span>
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
      {/* MODAL: FULL LOAN LEDGER & EMI MONTH-BY-MONTH REPAYMENT HISTORY */}
      {/* ============================================================== */}
      {selectedLoanForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedLoanForModal.photo}
                  alt={selectedLoanForModal.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {selectedLoanForModal.name}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      Loan Ref: {selectedLoanForModal.loanId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>Worker ID: <strong className="text-white font-mono">{selectedLoanForModal.workerId}</strong></span>
                    <span>&bull;</span>
                    <span>Dept: {selectedLoanForModal.department}</span>
                    <span>&bull;</span>
                    <span>Guarantor: {selectedLoanForModal.guarantor}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sanction Purpose: <em>{selectedLoanForModal.purpose}</em>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoanForModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick summary cards inside modal */}
            {(() => {
              const rec = selectedLoanForModal.repayments.reduce((s, r) => s + r.emiAmount, 0);
              const bal = Math.max(0, selectedLoanForModal.principalAmount - rec);
              const progress = Math.round((rec / selectedLoanForModal.principalAmount) * 100);

              return (
                <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sanctioned Principal</span>
                    <span className="text-lg font-mono font-extrabold text-slate-900">
                      ₹ {selectedLoanForModal.principalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fixed Monthly EMI</span>
                    <span className="text-lg font-mono font-extrabold text-indigo-800">
                      ₹ {selectedLoanForModal.monthlyEmi.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recovered</span>
                    <span className="text-lg font-mono font-extrabold text-emerald-800">
                      ₹ {rec.toLocaleString('en-IN')} ({progress}%)
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Balance</span>
                    <span className="text-lg font-mono font-extrabold text-rose-800">
                      ₹ {bal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Month-by-month repayment ledger */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Month-by-Month Salary Deduction Schedule & Ledger
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Inst #</th>
                    <th className="py-2.5 px-3">Billing Month</th>
                    <th className="py-2.5 px-3">Salary Cycle Ref</th>
                    <th className="py-2.5 px-3">Voucher Ref</th>
                    <th className="py-2.5 px-3 text-right">EMI Deducted</th>
                    <th className="py-2.5 px-3 text-right">Balance Remaining</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedLoanForModal.repayments.map((rep) => (
                    <tr key={rep.monthIndex} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">#{rep.monthIndex}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{rep.monthName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{rep.salaryCycle}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{rep.voucher}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-900">
                        ₹ {rep.emiAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        ₹ {rep.balanceAfter.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {rep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Fixed advance EMIs are non-interest employee welfare advances automatically deducted from monthly net salary.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Loan Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLoanForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SANCTION NEW FIXED ADVANCE LOAN */}
      {/* ============================================================== */}
      {isSanctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-indigo-50 border-b border-indigo-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sanction Fixed Advance Loan</h3>
                  <p className="text-xs text-slate-600">Issue lump-sum staff loan with fixed monthly EMI deduction</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSanctionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSanctionLoan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Worker Name *
                </label>
                {registeredWorkers.length > 0 ? (
                  <select
                    value={sanctionForm.workerId}
                    onChange={(e) => {
                      const sel = registeredWorkers.find((w) => w.workerId === e.target.value);
                      if (sel) {
                        setSanctionForm({
                          ...sanctionForm,
                          workerId: sel.workerId,
                          workerName: sel.name,
                          department: sel.department || 'Production',
                          bankAccount: sel.bankAccount || '',
                          ifsc: sel.ifscCode || '',
                        });
                      }
                    }}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {registeredWorkers.map((w) => (
                      <option key={w.workerId} value={w.workerId}>
                        {w.name} ({w.workerId}) &bull; {w.department}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={sanctionForm.workerName}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, workerName: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter worker full name"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={sanctionForm.department}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, department: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Quality">Quality</option>
                    <option value="Tool Room">Tool Room</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Production Floor">Production Floor</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sanction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sanctionForm.sanctionDate}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sanctioned Principal (₹) *
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    required
                    value={sanctionForm.principalAmount}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, principalAmount: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly EMI (₹) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={sanctionForm.monthlyEmi}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, monthlyEmi: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Auto-Calculated Loan Tenure:</span>
                <span className="font-mono font-extrabold text-indigo-900">
                  {Math.ceil(sanctionForm.principalAmount / sanctionForm.monthlyEmi)} Months (EMIs)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose / Need *
                </label>
                <input
                  type="text"
                  required
                  value={sanctionForm.purpose}
                  onChange={(e) => setSanctionForm({ ...sanctionForm, purpose: e.target.value })}
                  placeholder="e.g. Home renovation, marriage, medical..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guarantor / Approver *
                </label>
                <input
                  type="text"
                  required
                  value={sanctionForm.guarantor}
                  onChange={(e) => setSanctionForm({ ...sanctionForm, guarantor: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 text-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSanctionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sanction Loan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT FIXED ADVANCE EMI SCHEDULE (EXCEL / CSV) */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-indigo-50 border-b border-indigo-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Fixed Advance EMI Schedule</h3>
                  <p className="text-xs text-slate-600">Reconcile monthly fixed loan deduction schedule</p>
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

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Fixed Advance EMI Excel or CSV File
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Matches Loan ID with payroll deduction registers
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Supported Schema Columns:</span>
                <p className="font-mono text-[10px] text-slate-700">
                  Loan_ID | Worker_ID | Month_Year | EMI_Amount | Balance_Remaining | Status
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Updates each worker's loan balance and synchronizes with payroll auto-debit.
                </p>
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
                  type="button"
                  onClick={handleSimulateImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
