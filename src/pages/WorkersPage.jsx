import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkerService, DepartmentService } from '../services/api';
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
  CheckCircle2,
  UserCheck,
  UserX,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  RotateCcw,
  X,
  Phone,
  AlertCircle,
  Briefcase,
  Upload,
  Camera,
  CreditCard,
  FileText,
  MapPin,
  User,
  Hash,
  Landmark,
  Shield,
  Clock,
  Sparkles,
  EyeOff,
  Lock
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

// Initial workers list (empty, ready for user testing and actual data entry)
const INITIAL_WORKERS = [];

export const WorkersPage = ({ onNavigateBack, onLogout, onNavigateDepartment, onNavigateAttendance, onNavigateContractor, onNavigateSalary, onNavigateAdvance, onNavigateReports, onNavigateAdministration }) => {
  const [activeNav, setActiveNav] = useState('Workers');
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load workers and departments from database on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      WorkerService.getAll().catch(() => []),
      DepartmentService.getAll().catch(() => []),
    ])
      .then(([fetchedWorkers, fetchedDepts]) => {
        if (!isMounted) return;
        if (Array.isArray(fetchedWorkers)) {
          setWorkers(fetchedWorkers);
        }
        if (Array.isArray(fetchedDepts)) {
          setDepartmentsList(fetchedDepts);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWorkerType, setSelectedWorkerType] = useState('All');

  // Pagination state: now 10 rows per page as requested!
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Photo upload ref for Add / Edit
  const fileInputRef = useRef(null);

  // Form state with all comprehensive fields requested by user
  const initialFormState = {
    workerId: '',
    name: '',
    photo: '',
    department: 'Production',
    designation: '',
    workerType: 'Permanent',
    gender: 'Male',
    dob: '',
    joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Active',
    phone: '',
    address: '',
    contractorAgency: '',
    // Optional salary & payment banking fields
    bankAccount: '',
    ifscCode: '',
    // Optional statutory & verification fields
    aadharNumber: '',
    panNumber: '',
  };

  const [workerForm, setWorkerForm] = useState(initialFormState);

  // Nav Items matching AdminDashboard
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

  // Dynamic Metrics
  const totalWorkersCount = workers.length;
  const activeWorkersCount = workers.filter(w => w.status === 'Active').length;
  const inactiveWorkersCount = workers.filter(w => w.status === 'Inactive').length;

  // Filtering
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        worker.name.toLowerCase().includes(q) ||
        worker.workerId.toLowerCase().includes(q) ||
        (worker.designation && worker.designation.toLowerCase().includes(q)) ||
        (worker.contractorAgency && worker.contractorAgency.toLowerCase().includes(q)) ||
        (worker.bankAccount && worker.bankAccount.includes(q)) ||
        (worker.aadharNumber && worker.aadharNumber.includes(q));

      const matchesDept =
        selectedDepartment === 'All' || worker.department === selectedDepartment;

      const matchesStatus =
        selectedStatus === 'All' || worker.status === selectedStatus;

      const matchesType =
        selectedWorkerType === 'All' || worker.workerType === selectedWorkerType;

      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });
  }, [workers, searchQuery, selectedDepartment, selectedStatus, selectedWorkerType]);

  // Pagination with 10 rows
  const totalPages = Math.ceil(filteredWorkers.length / rowsPerPage) || 1;
  const paginatedWorkers = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredWorkers.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredWorkers, currentPage, rowsPerPage]);

  const startIndex = filteredWorkers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, filteredWorkers.length);

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All');
    setSelectedStatus('All');
    setSelectedWorkerType('All');
    setCurrentPage(1);
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerForm(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextNumber = workers.length + 1;
    const formattedId = `W${String(nextNumber).padStart(3, '0')}`;
    setWorkerForm({
      ...initialFormState,
      workerId: formattedId,
      photo: SAMPLE_AVATARS[nextNumber % SAMPLE_AVATARS.length],
      designation: 'Machine Operator',
      gender: 'Male',
      dob: '15 Jan 1994',
      address: 'Industrial Focal Point, Ludhiana',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Worker
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerForm.name.trim()) return;

    try {
      const payload = {
        workerId: workerForm.workerId.trim() || `W${String(workers.length + 1).padStart(3, '0')}`,
        name: workerForm.name.trim(),
        photo: workerForm.photo || SAMPLE_AVATARS[0],
        department: workerForm.department,
        designation: workerForm.designation.trim() || 'Worker',
        workerType: workerForm.workerType,
        gender: workerForm.gender,
        dob: workerForm.dob || '',
        address: workerForm.address || '',
        contractorAgency: workerForm.workerType === 'Contractor' ? workerForm.contractorAgency : '',
        joinDate: workerForm.joinDate,
        status: workerForm.status,
        phone: workerForm.phone || '+91 98765 00000',
        bankAccount: workerForm.bankAccount || '',
        ifscCode: workerForm.ifscCode ? workerForm.ifscCode.toUpperCase() : '',
        aadharNumber: workerForm.aadharNumber || '',
        panNumber: workerForm.panNumber ? workerForm.panNumber.toUpperCase() : '',
      };

      const created = await WorkerService.create(payload);
      setWorkers([created, ...workers]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(`Error creating worker: ${err.message || 'Server error'}`);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (worker) => {
    setSelectedWorker(worker);
    setWorkerForm({
      workerId: worker.workerId,
      name: worker.name,
      photo: worker.photo || '',
      department: worker.department,
      designation: worker.designation || '',
      workerType: worker.workerType,
      gender: worker.gender || 'Male',
      dob: worker.dob || '',
      address: worker.address || '',
      contractorAgency: worker.contractorAgency || '',
      joinDate: worker.joinDate,
      status: worker.status,
      phone: worker.phone || '',
      bankAccount: worker.bankAccount || '',
      ifscCode: worker.ifscCode || '',
      aadharNumber: worker.aadharNumber || '',
      panNumber: worker.panNumber || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Worker
  const handleEditWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerForm.name.trim()) return;

    try {
      const payload = {
        workerId: workerForm.workerId,
        name: workerForm.name,
        photo: workerForm.photo || selectedWorker.photo,
        department: workerForm.department,
        designation: workerForm.designation,
        workerType: workerForm.workerType,
        gender: workerForm.gender,
        dob: workerForm.dob,
        address: workerForm.address,
        contractorAgency: workerForm.workerType === 'Contractor' ? workerForm.contractorAgency : '',
        joinDate: workerForm.joinDate,
        status: workerForm.status,
        phone: workerForm.phone,
        bankAccount: workerForm.bankAccount,
        ifscCode: workerForm.ifscCode ? workerForm.ifscCode.toUpperCase() : '',
        aadharNumber: workerForm.aadharNumber,
        panNumber: workerForm.panNumber ? workerForm.panNumber.toUpperCase() : '',
      };

      const updated = await WorkerService.update(selectedWorker.id, payload);
      setWorkers(workers.map(w => (w.id === selectedWorker.id ? { ...w, ...updated } : w)));
      setIsEditModalOpen(false);
      setSelectedWorker(null);
    } catch (err) {
      alert(`Error updating worker: ${err.message || 'Server error'}`);
    }
  };

  // Open Detailed Worker View
  const handleOpenViewModal = (worker) => {
    setSelectedWorker(worker);
    setShowBankDetails(false);
    setIsViewModalOpen(true);
  };

  // Delete worker
  const handleDeleteWorker = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker record?')) {
      try {
        await WorkerService.delete(id);
        setWorkers(workers.filter(w => w.id !== id));
        if (selectedWorker && selectedWorker.id === id) {
          setIsViewModalOpen(false);
        }
      } catch (err) {
        alert(`Error deleting worker: ${err.message || 'Server error'}`);
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] font-sans antialiased overflow-hidden">
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
                    if (item.name === 'Dashboard' && onNavigateBack) {
                      onNavigateBack();
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

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* TOP HEADER */}
        <header className="px-8 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Workers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                {totalWorkersCount} Total
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Manage worker profiles, salary bank details &amp; contracts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Mode</span>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Worker</span>
            </button>
          </div>
        </header>

        {/* WORKER DASHBOARD CONTENT */}
        <main className="px-8 lg:px-10 pb-12 flex-1 space-y-6">
          {/* 1. THREE TOP STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-2">
            {/* Total Workers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300 group-hover:bg-indigo-600 rounded-r transition-colors" />
              <div className="pl-2">
                <span className="text-[13px] font-semibold text-slate-700 block">Total Workers</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                  {totalWorkersCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Showing 10 per page
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>

            {/* Active Workers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r transition-colors" />
              <div className="pl-2">
                <span className="text-[13px] font-semibold text-slate-700 block">Active Workers</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                  {activeWorkersCount}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                  Currently on active duty
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>

            {/* Inactive Workers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-rose-400 rounded-r transition-colors" />
              <div className="pl-2">
                <span className="text-[13px] font-semibold text-slate-700 block">Inactive Workers</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                  {inactiveWorkersCount}
                </span>
                <span className="text-[11px] text-rose-500 block mt-1">
                  On leave / off-duty
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <UserX className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>
          </div>

          {/* 2. TABLE BOX WITH INTEGRATED SEARCH & FILTERS */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Box Header & Filter Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-slate-50/40">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID, name, designation, bank, aadhaar..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Departments</option>
                  <option value="Production">Production</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Quality">Quality</option>
                  <option value="Store">Store</option>
                  <option value="Dispatch">Dispatch</option>
                  <option value="Tool Room">Tool Room</option>
                </select>

                <select
                  value={selectedWorkerType}
                  onChange={(e) => {
                    setSelectedWorkerType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Employee Types</option>
                  <option value="Permanent">🛡️ Permanent</option>
                  <option value="Contractor">👷 Contractor</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Workers Table with Worker Photo Column & Clickable Row */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 pl-6 w-12">#</th>
                    <th className="py-3.5 px-4">Worker</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Employee Type</th>
                    <th className="py-3.5 px-4">Join Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center pr-6">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {paginatedWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No workers match current criteria</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try resetting search or filter options</p>
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkers.map((worker, index) => {
                      const absoluteIndex = (currentPage - 1) * rowsPerPage + index + 1;
                      const isPermanent = worker.workerType === 'Permanent';
                      const isActive = worker.status === 'Active';

                      return (
                        <tr
                          key={worker.id}
                          className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                          onClick={() => handleOpenViewModal(worker)}
                        >
                          {/* 1. Row # */}
                          <td className="py-3.5 px-4 pl-6 text-slate-400 font-medium">
                            {absoluteIndex}
                          </td>

                          {/* 2. Worker Photo + ID + Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* Worker Photo */}
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200/90 shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400 transition">
                                {worker.photo ? (
                                  <img
                                    src={worker.photo}
                                    alt={worker.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&background=11133c&color=fff`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#11133c] text-indigo-200 flex items-center justify-center font-bold text-xs">
                                    {worker.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5 leading-tight">
                                  {worker.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {worker.workerId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Designation */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {worker.designation || 'Worker'}
                          </td>

                          {/* 4. Department */}
                          <td className="py-3.5 px-4 text-slate-600 font-normal">
                            {worker.department}
                          </td>

                          {/* 5. EMPLOYEE TYPE */}
                          <td className="py-3.5 px-4">
                            {isPermanent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs shadow-2xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Permanent</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 font-semibold text-xs shadow-2xs"
                                title={worker.contractorAgency ? `Agency: ${worker.contractorAgency}` : 'Contract Worker'}
                              >
                                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                                <span>Contractor</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Join Date */}
                          <td className="py-3.5 px-4 text-slate-500 font-normal">
                            {worker.joinDate}
                          </td>

                          {/* 8. Status Pill */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-semibold text-xs">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* 9. Actions */}
                          <td className="py-3.5 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenViewModal(worker)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="View Detailed Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(worker)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="Edit Worker"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteWorker(worker.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination (Showing 10 workers per page!) */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing {startIndex} to {endIndex} of {filteredWorkers.length} workers (10 per page)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                  const isCurrent = currentPage === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer ${
                        isCurrent
                          ? 'bg-[#1b1f54] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===================== MODAL 1: ADD NEW WORKER (WITH ALL NEW DETAILS) ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Register New Worker</h3>
                  <p className="text-xs text-slate-400">Complete personal, salary banking &amp; contract details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddWorkerSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* SECTION 1: PHOTO & BASIC IDENTITY */}
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> 1. Worker Identity &amp; Photo
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  {/* Photo Preview & Upload Button */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-indigo-200 shadow-sm flex items-center justify-center">
                      {workerForm.photo ? (
                        <img src={workerForm.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                      title="Upload Photo"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Instructions & Presets */}
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-slate-700 block">Worker Profile Photograph</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload worker picture (JPG/PNG). Or choose one of the quick avatars:
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                      {SAMPLE_AVATARS.slice(0, 5).map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWorkerForm({ ...workerForm, photo: av })}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                            workerForm.photo === av ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="sample" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ID, Full Name, Designation, Gender, DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Worker ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={workerForm.workerId}
                      onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. W053"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={workerForm.name}
                      onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Ramesh Chandra"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={workerForm.designation}
                      onChange={(e) => setWorkerForm({ ...workerForm, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. CNC Operator / Lathe Master"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={workerForm.gender}
                      onChange={(e) => setWorkerForm({ ...workerForm, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth (DOB)</label>
                    <input
                      type="text"
                      value={workerForm.dob}
                      onChange={(e) => setWorkerForm({ ...workerForm, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 15 Aug 1992"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={workerForm.phone}
                      onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="+91 98765 XXXXX"
                    />
                  </div>
                </div>

                <div className="mt-3.5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={workerForm.address}
                    onChange={(e) => setWorkerForm({ ...workerForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter complete permanent / local residential address..."
                  />
                </div>
              </div>

              {/* SECTION 2: EMPLOYEE TYPE & DEPARTMENT */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> 2. Employment &amp; Contract Type
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employee Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWorkerForm({ ...workerForm, workerType: 'Permanent', contractorAgency: '' })}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                        workerForm.workerType === 'Permanent'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        workerForm.workerType === 'Permanent' ? 'bg-[#1b1f54] text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Permanent</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">PaySphere Direct Staff</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkerForm({ ...workerForm, workerType: 'Contractor' })}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                        workerForm.workerType === 'Contractor'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        workerForm.workerType === 'Contractor' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Contractor</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Vendor / Third-Party</div>
                      </div>
                    </button>
                  </div>
                </div>

                {workerForm.workerType === 'Contractor' && (
                  <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Contractor / Agency Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={workerForm.contractorAgency}
                      onChange={(e) => setWorkerForm({ ...workerForm, contractorAgency: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="e.g. Apex Manpower Services"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={workerForm.department}
                      onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Production">Production</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Quality">Quality</option>
                      <option value="Store">Store</option>
                      <option value="Dispatch">Dispatch</option>
                      <option value="Tool Room">Tool Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={workerForm.status}
                      onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Active">Active Duty</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Join Date</label>
                    <input
                      type="text"
                      value={workerForm.joinDate}
                      onChange={(e) => setWorkerForm({ ...workerForm, joinDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 15 Oct 2024"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SALARY PAYMENT BANK DETAILS (OPTIONAL) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" /> 3. Salary Payment Bank Details
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    Optional for direct transfer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={workerForm.bankAccount}
                      onChange={(e) => setWorkerForm({ ...workerForm, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 50100234918234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={workerForm.ifscCode}
                      onChange={(e) => setWorkerForm({ ...workerForm, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: GOVERNMENT STATUTORY & KYC (AADHAAR & PAN - OPTIONAL) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> 4. Identification &amp; Statutory KYC
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    Optional
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Card Number
                    </label>
                    <input
                      type="text"
                      value={workerForm.aadharNumber}
                      onChange={(e) => setWorkerForm({ ...workerForm, aadharNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 8392 4820 1928"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      value={workerForm.panNumber}
                      onChange={(e) => setWorkerForm({ ...workerForm, panNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  Save Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: EDIT WORKER ===================== */}
      {isEditModalOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Worker Details</h3>
                  <p className="text-xs text-slate-400">Worker ID: {workerForm.workerId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditWorkerSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Photo & Basics */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <div className="relative group shrink-0">
                  <div className="w-18 h-18 rounded-2xl overflow-hidden bg-white border border-indigo-200 shadow-sm flex items-center justify-center">
                    {workerForm.photo ? (
                      <img src={workerForm.photo} alt="Worker" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm cursor-pointer"
                    title="Change Photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-semibold text-slate-700 block">Change Worker Photo</span>
                  <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                    {SAMPLE_AVATARS.slice(0, 5).map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWorkerForm({ ...workerForm, photo: av })}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                          workerForm.photo === av ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="sample" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Worker ID</label>
                  <input
                    type="text"
                    required
                    value={workerForm.workerId}
                    onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={workerForm.designation}
                    onChange={(e) => setWorkerForm({ ...workerForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={workerForm.gender}
                    onChange={(e) => setWorkerForm({ ...workerForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="text"
                    value={workerForm.dob}
                    onChange={(e) => setWorkerForm({ ...workerForm, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={workerForm.address}
                  onChange={(e) => setWorkerForm({ ...workerForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Employee Type */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkerForm({ ...workerForm, workerType: 'Permanent', contractorAgency: '' })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                      workerForm.workerType === 'Permanent'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      workerForm.workerType === 'Permanent' ? 'bg-[#1b1f54] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Permanent</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">PaySphere Staff</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkerForm({ ...workerForm, workerType: 'Contractor' })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                      workerForm.workerType === 'Contractor'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      workerForm.workerType === 'Contractor' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Contractor</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Agency Worker</div>
                    </div>
                  </button>
                </div>

                {workerForm.workerType === 'Contractor' && (
                  <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-amber-900 mb-1">Contractor / Agency Name</label>
                    <input
                      type="text"
                      required
                      value={workerForm.contractorAgency}
                      onChange={(e) => setWorkerForm({ ...workerForm, contractorAgency: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={workerForm.department}
                      onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Production">Production</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Quality">Quality</option>
                      <option value="Store">Store</option>
                      <option value="Dispatch">Dispatch</option>
                      <option value="Tool Room">Tool Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={workerForm.status}
                      onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Join Date</label>
                    <input
                      type="text"
                      value={workerForm.joinDate}
                      onChange={(e) => setWorkerForm({ ...workerForm, joinDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Statutory */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">
                  Salary Banking &amp; Statutory IDs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account</label>
                    <input
                      type="text"
                      value={workerForm.bankAccount}
                      onChange={(e) => setWorkerForm({ ...workerForm, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={workerForm.ifscCode}
                      onChange={(e) => setWorkerForm({ ...workerForm, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Card</label>
                    <input
                      type="text"
                      value={workerForm.aadharNumber}
                      onChange={(e) => setWorkerForm({ ...workerForm, aadharNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card</label>
                    <input
                      type="text"
                      value={workerForm.panNumber}
                      onChange={(e) => setWorkerForm({ ...workerForm, panNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  Update Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: COMPREHENSIVE WORKER DETAILS MODAL ===================== */}
      {isViewModalOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Photo, Name & Badges */}
            <div className="bg-[#11133c] p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Large Worker Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 border-2 border-indigo-400/30 shadow-lg shrink-0">
                    {selectedWorker.photo ? (
                      <img src={selectedWorker.photo} alt={selectedWorker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-indigo-200">
                        {selectedWorker.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#11133c] ${
                    selectedWorker.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                </div>

                {/* Worker Identity Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-bold text-white leading-tight">{selectedWorker.name}</h3>
                    <span className="text-xs bg-white/15 px-2.5 py-0.5 rounded-full font-mono text-indigo-200 border border-white/10">
                      {selectedWorker.workerId}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-300 font-medium mt-1">
                    {selectedWorker.designation || 'Factory Technician'} • {selectedWorker.department} Department
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    {selectedWorker.workerType === 'Permanent' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Permanent Staff</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                        <HardHat className="w-3.5 h-3.5 text-amber-300" />
                        <span>Contractor ({selectedWorker.contractorAgency || 'Third Party'})</span>
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      selectedWorker.status === 'Active'
                        ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-200'
                        : 'bg-rose-500/20 border border-rose-400/30 text-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedWorker.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {selectedWorker.status === 'Active' ? 'Active On-Duty' : 'Inactive / Off'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Detail Tabs/Sections */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* SECTION A: Personal Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Personal Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Gender</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.gender || 'Male'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Date of Birth</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.dob || '15 Aug 1992'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contact Phone</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Residential Address</span>
                    <span className="text-xs font-medium text-slate-800 mt-0.5 block leading-relaxed">
                      {selectedWorker.address || 'Plot 42, Focal Point Phase IV, Ludhiana, Punjab'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: Employment & Contract Details */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Employment &amp; Plant Assignment
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.department}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Designation</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.designation || 'Worker'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Join Date</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.joinDate}</span>
                  </div>
                </div>
                {selectedWorker.workerType === 'Contractor' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-medium flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-amber-600" /> Agency / Vendor:
                    </span>
                    <span className="font-bold text-amber-900">{selectedWorker.contractorAgency || 'Apex Manpower Services'}</span>
                  </div>
                )}
              </div>

              {/* SECTION C: Salary Banking Details (Secure / Masked by Default) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600" /> Salary Payment Bank Account
                  </h4>
                  {selectedWorker.bankAccount && (
                    <button
                      type="button"
                      onClick={() => setShowBankDetails(!showBankDetails)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      {showBankDetails ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> <span>Hide Details</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> <span>Reveal Secure Details</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bank Account Number</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">
                      {selectedWorker.bankAccount
                        ? showBankDetails
                          ? selectedWorker.bankAccount
                          : `•••• •••• •••• ${selectedWorker.bankAccount.slice(-4)}`
                        : 'Not Provided (Cash Payment)'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">IFSC Code</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">
                      {selectedWorker.ifscCode
                        ? showBankDetails
                          ? selectedWorker.ifscCode
                          : '••••••••••'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION D: Statutory KYC (Aadhaar & PAN) */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Statutory KYC Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Aadhaar Card</span>
                    <span className="text-xs font-bold font-mono text-slate-800 mt-1 block">
                      {selectedWorker.aadharNumber ? selectedWorker.aadharNumber : 'Pending Submission'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">PAN Card</span>
                    <span className="text-xs font-bold font-mono uppercase text-slate-800 mt-1 block">
                      {selectedWorker.panNumber ? selectedWorker.panNumber : 'Pending Submission'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Plant Verification pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Unit: PaySphere Boparai Industries
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  HR Verified
                </span>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(selectedWorker);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit This Worker</span>
              </button>

              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-[#11133c] hover:bg-[#1a1e52] text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
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

export default WorkersPage;
