import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building,
  Calendar,
  User,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Banknote,
  ReceiptText,
  ShieldCheck,
  Phone,
  HardHat,
  Tag,
  FileText
} from 'lucide-react';
import { WorkerService, DepartmentService, ContractorService, PaymentService, DataStoreService } from '../services/api';

// Disbursal Accounts (Only ICICI 1, ICICI 2, and Cash given by manager - no balance shown)
export const PAYMENT_ACCOUNTS = [
  { id: '1', account_name: 'ICICI 1', account_type: 'Bank', bank_name: 'ICICI Bank' },
  { id: '2', account_name: 'ICICI 2', account_type: 'Bank', bank_name: 'ICICI Bank' },
  { id: '3', account_name: 'Cash given by manager', account_type: 'Cash', bank_name: 'Manager Cash Desk' }
];

export default function PaymentForumModal({
  isOpen = true,
  isInline = false,
  onClose,
  onSuccess,
  initialWorkerId = '',
  initialWorkerName = '',
  initialCategory = 'Salary',
  initialAmount = '',
  initialContractor = null,
  title = 'Make Payment'
}) {
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Form Fields
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workerSearch, setWorkerSearch] = useState(initialWorkerId || initialWorkerName || '');
  const [selectedWorkerId, setSelectedWorkerId] = useState(initialWorkerId || '');
  const [selectedContractorId, setSelectedContractorId] = useState(initialContractor?.id || '');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [paymentCategory, setPaymentCategory] = useState(initialCategory || 'Salary');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('1');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  // Load live workers, departments & contractors
  useEffect(() => {
    let isMounted = true;
    const fetchEntities = async () => {
      setLoadingWorkers(true);
      try {
        const [fetchedWorkers, fetchedDepts, fetchedContractors] = await Promise.all([
          WorkerService.getAll().catch(() => []),
          DepartmentService.getAll().catch(() => []),
          ContractorService.getAll().catch(() => [])
        ]);

        if (!isMounted) return;

        // Department lookup map
        const deptsMap = new Map();
        if (Array.isArray(fetchedDepts)) {
          fetchedDepts.forEach((d) => {
            if (d.id !== undefined && d.id !== null) deptsMap.set(String(d.id), d.name);
            if (d.pk !== undefined && d.pk !== null) deptsMap.set(String(d.pk), d.name);
          });
        }

        const normalizedWorkers = [];
        if (Array.isArray(fetchedWorkers)) {
          fetchedWorkers.forEach((w) => {
            const wId = w.worker_id || w.workerId || (w.id ? `W${String(w.id).padStart(3, '0')}` : '');
            if (wId) {
              let deptName = 'General';
              if (typeof w.department === 'string' && w.department.trim()) {
                deptName = w.department.trim();
              } else if (w.department?.name) {
                deptName = w.department.name;
              } else if (w.department_name) {
                deptName = w.department_name;
              } else if (w.department && deptsMap.has(String(w.department))) {
                deptName = deptsMap.get(String(w.department));
              }

              normalizedWorkers.push({
                id: w.id || wId,
                worker_id: wId,
                workerId: wId,
                name: w.name || 'Worker',
                department: deptName,
                designation: w.designation || 'Worker',
                workArea: w.workArea || w.work_area || '',
                base_wage: Number(w.base_wage || w.baseWage || w.policy_rate || w.policyRate || 0),
                bank_account: w.bank_account || w.bankAccount || '',
                ifsc_code: w.ifsc_code || w.ifscCode || '',
                phone: w.phone || '',
                photo: w.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                status: w.status || 'Active'
              });
            }
          });
        }
        setWorkers(normalizedWorkers);

        if (Array.isArray(fetchedContractors)) {
          setContractors(fetchedContractors);
        }

        // Auto-select initial worker if given
        if (initialWorkerId) {
          const match = normalizedWorkers.find(
            (w) => w.worker_id.toLowerCase() === initialWorkerId.toLowerCase()
          );
          if (match) {
            setSelectedWorkerId(match.worker_id);
            setWorkerSearch(`${match.name} (${match.worker_id})`);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch entities in PaymentForumModal:', err);
      } finally {
        if (isMounted) setLoadingWorkers(false);
      }
    };

    fetchEntities();
    return () => {
      isMounted = false;
    };
  }, [initialWorkerId]);

  // Handle Contractor initial selection
  useEffect(() => {
    if (initialContractor) {
      setPaymentCategory('Contractor Bill');
      setSelectedContractorId(initialContractor.id || '');
      setWorkerSearch(initialContractor.name || '');
      if (initialContractor.pendingPayment && !initialAmount) {
        setAmount(String(initialContractor.pendingPayment));
      }
    }
  }, [initialContractor, initialAmount]);

  // Currently matched worker or contractor details
  const matchedWorker = useMemo(() => {
    if (paymentCategory === 'Contractor Bill') return null;
    if (selectedWorkerId) {
      return workers.find((w) => w.worker_id === selectedWorkerId) || null;
    }
    return null;
  }, [workers, selectedWorkerId, paymentCategory]);

  const matchedContractor = useMemo(() => {
    if (paymentCategory !== 'Contractor Bill') return null;
    if (selectedContractorId) {
      return contractors.find((c) => String(c.id) === String(selectedContractorId)) || null;
    }
    return null;
  }, [contractors, selectedContractorId, paymentCategory]);

  // Filtered workers list for autocomplete / selector (requires clicking to select) - STRICT Name or Code only
  const searchResults = useMemo(() => {
    if (paymentCategory === 'Contractor Bill' || selectedWorkerId) return [];
    const query = workerSearch.trim().toLowerCase();
    if (!query) return [];
    return workers
      .filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.worker_id.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [workers, workerSearch, selectedWorkerId, paymentCategory]);

  // Filtered contractors for autocomplete
  const contractorResults = useMemo(() => {
    if (paymentCategory !== 'Contractor Bill') return [];
    const query = workerSearch.trim().toLowerCase();
    if (!query || matchedContractor) return [];
    return contractors
      .filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.agencyName && c.agencyName.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [contractors, workerSearch, matchedContractor, paymentCategory]);

  // Mode & Account Syncing
  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode === 'Cash') {
      setSelectedAccountId('3'); // Cash given by manager
    } else if (selectedAccountId === '3') {
      setSelectedAccountId('1'); // ICICI 1
    }
  };

  const handleAccountChange = (accId) => {
    setSelectedAccountId(accId);
    if (accId === '3') {
      setPaymentMode('Cash');
    } else if (paymentMode === 'Cash') {
      setPaymentMode('Bank Transfer');
    }
  };

  const handleSelectWorker = (worker) => {
    setSelectedWorkerId(worker.worker_id);
    setWorkerSearch(`${worker.name} (${worker.worker_id})`);
  };

  const handleSelectContractor = (contractor) => {
    setSelectedContractorId(contractor.id);
    setWorkerSearch(contractor.name || contractor.agencyName);
    if (contractor.pendingPayment && !amount) {
      setAmount(String(contractor.pendingPayment));
    }
  };

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 5000);
  };

  // Submit payment & update all linked modules atomically
  const handleSubmit = async (e) => {
    e.preventDefault();

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      showToast('error', 'Please enter a valid disbursal amount greater than ₹0.');
      return;
    }

    if (paymentCategory === 'Contractor Bill') {
      if (!matchedContractor) {
        showToast('error', 'Please select a valid contractor agency.');
        return;
      }
    } else {
      if (!matchedWorker) {
        showToast('error', 'Please select a valid worker registered in the system.');
        return;
      }
    }

    const selectedAcc =
      PAYMENT_ACCOUNTS.find((a) => a.id.toString() === selectedAccountId.toString()) ||
      PAYMENT_ACCOUNTS[0];

    setIsSubmitting(true);
    try {
      const voucherNum = `PAY-${paymentDate.replace(/-/g, '').slice(0, 6)}-${String(
        Date.now()
      ).slice(-4)}`;

      const payeeName =
        paymentCategory === 'Contractor Bill'
          ? matchedContractor.name || matchedContractor.agencyName
          : matchedWorker.name;

      const payeeId =
        paymentCategory === 'Contractor Bill'
          ? String(matchedContractor.id)
          : matchedWorker.worker_id;

      const payeeDept =
        paymentCategory === 'Contractor Bill'
          ? 'Contract Labour'
          : matchedWorker.department || 'General';

      // 1. Build Standard Payment Voucher
      const voucher = {
        id: `vch_${Date.now()}`,
        voucher_number: voucherNum,
        payment_date: paymentDate,
        payment_type: paymentCategory,
        worker_id: payeeId,
        worker_id_code: payeeId,
        worker_name: payeeName,
        worker_department: payeeDept,
        worker_bank_account:
          paymentCategory === 'Contractor Bill'
            ? matchedContractor.bankAccount || ''
            : matchedWorker.bank_account || '',
        amount_paid: amtNum,
        total_payable: amtNum,
        previously_paid: 0,
        outstanding_after: 0,
        payment_mode: paymentMode,
        bank_account_name: selectedAcc.account_name,
        bank_account_id: selectedAcc.id,
        transaction_reference: reference || `REF-${voucherNum}`,
        narration: remarks || `${paymentCategory} payment disbursal for ${payeeName}`,
        status: 'Completed',
        created_at: new Date().toISOString()
      };

      // 2. Fetch linked datastores for consistent updates
      const [currentVouchers, currentRegAdvances, currentFixLoans, currentContractors] =
        await Promise.all([
          DataStoreService.get('payment_vouchers', []),
          DataStoreService.get('advances_regular', []),
          DataStoreService.get('advances_fixed', []),
          DataStoreService.get('contractors', [])
        ]);

      // 3A. Update Advances Register if category is Advance
      if (paymentCategory === 'Advance' && matchedWorker) {
        const regList = Array.isArray(currentRegAdvances) ? [...currentRegAdvances] : [];
        const wIdx = regList.findIndex((w) => w.workerId === matchedWorker.worker_id);
        const newTx = {
          id: `ADV-${paymentDate.slice(0, 4)}-${String(Date.now()).slice(-4)}`,
          date: paymentDate,
          amount: amtNum,
          mode: paymentMode,
          voucher: voucherNum,
          purpose: remarks || 'Salary Advance',
          approvedBy: 'Admin / Manager',
          status: 'Pending Deduction'
        };

        if (wIdx >= 0) {
          regList[wIdx] = {
            ...regList[wIdx],
            transactions: [newTx, ...(regList[wIdx].transactions || [])]
          };
        } else {
          regList.push({
            workerId: matchedWorker.worker_id,
            name: matchedWorker.name,
            department: matchedWorker.department || 'General',
            designation: matchedWorker.designation || 'Worker',
            photo: matchedWorker.photo,
            transactions: [newTx]
          });
        }
        await DataStoreService.save('advances_regular', regList);
      }

      // 3B. Update Fixed Advance / Loan EMI if category is Loan
      if (paymentCategory === 'Loan' && matchedWorker) {
        const fixList = Array.isArray(currentFixLoans) ? [...currentFixLoans] : [];
        const lIdx = fixList.findIndex(
          (l) => l.workerId === matchedWorker.worker_id && (l.status || '').includes('Active')
        );
        if (lIdx >= 0) {
          const loan = fixList[lIdx];
          const prevRecovered = (loan.repayments || []).reduce(
            (s, r) => s + Number(r.emiAmount || 0),
            0
          );
          const remainingBalance = Math.max(0, loan.principalAmount - (prevRecovered + amtNum));

          const repaymentRecord = {
            installmentNo: (loan.repayments || []).length + 1,
            date: paymentDate,
            emiAmount: amtNum,
            balanceAfter: remainingBalance,
            status: 'Deducted from Salary',
            paymentMode,
            voucherNo: voucherNum
          };

          fixList[lIdx] = {
            ...loan,
            status: remainingBalance <= 0 ? 'Closed / Fully Recovered' : 'Active (In Repayment)',
            repayments: [repaymentRecord, ...(loan.repayments || [])]
          };
          await DataStoreService.save('advances_fixed', fixList);
        }
      }

      // 3C. Update Contractor Billing & Settlement if category is Contractor Bill
      if (paymentCategory === 'Contractor Bill' && matchedContractor) {
        const cList = Array.isArray(currentContractors) ? [...currentContractors] : [];
        const cIdx = cList.findIndex((c) => String(c.id) === String(matchedContractor.id));
        if (cIdx >= 0) {
          const cont = cList[cIdx];
          const updatedPending = Math.max(0, (cont.pendingPayment || 0) - amtNum);
          const updatedPaid = (cont.totalPaidYTD || 0) + amtNum;

          // Update invoices if applicable
          const updatedInvoices = (cont.invoices || []).map((inv) => {
            if (inv.pendingAmount > 0) {
              const payHere = Math.min(amtNum, inv.pendingAmount);
              return {
                ...inv,
                paidAmount: (inv.paidAmount || 0) + payHere,
                pendingAmount: Math.max(0, inv.pendingAmount - payHere),
                status: inv.pendingAmount - payHere === 0 ? 'Fully Settled' : 'Partially Paid'
              };
            }
            return inv;
          });

          cList[cIdx] = {
            ...cont,
            pendingPayment: updatedPending,
            totalPaidYTD: updatedPaid,
            invoices: updatedInvoices
          };
          await DataStoreService.save('contractors', cList);
        }
      }

      // 4. Update Vouchers Register
      const updatedVouchers = [
        voucher,
        ...(Array.isArray(currentVouchers) ? currentVouchers : [])
      ];
      await DataStoreService.save('payment_vouchers', updatedVouchers);

      // 5. Backend Django API Sync (non-blocking)
      try {
        PaymentService.createPaymentVoucher(voucher).catch(() => {});
      } catch (err) {}

      // 6. Broadcast event across modules
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paysphere-payment-completed', { detail: voucher }));
        window.dispatchEvent(new CustomEvent('paysphere-advance-updated', { detail: voucher }));
      }

      showToast(
        'success',
        `Payment of ₹${amtNum.toLocaleString('en-IN')} via ${selectedAcc.account_name} disbursed successfully for ${payeeName}!`
      );

      // Reset form
      setAmount('');
      setReference('');
      setRemarks('');
      if (!initialWorkerId && !initialContractor) {
        setWorkerSearch('');
        setSelectedWorkerId('');
        setSelectedContractorId('');
      }

      if (onSuccess) {
        onSuccess(voucher);
      }

      if (!isInline && onClose) {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Payment disbursal error in PaymentForumModal:', err);
      showToast('error', err.message || 'Payment processing failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isInline) return null;

  // The Inner Payment Forum Content
  const forumContent = (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Feedback Toast Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-150 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Row 1: Date & Payment Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Payment Date <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Payment Category */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Payment Category <span className="text-rose-500">*</span></span>
          </label>
          <select
            value={paymentCategory}
            onChange={(e) => {
              setPaymentCategory(e.target.value);
              if (e.target.value === 'Contractor Bill' && !matchedContractor && contractors.length > 0) {
                setSelectedContractorId(String(contractors[0].id));
                setWorkerSearch(contractors[0].name || contractors[0].agencyName);
              }
            }}
            className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="Salary">Salary (Wage Disbursal)</option>
            <option value="Advance">Salary Advance (Short-Term Running)</option>
            <option value="Loan">Loan (Fixed Advance / Installment EMI)</option>
            <option value="Contractor Bill">Contractor Bill (Agency Settlement)</option>
          </select>
        </div>
      </div>

      {/* Row 2: Worker or Contractor Search & Fetch */}
      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {paymentCategory === 'Contractor Bill'
                ? 'Select or Search Contractor Agency'
                : 'Worker ID or Worker Name'}{' '}
              <span className="text-rose-500">*</span>
            </span>
          </div>
          {matchedWorker && (
            <button
              type="button"
              onClick={() => {
                setSelectedWorkerId('');
                setWorkerSearch('');
              }}
              className="text-[11px] text-indigo-600 hover:underline font-semibold"
            >
              Change Worker
            </button>
          )}
          {matchedContractor && (
            <button
              type="button"
              onClick={() => {
                setSelectedContractorId('');
                setWorkerSearch('');
              }}
              className="text-[11px] text-indigo-600 hover:underline font-semibold"
            >
              Change Contractor
            </button>
          )}
        </label>

        {paymentCategory === 'Contractor Bill' ? (
          <div>
            <select
              value={selectedContractorId}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedContractorId(cId);
                const match = contractors.find((c) => String(c.id) === String(cId));
                if (match) {
                  setWorkerSearch(match.name || match.agencyName);
                  if (match.pendingPayment && !amount) {
                    setAmount(String(match.pendingPayment));
                  }
                }
              }}
              className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Contractor ({contractors.length} registered) --</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.agencyName} (Pending: ₹{Number(c.pendingPayment || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by worker name or ID/code..."
                value={workerSearch}
                onChange={(e) => {
                  setWorkerSearch(e.target.value);
                  setSelectedWorkerId('');
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs lg:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                  matchedWorker ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Dropdown search autocomplete results (Click on worker to select) */}
            {searchResults.length > 0 && !selectedWorkerId && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Matching Workers ({searchResults.length})</span>
                  <span className="text-indigo-600 font-semibold lowercase">Click on worker to select</span>
                </div>
                {searchResults.map((w) => (
                  <button
                    key={w.worker_id}
                    type="button"
                    onClick={() => handleSelectWorker(w)}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-indigo-50/70 flex items-center justify-between transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={w.photo}
                          alt={w.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=11133c&color=fff`;
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                          <span>{w.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">({w.worker_id})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-indigo-700">Dept: {w.department}</span>
                          <span>&bull;</span>
                          <span>Role: {w.designation}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1 rounded-lg transition shadow-2xs">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORKER DETAILS CARD (Shown immediately once clicked & selected) */}
        {matchedWorker && (
          <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 rounded-2xl border-2 border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={matchedWorker.photo}
                  alt={matchedWorker.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedWorker.name)}&background=11133c&color=fff`;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">{matchedWorker.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold">
                    {matchedWorker.worker_id}
                  </span>
                </div>
                {/* Department and Designation clearly highlighted upon selection */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                    <span>Department:</span>
                    <span className="font-extrabold">{matchedWorker.department}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                    <span>Designation:</span>
                    <span className="font-bold">{matchedWorker.designation}</span>
                  </span>
                  {matchedWorker.workArea && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <span>Area:</span>
                      <span className="font-bold">{matchedWorker.workArea}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs">
              {matchedWorker.phone && (
                <div className="flex items-center gap-1 text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{matchedWorker.phone}</span>
                </div>
              )}
              {matchedWorker.bank_account && (
                <span className="font-mono text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                  A/C: ••••{matchedWorker.bank_account.slice(-4)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* CONTRACTOR DETAILS CARD */}
        {matchedContractor && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-slate-50 to-amber-50/30 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <HardHat className="w-8 h-8 text-amber-600 p-1.5 bg-amber-100 rounded-xl shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">{matchedContractor.name || matchedContractor.agencyName}</div>
                <div className="text-[11px] text-slate-500">
                  Contact: {matchedContractor.contactPerson || 'Agency Lead'} • {matchedContractor.phone || ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending Bill</div>
              <div className="text-sm font-extrabold text-amber-700 font-mono">
                ₹ {Number(matchedContractor.pendingPayment || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Amount & Payment Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Disbursal Amount (₹) - Manual Entry */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-indigo-600" />
              <span>Disbursal Amount (₹) <span className="text-rose-500">*</span></span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Enter manually</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2 text-xs lg:text-sm font-bold font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Payment Mode <span className="text-rose-500">*</span></span>
          </label>
          <select
            value={paymentMode}
            onChange={(e) => handlePaymentModeChange(e.target.value)}
            className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
            <option value="Cash">Cash (Given by Manager)</option>
            <option value="UPI">UPI (Unified Payments Interface)</option>
            <option value="Cheque">Bank Cheque</option>
          </select>
        </div>
      </div>

      {/* Row 4: Paid From Account & Transaction Ref */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paid From Account - Only ICICI 1, ICICI 2, Cash given by manager (No balance) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>Paid From Account <span className="text-rose-500">*</span></span>
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            required
          >
            {PAYMENT_ACCOUNTS.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Reference / UTR Number (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
            <span>UTR / Ref / Cheque No (Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. UTR-98214 or CHQ-0012"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Row 5: Remarks / Narration */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Remarks / Narration</span>
        </label>
        <input
          type="text"
          placeholder="e.g. November regular wage payment or mid-month settlement..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Form Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? (
            <span>
              Total: <strong className="text-emerald-700 font-mono text-sm">₹ {Number(amount).toLocaleString('en-IN')}</strong>
            </span>
          ) : (
            <span className="text-slate-400">Enter amount above</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isInline && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || (!matchedWorker && !matchedContractor)}
            className="flex items-center gap-2 px-6 py-2.5 text-xs lg:text-sm font-bold text-white bg-[#11133c] hover:bg-indigo-950 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Disburse Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  // If inline, return form directly
  if (isInline) {
    return <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">{forumContent}</div>;
  }

  // Modal Wrapper
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Banknote className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">
                Single payee disbursement • Synced across all modules
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1">{forumContent}</div>
      </div>
    </div>
  );
}
