import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  ReceiptText,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Eye,
  RotateCcw,
  BookOpen,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  Building,
  CreditCard,
  FileText,
  X,
  Upload,
  Check,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Download,
  Trash2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';
import PaymentForumModal from '../components/PaymentForumModal';
import { PaymentService, WorkerService, DepartmentService, DataStoreService } from '../services/api';

// Company Disbursal Accounts (Only ICICI 1, ICICI 2, and Cash given by manager - no balance shown)
export const COMPANY_PAYMENT_ACCOUNTS = [
  { id: '1', account_name: 'ICICI 1', account_type: 'Bank', bank_name: 'ICICI Bank', account_number: 'ICICI-01', is_default: true },
  { id: '2', account_name: 'ICICI 2', account_type: 'Bank', bank_name: 'ICICI Bank', account_number: 'ICICI-02', is_default: false },
  { id: '3', account_name: 'Cash given by manager', account_type: 'Cash', bank_name: 'Manager Cash Desk', account_number: 'CASH-MGR', is_default: false }
];

export default function WorkerPaymentEntryPage({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) {
  const [activeNav, setActiveNav] = useState('Payment Entry');

  // Sidebar navigation items
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Workers', icon: Users },
    { name: 'Department', icon: Building2 },
    { name: 'Attendance', icon: Calendar },
    { name: 'Contractor', icon: HardHat },
    { name: 'Salary', icon: Banknote },
    { name: 'Advance', icon: HandCoins },
    { name: 'Payment Entry', icon: ReceiptText },
    { name: 'Reports', icon: FileBarChart },
    { name: 'Administration Setting', icon: Settings },
  ];

  // Core Data States
  const [workers, setWorkers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState(COMPANY_PAYMENT_ACCOUNTS);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Entry Mode: 'single' (Make Payment Forum) | 'bulk' (Bulk Payment Grid) | 'excel' (Excel Upload)
  const [entryMode, setEntryMode] = useState('single');

  // Common Header Options
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState('Salary'); // 'Salary' | 'Advance' | 'Loan'
  const [paymentMode, setPaymentMode] = useState('Bank Transfer'); // 'Bank Transfer' | 'Cash' | 'UPI' | 'Cheque'
  const [selectedAccountId, setSelectedAccountId] = useState('1');

  // Multi-Worker Entry Rows (Can hold 20+ workers at once)
  const [workerRows, setWorkerRows] = useState([
    { id: 1, workerId: '', amount: '', remarks: '' },
    { id: 2, workerId: '', amount: '', remarks: '' },
    { id: 3, workerId: '', amount: '', remarks: '' },
    { id: 4, workerId: '', amount: '', remarks: '' },
    { id: 5, workerId: '', amount: '', remarks: '' }
  ]);

  // Excel Upload State
  const [excelFile, setExcelFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const fileInputRef = useRef(null);

  // Filters & Table State for Recent Payments
  const [tableSearch, setTableSearch] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState('All');
  const [tableModeFilter, setTableModeFilter] = useState('All');

  // Modals
  const [selectedVoucherForDetails, setSelectedVoucherForDetails] = useState(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState(null);
  const [reversalVoucher, setReversalVoucher] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);

  // Feedback Alert Banner
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Initial Data Loading
  useEffect(() => {
    loadAllData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 6000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedWorkers, fetchedDepts, fetchedVouchers, savedVouchersDS] = await Promise.all([
        WorkerService.getAll().catch(() => []),
        DepartmentService.getAll().catch(() => []),
        PaymentService.getPaymentVouchers().catch(() => []),
        DataStoreService.get('payment_vouchers', [])
      ]);

      // Department Map for resolving IDs or references to actual department names
      const deptsMap = new Map();
      if (Array.isArray(fetchedDepts)) {
        fetchedDepts.forEach(d => {
          if (d.id !== undefined && d.id !== null) deptsMap.set(String(d.id), d.name);
          if (d.pk !== undefined && d.pk !== null) deptsMap.set(String(d.pk), d.name);
        });
      }

      // Live Workers list from Workers & Department modules (Strictly live data, no dummy pre-seeded workers)
      const liveWorkersList = [];
      if (Array.isArray(fetchedWorkers)) {
        fetchedWorkers.forEach(w => {
          const wId = w.worker_id || w.workerId || (w.id ? `W${String(w.id).padStart(3, '0')}` : '');
          if (wId) {
            let deptName = 'General';
            if (typeof w.department === 'string' && w.department.trim()) {
              deptName = w.department.trim();
            } else if (w.department?.name) {
              deptName = w.department.name;
            } else if (w.department_name) {
              deptName = w.department_name;
            } else if (w.department !== undefined && w.department !== null && deptsMap.has(String(w.department))) {
              deptName = deptsMap.get(String(w.department));
            }

            liveWorkersList.push({
              id: w.id || wId,
              worker_id: wId,
              workerId: wId,
              name: w.name || 'Unnamed Worker',
              department: deptName,
              designation: w.designation || 'Worker',
              base_wage: Number(w.base_wage || w.baseWage || w.policy_rate || w.policyRate || 0),
              bank_account: w.bank_account || w.bankAccount || '',
              ifsc_code: w.ifsc_code || w.ifscCode || '',
              phone: w.phone || '',
              status: w.status || 'Active'
            });
          }
        });
      }
      setWorkers(liveWorkersList);

      // Bank & Disbursal accounts: Only ICICI 1, ICICI 2, and Cash given by manager (no balance)
      setBankAccounts(COMPANY_PAYMENT_ACCOUNTS);
      setSelectedAccountId('1');

      // Vouchers: combine backend and datastore
      const voucherMap = new Map();
      if (Array.isArray(savedVouchersDS)) {
        savedVouchersDS.forEach(v => voucherMap.set(v.voucher_number || v.id, v));
      }
      if (Array.isArray(fetchedVouchers)) {
        fetchedVouchers.forEach(v => voucherMap.set(v.voucher_number || v.id, v));
      }
      const combinedVouchers = Array.from(voucherMap.values());
      // Sort newest first
      combinedVouchers.sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0));
      setVouchers(combinedVouchers);
    } catch (err) {
      console.warn('Initial data load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatInr = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // =========================================================================
  // METRICS: THIS MONTH DISBURSED AMOUNT ON SALARY (Hero Focus)
  // =========================================================================
  const salaryMetrics = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    let thisMonthSalaryTotal = 0;
    let thisMonthSalaryCount = 0;
    let thisMonthAdvanceTotal = 0;
    let thisMonthAdvanceCount = 0;
    let thisMonthLoanTotal = 0;
    let thisMonthLoanCount = 0;

    vouchers.forEach(v => {
      if (v.status === 'Cancelled') return;
      const vDate = v.payment_date || '';
      const isThisMonth = vDate.startsWith(currentMonthPrefix);

      const type = (v.payment_type || 'Salary').toLowerCase();
      const amount = Number(v.amount_paid || 0);

      if (isThisMonth) {
        if (type.includes('advance')) {
          thisMonthAdvanceTotal += amount;
          thisMonthAdvanceCount++;
        } else if (type.includes('loan')) {
          thisMonthLoanTotal += amount;
          thisMonthLoanCount++;
        } else {
          // Salary
          thisMonthSalaryTotal += amount;
          thisMonthSalaryCount++;
        }
      }
    });

    const thisMonthAllTotal = thisMonthSalaryTotal + thisMonthAdvanceTotal + thisMonthLoanTotal;

    return {
      monthName,
      thisMonthSalaryTotal,
      thisMonthSalaryCount,
      thisMonthAdvanceTotal,
      thisMonthAdvanceCount,
      thisMonthLoanTotal,
      thisMonthLoanCount,
      thisMonthAllTotal
    };
  }, [vouchers]);

  // =========================================================================
  // OPTION 1: MULTI-WORKER ROWS MANAGEMENT
  // =========================================================================
  // Quick Populate: fills rows with all active workers from Workers module (Amounts blank for manual entry)
  const handlePopulateAllWorkers = () => {
    if (!workers || workers.length === 0) {
      showFeedback('error', 'No workers available. Please add workers in the Workers module or click Refresh Data.');
      return;
    }
    const newRows = workers.map((w, idx) => ({
      id: idx + 1,
      workerId: w.worker_id,
      amount: '', // Amount is not automatically entered; entered manually every time as requested
      remarks: ''
    }));
    setWorkerRows(newRows);
    showFeedback('success', `Populated ${newRows.length} active worker(s). Please enter disbursal amounts manually.`);
  };

  const handleAddRow = () => {
    setWorkerRows(prev => [
      ...prev,
      { id: Date.now() + Math.random(), workerId: '', amount: '', remarks: '' }
    ]);
  };

  const handleAddFiveRows = () => {
    const additional = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      workerId: '',
      amount: '',
      remarks: ''
    }));
    setWorkerRows(prev => [...prev, ...additional]);
  };

  const handleRemoveRow = (rowId) => {
    if (workerRows.length <= 1) {
      setWorkerRows([{ id: 1, workerId: '', amount: '', remarks: '' }]);
      return;
    }
    setWorkerRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleRowChange = (rowId, field, value) => {
    setWorkerRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleClearAllRows = () => {
    setWorkerRows([
      { id: 1, workerId: '', amount: '', remarks: '' },
      { id: 2, workerId: '', amount: '', remarks: '' },
      { id: 3, workerId: '', amount: '', remarks: '' }
    ]);
  };

  // Multi-Worker summary
  const multiWorkerSummary = useMemo(() => {
    let validCount = 0;
    let totalAmt = 0;
    workerRows.forEach(r => {
      const amt = parseFloat(r.amount);
      if (r.workerId && !isNaN(amt) && amt > 0) {
        validCount++;
        totalAmt += amt;
      }
    });

    const selectedAcc = bankAccounts.find(a => a.id.toString() === selectedAccountId.toString()) || bankAccounts[0];

    return {
      validCount,
      totalAmt,
      selectedAcc
    };
  }, [workerRows, bankAccounts, selectedAccountId]);

  // =========================================================================
  // OPTION 2: EXCEL / CSV UPLOAD & TEMPLATE DOWNLOAD
  // =========================================================================
  const handleDownloadTemplate = () => {
    const sampleRows = workers.length > 0
      ? workers.slice(0, 3).map((w, i) => ({
          'Worker ID': w.worker_id,
          'Worker Name': w.name,
          'Payment Type': i === 0 ? 'Salary' : i === 1 ? 'Advance' : 'Salary',
          'Amount': w.base_wage || 25000,
          'Payment Date': paymentDate,
          'Payment Mode': 'Bank Transfer',
          'Reference Number': `REF-${w.worker_id}-01`,
          'Remarks': `${w.department} wage disbursal`
        }))
      : [
          {
            'Worker ID': 'W001',
            'Worker Name': 'Sample Worker',
            'Payment Type': 'Salary',
            'Amount': 25000,
            'Payment Date': paymentDate,
            'Payment Mode': 'Bank Transfer',
            'Reference Number': 'REF-001',
            'Remarks': 'Monthly wage disbursal'
          }
        ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments_Template');
    XLSX.writeFile(workbook, `PaySphere_Payment_Entry_Template_${paymentDate}.xlsx`);
    showFeedback('success', 'Sample Excel template downloaded! Fill worker payments and upload below.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!Array.isArray(rawJson) || rawJson.length === 0) {
          showFeedback('error', 'The uploaded file contains no data rows.');
          setParsedRows([]);
          setIsParsingExcel(false);
          return;
        }

        // Normalize rows and validate against workers
        const processed = rawJson.map((row, index) => {
          // Normalize column names
          const workerIdRaw = (
            row['Worker ID'] || row['worker_id'] || row['WorkerId'] || row['ID'] || row['Worker'] || ''
          ).toString().trim();

          const nameRaw = (
            row['Worker Name'] || row['worker_name'] || row['Name'] || ''
          ).toString().trim();

          const typeRaw = (
            row['Payment Type'] || row['payment_type'] || row['Type'] || row['Category'] || paymentType
          ).toString().trim();

          const amountRaw = parseFloat(
            row['Amount'] || row['amount'] || row['Amount Paid'] || row['Payment Amount'] || 0
          );

          const dateRaw = (
            row['Payment Date'] || row['payment_date'] || row['Date'] || paymentDate
          ).toString().trim();

          const modeRaw = (
            row['Payment Mode'] || row['payment_mode'] || row['Mode'] || paymentMode
          ).toString().trim();

          const refRaw = (
            row['Reference Number'] || row['transaction_reference'] || row['Reference'] || row['Ref'] || ''
          ).toString().trim();

          const remarksRaw = (
            row['Remarks'] || row['remarks'] || row['Narration'] || row['Note'] || ''
          ).toString().trim();

          // Match worker
          const matchedWorker = workers.find(
            w =>
              (workerIdRaw && w.worker_id.toLowerCase() === workerIdRaw.toLowerCase()) ||
              (nameRaw && w.name.toLowerCase() === nameRaw.toLowerCase())
          );

          // Normalize type to standard: Salary, Advance, or Loan
          let normalizedType = 'Salary';
          if (typeRaw.toLowerCase().includes('adv')) normalizedType = 'Advance';
          else if (typeRaw.toLowerCase().includes('loan')) normalizedType = 'Loan';

          const isValidWorker = Boolean(matchedWorker);
          const isValidAmount = !isNaN(amountRaw) && amountRaw > 0;
          const isValid = isValidWorker && isValidAmount;

          let errorMsg = '';
          if (!isValidWorker) errorMsg = `Worker "${workerIdRaw || nameRaw}" not registered.`;
          else if (!isValidAmount) errorMsg = 'Invalid amount.';

          return {
            rowNum: index + 1,
            workerId: matchedWorker ? matchedWorker.worker_id : workerIdRaw,
            workerName: matchedWorker ? matchedWorker.name : nameRaw,
            department: matchedWorker ? matchedWorker.department : 'General',
            paymentType: normalizedType,
            amount: isNaN(amountRaw) ? 0 : amountRaw,
            paymentDate: dateRaw || paymentDate,
            paymentMode: modeRaw || paymentMode,
            reference: refRaw,
            remarks: remarksRaw,
            isValid,
            errorMsg
          };
        });

        setParsedRows(processed);
        showFeedback(
          'success',
          `Parsed ${processed.length} entries from Excel. ${processed.filter(p => p.isValid).length} ready for import.`
        );
      } catch (err) {
        console.error('Excel parse error:', err);
        showFeedback('error', 'Failed to read Excel file. Please use a valid .xlsx, .xls, or .csv file.');
      } finally {
        setIsParsingExcel(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const parsedExcelSummary = useMemo(() => {
    const totalCount = parsedRows.length;
    const validRows = parsedRows.filter(r => r.isValid);
    const validCount = validRows.length;
    const totalAmount = validRows.reduce((sum, r) => sum + r.amount, 0);

    const selectedAcc = bankAccounts.find(a => a.id.toString() === selectedAccountId.toString()) || bankAccounts[0];

    return {
      totalCount,
      validCount,
      invalidCount: totalCount - validCount,
      totalAmount,
      selectedAcc
    };
  }, [parsedRows, bankAccounts, selectedAccountId]);

  // =========================================================================
  // SUBMISSION LOGIC: ATOMIC PAYMENT DISBURSAL & CROSS-MODULE SYNC
  // =========================================================================
  const executePaymentDisbursal = async (paymentList) => {
    if (!paymentList || paymentList.length === 0) {
      showFeedback('error', 'No valid payment entries to process.');
      return;
    }

    const selectedAcc = bankAccounts.find(a => a.id.toString() === selectedAccountId.toString()) || bankAccounts[0];
    const totalDisbursal = paymentList.reduce((sum, p) => sum + p.amount, 0);

    setIsSubmitting(true);
    try {
      // 1. Fetch live datastores for advances, loans, and vouchers
      const [currentRegAdvances, currentFixLoans, currentStoredVouchers] = await Promise.all([
        DataStoreService.get('advances_regular', []),
        DataStoreService.get('advances_fixed', []),
        DataStoreService.get('payment_vouchers', [])
      ]);

      const updatedRegAdvances = Array.isArray(currentRegAdvances) ? [...currentRegAdvances] : [];
      const updatedFixLoans = Array.isArray(currentFixLoans) ? [...currentFixLoans] : [];
      const newVouchersList = [];

      let salaryDisbursedCount = 0;
      let advanceDisbursedCount = 0;
      let loanDisbursedCount = 0;

      // 2. Process each payment item
      paymentList.forEach((entry, idx) => {
        const worker = workers.find(w => w.worker_id === entry.workerId);
        if (!worker) return;

        const voucherNum = `PAY-${entry.paymentDate.replace(/-/g, '').slice(0, 6)}-${String(Date.now() + idx).slice(-4)}`;
        const amountNum = Number(entry.amount);

        // Official Payment Voucher Object
        const voucher = {
          id: `vch_${Date.now()}_${idx}`,
          voucher_number: voucherNum,
          payment_date: entry.paymentDate,
          payment_type: entry.paymentType, // 'Salary' | 'Advance' | 'Loan'
          worker_id: worker.worker_id,
          worker_id_code: worker.worker_id,
          worker_name: worker.name,
          worker_department: worker.department || 'Production',
          worker_bank_account: worker.bank_account || '',
          amount_paid: amountNum,
          total_payable: worker.base_wage || amountNum,
          previously_paid: 0,
          outstanding_after: Math.max(0, (worker.base_wage || amountNum) - amountNum),
          payment_mode: entry.paymentMode || paymentMode,
          bank_account_name: selectedAcc.account_name,
          bank_account_id: selectedAcc.id,
          transaction_reference: entry.reference || `REF-${voucherNum}`,
          narration: entry.remarks || `${entry.paymentType} payment disbursal for ${worker.name}`,
          status: 'Completed',
          created_at: new Date().toISOString()
        };

        newVouchersList.unshift(voucher);

        // 3A. CROSS-MODULE SYNC: IF TYPE IS ADVANCE (Salary Advance)
        if (entry.paymentType === 'Advance') {
          advanceDisbursedCount++;
          const targetWorkerIndex = updatedRegAdvances.findIndex(w => w.workerId === worker.worker_id);
          const newAdvanceTx = {
            id: `ADV-${entry.paymentDate.slice(0, 4)}-${String(Date.now() + idx).slice(-4)}`,
            date: entry.paymentDate,
            amount: amountNum,
            mode: entry.paymentMode || paymentMode,
            voucher: voucherNum,
            purpose: entry.remarks || 'Monthly Salary Advance',
            approvedBy: 'Admin / Plant Cashier',
            status: 'Pending Deduction'
          };

          if (targetWorkerIndex >= 0) {
            updatedRegAdvances[targetWorkerIndex] = {
              ...updatedRegAdvances[targetWorkerIndex],
              transactions: [newAdvanceTx, ...(updatedRegAdvances[targetWorkerIndex].transactions || [])]
            };
          } else {
            updatedRegAdvances.push({
              workerId: worker.worker_id,
              name: worker.name,
              department: worker.department || 'Production',
              designation: worker.designation || 'Worker',
              photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              transactions: [newAdvanceTx]
            });
          }
        }
        // 3B. CROSS-MODULE SYNC: IF TYPE IS LOAN (Fixed Advance EMI / Loan Sanction)
        else if (entry.paymentType === 'Loan') {
          loanDisbursedCount++;
          const targetLoanIndex = updatedFixLoans.findIndex(
            l => l.workerId === worker.worker_id && l.status && l.status.includes('Active')
          );

          if (targetLoanIndex >= 0) {
            // Record EMI repayment towards active loan
            const activeLoan = updatedFixLoans[targetLoanIndex];
            const prevRecovered = (activeLoan.repayments || []).reduce((s, r) => s + Number(r.emiAmount || 0), 0);
            const remainingBalance = Math.max(0, activeLoan.principalAmount - (prevRecovered + amountNum));

            const newRepayment = {
              monthIndex: (activeLoan.repayments || []).length + 1,
              monthName: new Date(entry.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' }),
              salaryCycle: `SAL-${entry.paymentDate.slice(0, 7)}`,
              emiAmount: amountNum,
              balanceAfter: remainingBalance,
              status: 'Deducted from Salary',
              voucher: voucherNum,
              paymentDate: entry.paymentDate
            };

            updatedFixLoans[targetLoanIndex] = {
              ...activeLoan,
              status: remainingBalance <= 0 ? 'Closed / Fully Recovered' : 'Active (In Repayment)',
              repayments: [newRepayment, ...(activeLoan.repayments || [])]
            };
          } else {
            // New loan sanction / disbursal
            const newLoan = {
              loanId: `FL-2026-00${updatedFixLoans.length + 1}`,
              workerId: worker.worker_id,
              name: worker.name,
              department: worker.department || 'Production',
              designation: worker.designation || 'Staff Associate',
              sanctionDate: entry.paymentDate,
              principalAmount: amountNum,
              monthlyEmi: Math.round(amountNum / 10) || 1000,
              purpose: entry.remarks || 'Fixed Advance Sanctioned',
              guarantor: 'Plant Head',
              status: 'Active (In Repayment)',
              totalTenureMonths: 10,
              monthsPaid: 0,
              repayments: []
            };
            updatedFixLoans.unshift(newLoan);
          }
        } else {
          // Salary
          salaryDisbursedCount++;
        }

        // Fire background API call if Django backend is active
        try {
          PaymentService.createPaymentVoucher({
            worker_id: worker.worker_id,
            settlement_period: `Cycle ${entry.paymentDate.slice(0, 7)}`,
            amount_paid: amountNum,
            payment_date: entry.paymentDate,
            payment_mode: entry.paymentMode || paymentMode,
            bank_account_id: selectedAcc.id,
            transaction_reference: entry.reference || `TXN-${voucherNum}`,
            narration: `${entry.paymentType} disbursal: ${entry.remarks || 'Direct payment'}`
          }).catch(() => {});
        } catch (e) {}
      });

      // 4. Save updated advances and loans to DataStore (cross-module persistence)
      await Promise.all([
        DataStoreService.save('advances_regular', updatedRegAdvances),
        DataStoreService.save('advances_fixed', updatedFixLoans)
      ]);

      // 5. Update Vouchers List & DataStore
      const combinedVouchers = [...newVouchersList, ...(Array.isArray(currentStoredVouchers) ? currentStoredVouchers : vouchers)];
      setVouchers(combinedVouchers);
      await DataStoreService.save('payment_vouchers', combinedVouchers);

      // 6. Broadcast cross-module events so Dashboard, Workers & Advances reflect immediately
      if (typeof window !== 'undefined') {
        newVouchersList.forEach((v) => {
          window.dispatchEvent(new CustomEvent('paysphere-payment-completed', { detail: v }));
        });
        window.dispatchEvent(new CustomEvent('paysphere-advance-updated', { detail: { count: newVouchersList.length } }));
      }

      // Reset forms
      if (entryMode === 'bulk' || entryMode === 'manual') {
        setWorkerRows([
          { id: 1, workerId: '', amount: '', remarks: '' },
          { id: 2, workerId: '', amount: '', remarks: '' },
          { id: 3, workerId: '', amount: '', remarks: '' }
        ]);
      } else {
        setParsedRows([]);
        setExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      showFeedback(
        'success',
        `Successfully posted ${paymentList.length} payment(s) totalling ₹${formatInr(totalDisbursal)} via ${selectedAcc.account_name}! Synced across Salary, Advances & Loans.`
      );
    } catch (err) {
      console.error('Payment disbursal failed:', err);
      showFeedback('error', err.message || 'Payment processing failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Manual Multi-Worker Form
  const handleSubmitManualForm = (e) => {
    e.preventDefault();
    if (multiWorkerSummary.validCount === 0) {
      showFeedback('error', 'Please enter at least one worker and payment amount greater than ₹0.');
      return;
    }

    const payload = workerRows
      .filter(r => r.workerId && parseFloat(r.amount) > 0)
      .map(r => ({
        workerId: r.workerId,
        amount: parseFloat(r.amount),
        paymentType,
        paymentDate,
        paymentMode,
        reference: r.remarks ? `REF-${Date.now().toString().slice(-4)}` : '',
        remarks: r.remarks || `${paymentType} bulk entry`
      }));

    executePaymentDisbursal(payload);
  };

  // Submit Handler for Excel Import
  const handleImportExcelPayments = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      showFeedback('error', 'No valid rows found to import.');
      return;
    }

    const payload = validRows.map(r => ({
      workerId: r.workerId,
      amount: r.amount,
      paymentType: r.paymentType,
      paymentDate: r.paymentDate,
      paymentMode: r.paymentMode,
      reference: r.reference,
      remarks: r.remarks || `Imported via ${excelFile?.name || 'Excel'}`
    }));

    executePaymentDisbursal(payload);
  };

  // =========================================================================
  // RECENT PAYMENTS: FILTERING & ACTIONS
  // =========================================================================
  const filteredRecentVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (v.voucher_number && v.voucher_number.toLowerCase().includes(q)) ||
        (v.worker_name && v.worker_name.toLowerCase().includes(q)) ||
        (v.worker_id_code && v.worker_id_code.toLowerCase().includes(q)) ||
        (v.transaction_reference && v.transaction_reference.toLowerCase().includes(q));

      const vType = (v.payment_type || 'Salary').toLowerCase();
      let matchesType = true;
      if (tableTypeFilter === 'Salary') matchesType = vType.includes('salary');
      else if (tableTypeFilter === 'Advance') matchesType = vType.includes('advance');
      else if (tableTypeFilter === 'Loan') matchesType = vType.includes('loan');

      const matchesMode = tableModeFilter === 'All' || v.payment_mode === tableModeFilter;

      return matchesSearch && matchesType && matchesMode;
    });
  }, [vouchers, tableSearch, tableTypeFilter, tableModeFilter]);

  // Reversal / Cancellation
  const handleReverseVoucher = async () => {
    if (!reversalVoucher || isReversing) return;
    setIsReversing(true);

    try {
      const amountToRefund = Number(reversalVoucher.amount_paid || 0);

      // Update vouchers list
      const updatedVouchers = vouchers.map(v => {
        if (v.voucher_number === reversalVoucher.voucher_number || v.id === reversalVoucher.id) {
          return {
            ...v,
            status: 'Cancelled',
            cancellation_reason: reversalReason || 'Cancelled by admin'
          };
        }
        return v;
      });
      setVouchers(updatedVouchers);
      await DataStoreService.save('payment_vouchers', updatedVouchers);

      // Backend API call if active
      if (reversalVoucher.id && !String(reversalVoucher.id).startsWith('vch_')) {
        PaymentService.reversePaymentVoucher(reversalVoucher.id, reversalReason).catch(() => {});
      }

      showFeedback(
        'success',
        `Payment voucher ${reversalVoucher.voucher_number} cancelled.`
      );
      setReversalVoucher(null);
      setReversalReason('');
    } catch (err) {
      console.error('Reversal error:', err);
      showFeedback('error', 'Failed to reverse payment voucher.');
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] font-sans antialiased overflow-hidden">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 lg:w-72 bg-[#11133c] text-white flex flex-col justify-between shrink-0 h-full border-r border-[#1a1e52] z-20 select-none">
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
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Ashmeet Admin"
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0 shadow-sm"
              />
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
                    if (item.name === 'Dashboard' && onNavigateDashboard) onNavigateDashboard();
                    else if (item.name === 'Workers' && onNavigateWorkers) onNavigateWorkers();
                    else if (item.name === 'Department' && onNavigateDepartment) onNavigateDepartment();
                    else if (item.name === 'Attendance' && onNavigateAttendance) onNavigateAttendance();
                    else if (item.name === 'Contractor' && onNavigateContractor) onNavigateContractor();
                    else if (item.name === 'Salary' && onNavigateSalary) onNavigateSalary();
                    else if (item.name === 'Advance' && onNavigateAdvance) onNavigateAdvance();
                    else if (item.name === 'Reports' && onNavigateReports) onNavigateReports();
                    else if (item.name === 'Administration Setting' && onNavigateAdministration) onNavigateAdministration();
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafbfc]">
        {/* Top Header Bar */}
        <header className="h-16 px-8 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Worker Payment Entry
              </h1>
              <p className="text-[11px] text-slate-500">
                Disburse salaries, advances & loans with automated cross-module ledger updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAccountsModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Company Accounts ({bankAccounts.length})</span>
            </button>

            <button
              type="button"
              onClick={loadAllData}
              title="Refresh Data"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-6">
          {/* Feedback Banner */}
          {feedback.message && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                )}
                <span className="text-xs lg:text-sm font-medium">{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback({ type: '', message: '' })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              CARD: THIS MONTH DISBURSED AMOUNT ON SALARY (Sole Required Focus Card)
              ========================================================================= */}
          <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
            {/* Background Decorative Accent */}
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Current Payroll Cycle • {salaryMetrics.monthName}
                  </span>
                </div>

                <div className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">
                  This Month Disbursed Amount on Salary
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                    ₹ {formatInr(salaryMetrics.thisMonthSalaryTotal)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({salaryMetrics.thisMonthSalaryCount} workers paid)
                  </span>
                </div>

                <p className="text-xs text-slate-500 max-w-xl">
                  Total salary wage disbursements approved and released to the factory workforce for the active month of {salaryMetrics.monthName}.
                </p>
              </div>

              {/* Side Breakdown Pill Indicators */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/70 min-w-[140px]">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                    Advance Disbursed
                  </span>
                  <div className="text-base font-bold text-sky-900 font-mono mt-1">
                    ₹ {formatInr(salaryMetrics.thisMonthAdvanceTotal)}
                  </div>
                  <span className="text-[10px] text-sky-700/80 block mt-0.5">
                    {salaryMetrics.thisMonthAdvanceCount} salary advances
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-violet-50/80 border border-violet-200/70 min-w-[140px]">
                  <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider block">
                    Loan Repaid / Disbursed
                  </span>
                  <div className="text-base font-bold text-violet-900 font-mono mt-1">
                    ₹ {formatInr(salaryMetrics.thisMonthLoanTotal)}
                  </div>
                  <span className="text-[10px] text-violet-700/80 block mt-0.5">
                    {salaryMetrics.thisMonthLoanCount} loan installments
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 text-white min-w-[150px] shadow-sm">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Total Disbursed (All)
                  </span>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                    ₹ {formatInr(salaryMetrics.thisMonthAllTotal)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Plant ledger outflow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TWO OPTIONS OF SIMPLE ENTRY: TAB SELECTOR
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Option Tabs Header */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#11133c] text-white flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <h2 className="text-sm lg:text-base font-bold text-slate-900">
                    Disbursal & Payment Entry
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Single payee payment forum, bulk multi-worker grid, or Excel batch upload
                  </p>
                </div>
              </div>

              {/* 3 Option Toggle Buttons */}
              <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEntryMode('single')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    entryMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Make Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('bulk')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    entryMode === 'bulk'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bulk Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('excel')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    entryMode === 'excel'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel Upload</span>
                </button>
              </div>
            </div>

            {/* OPTION 1: MAKE PAYMENT (SINGLE WORKER PAYMENT FORUM) */}
            {entryMode === 'single' && (
              <PaymentForumModal isInline={true} onSuccess={() => loadAllData()} />
            )}

            {/* Common Global Settings Ribbon (for Bulk & Excel modes) */}
            {entryMode !== 'single' && (
              <div className="p-6 bg-indigo-50/30 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Payment Date <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                {/* 2. Select Salary, Advance, or Loan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Payment Category <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="Salary">Salary (Wage Disbursal)</option>
                    <option value="Advance">Salary Advance (Short-Term Running)</option>
                    <option value="Loan">Loan (Fixed Advance / Installment EMI)</option>
                  </select>
                </div>

                {/* 3. Payment Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Payment Mode <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => {
                      const newMode = e.target.value;
                      setPaymentMode(newMode);
                      if (newMode === 'Cash') {
                        setSelectedAccountId('3'); // Cash given by manager
                      } else if (selectedAccountId === '3') {
                        setSelectedAccountId('1'); // ICICI 1
                      }
                    }}
                    className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                    <option value="Cash">Cash (Given by Manager)</option>
                    <option value="UPI">UPI (Unified Payments Interface)</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                {/* 4. Paid From Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Paid From Account <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      const newAccId = e.target.value;
                      setSelectedAccountId(newAccId);
                      if (newAccId === '3') {
                        setPaymentMode('Cash');
                      } else if (paymentMode === 'Cash') {
                        setPaymentMode('Bank Transfer');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs lg:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* =========================================================================
                OPTION 2 CONTENT: BULK PAYMENT GRID (UP TO 20+ WORKERS AT ONCE)
                ========================================================================= */}
            {entryMode === 'bulk' && (
              <form onSubmit={handleSubmitManualForm} className="p-6 space-y-5">
                {/* Grid Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs lg:text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>Worker & Amount Entry Grid</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Enter amounts for individual workers or populate all active workers in one click
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePopulateAllWorkers}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Load all registered workers into the grid"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Populate All Workers ({workers.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddFiveRows}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer"
                    >
                      +5 Rows
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllRows}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* No Workers Helper Notice */}
                {workers.length === 0 && !loading && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No workers loaded from the Workers module. Please add workers in the <strong>Workers</strong> module or click <strong>Refresh</strong>.</span>
                    </div>
                    {onNavigateWorkers && (
                      <button
                        type="button"
                        onClick={onNavigateWorkers}
                        className="px-3 py-1 font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                      >
                        Go to Workers
                      </button>
                    )}
                  </div>
                )}

                {/* The Multi-Worker Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">#</th>
                        <th className="px-4 py-2.5 min-w-[260px]">Worker Name & ID *</th>
                        <th className="px-4 py-2.5 min-w-[150px]">Department</th>
                        <th className="px-4 py-2.5 min-w-[180px]">Disbursal Amount (₹) *</th>
                        <th className="px-4 py-2.5 min-w-[200px]">Reference / Note (Optional)</th>
                        <th className="px-3 py-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workerRows.map((row, index) => {
                        const matchedWorker = workers.find(w => w.worker_id === row.workerId);

                        return (
                          <tr key={row.id} className="hover:bg-indigo-50/20 transition">
                            {/* Row Number */}
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                              {index + 1}
                            </td>

                            {/* Worker Selector */}
                            <td className="px-4 py-2">
                              <select
                                value={row.workerId}
                                onChange={(e) => handleRowChange(row.id, 'workerId', e.target.value)}
                                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                                  !row.workerId ? 'border-slate-200 text-slate-400' : 'border-slate-300 text-slate-800'
                                }`}
                              >
                                <option value="">
                                  {workers.length > 0 ? `-- Choose Worker (${workers.length} available) --` : '-- No registered workers found --'}
                                </option>
                                {workers.map(w => (
                                  <option key={w.worker_id} value={w.worker_id}>
                                    {w.name} ({w.worker_id}) • {w.department}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Department / Designation Badge */}
                            <td className="px-4 py-2">
                              {matchedWorker ? (
                                <div className="text-[11px]">
                                  <span className="font-semibold text-slate-700">{matchedWorker.department}</span>
                                  <span className="text-slate-400 block text-[10px]">{matchedWorker.designation}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">—</span>
                              )}
                            </td>

                            {/* Amount Input */}
                            <td className="px-4 py-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={row.amount}
                                  onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                                  className={`w-full pl-6 pr-3 py-1.5 text-xs font-bold font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    row.workerId && !row.amount ? 'border-amber-300' : 'border-slate-200'
                                  }`}
                                />
                              </div>
                            </td>

                            {/* Reference / Remarks */}
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                placeholder={`e.g. ${paymentType} voucher note...`}
                                value={row.remarks}
                                onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Remove Row Button */}
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                title="Remove row"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total & Validation Bar */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Valid Workers Selected
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {multiWorkerSummary.validCount} worker{multiWorkerSummary.validCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Total {paymentType} Outflow
                      </span>
                      <span className="text-xl font-extrabold text-emerald-700 font-mono">
                        ₹ {formatInr(multiWorkerSummary.totalAmt)}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Disbursal Account
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {multiWorkerSummary.selectedAcc?.account_name || 'ICICI 1'}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={multiWorkerSummary.validCount === 0 || isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs lg:text-sm font-bold text-white transition shadow-sm cursor-pointer ${
                      multiWorkerSummary.validCount === 0 || isSubmitting
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-[#11133c] hover:bg-indigo-950 active:scale-98'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing {multiWorkerSummary.validCount} Disbursals...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          Post & Disburse {paymentType} ({multiWorkerSummary.validCount} Workers • ₹{formatInr(multiWorkerSummary.totalAmt)})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* =========================================================================
                OPTION 2 CONTENT: UPLOAD EXCEL FILE (BATCH FILE IMPORT)
                ========================================================================= */}
            {entryMode === 'excel' && (
              <div className="p-6 space-y-6">
                {/* Upload & Template Actions Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* File Dropzone */}
                  <div className="md:col-span-2 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50 flex flex-col items-center justify-center">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">
                      Upload Payment Register Excel or CSV File
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Upload your spreadsheet containing columns for Worker ID, Amount, Payment Type, Date, and Mode.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-file-upload-input"
                      />
                      <label
                        htmlFor="excel-file-upload-input"
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer flex items-center gap-2 shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{excelFile ? 'Choose Different File' : 'Browse Excel File (.xlsx)'}</span>
                      </label>

                      {excelFile && (
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {excelFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sample Template Download Card */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider mb-2">
                        <Download className="w-4 h-4 text-indigo-600" />
                        <span>Excel Template</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Download our pre-structured template containing exact headers and sample entries for Salary, Advances, and Loans.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100/50 border border-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample Excel Template</span>
                    </button>
                  </div>
                </div>

                {/* Parsed Excel Rows Preview */}
                {parsedRows.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>File Data Preview ({parsedRows.length} rows detected)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Review parsed payment records before updating system ledgers
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          {parsedExcelSummary.validCount} Valid Records
                        </span>
                        {parsedExcelSummary.invalidCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800">
                            {parsedExcelSummary.invalidCount} Invalid Rows
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Table of Parsed Rows */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[360px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-3 py-2.5 w-10 text-center">Row</th>
                            <th className="px-3 py-2.5 text-center">Status</th>
                            <th className="px-4 py-2.5">Worker</th>
                            <th className="px-3 py-2.5">Type</th>
                            <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                            <th className="px-3 py-2.5">Date</th>
                            <th className="px-3 py-2.5">Mode</th>
                            <th className="px-4 py-2.5">Remarks / Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((r) => (
                            <tr
                              key={r.rowNum}
                              className={`transition ${!r.isValid ? 'bg-rose-50/40' : 'hover:bg-slate-50'}`}
                            >
                              <td className="px-3 py-2 text-center font-mono text-slate-400">{r.rowNum}</td>
                              <td className="px-3 py-2 text-center">
                                {r.isValid ? (
                                  <span className="text-emerald-600 font-bold">✓</span>
                                ) : (
                                  <span className="text-rose-600 font-bold" title={r.errorMsg}>✕</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <div className="font-bold text-slate-800">{r.workerName || 'Unknown Worker'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {r.workerId || 'Missing'} • {r.department}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                                    r.paymentType === 'Advance'
                                      ? 'bg-sky-100 text-sky-800'
                                      : r.paymentType === 'Loan'
                                      ? 'bg-violet-100 text-violet-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {r.paymentType}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">
                                ₹{formatInr(r.amount)}
                              </td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.paymentDate}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.paymentMode}</td>
                              <td className="px-4 py-2">
                                {r.isValid ? (
                                  <span className="text-slate-500 text-[11px] truncate max-w-xs block">
                                    {r.remarks || r.reference || 'Ready for import'}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {r.errorMsg}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Import Submit Banner */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Total Import Value
                        </span>
                        <div className="text-xl font-extrabold text-emerald-700 font-mono">
                          ₹ {formatInr(parsedExcelSummary.totalAmount)}
                          <span className="text-xs text-slate-500 font-normal ml-2">
                            ({parsedExcelSummary.validCount} valid entries)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleImportExcelPayments}
                        disabled={parsedExcelSummary.validCount === 0 || isSubmitting}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs lg:text-sm font-bold text-white transition shadow-sm cursor-pointer ${
                          parsedExcelSummary.validCount === 0 || isSubmitting
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Importing & Processing...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Confirm & Import {parsedExcelSummary.validCount} Payments</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              END SECTION: RECENT PAYMENTS SHOWN AT THE END
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-indigo-600" />
                  <span>Recent Payment Transactions</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Audit trail of all recent disbursements across salary, advances, and loans
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search voucher, worker, UTR..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={tableTypeFilter}
                  onChange={(e) => setTableTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Salary">Salary Only</option>
                  <option value="Advance">Advance Only</option>
                  <option value="Loan">Loan Only</option>
                </select>

                {/* Mode Filter */}
                <select
                  value={tableModeFilter}
                  onChange={(e) => setTableModeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Modes</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Voucher No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Worker</th>
                    <th className="px-4 py-3">Payment Category</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-800">Amount Paid</th>
                    <th className="px-4 py-3">Mode & Account</th>
                    <th className="px-4 py-3">Reference / Remarks</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecentVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                        No recent payments recorded matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecentVouchers.map((v) => {
                      const vType = v.payment_type || 'Salary';

                      return (
                        <tr
                          key={v.id || v.voucher_number}
                          className={`hover:bg-indigo-50/20 transition ${
                            v.status === 'Cancelled' ? 'opacity-60 bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Voucher No */}
                          <td className="px-4 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                            {v.voucher_number}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {v.payment_date}
                          </td>

                          {/* Worker */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{v.worker_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {v.worker_id_code} • {v.worker_department || 'General'}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                vType === 'Advance'
                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                  : vType === 'Loan'
                                  ? 'bg-violet-100 text-violet-800 border border-violet-200'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}
                            >
                              {vType}
                            </span>
                          </td>

                          {/* Amount Paid */}
                          <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap font-mono text-sm">
                            ₹{formatInr(v.amount_paid)}
                          </td>

                          {/* Mode & Account */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{v.payment_mode}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {v.bank_account_name}
                            </div>
                          </td>

                          {/* Reference / Remarks */}
                          <td className="px-4 py-3 text-slate-600 text-[11px] max-w-[180px] truncate">
                            {v.transaction_reference || v.narration || '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                v.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                title="View Details"
                                onClick={() => setSelectedVoucherForDetails(v)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Voucher Slip */}
                              <button
                                type="button"
                                title="Print Voucher Slip"
                                onClick={() => setSelectedVoucherForPrint(v)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel / Reverse */}
                              {v.status === 'Completed' && (
                                <button
                                  type="button"
                                  title="Reverse / Cancel Payment"
                                  onClick={() => setReversalVoucher(v)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ===================== MODAL: VIEW DETAILS ===================== */}
      {selectedVoucherForDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Voucher Details</h3>
                <span className="font-mono text-xs text-indigo-600 font-bold">
                  {selectedVoucherForDetails.voucher_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherForDetails(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Worker</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVoucherForDetails.worker_name}</div>
                  <div className="font-mono text-slate-500">{selectedVoucherForDetails.worker_id_code}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Category</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVoucherForDetails.payment_type || 'Salary'}</div>
                  <div className="text-slate-500">Date: {selectedVoucherForDetails.payment_date}</div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Total Amount Disbursed:</span>
                <span className="text-base font-extrabold text-emerald-800 font-mono">
                  ₹ {formatInr(selectedVoucherForDetails.amount_paid)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{selectedVoucherForDetails.payment_mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid From Account:</span>
                  <span className="font-bold text-slate-800">{selectedVoucherForDetails.bank_account_name}</span>
                </div>
                {selectedVoucherForDetails.transaction_reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference:</span>
                    <span className="font-mono text-slate-800">{selectedVoucherForDetails.transaction_reference}</span>
                  </div>
                )}
                {selectedVoucherForDetails.narration && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Narration:</span>
                    <span className="text-slate-700 italic">{selectedVoucherForDetails.narration}</span>
                  </div>
                )}
              </div>

              {selectedVoucherForDetails.status === 'Cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block">Status: Cancelled / Reversed</span>
                  <span className="text-[11px]">{selectedVoucherForDetails.cancellation_reason || 'Reversed by admin'}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVoucherForDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRINT OFFICIAL VOUCHER SLIP ===================== */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Print Payment Voucher Slip</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#11133c] hover:bg-indigo-950 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForPrint(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Slip Content */}
            <div className="p-8 text-slate-800 space-y-6 print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    Boparai Industries Ltd.
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Industrial Forging Plant • Plant Office 01 • PaySphere Payroll System
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    GSTIN: 03AAAAA0000A1Z5 • Corporate Office
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                    Payment Voucher
                  </span>
                  <span className="text-base font-black font-mono text-indigo-950">
                    {selectedVoucherForPrint.voucher_number}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Date: {selectedVoucherForPrint.payment_date}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Paid To (Beneficiary)</div>
                  <div className="font-bold text-sm text-slate-900">{selectedVoucherForPrint.worker_name}</div>
                  <div className="font-mono text-slate-600">Worker ID: {selectedVoucherForPrint.worker_id_code}</div>
                  <div className="text-slate-600">Department: {selectedVoucherForPrint.worker_department || 'General'}</div>
                  <div className="font-mono text-slate-500">Bank A/C: {selectedVoucherForPrint.worker_bank_account || 'Registered A/C'}</div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Payment Source & Category</div>
                  <div className="font-bold text-slate-800">{selectedVoucherForPrint.payment_type || 'Salary'}</div>
                  <div className="text-slate-600">Mode: {selectedVoucherForPrint.payment_mode}</div>
                  <div className="text-slate-600">From: {selectedVoucherForPrint.bank_account_name}</div>
                  <div className="font-mono text-slate-600">
                    Ref: {selectedVoucherForPrint.transaction_reference || 'Direct Slip'}
                  </div>
                </div>
              </div>

              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 text-left font-bold text-slate-700">Description</th>
                    <th className="p-2.5 text-right font-bold text-slate-900">Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-medium">
                      {selectedVoucherForPrint.payment_type || 'Salary'} Disbursal
                      {selectedVoucherForPrint.narration && (
                        <span className="block text-[11px] text-slate-500 italic mt-0.5">
                          Note: {selectedVoucherForPrint.narration}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹ {formatInr(selectedVoucherForPrint.amount_paid)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                    Prepared By
                  </div>
                  <span className="text-[10px] text-slate-400">Accountant / Cashier</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                    Worker Signature
                  </div>
                  <span className="text-[10px] text-slate-400">Received with thanks</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                    Authorized Signatory
                  </div>
                  <span className="text-[10px] text-slate-400">For Boparai Industries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REVERSE / CANCEL VOUCHER ===================== */}
      {reversalVoucher && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold">Cancel / Reverse Payment Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setReversalVoucher(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel payment voucher{' '}
                <span className="font-mono font-bold text-slate-900">{reversalVoucher.voucher_number}</span>?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-slate-700">
                <div>Worker: <strong className="text-slate-900">{reversalVoucher.worker_name}</strong></div>
                <div>Amount to Refund: <strong className="text-emerald-700 font-mono">₹{formatInr(reversalVoucher.amount_paid)}</strong></div>
                <div>Crediting Back to: <strong className="text-slate-900">{reversalVoucher.bank_account_name}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation / Reversal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Incorrect bank account, duplicate voucher, transaction rejected..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  required
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  The payment voucher will be marked as Cancelled and recorded in audit logs.
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReversalVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!reversalReason.trim() || isReversing}
                onClick={handleReverseVoucher}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {isReversing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reversing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reversal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: COMPANY ACCOUNTS ===================== */}
      {showAccountsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Disbursal Accounts & Payment Modes</h3>
                  <p className="text-[11px] text-slate-500">Configured payout sources for wage disbursals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountsModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-indigo-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{acc.account_name}</span>
                        <span className="text-[11px] text-slate-400 block">{acc.bank_name || 'Cash Desk'}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          acc.account_type === 'Bank'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {acc.account_type}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {acc.account_number ? `A/C: ${acc.account_number}` : 'Cash'}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAccountsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
