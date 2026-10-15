import React, { useState, useMemo, useEffect } from 'react';
import { DataStoreService } from '../services/api';
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
  ShieldCheck,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  RotateCcw,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Receipt,
  Download,
  Filter,
  ArrowLeft,
  ExternalLink,
  Shield,
  CreditCard,
  Building,
  Check,
  Coins,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowUpRight,
  Sparkles,
  Printer,
  SlidersHorizontal,
  Briefcase
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

// Realistic sample photo avatars for workers
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

// Initial Contractors List (empty, ready for user testing and actual data entry)
const INITIAL_CONTRACTORS = [];

export const ContractorPage = ({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) => {
  const [activeNav, setActiveNav] = useState('Contractor');
  const [contractors, setContractors] = useState(INITIAL_CONTRACTORS);
  const [selectedContractorId, setSelectedContractorId] = useState(null);

  // Load contractors from database datastore
  useEffect(() => {
    let isMounted = true;
    DataStoreService.get('contractors', [])
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setContractors(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load contractors from datastore:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveAndSetContractors = (updater) => {
    setContractors((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      DataStoreService.save('contractors', next).catch((err) => {
        console.warn('Failed to persist contractors to datastore:', err);
      });
      return next;
    });
  };

  // Filters for Main List
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Detail View Sub-tabs: 'workers' | 'invoices' | 'attendance' | 'contract'
  const [activeDetailTab, setActiveDetailTab] = useState('workers');
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [workerDeptFilter, setWorkerDeptFilter] = useState('All');

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentContractor, setPaymentContractor] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMode: 'NEFT / RTGS',
    utrNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: 'Approved for contractor disbursement cycle'
  });

  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    department: 'Production',
    designation: 'CNC Operator Trainee',
    shift: 'Morning (06:00 - 14:00)',
    dailyRate: '750',
    phone: '+91 98765 43900'
  });

  const [isAddContractorModalOpen, setIsAddContractorModalOpen] = useState(false);
  const [newContractorForm, setNewContractorForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: 'Ludhiana, Punjab',
    gstin: '',
    labourLicense: '',
    bankName: 'HDFC Bank',
    bankAccount: '',
    ifscCode: '',
    primaryService: 'Manpower Supply',
    departments: 'Production'
  });

  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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

  // ================= Aggregated Stats for Overview =================
  const totalContractorsCount = contractors.length;
  const totalWorkersUnderContractor = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.workers?.length || c.totalWorkers || 0), 0);
  }, [contractors]);

  const totalWorkersPresentToday = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.presentToday || 0), 0);
  }, [contractors]);

  const totalPendingPayments = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.pendingPayment || 0), 0);
  }, [contractors]);

  const totalPaidYTDOverall = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.totalPaidYTD || 0), 0);
  }, [contractors]);

  // Filtered Contractors for List View
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.primaryService.toLowerCase().includes(q);

      const matchesDept =
        departmentFilter === 'All' ||
        c.departments.includes(departmentFilter);

      const matchesPayment =
        paymentFilter === 'All' ||
        (paymentFilter === 'Pending' && c.pendingPayment > 0) ||
        (paymentFilter === 'Cleared' && c.pendingPayment === 0);

      return matchesSearch && matchesDept && matchesPayment;
    });
  }, [contractors, searchQuery, departmentFilter, paymentFilter]);

  // Currently Selected Contractor Object
  const selectedContractor = useMemo(() => {
    if (!selectedContractorId) return null;
    return contractors.find((c) => c.id === selectedContractorId) || null;
  }, [contractors, selectedContractorId]);

  // Filtered Workers inside Selected Contractor
  const filteredContractorWorkers = useMemo(() => {
    if (!selectedContractor) return [];
    return (selectedContractor.workers || []).filter((w) => {
      const q = workerSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.designation.toLowerCase().includes(q) ||
        w.phone.includes(q);

      const matchesDept =
        workerDeptFilter === 'All' || w.department === workerDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [selectedContractor, workerSearchQuery, workerDeptFilter]);

  // Handle Payment Settlement Submit
  const handleSettlePayment = (e) => {
    e.preventDefault();
    if (!paymentContractor || !paymentForm.amount) return;

    const payAmt = parseFloat(paymentForm.amount);
    if (isNaN(payAmt) || payAmt <= 0) return;

    saveAndSetContractors((prev) =>
      prev.map((c) => {
        if (c.id !== paymentContractor.id) return c;

        const updatedPending = Math.max(0, c.pendingPayment - payAmt);
        const updatedPaid = c.totalPaidYTD + payAmt;

        // update invoices if specific invoice was targeted
        let updatedInvoices = c.invoices.map((inv) => {
          if (paymentForm.invoiceId && inv.id === paymentForm.invoiceId) {
            const newPaid = inv.paidAmount + payAmt;
            const newPending = Math.max(0, inv.pendingAmount - payAmt);
            return {
              ...inv,
              paidAmount: newPaid,
              pendingAmount: newPending,
              status: newPending === 0 ? 'Fully Settled' : 'Partially Paid'
            };
          } else if (!paymentForm.invoiceId && inv.pendingAmount > 0) {
            return inv;
          }
          return inv;
        });

        return {
          ...c,
          pendingPayment: updatedPending,
          totalPaidYTD: updatedPaid,
          invoices: updatedInvoices
        };
      })
    );

    setIsPaymentModalOpen(false);
    showToast(`Payment of ₹ ${payAmt.toLocaleString('en-IN')} recorded successfully for ${paymentContractor.name}!`);
  };

  // Open Payment modal from anywhere
  const triggerPaymentModal = (contractor, invoice = null) => {
    setPaymentContractor(contractor);
    setPaymentForm({
      invoiceId: invoice ? invoice.id : (contractor.invoices?.find(i => i.pendingAmount > 0)?.id || ''),
      amount: invoice ? invoice.pendingAmount.toString() : contractor.pendingPayment.toString(),
      paymentMode: 'NEFT / RTGS',
      utrNumber: `UTR${Math.floor(100000000 + Math.random() * 900000000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Settlement payout for ${contractor.name}`
    });
    setIsPaymentModalOpen(true);
  };

  // Add Worker to Contractor
  const handleAddWorkerSubmit = (e) => {
    e.preventDefault();
    if (!selectedContractor || !newWorkerForm.name) return;

    const newWorker = {
      id: `W0${Math.floor(50 + Math.random() * 40)}`,
      name: newWorkerForm.name,
      photo: SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)],
      department: newWorkerForm.department,
      designation: newWorkerForm.designation,
      shift: newWorkerForm.shift,
      dailyRate: parseFloat(newWorkerForm.dailyRate) || 750,
      attendanceMonth: 1,
      totalWorkingDays: 26,
      statusToday: 'Present',
      phone: newWorkerForm.phone || '+91 98765 00000',
      joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      aadhar: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      pan: `BKRPK${Math.floor(1000 + Math.random() * 9000)}Z`,
      bankAccount: `50100${Math.floor(100000000 + Math.random() * 900000000)}`,
      ifsc: 'HDFC0001234'
    };

    saveAndSetContractors((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContractor.id) return c;
        const currentWorkers = c.workers || [];
        return {
          ...c,
          totalWorkers: currentWorkers.length + 1,
          presentToday: (c.presentToday || 0) + 1,
          workers: [newWorker, ...currentWorkers]
        };
      })
    );

    setIsAddWorkerModalOpen(false);
    setNewWorkerForm({
      name: '',
      department: 'Production',
      designation: 'CNC Operator Trainee',
      shift: 'Morning (06:00 - 14:00)',
      dailyRate: '750',
      phone: '+91 98765 43900'
    });
    showToast(`Worker ${newWorker.name} (${newWorker.id}) onboarded to ${selectedContractor.name}!`);
  };

  // Add Contractor Submit
  const handleAddContractorSubmit = (e) => {
    e.preventDefault();
    if (!newContractorForm.name || !newContractorForm.owner) return;

    const nextId = contractors.length + 1;
    const newContractor = {
      id: nextId,
      code: `CON-00${nextId}`,
      name: newContractorForm.name,
      owner: newContractorForm.owner,
      phone: newContractorForm.phone || '+91 98111 22233',
      email: newContractorForm.email || `info@${newContractorForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      address: newContractorForm.address,
      gstin: newContractorForm.gstin || '03AAACN9182K1Z9',
      pan: 'AAACN9182K',
      labourLicense: newContractorForm.labourLicense || `LIC/LDH/2024/${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpiry: '31 Dec 2026',
      bankName: newContractorForm.bankName,
      bankAccount: newContractorForm.bankAccount || '50200019283746',
      ifscCode: newContractorForm.ifscCode || 'HDFC0001234',
      rating: 4.8,
      status: 'Active',
      complianceStatus: 'Fully Compliant',
      primaryService: newContractorForm.primaryService,
      departments: newContractorForm.departments.split(',').map(d => d.trim()),
      totalWorkers: 0,
      presentToday: 0,
      absentToday: 0,
      pendingPayment: 0,
      totalPaidYTD: 0,
      avgShiftRate: 750,
      contractStart: '01 Oct 2024',
      contractEnd: '30 Sep 2025',
      invoices: [],
      workers: []
    };

    saveAndSetContractors((prev) => [newContractor, ...prev]);
    setIsAddContractorModalOpen(false);
    showToast(`Contractor agency "${newContractor.name}" successfully registered!`);
  };

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] font-sans antialiased overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/60 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
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
              const isActive = item.name === 'Contractor';

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
                    } else if (item.name === 'Contractor') {
                      setSelectedContractorId(null);
                    } else if (item.name === 'Salary' && onNavigateSalary) {
                      onNavigateSalary();
                    } else if (item.name === 'Advance' && onNavigateAdvance) {
                      onNavigateAdvance();
                    } else if (item.name === 'Reports' && onNavigateReports) {
                      onNavigateReports();
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

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* VIEW 1: DEDICATED CONTRACTOR DASHBOARD (WHEN A CONTRACTOR IS CLICKED) */}
        {selectedContractor ? (
          <div className="flex-1 flex flex-col pb-12">
            {/* Header / Breadcrumb */}
            <header className="px-8 lg:px-10 pt-8 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedContractorId(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Back to all contractors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedContractorId(null)}
                      className="hover:text-indigo-600 transition"
                    >
                      Contractors
                    </button>
                    <span>/</span>
                    <span className="text-slate-800 font-semibold">{selectedContractor.name}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mt-1">
                    {selectedContractor.name}
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedContractor.code}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      selectedContractor.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedContractor.status}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => triggerPaymentModal(selectedContractor)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Settle / Pay Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddWorkerModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard Worker</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Contractor summary statement generated for ${selectedContractor.name}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Statement</span>
                </button>
              </div>
            </header>

            <main className="px-8 lg:px-10 pt-6 space-y-6">
              {/* Contractor Information Summary Banner */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Agency Details */}
                  <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pr-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Agency Contact & Lead
                    </span>
                    <div className="text-base font-bold text-slate-800">{selectedContractor.owner}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedContractor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedContractor.email}</span>
                    </div>
                  </div>

                  {/* Registered Office & Licenses */}
                  <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pr-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Compliance & Legal
                    </span>
                    <div className="text-xs text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{selectedContractor.address}</span>
                    </div>
                    <div className="text-xs text-slate-600 pt-1">
                      <span className="text-slate-400">GSTIN: </span>
                      <span className="font-mono font-medium text-slate-800">{selectedContractor.gstin}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-400">Labour License: </span>
                      <span className="font-mono font-medium text-slate-800">{selectedContractor.labourLicense}</span>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="space-y-1.5 border-b md:border-b-0 xl:border-r border-slate-100 pr-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Disbursement Bank Details
                    </span>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedContractor.bankName}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-400">A/C: </span>
                      <span className="font-mono font-medium text-slate-800">{selectedContractor.bankAccount}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-400">IFSC: </span>
                      <span className="font-mono font-medium text-slate-800">{selectedContractor.ifscCode}</span>
                    </div>
                  </div>

                  {/* Operational Deployment */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Deployment Scope
                    </span>
                    <div className="text-xs text-slate-700 font-medium">
                      {selectedContractor.primaryService}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedContractor.departments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Valid: <span className="font-medium text-slate-700">{selectedContractor.contractStart}</span> to{' '}
                      <span className="font-medium text-slate-700">{selectedContractor.contractEnd}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================== CONTRACTOR DASHBOARD STAT CARDS ===================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* 1. Total Workers */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Workers
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {selectedContractor.workers?.length || selectedContractor.totalWorkers}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">contracted personnel</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{selectedContractor.presentToday} Present Today</span>
                    </div>
                    <span className="text-slate-400">
                      {selectedContractor.absentToday} Absent
                    </span>
                  </div>
                </div>

                {/* 2. Total Pending Payment */}
                <div className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs hover:shadow-sm transition group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Pending Payment
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                      <Receipt className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-900">
                      ₹ {selectedContractor.pendingPayment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedContractor.invoices?.filter(i => i.pendingAmount > 0).length || 0} Invoices pending
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerPaymentModal(selectedContractor)}
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Pay Now →
                    </button>
                  </div>
                </div>

                {/* 3. Total Paid YTD */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Paid to Date
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₹ {selectedContractor.totalPaidYTD.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Cleared FY 2024-25</span>
                    <span className="text-emerald-600 font-semibold">100% via RTGS</span>
                  </div>
                </div>

                {/* 4. Average Daily Rate */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Avg Daily Shift Rate
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₹ {selectedContractor.avgShiftRate}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">/ shift average</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Attendance Rate Today:</span>
                    <span className="font-semibold text-slate-800">
                      {Math.round(((selectedContractor.presentToday || 0) / (selectedContractor.totalWorkers || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ===================== TABS & OPTIONS BELOW THE CARDS ===================== */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Options Navigation Tabs */}
                <div className="px-6 pt-4 pb-0 border-b border-slate-200 flex items-center gap-6 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('workers')}
                    className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeDetailTab === 'workers'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Deployed Workers ({selectedContractor.workers?.length || 0})</span>
                    {activeDetailTab === 'workers' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('invoices')}
                    className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeDetailTab === 'invoices'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Invoices & Payment Ledger ({selectedContractor.invoices?.length || 0})</span>
                    {selectedContractor.pendingPayment > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    {activeDetailTab === 'invoices' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('attendance')}
                    className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeDetailTab === 'attendance'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Shift Roster & Muster Roll</span>
                    {activeDetailTab === 'attendance' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('contract')}
                    className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeDetailTab === 'contract'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Contract & Compliance Terms</span>
                    {activeDetailTab === 'contract' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                    )}
                  </button>
                </div>

                {/* TAB CONTENT 1: DEPLOYED WORKERS */}
                {activeDetailTab === 'workers' && (
                  <div className="p-6 space-y-4">
                    {/* Search & Actions Bar inside Workers Tab */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 max-w-md">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by worker name, ID, or designation..."
                            value={workerSearchQuery}
                            onChange={(e) => setWorkerSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                          />
                        </div>
                        <select
                          value={workerDeptFilter}
                          onChange={(e) => setWorkerDeptFilter(e.target.value)}
                          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                        >
                          <option value="All">All Departments</option>
                          {selectedContractor.departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddWorkerModalOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Worker</span>
                        </button>
                      </div>
                    </div>

                    {/* Workers Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Worker ID & Name</th>
                            <th className="px-4 py-3">Department & Role</th>
                            <th className="px-4 py-3">Shift Timing</th>
                            <th className="px-4 py-3 text-right">Daily Rate</th>
                            <th className="px-4 py-3 text-center">Month Attendance</th>
                            <th className="px-4 py-3 text-center">Today's Status</th>
                            <th className="px-4 py-3 text-right">Est. MTD Pay</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredContractorWorkers.length > 0 ? (
                            filteredContractorWorkers.map((worker) => {
                              const estPay = (worker.attendanceMonth || 0) * (worker.dailyRate || 700);
                              return (
                                <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Worker Identity */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={worker.photo}
                                        alt={worker.name}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                                      />
                                      <div>
                                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                          <span>{worker.name}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-slate-100 text-slate-600">
                                            {worker.id}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-400">{worker.phone}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Department & Role */}
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-800">{worker.designation}</div>
                                    <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                      {worker.department}
                                    </span>
                                  </td>

                                  {/* Shift */}
                                  <td className="px-4 py-3 text-slate-600 font-medium">
                                    {worker.shift}
                                  </td>

                                  {/* Daily Rate */}
                                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                    ₹ {worker.dailyRate}
                                  </td>

                                  {/* Month Attendance */}
                                  <td className="px-4 py-3 text-center">
                                    <span className="font-semibold text-slate-800">
                                      {worker.attendanceMonth}
                                    </span>
                                    <span className="text-slate-400"> / {worker.totalWorkingDays} days</span>
                                  </td>

                                  {/* Today's Status */}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                      worker.statusToday === 'Present'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        worker.statusToday === 'Present' ? 'bg-emerald-600' : 'bg-rose-600'
                                      }`} />
                                      {worker.statusToday}
                                    </span>
                                  </td>

                                  {/* Est. MTD Pay */}
                                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                                    ₹ {estPay.toLocaleString('en-IN')}
                                  </td>

                                  {/* Action */}
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWorkerDetail(worker)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                      title="View Worker Dossier"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                No workers found matching your filter criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 2: INVOICES & PAYMENT LEDGER */}
                {activeDetailTab === 'invoices' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Contractor Invoices & Payout History</h3>
                        <p className="text-xs text-slate-500">Track cycle man-days, deductions (TDS 2%), and cleared disbursements</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerPaymentModal(selectedContractor)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                      >
                        <Coins className="w-4 h-4" />
                        <span>Record Payment</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Invoice Number</th>
                            <th className="px-4 py-3">Billing Cycle</th>
                            <th className="px-4 py-3 text-center">Billed Man-days</th>
                            <th className="px-4 py-3 text-right">Gross Amount</th>
                            <th className="px-4 py-3 text-right">TDS / Deductions</th>
                            <th className="px-4 py-3 text-right">Net Payable</th>
                            <th className="px-4 py-3 text-right">Pending Balance</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(selectedContractor.invoices || []).map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                {inv.id}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <div>{inv.period}</div>
                                <div className="text-[11px] text-slate-400">Due: {inv.dueDate}</div>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                {inv.mandays} shifts
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                ₹ {inv.grossAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right text-rose-600">
                                - ₹ {inv.deductions.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                ₹ {inv.netAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-amber-700">
                                ₹ {inv.pendingAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  inv.status === 'Fully Settled'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : inv.status === 'Partially Paid'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {inv.pendingAmount > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerPaymentModal(selectedContractor, inv)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-[11px] transition cursor-pointer"
                                    >
                                      Settle
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => showToast(`Invoice ${inv.id} downloaded.`)}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 3: SHIFT ROSTER & MUSTER ROLL */}
                {activeDetailTab === 'attendance' && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Morning Shift */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between text-slate-700 font-semibold text-xs">
                          <span>Morning Shift (06:00 - 14:00)</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px]">
                            {selectedContractor.workers?.filter(w => w.shift.includes('Morning')).length || 0} Workers
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Active deployed in Forging, Trimming and Machining bays
                        </div>
                      </div>

                      {/* General Shift */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between text-slate-700 font-semibold text-xs">
                          <span>General Shift (09:00 - 17:30)</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px]">
                            {selectedContractor.workers?.filter(w => w.shift.includes('General')).length || 0} Workers
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Assigned to Maintenance, Tool Room & Store operations
                        </div>
                      </div>

                      {/* Night Shift */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between text-slate-700 font-semibold text-xs">
                          <span>Night Shift (22:00 - 06:00)</span>
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px]">
                            {selectedContractor.workers?.filter(w => w.shift.includes('Night')).length || 0} Workers
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Furnace heating, security patrols and heavy billet staging
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Department Deployment Breakdown
                      </h4>
                      <div className="space-y-3">
                        {selectedContractor.departments.map((dept) => {
                          const count = selectedContractor.workers?.filter(w => w.department === dept).length || 0;
                          const pct = Math.round((count / (selectedContractor.workers?.length || 1)) * 100);
                          return (
                            <div key={dept} className="space-y-1">
                              <div className="flex justify-between text-xs text-slate-700">
                                <span className="font-medium">{dept}</span>
                                <span className="font-semibold">{count} Workers ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 4: CONTRACT & COMPLIANCE */}
                {activeDetailTab === 'contract' && (
                  <div className="p-6 space-y-5 text-xs text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Statutory & Legal Compliance
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">Labour Department License:</span>
                            <span className="font-semibold text-slate-800">{selectedContractor.labourLicense}</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">License Validity:</span>
                            <span className="font-semibold text-emerald-700">{selectedContractor.licenseExpiry}</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">EPF & ESIC ECR Verification:</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verified
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-500">GST Registration:</span>
                            <span className="font-mono font-semibold text-slate-800">{selectedContractor.gstin}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          Contract Agreement Terms
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">Contract Tenure:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedContractor.contractStart} to {selectedContractor.contractEnd}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">Payment Term:</span>
                            <span className="font-semibold text-slate-800">Bi-Monthly (15-Day Billing)</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500">Statutory Deductions:</span>
                            <span className="font-semibold text-slate-800">TDS 2% Section 194C</span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-500">Notice Period:</span>
                            <span className="font-semibold text-slate-800">30 Days written notice</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        ) : (
          /* VIEW 2: CONTRACTORS OVERVIEW & LIST VIEW (DEFAULT) */
          <div className="flex-1 flex flex-col pb-12">
            {/* Top Header */}
            <header className="px-8 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Contractor Management
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  Overview of contractor agencies, deployed workforce, and pending disbursements
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddContractorModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Contractor</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Mode</span>
                </div>
              </div>
            </header>

            <main className="px-8 lg:px-10 space-y-6">
              {/* ===================== TOP STAT CARDS ROW ===================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-2">
                {/* 1. Total Contractors */}
                <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Contractors
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <HardHat className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {totalContractorsCount}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">Registered agencies</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {contractors.filter(c => c.status === 'Active').length} Active Agencies
                    </span>
                    <span className="text-slate-400">{contractors.filter(c => c.status !== 'Active').length} Inactive</span>
                  </div>
                </div>

                {/* 2. Total Workers Under Contractor */}
                <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Workers Under Contractor
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {totalWorkersUnderContractor}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">deployed workers</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> {totalWorkersPresentToday} Present Today
                    </span>
                    <span className="text-slate-400">Shop Floor</span>
                  </div>
                </div>

                {/* 3. Total Pending Payments */}
                <div className="relative overflow-hidden bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs hover:shadow-sm transition-shadow group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Total Pending Payments
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                      <Banknote className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-900">
                      ₹ {totalPendingPayments.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {contractors.filter(c => (c.pendingPayment || 0) > 0).length} Pending Cycles
                    </span>
                    <span className="text-xs text-slate-400">{totalPendingPayments > 0 ? 'Awaiting Clearance' : 'All Cleared'}</span>
                  </div>
                </div>

                {/* 4. Total Disbursed YTD */}
                <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Paid (FY 2024-25)
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₹ {totalPaidYTDOverall.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Disbursed to Date</span>
                    <span className="text-emerald-600 font-semibold">{totalPaidYTDOverall > 0 ? 'Disbursed' : 'No Payouts Yet'}</span>
                  </div>
                </div>
              </div>

              {/* ===================== FILTER & SEARCH BAR ===================== */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search contractor, owner, phone, GSTIN, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                    >
                      <option value="All">All Departments</option>
                      <option value="Production">Production</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Store">Store</option>
                      <option value="Dispatch">Dispatch</option>
                      <option value="Tool Room">Tool Room</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  {/* Payment Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                    >
                      <option value="All">All Payment Status</option>
                      <option value="Pending">Payment Pending</option>
                      <option value="Cleared">Payment Cleared</option>
                    </select>
                  </div>

                  {(searchQuery || departmentFilter !== 'All' || paymentFilter !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDepartmentFilter('All');
                        setPaymentFilter('All');
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <span className="font-semibold text-slate-800">{filteredContractors.length}</span> of {contractors.length} contractors
                </div>
              </div>

              {/* ===================== LIST OF CONTRACTORS (CLICKABLE) ===================== */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Contractor Agencies Directory</h2>
                    <p className="text-xs text-slate-500">Click on any contractor to view their comprehensive workforce & financial dashboard</p>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    Click row to view contractor dashboard
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Contractor Agency</th>
                        <th className="px-6 py-3.5">Contact Person</th>
                        <th className="px-6 py-3.5">Assigned Departments</th>
                        <th className="px-6 py-3.5 text-center">Deployed Workers</th>
                        <th className="px-6 py-3.5 text-right">Pending Payment</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredContractors.length > 0 ? (
                        filteredContractors.map((contractor) => (
                          <tr
                            key={contractor.id}
                            onClick={() => {
                              setSelectedContractorId(contractor.id);
                              setActiveDetailTab('workers');
                            }}
                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                          >
                            {/* Agency Identity */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                  {contractor.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                    <span>{contractor.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                      {contractor.code}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    {contractor.primaryService}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Person */}
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{contractor.owner}</div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {contractor.phone}
                              </div>
                            </td>

                            {/* Assigned Departments */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {contractor.departments.map((dept) => (
                                  <span
                                    key={dept}
                                    className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                                  >
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Deployed Workers */}
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-slate-900 text-sm">
                                  {contractor.workers?.length || contractor.totalWorkers}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  {contractor.presentToday} on-duty today
                                </span>
                              </div>
                            </td>

                            {/* Pending Payment */}
                            <td className="px-6 py-4 text-right">
                              {contractor.pendingPayment > 0 ? (
                                <div>
                                  <div className="font-bold text-amber-700 text-sm">
                                    ₹ {contractor.pendingPayment.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-amber-600 font-medium">
                                    {contractor.invoices?.filter(i => i.pendingAmount > 0).length || 1} Pending Cycle(s)
                                  </div>
                                </div>
                              ) : (
                                <div className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>All Settled</span>
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                contractor.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  contractor.status === 'Active' ? 'bg-emerald-600' : 'bg-amber-600'
                                }`} />
                                {contractor.status}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 text-indigo-600 group-hover:text-indigo-800 font-semibold text-xs group-hover:translate-x-1 transition-all">
                                <span>Dashboard</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                            No contractors found matching the filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      {/* ===================== MODAL: RECORD / SETTLE PAYMENT ===================== */}
      {isPaymentModalOpen && paymentContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Contractor Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Paying Contractor Agency:</div>
                <div className="text-sm font-bold text-slate-900">{paymentContractor.name} ({paymentContractor.code})</div>
                <div className="text-slate-500">
                  Current Total Pending: <span className="font-bold text-amber-700">₹ {paymentContractor.pendingPayment.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {paymentContractor.invoices && paymentContractor.invoices.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Specific Invoice</label>
                  <select
                    value={paymentForm.invoiceId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      const inv = paymentContractor.invoices.find(i => i.id === invId);
                      setPaymentForm({
                        ...paymentForm,
                        invoiceId: invId,
                        amount: inv ? inv.pendingAmount.toString() : paymentForm.amount
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  >
                    <option value="">General Balance Settlement (All Pending)</option>
                    {paymentContractor.invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} — {inv.period} (Pending: ₹ {inv.pendingAmount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹)*</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={paymentContractor.pendingPayment || 9999999}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode*</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="Account Payee Cheque">Account Payee Cheque</option>
                    <option value="Corporate UPI">Corporate UPI</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank UTR / Transaction Ref</label>
                  <input
                    type="text"
                    value={paymentForm.utrNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, utrNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Remarks</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  Confirm & Clear Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ONBOARD WORKER TO CONTRACTOR ===================== */}
      {isAddWorkerModalOpen && selectedContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Onboard Worker to {selectedContractor.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWorkerModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Worker Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manpreet Singh"
                  value={newWorkerForm.name}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Department*</label>
                  <select
                    value={newWorkerForm.department}
                    onChange={(e) => setNewWorkerForm({ ...newWorkerForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 cursor-pointer"
                  >
                    {selectedContractor.departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Role*</label>
                  <input
                    type="text"
                    required
                    value={newWorkerForm.designation}
                    onChange={(e) => setNewWorkerForm({ ...newWorkerForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Schedule*</label>
                  <select
                    value={newWorkerForm.shift}
                    onChange={(e) => setNewWorkerForm({ ...newWorkerForm, shift: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 cursor-pointer"
                  >
                    <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                    <option value="General (09:00 - 17:30)">General (09:00 - 17:30)</option>
                    <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Daily Shift Wage Rate (₹)*</label>
                  <input
                    type="number"
                    required
                    value={newWorkerForm.dailyRate}
                    onChange={(e) => setNewWorkerForm({ ...newWorkerForm, dailyRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newWorkerForm.phone}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  Onboard Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REGISTER NEW CONTRACTOR ===================== */}
      {isAddContractorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardHat className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Register New Contractor Agency</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddContractorModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContractorSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contractor / Agency Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Manpower Works"
                    value={newContractorForm.name}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead / Proprietor Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balwinder Singh"
                    value={newContractorForm.owner}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number*</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newContractorForm.phone}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@agency.com"
                    value={newContractorForm.email}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="03AAACN9182K1Z9"
                    value={newContractorForm.gstin}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Labour License No.</label>
                  <input
                    type="text"
                    placeholder="LIC/LDH/2024/0912"
                    value={newContractorForm.labourLicense}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, labourLicense: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Scope / Services</label>
                  <input
                    type="text"
                    placeholder="e.g. Mechanical Labour & Helpers"
                    value={newContractorForm.primaryService}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, primaryService: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Departments (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Production, Store"
                    value={newContractorForm.departments}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, departments: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddContractorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  Register Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: WORKER DETAILS DOSSIER ===================== */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white relative flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setSelectedWorkerDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedWorkerDetail.photo}
                alt={selectedWorkerDetail.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg mb-3"
              />
              <h3 className="font-bold text-lg">{selectedWorkerDetail.name}</h3>
              <div className="text-xs text-indigo-300 font-mono mt-0.5">{selectedWorkerDetail.id}</div>
              <span className="mt-2 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedWorkerDetail.designation} • {selectedWorkerDetail.department}
              </span>
            </div>

            <div className="p-6 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Shift Timing:</span>
                <span className="font-semibold text-slate-800">{selectedWorkerDetail.shift}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Daily Rate:</span>
                <span className="font-bold text-indigo-600">₹ {selectedWorkerDetail.dailyRate} / shift</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Month Attendance:</span>
                <span className="font-semibold text-slate-800">
                  {selectedWorkerDetail.attendanceMonth} / {selectedWorkerDetail.totalWorkingDays} days
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Aadhar Number:</span>
                <span className="font-mono font-medium text-slate-800">{selectedWorkerDetail.aadhar}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">PAN Number:</span>
                <span className="font-mono font-medium text-slate-800">{selectedWorkerDetail.pan}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Bank Account:</span>
                <span className="font-mono font-medium text-slate-800">{selectedWorkerDetail.bankAccount}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Contact Phone:</span>
                <span className="font-medium text-slate-800">{selectedWorkerDetail.phone}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWorkerDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-medium text-xs hover:bg-slate-900 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorPage;
