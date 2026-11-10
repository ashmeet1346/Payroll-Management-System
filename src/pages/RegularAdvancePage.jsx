import React, { useState, useMemo, useEffect } from 'react';
import { DataStoreService, WorkerService } from '../services/api';
import PaymentForumModal from '../components/PaymentForumModal';
import { validateAdvance, validateDate } from '../utils/validation';
import {
  HandCoins,
  Banknote,
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
  Trash2
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

// Initial running monthly advances (empty, ready for user testing)
const INITIAL_ADVANCE_RECORDS = [];

export default function RegularAdvancePage({ onBackToAdvanceCards, onSwitchToFixedAdvance }) {
  const [workers, setWorkers] = useState(INITIAL_ADVANCE_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedWorkerForModal, setSelectedWorkerForModal] = useState(null);
  const [issueAdvanceWorker, setIssueAdvanceWorker] = useState(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [issueErrors, setIssueErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Advance Form State
  const [issueForm, setIssueForm] = useState({
    workerId: '',
    date: '2026-10-15',
    amount: 1000,
    mode: 'Cash',
    purpose: 'Medical / Emergency',
    approvedBy: 'Sukhwinder (Plant Head)',
    deductInCurrentSalary: true
  });

  // Load advances from datastore and sync with registered workers
  const loadAdvances = async () => {
    try {
      const [savedRecords, registeredWorkers] = await Promise.all([
        DataStoreService.get('advances_regular', []),
        WorkerService.getAll().catch(() => []),
      ]);

      const recordsMap = new Map();
      if (Array.isArray(savedRecords)) {
        savedRecords.forEach((r) => recordsMap.set(r.workerId, r));
      }

      if (Array.isArray(registeredWorkers)) {
        registeredWorkers.forEach((rw) => {
          const wId = rw.workerId || rw.worker_id || rw.id;
          if (recordsMap.has(wId)) {
            const existing = recordsMap.get(wId);
            recordsMap.set(wId, {
              ...existing,
              name: rw.name || existing.name,
              department: rw.department || existing.department || 'Production',
              designation: rw.designation || existing.designation || 'Worker',
              photo: rw.photo || existing.photo || SAMPLE_AVATARS[0],
            });
          } else {
            recordsMap.set(wId, {
              workerId: wId,
              name: rw.name,
              department: rw.department || 'Production',
              designation: rw.designation || 'Worker',
              photo: rw.photo || SAMPLE_AVATARS[0],
              transactions: [],
            });
          }
        });
      }

      const merged = Array.from(recordsMap.values());
      setWorkers(merged);
      if (merged.length > 0) {
        setIssueForm((prev) => ({ ...prev, workerId: merged[0].workerId }));
      }
    } catch (err) {
      console.warn('Failed to load advances in RegularAdvancePage:', err);
    }
  };

  useEffect(() => {
    loadAdvances();

    const handleSync = () => {
      loadAdvances();
    };

    window.addEventListener('paysphere-payment-completed', handleSync);
    window.addEventListener('paysphere-advance-updated', handleSync);

    return () => {
      window.removeEventListener('paysphere-payment-completed', handleSync);
      window.removeEventListener('paysphere-advance-updated', handleSync);
    };
  }, []);

  // Delete an individual advance transaction with live cross-module update
  const handleDeleteTransaction = async (workerId, txId) => {
    if (!window.confirm('Are you sure you want to delete this advance transaction?')) return;

    const updated = workers.map((w) => {
      if (w.workerId === workerId) {
        return {
          ...w,
          transactions: (w.transactions || []).filter((t) => t.id !== txId),
        };
      }
      return w;
    });

    try {
      setWorkers(updated);
      await DataStoreService.save('advances_regular', updated);

      if (selectedWorkerForModal && selectedWorkerForModal.workerId === workerId) {
        setSelectedWorkerForModal({
          ...selectedWorkerForModal,
          transactions: (selectedWorkerForModal.transactions || []).filter((t) => t.id !== txId),
        });
      }

      // Dispatch cross-module sync events so Dashboard, Worker Profile & Payment Entry update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paysphere-advance-updated', { detail: { workerId, txId } }));
      }

      showToast('Advance transaction deleted successfully.');
    } catch (err) {
      console.warn('Failed to delete advance transaction:', err);
      showToast('Error deleting transaction.');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Compute Overall Advance Statistics
  const stats = useMemo(() => {
    let totalDisbursed = 0;
    let totalDeducted = 0;
    let totalPending = 0;
    let totalTxCount = 0;

    workers.forEach((w) => {
      w.transactions.forEach((tx) => {
        totalDisbursed += tx.amount;
        totalTxCount += 1;
        if (tx.status === 'Deducted in Salary') {
          totalDeducted += tx.amount;
        } else {
          totalPending += tx.amount;
        }
      });
    });

    return {
      totalDisbursed,
      totalDeducted,
      totalPending,
      totalTxCount,
      recipientCount: workers.filter((w) => w.transactions.length > 0).length
    };
  }, [workers]);

  // Departments List
  const departments = useMemo(() => {
    const deps = new Set(workers.map((w) => w.department));
    return ['All', ...Array.from(deps)];
  }, [workers]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.transactions.some(tx => tx.voucher.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept = departmentFilter === 'All' || w.department === departmentFilter;

      const hasDeducted = w.transactions.some(tx => tx.status === 'Deducted in Salary');
      const hasPending = w.transactions.some(tx => tx.status === 'Pending Deduction');

      let matchStatus = true;
      if (statusFilter === 'Deducted in Salary') matchStatus = hasDeducted;
      if (statusFilter === 'Pending Deduction') matchStatus = hasPending;

      return matchSearch && matchDept && matchStatus;
    });
  }, [workers, searchQuery, departmentFilter, statusFilter]);

  // Handle Issue Advance Submission
  const handleIssueAdvance = async (e) => {
    e.preventDefault();
    const errors = {};
    const targetWorker = workers.find((w) => w.workerId === issueForm.workerId);
    if (!targetWorker) {
      errors.workerId = 'Please select a worker.';
    }

    const amtErr = validateAdvance(issueForm.amount, 50000);
    if (amtErr) errors.amount = amtErr;

    const dateErr = validateDate(issueForm.date, 'Advance Date', false);
    if (dateErr) errors.date = dateErr;

    if (Object.keys(errors).length > 0) {
      setIssueErrors(errors);
      showToast(`Validation error: ${Object.values(errors)[0]}`);
      return;
    }

    setIsSubmitting(true);
    const newTx = {
      id: `ADV-2026-${Date.now().toString().slice(-4)}`,
      date: issueForm.date,
      amount: Number(issueForm.amount),
      mode: issueForm.mode,
      voucher: `VCH-${Math.floor(10000 + Math.random() * 90000)}`,
      purpose: issueForm.purpose,
      approvedBy: issueForm.approvedBy,
      status: issueForm.deductInCurrentSalary ? 'Deducted in Salary' : 'Pending Deduction'
    };

    const updated = workers.map((w) => {
      if (w.workerId === issueForm.workerId) {
        return {
          ...w,
          transactions: [newTx, ...w.transactions]
        };
      }
      return w;
    });

    try {
      setWorkers(updated);
      await DataStoreService.save('advances_regular', updated);
      setIsIssueModalOpen(false);
      setIssueErrors({});
      showToast(`₹${issueForm.amount.toLocaleString('en-IN')} advance issued to ${targetWorker.name} (${targetWorker.workerId})`);
    } catch (err) {
      console.warn('Failed to save advances to datastore:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Bulk Import
  const handleSimulateImport = () => {
    setIsImportModalOpen(false);
    showToast('Monthly advance register successfully imported from Payroll Cashier sheet!');
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
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center font-bold">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Monthly Running Advance
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-200">
                    October 2026
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Mid-month cash advances &bull; 100% recovered and deducted in current month salary
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToFixedAdvance && (
              <button
                type="button"
                onClick={onSwitchToFixedAdvance}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              >
                <span>Switch to Fixed Advance (EMI)</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Give Advance</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print List</span>
            </button>

            <button
              type="button"
              onClick={() => showToast('Advance register exported as Excel.')}
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
              This Month Advance
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
              ₹ {stats.totalDisbursed.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Disbursed across {stats.totalTxCount} cash vouchers
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Deducted in Salary
            </span>
            <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
              ₹ {stats.totalDeducted.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-emerald-600 mt-1">
              Deducted from October payroll
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Salary Deduction
            </span>
            <span className="text-2xl font-extrabold text-amber-800 font-mono mt-1 block">
              ₹ {stats.totalPending.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-amber-600 mt-1">
              Late mid-month entries pending adjustment
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Advance Recipients
            </span>
            <span className="text-2xl font-extrabold text-sky-900 font-mono mt-1 block">
              {stats.recipientCount} <span className="text-xs font-semibold text-slate-400">Workers</span>
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Availed short-term mid-month advance
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by worker name, ID, or voucher code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="All">All Deduction Statuses</option>
              <option value="Deducted in Salary">Deducted in Salary</option>
              <option value="Pending Deduction">Pending Deduction</option>
            </select>
          </div>
        </div>

        {/* WORKERS ADVANCE REGISTER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Monthly Worker Advance Register (October 2026)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every advance taken during the month is tracked with payment mode, approval, and payroll deduction status
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredWorkers.length} workers &bull; Click row to inspect whole month
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Worker Profile</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Advances Taken</th>
                  <th className="py-3 px-3">Recent Voucher / Date</th>
                  <th className="py-3 px-3">Purpose / Note</th>
                  <th className="py-3 px-3 text-right">Total Advance</th>
                  <th className="py-3 px-3 text-center">Deduction Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.map((w) => {
                  const totalWorkerAdvance = w.transactions.reduce((sum, t) => sum + t.amount, 0);
                  const latestTx = w.transactions[0] || {};
                  const allDeducted = w.transactions.every(t => t.status === 'Deducted in Salary');

                  return (
                    <tr
                      key={w.workerId}
                      onClick={() => setSelectedWorkerForModal(w)}
                      className="hover:bg-sky-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={w.photo}
                            alt={w.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{w.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{w.workerId} &bull; {w.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{w.department}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          {w.transactions.length} record{w.transactions.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 font-medium">{latestTx.voucher || '-'}</div>
                        <div className="text-[10px] text-slate-400">{latestTx.date || '-'} ({latestTx.mode || '-'})</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {latestTx.purpose || 'General Advance'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-sky-900 text-sm">
                        ₹ {totalWorkerAdvance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          allDeducted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {allDeducted ? 'Deducted in Salary' : 'Pending Deduction'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIssueAdvanceWorker(w);
                              setIsIssueModalOpen(true);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 border border-emerald-200"
                            title={`Give Advance / Settle to ${w.name}`}
                          >
                            <Banknote className="w-3 h-3" />
                            <span>Pay</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkerForModal(w);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-600 text-slate-700 hover:text-white transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Month</span>
                          </button>
                        </div>
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
      {/* MODAL: WORKER WHOLE MONTH ADVANCE DETAILS & VOUCHER BREAKDOWN */}
      {/* ============================================================== */}
      {selectedWorkerForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedWorkerForModal.photo}
                  alt={selectedWorkerForModal.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {selectedWorkerForModal.name}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      {selectedWorkerForModal.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>ID: <strong className="text-white font-mono">{selectedWorkerForModal.workerId}</strong></span>
                    <span>&bull;</span>
                    <span>Role: {selectedWorkerForModal.designation}</span>
                    <span>&bull;</span>
                    <span>A/C: {selectedWorkerForModal.bankAccount} ({selectedWorkerForModal.ifsc})</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkerForModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick summary cards inside modal */}
            <div className="p-5 bg-sky-50/50 border-b border-sky-100 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Month Advance</span>
                <span className="text-lg font-mono font-extrabold text-sky-950">
                  ₹ {selectedWorkerForModal.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Salary Deducted</span>
                <span className="text-lg font-mono font-extrabold text-emerald-800">
                  ₹ {selectedWorkerForModal.transactions.filter(t => t.status === 'Deducted in Salary').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Pending</span>
                <span className="text-lg font-mono font-extrabold text-amber-800">
                  ₹ {selectedWorkerForModal.transactions.filter(t => t.status !== 'Deducted in Salary').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Transactions table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                October 2026 Advance Disbursement Vouchers
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">Purpose</th>
                    <th className="py-2.5 px-3">Approver</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedWorkerForModal.transactions && selectedWorkerForModal.transactions.length > 0 ? (
                    selectedWorkerForModal.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium">{tx.date}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">{tx.voucher}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{tx.mode}</td>
                        <td className="py-2.5 px-3 text-slate-800">{tx.purpose}</td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">{tx.approvedBy}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                          ₹ {Number(tx.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            tx.status === 'Deducted in Salary'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(selectedWorkerForModal.workerId, tx.id)}
                            className="p-1 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                            title="Delete this advance transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No advance transactions recorded for this worker.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                All advances are settled against gross wages in the final monthly payroll disbursement.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Vouchers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkerForModal(null)}
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
      {/* MODAL: UNIFIED PAYMENT FORUM (ADVANCE DISBURSAL) */}
      {/* ============================================================== */}
      {isIssueModalOpen && (
        <PaymentForumModal
          isOpen={isIssueModalOpen}
          onClose={() => {
            setIsIssueModalOpen(false);
            setIssueAdvanceWorker(null);
          }}
          initialCategory="Advance"
          initialWorkerId={issueAdvanceWorker?.workerId || ''}
          initialWorkerName={issueAdvanceWorker?.name || ''}
          title={issueAdvanceWorker ? `Issue Advance - ${issueAdvanceWorker.name}` : 'Disburse Salary Advance'}
          onSuccess={() => {
            setIsIssueModalOpen(false);
            setIssueAdvanceWorker(null);
            // Refresh advances register
            DataStoreService.get('advances_regular', []).then((saved) => {
              if (Array.isArray(saved) && saved.length > 0) {
                setWorkers(saved);
              }
            });
            setToastMessage('Advance successfully disbursed and registered!');
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT MONTHLY ADVANCE REGISTER (EXCEL / CSV) */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-sky-50 border-b border-sky-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Advance Register</h3>
                  <p className="text-xs text-slate-600">Bulk upload mid-month advance disbursement register</p>
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
              <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-sky-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Cashier Advance Excel or CSV File
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Matches Worker ID with disbursement amounts & vouchers
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Supported Schema Columns:</span>
                <p className="font-mono text-[10px] text-slate-700">
                  Worker_ID | Date | Amount | Payment_Mode | Voucher_ID | Purpose | Deduct_Flag
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  All imported amounts are mapped directly into each worker's month-end salary deduction ledger.
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
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
