import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkerService, DepartmentService, DesignationService, ContractorService, PaymentService, WorkAreaService } from '../services/api';
import PaymentForumModal from '../components/PaymentForumModal';
import WorkerFullProfileView from '../components/WorkerFullProfileView';
import {
  validateName,
  validateMobile,
  validateDOB,
  calculateAgeFromDOB,
  validateDateOfJoining,
  validateAadhaar,
  maskAadhaar,
  validatePAN,
  validateBankAccount,
  maskBankAccount,
  validateIFSC,
  validateSalary,
  getNextWorkerId,
  sanitizeNameInput,
  sanitizeNumericInput,
  sanitizeAlphaNumericUpper,
  formatDateForInput,
  formatDateDisplay,
} from '../utils/validation';
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
  ReceiptText,
  FileText,
  MapPin,
  User,
  Hash,
  Landmark,
  Shield,
  Clock,
  Sparkles,
  EyeOff,
  Lock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
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

// Salary policies for Permanent Staff
export const PERMANENT_POLICIES = [
  {
    id: 'FIXED_ABSENT',
    title: 'Fully fixed salary with absent affecting their salary',
    desc: 'Monthly fixed salary. Any absence directly affects and reduces salary.',
    rateUnit: '₹ / Month',
  },
  {
    id: 'FIXED_ABSENT_OT',
    title: 'Fixed with absent and overtime (Sunday and Holiday)',
    desc: 'Fixed salary with absent deductions plus standard overtime on Sunday/Holidays.',
    rateUnit: '₹ / Month',
  },
  {
    id: 'TIME_BASED',
    title: 'Basic time based salary (Daily/Hourly)',
    desc: 'Wages calculated based on clocked hours or daily shift counts.',
    rateUnit: '₹ / Day or Hour',
  },
  {
    id: 'PIECE_RATE',
    title: 'Pcs rate salary',
    desc: 'Wages paid directly on units or piece count manufactured.',
    rateUnit: '₹ / Piece',
  },
];

// Salary policies for Contractor Workers
export const CONTRACTOR_POLICIES = [
  {
    id: 'PER_TONNAGE',
    title: 'Rs per tonnage',
    desc: 'Compensation calculated on total metric tonnage handled.',
    rateUnit: '₹ / Ton',
  },
  {
    id: 'PER_KG',
    title: 'Rs per kg',
    desc: 'Compensation calculated on total kilograms produced/cut.',
    rateUnit: '₹ / Kg',
  },
  {
    id: 'PER_HOUR',
    title: 'Rs per hour',
    desc: 'Contract labour rate per clocked working hour.',
    rateUnit: '₹ / Hour',
  },
  {
    id: 'PER_DAY',
    title: 'Rs per day',
    desc: 'Fixed contractor daily shift wage rate.',
    rateUnit: '₹ / Day',
  },
];

// Initial workers list (empty, ready for user testing and actual data entry)
const INITIAL_WORKERS = [];

export const WorkersPage = ({
  onNavigateBack,
  onLogout,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigatePayments,
  onNavigateReports,
  onNavigateAdministration,
  initialContractorAgency,
}) => {
  const [activeNav, setActiveNav] = useState('Workers');
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [workAreasList, setWorkAreasList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workerPayableSummary, setWorkerPayableSummary] = useState(null);

  // Load workers, departments, designations, contractors, and work areas from database
  const loadInitialData = () => {
    setIsLoading(true);
    Promise.all([
      WorkerService.getAll().catch(() => []),
      DepartmentService.getAll().catch(() => []),
      DesignationService.getAll().catch(() => []),
      ContractorService.getAll().catch(() => []),
      WorkAreaService.getAll().catch(() => []),
    ])
      .then(([fetchedWorkers, fetchedDepts, fetchedDesigs, fetchedContractors, fetchedWorkAreas]) => {
        if (Array.isArray(fetchedWorkers)) {
          setWorkers(fetchedWorkers);
        }
        if (Array.isArray(fetchedDepts)) {
          setDepartmentsList(fetchedDepts);
        }
        if (Array.isArray(fetchedDesigs)) {
          setDesignationsList(fetchedDesigs);
        }
        if (Array.isArray(fetchedContractors)) {
          setContractorsList(fetchedContractors);
        }
        if (Array.isArray(fetchedWorkAreas)) {
          setWorkAreasList(fetchedWorkAreas);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadInitialData();
  }, []);


  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedWorkArea, setSelectedWorkArea] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWorkerType, setSelectedWorkerType] = useState('All');
  const [workerSortConfig, setWorkerSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Column Sort Toggle Handler (Name only)
  const handleWorkerSort = () => {
    setWorkerSortConfig((prev) => ({
      key: 'name',
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  // Helper to render sort arrow beside Worker Name column header
  const renderSortIcon = () => {
    return workerSortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
    );
  };

  // Pagination state: now 10 rows per page as requested!
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingWorkerProfile, setViewingWorkerProfile] = useState(null);
  const [payWorkerModal, setPayWorkerModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Photo & Document upload refs for Add / Edit
  const fileInputRef = useRef(null);
  const aadharFileInputRef = useRef(null);
  const panFileInputRef = useRef(null);
  const [adminDocPreview, setAdminDocPreview] = useState(null);
  const [sameAsResidential, setSameAsResidential] = useState(false);

  // Form state with all comprehensive fields requested by user
  const initialFormState = {
    workerId: '',
    name: '',
    photo: '',
    department: '',
    designation: '',
    workArea: '',
    workerType: 'Permanent',
    gender: 'Male',
    dob: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    phone: '',
    emergencyContact: '',
    address: '',
    permanentAddress: '',
    contractorAgency: '',
    // Salary Policy & Rate (default 0)
    salaryPolicy: 'FIXED_ABSENT',
    policyRate: '0',
    // Optional salary & payment banking fields
    bankAccount: '',
    ifscCode: '',
    // Optional statutory & verification fields
    aadharNumber: '',
    panNumber: '',
    aadharDoc: '',
    panDoc: '',
  };

  const [workerForm, setWorkerForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Central validation for Worker profile
  const validateWorkerForm = (form) => {
    const errors = {};
    const nameErr = validateName(form.name, 'Full Name', 2, 100, true);
    if (nameErr) errors.name = nameErr;

    if (!form.department) {
      errors.department = 'Please select a department.';
    }
    if (!form.designation) {
      errors.designation = 'Please select a designation.';
    }
    if (!form.workArea) {
      errors.workArea = 'Please select a work area.';
    }
    if (form.workerType === 'Contractor' && !form.contractorAgency) {
      errors.contractorAgency = 'Please select a contractor agency.';
    }
    // Phone number is mandatory
    const phoneErr = validateMobile(form.phone, 'Phone number', true);
    if (phoneErr) errors.phone = phoneErr;

    // Address is mandatory
    if (!form.address || !form.address.trim()) {
      errors.address = 'Current residential address is required.';
    }

    if (form.emergencyContact && form.emergencyContact.trim()) {
      const emErr = validateMobile(form.emergencyContact, 'Emergency contact', false);
      if (emErr) errors.emergencyContact = emErr;
    }
    if (form.dob && form.dob.trim()) {
      const dobErr = validateDOB(form.dob, 18, 100);
      if (dobErr) errors.dob = dobErr;
    }
    if (form.joinDate && form.joinDate.trim()) {
      const joinErr = validateDateOfJoining(form.joinDate, false);
      if (joinErr) errors.joinDate = joinErr;
    }
    if (form.aadharNumber && form.aadharNumber.trim()) {
      const aadharErr = validateAadhaar(form.aadharNumber, false);
      if (aadharErr) errors.aadharNumber = aadharErr;
    }
    if (form.panNumber && form.panNumber.trim()) {
      const panErr = validatePAN(form.panNumber, false);
      if (panErr) errors.panNumber = panErr;
    }
    if (form.bankAccount && form.bankAccount.trim()) {
      const bankErr = validateBankAccount(form.bankAccount, false);
      if (bankErr) errors.bankAccount = bankErr;
    }
    if (form.ifscCode && form.ifscCode.trim()) {
      const ifscErr = validateIFSC(form.ifscCode, false);
      if (ifscErr) errors.ifscCode = ifscErr;
    }
    if (form.policyRate !== undefined && form.policyRate !== null && String(form.policyRate).trim() !== '') {
      const rateErr = validateSalary(form.policyRate, 'Salary / Policy rate', true, true);
      if (rateErr) errors.policyRate = rateErr;
    }
    return errors;
  };

  // Available designations based on selected department in form
  const availableDesignations = useMemo(() => {
    if (!workerForm.department) return designationsList;
    const deptObj = departmentsList.find(
      (d) => d.name === workerForm.department || String(d.id) === String(workerForm.department)
    );
    return designationsList.filter((d) => {
      const matchName = (d.department_name || d.departmentName) === workerForm.department;
      const matchId = deptObj && (String(d.department) === String(deptObj.id) || String(d.departmentId) === String(deptObj.id));
      return matchName || matchId;
    });
  }, [designationsList, departmentsList, workerForm.department]);

  // Available work areas (every department comes under each work area)
  const availableWorkAreas = useMemo(() => {
    return workAreasList.filter((a) => a.status !== 'Inactive');
  }, [workAreasList]);


  // Nav Items matching AdminDashboard
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

  // Dynamic Metrics
  const totalWorkersCount = workers.length;
  const activeWorkersCount = workers.filter(w => w.status === 'Active').length;
  const inactiveWorkersCount = workers.filter(w => w.status === 'Inactive').length;

  // Filtering & Sorting (Search STRICTLY on Name or ID/Code only)
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = workers.filter((worker) => {
      const matchesSearch =
        !q ||
        (worker.name && worker.name.toLowerCase().includes(q)) ||
        (worker.workerId && worker.workerId.toLowerCase().includes(q));

      const matchesDept =
        selectedDepartment === 'All' || worker.department === selectedDepartment;

      const matchesWorkArea =
        selectedWorkArea === 'All' ||
        (worker.workArea || worker.work_area) === selectedWorkArea;

      const matchesStatus =
        selectedStatus === 'All' || worker.status === selectedStatus;

      const matchesType =
        selectedWorkerType === 'All' || worker.workerType === selectedWorkerType;

      return matchesSearch && matchesDept && matchesWorkArea && matchesStatus && matchesType;
    });

    return [...list].sort((a, b) => {
      const factor = workerSortConfig.direction === 'asc' ? 1 : -1;
      return factor * (a.name || '').localeCompare(b.name || '');
    });
  }, [workers, searchQuery, selectedDepartment, selectedWorkArea, selectedStatus, selectedWorkerType, workerSortConfig]);

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
    setSelectedWorkArea('All');
    setSelectedStatus('All');
    setSelectedWorkerType('All');
    setWorkerSortConfig({ key: 'name', direction: 'asc' });
    setCurrentPage(1);
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerForm(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle KYC Document File Upload (Aadhaar & PAN)
  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerForm(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (departmentsList.length === 0) {
      alert('No departments found! You must create at least one Department and Designation first before adding workers.');
      if (onNavigateDepartment) {
        onNavigateDepartment();
      }
      return;
    }
    if (designationsList.length === 0) {
      alert('No designations found! Please create a Designation in the Department & Designation page first.');
      if (onNavigateDepartment) {
        onNavigateDepartment();
      }
      return;
    }

    const formattedId = getNextWorkerId(workers);
    const defaultDept = departmentsList[0]?.name || '';
    const matchingDesigs = designationsList.filter(
      (d) => (d.department_name || d.departmentName) === defaultDept
    );
    const defaultDesig = matchingDesigs.length > 0 ? matchingDesigs[0].title : (designationsList[0]?.title || '');
    const matchingAreas = workAreasList.filter(
      (a) => !a.department || a.department === 'All Departments' || a.department === defaultDept
    );
    const defaultWorkArea = matchingAreas.length > 0 ? matchingAreas[0].name : (workAreasList[0]?.name || '');
    const defaultContractor = initialContractorAgency || contractorsList[0]?.name || '';
    const defaultWorkerType = initialContractorAgency ? 'Contractor' : 'Permanent';
    const defaultSalaryPolicy = initialContractorAgency ? 'PER_TONNAGE' : 'FIXED_ABSENT';
    const defaultPolicyRate = '0';

    setFormErrors({});
    setSameAsResidential(false);
    setWorkerForm({
      ...initialFormState,
      workerId: formattedId,
      photo: '',
      department: defaultDept,
      designation: defaultDesig,
      workArea: defaultWorkArea,
      workerType: defaultWorkerType,
      contractorAgency: defaultContractor,
      gender: 'Male',
      dob: '',
      joinDate: new Date().toISOString().split('T')[0],
      address: '',
      permanentAddress: '',
      emergencyContact: '',
      phone: '',
      salaryPolicy: defaultSalaryPolicy,
      policyRate: defaultPolicyRate,
      bankAccount: '',
      ifscCode: '',
      aadharNumber: '',
      panNumber: '',
      aadharDoc: '',
      panDoc: '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Worker
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateWorkerForm(workerForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        workerId: workerForm.workerId.trim() || `W${String(workers.length + 1).padStart(3, '0')}`,
        name: workerForm.name.trim(),
        photo: workerForm.photo || SAMPLE_AVATARS[0],
        department: workerForm.department,
        designation: workerForm.designation.trim() || 'Worker',
        workArea: workerForm.workArea || '',
        workerType: workerForm.workerType,
        gender: workerForm.gender,
        dob: workerForm.dob || '',
        address: workerForm.address || '',
        permanentAddress: workerForm.permanentAddress || '',
        contractorAgency: workerForm.workerType === 'Contractor' ? workerForm.contractorAgency : '',
        joinDate: workerForm.joinDate,
        status: workerForm.status,
        phone: workerForm.phone ? workerForm.phone.trim() : '',
        emergencyContact: workerForm.emergencyContact ? workerForm.emergencyContact.trim() : '',
        salaryPolicy: workerForm.salaryPolicy || (workerForm.workerType === 'Contractor' ? 'PER_TONNAGE' : 'FIXED_ABSENT'),
        policyRate: parseFloat(workerForm.policyRate) || 0,
        bankAccount: workerForm.bankAccount ? workerForm.bankAccount.trim() : '',
        ifscCode: workerForm.ifscCode ? workerForm.ifscCode.toUpperCase().trim() : '',
        aadharNumber: workerForm.aadharNumber ? workerForm.aadharNumber.trim() : '',
        panNumber: workerForm.panNumber ? workerForm.panNumber.toUpperCase().trim() : '',
        aadharDoc: workerForm.aadharDoc || '',
        panDoc: workerForm.panDoc || '',
      };

      const created = await WorkerService.create(payload);
      setWorkers([created, ...workers]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(`Error creating worker: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (worker) => {
    setSelectedWorker(worker);
    setFormErrors({});

    const safeDob = formatDateForInput(
      worker.dob || worker.date_of_birth || worker.dateOfBirth || worker.dob_raw || worker.dobRaw
    );
    const safeJoinDate = formatDateForInput(
      worker.joinDate || worker.joining_date || worker.joiningDate || worker.join_date || worker.joinDateRaw
    );

    const safeAddress = worker.address || '';
    const safePermanentAddress = worker.permanentAddress || worker.permanent_address || '';
    setSameAsResidential(Boolean(safeAddress && safePermanentAddress && safeAddress.trim() === safePermanentAddress.trim()));

    setWorkerForm({
      workerId: worker.workerId || worker.worker_id || '',
      name: worker.name || '',
      photo: worker.photo || '',
      department: worker.department || '',
      designation: worker.designation || '',
      workArea: worker.workArea || worker.work_area || '',
      workerType: worker.workerType || worker.worker_type || 'Permanent',
      gender: worker.gender || 'Male',
      dob: safeDob,
      address: safeAddress,
      permanentAddress: safePermanentAddress,
      contractorAgency: worker.contractorAgency || worker.contractor_agency || '',
      joinDate: safeJoinDate || new Date().toISOString().split('T')[0],
      status: worker.status || 'Active',
      phone: worker.phone || '',
      emergencyContact: worker.emergencyContact || worker.emergency_contact || '',
      salaryPolicy: worker.salaryPolicy || worker.salary_policy || (worker.workerType === 'Contractor' ? 'PER_TONNAGE' : 'FIXED_ABSENT'),
      policyRate: String(worker.policyRate || worker.policy_rate || worker.baseWage || worker.base_wage || 15000),
      bankAccount: worker.bankAccount || worker.bank_account || '',
      ifscCode: worker.ifscCode || worker.ifsc_code || '',
      aadharNumber: worker.aadharNumber || worker.aadhar_number || '',
      panNumber: worker.panNumber || worker.pan_number || '',
      aadharDoc: worker.aadharDoc || worker.aadhar_doc || '',
      panDoc: worker.panDoc || worker.pan_doc || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Worker
  const handleEditWorkerSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateWorkerForm(workerForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        workerId: workerForm.workerId,
        name: workerForm.name.trim(),
        photo: workerForm.photo || selectedWorker.photo,
        department: workerForm.department,
        designation: workerForm.designation.trim() || 'Worker',
        workArea: workerForm.workArea || '',
        workerType: workerForm.workerType,
        gender: workerForm.gender,
        dob: formatDateForInput(workerForm.dob) || '',
        address: workerForm.address || '',
        permanentAddress: workerForm.permanentAddress || '',
        contractorAgency: workerForm.workerType === 'Contractor' ? workerForm.contractorAgency : '',
        joinDate: formatDateForInput(workerForm.joinDate) || '',
        joining_date: formatDateForInput(workerForm.joinDate) || '',
        status: workerForm.status,
        phone: workerForm.phone ? workerForm.phone.trim() : '',
        emergencyContact: workerForm.emergencyContact ? workerForm.emergencyContact.trim() : '',
        salaryPolicy: workerForm.salaryPolicy || (workerForm.workerType === 'Contractor' ? 'PER_TONNAGE' : 'FIXED_ABSENT'),
        policyRate: parseFloat(workerForm.policyRate) || 0,
        bankAccount: workerForm.bankAccount ? workerForm.bankAccount.trim() : '',
        ifscCode: workerForm.ifscCode ? workerForm.ifscCode.toUpperCase().trim() : '',
        aadharNumber: workerForm.aadharNumber ? workerForm.aadharNumber.trim() : '',
        panNumber: workerForm.panNumber ? workerForm.panNumber.toUpperCase().trim() : '',
        aadharDoc: workerForm.aadharDoc || '',
        panDoc: workerForm.panDoc || '',
      };

      const updated = await WorkerService.update(selectedWorker.id, payload);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === selectedWorker.id
            ? {
                ...w,
                ...updated,
                ...payload,
                dob: payload.dob || updated?.dob || w.dob,
                joinDate: payload.joinDate || updated?.joinDate || w.joinDate,
                joining_date: payload.joining_date || updated?.joining_date || w.joining_date,
              }
            : w
        )
      );
      setIsEditModalOpen(false);
      setSelectedWorker(null);
    } catch (err) {
      alert(`Error updating worker: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detailed Worker View (Full Page Profile)
  const handleOpenViewModal = (worker) => {
    setSelectedWorker(worker);
    setViewingWorkerProfile(worker);
    setShowBankDetails(false);
    setWorkerPayableSummary(null);
    if (worker?.worker_id) {
      PaymentService.getWorkerPayableSummary(worker.worker_id)
        .then(res => setWorkerPayableSummary(res))
        .catch(err => console.warn('Could not fetch worker payment summary:', err));
    }
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
                    } else if (item.name === 'Payment Entry' && onNavigatePayments) {
                      onNavigatePayments();
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
      {viewingWorkerProfile ? (
        <WorkerFullProfileView
          worker={viewingWorkerProfile}
          onBack={() => setViewingWorkerProfile(null)}
          onEdit={(w) => {
            setViewingWorkerProfile(null);
            handleOpenEditModal(w);
          }}
          onWorkerUpdated={() => {
            loadInitialData();
          }}
        />
      ) : (
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
              {/* Search Bar (STRICT Name or ID/Code only) */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by worker name or ID/code..."
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
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedWorkArea}
                  onChange={(e) => {
                    setSelectedWorkArea(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Work Areas</option>
                  {workAreasList.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
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
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4 pl-6 w-12">#</th>
                    <th
                      onClick={handleWorkerSort}
                      className="py-3.5 px-4 cursor-pointer group hover:text-indigo-600 transition"
                      title="Click to sort by Worker Name"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Worker
                        {renderSortIcon()}
                      </span>
                    </th>
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

                          {/* 4. Department & Work Area */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-medium text-slate-800">{worker.department || '—'}</div>
                            {(worker.workArea || worker.work_area) && (
                              <div className="text-[11px] text-indigo-700 font-medium flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{worker.workArea || worker.work_area}</span>
                              </div>
                            )}
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
                            {formatDateDisplay(worker.joinDateFormatted || worker.joinDate || worker.joining_date)}
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
                            <div className="inline-flex items-center justify-center gap-1.5">
                              {/* Small Sign of Pay Option */}
                              <button
                                type="button"
                                onClick={() => setPayWorkerModal(worker)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title={`Make Payment to ${worker.name}`}
                              >
                                <Banknote className="w-4 h-4" />
                              </button>

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
      )}

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
                        <User className="w-10 h-10 text-slate-300 stroke-[1.5]" />
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

                  {/* Photo Instructions & Status */}
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-slate-700 block">Worker Profile Photograph</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {workerForm.photo ? 'Real worker photo selected' : 'No photo uploaded. Upload an actual worker picture (JPG/PNG).'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{workerForm.photo ? 'Change Photo' : 'Upload Worker Photo'}</span>
                      </button>
                      {workerForm.photo && (
                        <button
                          type="button"
                          onClick={() => setWorkerForm((prev) => ({ ...prev, photo: '' }))}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID, Full Name, Designation, Gender, DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Worker ID <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        Auto-generated
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={workerForm.workerId}
                      onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkerForm({ ...workerForm, name: val });
                        if (/\d/.test(val)) {
                          setFormErrors((prev) => ({ ...prev, name: 'Numeric values are not allowed in name.' }));
                        } else if (formErrors.name) {
                          setFormErrors((prev) => ({ ...prev, name: null }));
                        }
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                      placeholder="e.g. Rahul Kumar"
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.name}</p>
                    )}
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
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Date of Birth (DOB)</label>
                      {calculateAgeFromDOB(workerForm.dob) !== null && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          Age: {calculateAgeFromDOB(workerForm.dob)} yrs
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={workerForm.dob}
                      onChange={(e) => {
                        setWorkerForm({ ...workerForm, dob: e.target.value });
                        if (formErrors.dob) setFormErrors({ ...formErrors, dob: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.dob ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer`}
                    />
                    {formErrors.dob && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.dob}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={workerForm.phone}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 10);
                        setWorkerForm({ ...workerForm, phone: clean });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="e.g. 9812345678"
                      value={workerForm.emergencyContact}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 10);
                        setWorkerForm({ ...workerForm, emergencyContact: clean });
                        if (formErrors.emergencyContact) setFormErrors({ ...formErrors, emergencyContact: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.emergencyContact ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.emergencyContact && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.emergencyContact}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Residential Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={workerForm.address}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkerForm((prev) => ({
                          ...prev,
                          address: val,
                          ...(sameAsResidential ? { permanentAddress: val } : {}),
                        }));
                        if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                      placeholder="Current local address in Ludhiana / Punjab..."
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Residential Address</label>
                    <textarea
                      rows={2}
                      value={workerForm.permanentAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkerForm((prev) => ({ ...prev, permanentAddress: val }));
                        if (sameAsResidential && val !== workerForm.address) {
                          setSameAsResidential(false);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="Permanent hometown village/city address..."
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={sameAsResidential}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsResidential(checked);
                            if (checked) {
                              setWorkerForm((prev) => ({
                                ...prev,
                                permanentAddress: prev.address || '',
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-medium">Same as Residential Address</span>
                      </label>
                      {sameAsResidential && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Synced
                        </span>
                      )}
                    </div>
                  </div>
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
                      onClick={() => setWorkerForm({
                        ...workerForm,
                        workerType: 'Permanent',
                        contractorAgency: '',
                        salaryPolicy: 'FIXED_ABSENT',
                        policyRate: workerForm.policyRate || '15000'
                      })}
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
                      onClick={() => setWorkerForm({
                        ...workerForm,
                        workerType: 'Contractor',
                        salaryPolicy: 'PER_TONNAGE',
                        policyRate: workerForm.policyRate || '500'
                      })}
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
                      Contractor Agency <span className="text-rose-500">*</span>
                    </label>
                    {contractorsList.length === 0 ? (
                      <div className="p-3 bg-amber-100 rounded-lg text-amber-900 text-xs flex items-center justify-between">
                        <span>No contractors registered yet. Please add a contractor first in Contractor management.</span>
                        {onNavigateContractor && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddModalOpen(false);
                              onNavigateContractor();
                            }}
                            className="font-bold underline text-amber-900 hover:text-black ml-2 cursor-pointer"
                          >
                            Add Contractor
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.contractorAgency}
                        onChange={(e) => setWorkerForm({ ...workerForm, contractorAgency: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Select Registered Contractor --</option>
                        {contractorsList.map((c) => (
                          <option key={c.id || c.contractor_id} value={c.name}>
                            {c.name} {c.contractor_id ? `(${c.contractor_id})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {departmentsList.length === 0 ? (
                  <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">No departments created yet</span>
                      <span className="text-[11px] text-rose-600">You must first create a department and designation before registering workers.</span>
                    </div>
                    {onNavigateDepartment && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          onNavigateDepartment();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 ml-3"
                      >
                        Create Department
                      </button>
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={workerForm.department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const deptObj = departmentsList.find(
                          (d) => d.name === newDept || String(d.id) === String(newDept)
                        );
                        const matchingDesigs = designationsList.filter((d) => {
                          const matchName = (d.department_name || d.departmentName) === newDept;
                          const matchId = deptObj && (String(d.department) === String(deptObj.id) || String(d.departmentId) === String(deptObj.id));
                          return matchName || matchId;
                        });
                        setWorkerForm({
                          ...workerForm,
                          department: newDept,
                          designation: matchingDesigs.length > 0 ? matchingDesigs[0].title : '',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Department --</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    {availableDesignations.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                        <span>No designations under this dept.</span>
                        {onNavigateDepartment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditModalOpen(false);
                              onNavigateDepartment();
                            }}
                            className="font-bold underline text-amber-900 ml-1 cursor-pointer shrink-0"
                          >
                            Add Designation
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.designation}
                        onChange={(e) => {
                          setWorkerForm({ ...workerForm, designation: e.target.value });
                          if (formErrors.designation) setFormErrors({ ...formErrors, designation: null });
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border ${
                          formErrors.designation ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                        } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                      >
                        <option value="">-- Select Designation --</option>
                        {availableDesignations.map((d) => (
                          <option key={d.id} value={d.title}>
                            {d.title} {d.code ? `(${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.designation && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.designation}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Work Area <span className="text-rose-500">*</span>
                    </label>
                    {availableWorkAreas.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                        <span>No work areas available.</span>
                        {onNavigateDepartment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddModalOpen(false);
                              onNavigateDepartment();
                            }}
                            className="font-bold underline text-amber-900 ml-1 cursor-pointer shrink-0"
                          >
                            Add Work Area
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.workArea}
                        onChange={(e) => setWorkerForm({ ...workerForm, workArea: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Select Work Area --</option>
                        {availableWorkAreas.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} {a.code ? `[${a.code}]` : ''}
                          </option>
                        ))}
                      </select>
                    )}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Join Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={workerForm.joinDate}
                      onChange={(e) => {
                        setWorkerForm({ ...workerForm, joinDate: e.target.value });
                        if (formErrors.joinDate) setFormErrors({ ...formErrors, joinDate: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.joinDate ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.joinDate && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.joinDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: SALARY POLICY CONFIGURATION */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> 3. Salary Policy &amp; Wage Model <span className="text-rose-500">*</span>
                  </h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                    {workerForm.workerType === 'Permanent' ? 'Staff Policy Selection' : 'Contractor Work Model'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Choose the compensation formula that dictates monthly payroll calculations:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(workerForm.workerType === 'Permanent' ? PERMANENT_POLICIES : CONTRACTOR_POLICIES).map((policy) => {
                    const isSelected = workerForm.salaryPolicy === policy.id;
                    return (
                      <div
                        key={policy.id}
                        onClick={() => setWorkerForm({ ...workerForm, salaryPolicy: policy.id })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {policy.title}
                          </span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">{policy.desc}</p>
                        <div className="mt-2 text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                          Unit: {policy.rateUnit}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Policy Rate / Wage Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Default is 0 — set custom rate as required
                    </span>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={workerForm.policyRate}
                      onChange={(e) => setWorkerForm({ ...workerForm, policyRate: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: SALARY PAYMENT BANK DETAILS (OPTIONAL) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" /> 4. Salary Payment Bank Details
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
                      inputMode="numeric"
                      maxLength={18}
                      value={workerForm.bankAccount}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 18);
                        setWorkerForm({ ...workerForm, bankAccount: clean });
                        if (formErrors.bankAccount) setFormErrors({ ...formErrors, bankAccount: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.bankAccount ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.bankAccount && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.bankAccount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={workerForm.ifscCode}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 11);
                        setWorkerForm({ ...workerForm, ifscCode: clean });
                        if (formErrors.ifscCode) setFormErrors({ ...formErrors, ifscCode: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.ifscCode ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.ifscCode && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.ifscCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 5: GOVERNMENT STATUTORY & KYC (AADHAAR & PAN - OPTIONAL) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> 5. Identification &amp; Statutory KYC
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
                      inputMode="numeric"
                      maxLength={12}
                      value={workerForm.aadharNumber}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 12);
                        setWorkerForm({ ...workerForm, aadharNumber: clean });
                        if (formErrors.aadharNumber) setFormErrors({ ...formErrors, aadharNumber: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.aadharNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.aadharNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.aadharNumber}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload Aadhaar Card (Image/PDF)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={aadharFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'aadharDoc')}
                      className="hidden"
                    />
                    {workerForm.aadharDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Aadhaar Card Attached</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: 'Aadhaar Card Document', data: workerForm.aadharDoc })}
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorkerForm({ ...workerForm, aadharDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => aadharFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:border-indigo-400 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Select Aadhaar Card File</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={workerForm.panNumber}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 10);
                        setWorkerForm({ ...workerForm, panNumber: clean });
                        if (formErrors.panNumber) setFormErrors({ ...formErrors, panNumber: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.panNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.panNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.panNumber}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload PAN Card (Image/PDF)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={panFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'panDoc')}
                      className="hidden"
                    />
                    {workerForm.panDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">PAN Card Attached</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: 'PAN Card Document', data: workerForm.panDoc })}
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorkerForm({ ...workerForm, panDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => panFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:border-indigo-400 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Select PAN Card File</span>
                      </button>
                    )}
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
                  disabled={isSubmitting}
                  className={`px-5 py-2 ${
                    isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  } text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition`}
                >
                  {isSubmitting ? 'Saving Profile...' : 'Save Worker Profile'}
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
                    title="Upload Photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-semibold text-slate-700 block">Worker Photo</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload official worker picture. If no photo is uploaded, profile shows no avatar.
                  </p>
                  {workerForm.photo && (
                    <button
                      type="button"
                      onClick={() => setWorkerForm({ ...workerForm, photo: '' })}
                      className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                    </button>
                  )}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
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
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = sanitizeNameInput(val);
                      setWorkerForm({ ...workerForm, name: clean });
                      if (/\d/.test(val)) {
                        setFormErrors((prev) => ({ ...prev, name: 'Numeric values are not allowed in name.' }));
                      } else if (formErrors.name) {
                        setFormErrors((prev) => ({ ...prev, name: null }));
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border ${
                      formErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                    } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.name}</p>
                  )}
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
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Date of Birth (DOB)</label>
                    {calculateAgeFromDOB(workerForm.dob) !== null && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        Age: {calculateAgeFromDOB(workerForm.dob)} yrs
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={workerForm.dob}
                    onChange={(e) => {
                      setWorkerForm({ ...workerForm, dob: e.target.value });
                      if (formErrors.dob) setFormErrors({ ...formErrors, dob: null });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border ${
                      formErrors.dob ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                    } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.dob && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.dob}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={workerForm.phone}
                    onChange={(e) => {
                      const clean = sanitizeNumericInput(e.target.value, 10);
                      setWorkerForm({ ...workerForm, phone: clean });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border ${
                      formErrors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                    } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={workerForm.emergencyContact}
                    onChange={(e) => {
                      const clean = sanitizeNumericInput(e.target.value, 10);
                      setWorkerForm({ ...workerForm, emergencyContact: clean });
                      if (formErrors.emergencyContact) setFormErrors({ ...formErrors, emergencyContact: null });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border ${
                      formErrors.emergencyContact ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                    } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.emergencyContact && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.emergencyContact}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={workerForm.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWorkerForm((prev) => ({
                        ...prev,
                        address: val,
                        ...(sameAsResidential ? { permanentAddress: val } : {}),
                      }));
                      if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border ${
                      formErrors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                    } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.address}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    value={workerForm.permanentAddress}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWorkerForm((prev) => ({ ...prev, permanentAddress: val }));
                      if (sameAsResidential && val !== workerForm.address) {
                        setSameAsResidential(false);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={sameAsResidential}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsResidential(checked);
                          if (checked) {
                            setWorkerForm((prev) => ({
                              ...prev,
                              permanentAddress: prev.address || '',
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="font-medium">Same as Residential Address</span>
                    </label>
                    {sameAsResidential && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Synced
                      </span>
                    )}
                  </div>
                </div>
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
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Contractor Agency <span className="text-rose-500">*</span>
                    </label>
                    {contractorsList.length === 0 ? (
                      <div className="p-3 bg-amber-100 rounded-lg text-amber-900 text-xs">
                        No registered contractors found. Please create a contractor in Contractor management.
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.contractorAgency}
                        onChange={(e) => setWorkerForm({ ...workerForm, contractorAgency: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Select Registered Contractor --</option>
                        {contractorsList.map((c) => (
                          <option key={c.id || c.contractor_id} value={c.name}>
                            {c.name} {c.contractor_id ? `(${c.contractor_id})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={workerForm.department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const deptObj = departmentsList.find(
                          (d) => d.name === newDept || String(d.id) === String(newDept)
                        );
                        const matchingDesigs = designationsList.filter((d) => {
                          const matchName = (d.department_name || d.departmentName) === newDept;
                          const matchId = deptObj && (String(d.department) === String(deptObj.id) || String(d.departmentId) === String(deptObj.id));
                          return matchName || matchId;
                        });
                        setWorkerForm({
                          ...workerForm,
                          department: newDept,
                          designation: matchingDesigs.length > 0 ? matchingDesigs[0].title : '',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Department --</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    {availableDesignations.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                        <span>No designations under this dept.</span>
                        {onNavigateDepartment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditModalOpen(false);
                              onNavigateDepartment();
                            }}
                            className="font-bold underline text-amber-900 ml-1 cursor-pointer shrink-0"
                          >
                            Add Designation
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.designation}
                        onChange={(e) => {
                          setWorkerForm({ ...workerForm, designation: e.target.value });
                          if (formErrors.designation) setFormErrors({ ...formErrors, designation: null });
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border ${
                          formErrors.designation ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                        } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                      >
                        <option value="">-- Select Designation --</option>
                        {availableDesignations.map((d) => (
                          <option key={d.id} value={d.title}>
                            {d.title} {d.code ? `(${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.designation && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.designation}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Work Area <span className="text-rose-500">*</span>
                    </label>
                    {availableWorkAreas.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                        <span>No work areas available.</span>
                        {onNavigateDepartment && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddModalOpen(false);
                              onNavigateDepartment();
                            }}
                            className="font-bold underline text-amber-900 ml-1 cursor-pointer shrink-0"
                          >
                            Add Work Area
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={workerForm.workArea}
                        onChange={(e) => setWorkerForm({ ...workerForm, workArea: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Select Work Area --</option>
                        {availableWorkAreas.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} {a.code ? `[${a.code}]` : ''}
                          </option>
                        ))}
                      </select>
                    )}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Join Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={workerForm.joinDate}
                      onChange={(e) => {
                        setWorkerForm({ ...workerForm, joinDate: e.target.value });
                        if (formErrors.joinDate) setFormErrors({ ...formErrors, joinDate: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.joinDate ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.joinDate && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.joinDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary Policy & Rate Configuration */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> Salary Policy &amp; Wage Model <span className="text-rose-500">*</span>
                  </h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                    {workerForm.workerType === 'Permanent' ? 'Staff Policy' : 'Contractor Model'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(workerForm.workerType === 'Permanent' ? PERMANENT_POLICIES : CONTRACTOR_POLICIES).map((policy) => {
                    const isSelected = workerForm.salaryPolicy === policy.id;
                    return (
                      <div
                        key={policy.id}
                        onClick={() => setWorkerForm({ ...workerForm, salaryPolicy: policy.id })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {policy.title}
                          </span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">{policy.desc}</p>
                        <div className="mt-2 text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                          Unit: {policy.rateUnit}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Policy Rate / Wage Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Default is 0 — set custom rate as required
                    </span>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={workerForm.policyRate}
                      onChange={(e) => setWorkerForm({ ...workerForm, policyRate: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      placeholder="0"
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
                      inputMode="numeric"
                      maxLength={18}
                      value={workerForm.bankAccount}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 18);
                        setWorkerForm({ ...workerForm, bankAccount: clean });
                        if (formErrors.bankAccount) setFormErrors({ ...formErrors, bankAccount: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.bankAccount ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.bankAccount && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.bankAccount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={workerForm.ifscCode}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 11);
                        setWorkerForm({ ...workerForm, ifscCode: clean });
                        if (formErrors.ifscCode) setFormErrors({ ...formErrors, ifscCode: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.ifscCode ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.ifscCode && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.ifscCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Card Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={workerForm.aadharNumber}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 12);
                        setWorkerForm({ ...workerForm, aadharNumber: clean });
                        if (formErrors.aadharNumber) setFormErrors({ ...formErrors, aadharNumber: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.aadharNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.aadharNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.aadharNumber}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload Aadhaar Card (Image/PDF)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    {workerForm.aadharDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Aadhaar Card Attached</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: 'Aadhaar Card Document', data: workerForm.aadharDoc })}
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorkerForm({ ...workerForm, aadharDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => aadharFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:border-indigo-400 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Select Aadhaar Card File</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={workerForm.panNumber}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 10);
                        setWorkerForm({ ...workerForm, panNumber: clean });
                        if (formErrors.panNumber) setFormErrors({ ...formErrors, panNumber: null });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        formErrors.panNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {formErrors.panNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.panNumber}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload PAN Card (Image/PDF)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    {workerForm.panDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">PAN Card Attached</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: 'PAN Card Document', data: workerForm.panDoc })}
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorkerForm({ ...workerForm, panDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => panFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:border-indigo-400 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Select PAN Card File</span>
                      </button>
                    )}
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
                  disabled={isSubmitting}
                  className={`px-5 py-2 ${
                    isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  } text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition`}
                >
                  {isSubmitting ? 'Updating Profile...' : 'Update Worker Profile'}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Gender</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.gender || 'Male'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Date of Birth</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                      {formatDateDisplay(selectedWorker.dobFormatted || selectedWorker.dob || selectedWorker.date_of_birth)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contact Phone</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedWorker.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Emergency Phone</span>
                    <span className="text-xs font-bold text-rose-600 mt-0.5 block">{selectedWorker.emergencyContact || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Current Address</span>
                      <span className="text-xs font-medium text-slate-800 mt-0.5 block leading-relaxed">
                        {selectedWorker.address || 'Industrial Focal Point, Ludhiana, Punjab'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Permanent Hometown Address</span>
                      <span className="text-xs font-medium text-slate-800 mt-0.5 block leading-relaxed">
                        {selectedWorker.permanentAddress || 'Same as current address'}
                      </span>
                    </div>
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
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                      {formatDateDisplay(selectedWorker.joinDateFormatted || selectedWorker.joinDate || selectedWorker.joining_date)}
                    </span>
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

                {/* Salary Policy View Box */}
                <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Assigned Salary Policy</span>
                    <span className="text-xs font-bold text-indigo-950 mt-0.5 block">
                      {selectedWorker.salaryPolicy
                        ? [...PERMANENT_POLICIES, ...CONTRACTOR_POLICIES].find(p => p.id === selectedWorker.salaryPolicy)?.title || selectedWorker.salaryPolicy
                        : 'Fully fixed salary with absent affecting their salary'}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Policy Base Wage</span>
                    <span className="text-sm font-extrabold text-indigo-600 font-mono">
                      ₹ {selectedWorker.policyRate || selectedWorker.baseWage || 0}
                    </span>
                  </div>
                </div>
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
                          : maskBankAccount(selectedWorker.bankAccount)
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
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Statutory KYC Records &amp; Documents
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Admin Only Access
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Aadhaar Card</span>
                      <span className="text-xs font-bold font-mono text-slate-800 mt-1 block">
                        {selectedWorker.aadharNumber
                          ? showBankDetails
                            ? selectedWorker.aadharNumber
                            : maskAadhaar(selectedWorker.aadharNumber)
                          : 'Pending Submission'}
                      </span>
                    </div>
                    {selectedWorker.aadharDoc ? (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> File Available
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdminDocPreview({ title: `${selectedWorker.name}'s Aadhaar Card`, data: selectedWorker.aadharDoc })}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Doc
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 mt-2 block">No document file uploaded</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">PAN Card</span>
                      <span className="text-xs font-bold font-mono uppercase text-slate-800 mt-1 block">
                        {selectedWorker.panNumber ? selectedWorker.panNumber : 'Pending Submission'}
                      </span>
                    </div>
                    {selectedWorker.panDoc ? (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> File Available
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdminDocPreview({ title: `${selectedWorker.name}'s PAN Card`, data: selectedWorker.panDoc })}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Doc
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 mt-2 block">No document file uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Worker Payment & Outstanding Balance Section */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Wage Disbursal & Settlement Status
                    </span>
                  </div>
                  {workerPayableSummary && (
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md">
                      Outstanding: ₹{Number(workerPayableSummary.total_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                {workerPayableSummary ? (
                  <div className="space-y-2">
                    {/* Settlement lines */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {workerPayableSummary.settlements?.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-indigo-100/80 flex items-center justify-between shadow-2xs">
                          <div>
                            <div className="font-bold text-slate-800">{s.period_name}</div>
                            <div className="text-[10px] text-slate-400">
                              Net: ₹{Number(s.net_payable).toLocaleString('en-IN')} • Paid: ₹{Number(s.paid_amount).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            s.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.payment_status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {s.payment_status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Disburse Button */}
                    {onNavigatePayments && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsViewModalOpen(false);
                            onNavigatePayments();
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment Entry</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Loading live wage settlements...
                  </div>
                )}
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

      {/* ===================== ADMIN CONFIDENTIAL DOCUMENT VIEWER MODAL ===================== */}
      {adminDocPreview && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-white">{adminDocPreview.title}</h4>
                  <p className="text-[10px] text-amber-300 font-medium">Confidential Statutory Record • Authorized HR Admin Eyes Only</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminDocPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              {adminDocPreview.data?.startsWith('data:image/') || adminDocPreview.data?.startsWith('http') || adminDocPreview.data?.startsWith('/') ? (
                <img
                  src={adminDocPreview.data}
                  alt={adminDocPreview.title}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200"
                />
              ) : adminDocPreview.data?.startsWith('data:application/pdf') ? (
                <iframe
                  src={adminDocPreview.data}
                  title={adminDocPreview.title}
                  className="w-full h-[65vh] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md">
                  <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800 mb-1">{adminDocPreview.title}</p>
                  <p className="text-[11px] text-slate-500 font-mono break-all line-clamp-3 bg-slate-50 p-2 rounded border border-slate-200">
                    {adminDocPreview.data}
                  </p>
                  <a
                    href={adminDocPreview.data}
                    target="_blank"
                    rel="noreferrer"
                    download="document"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Document
                  </a>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Securely Stored in Database
              </span>
              <button
                type="button"
                onClick={() => setAdminDocPreview(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PAYMENT FORUM MODAL ===================== */}
      {payWorkerModal && (
        <PaymentForumModal
          isOpen={Boolean(payWorkerModal)}
          onClose={() => setPayWorkerModal(null)}
          initialWorkerId={payWorkerModal.workerId || payWorkerModal.worker_id}
          initialWorkerName={payWorkerModal.name}
          initialCategory="Salary"
          title={`Make Payment - ${payWorkerModal.name}`}
          onSuccess={() => {
            loadInitialData();
          }}
        />
      )}
    </div>
  );
};

export default WorkersPage;
