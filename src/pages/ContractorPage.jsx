import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DataStoreService, ContractorService, DepartmentService, WorkerService, DesignationService } from '../services/api';
import PaymentForumModal from '../components/PaymentForumModal';
import WorkerFullProfileView from '../components/WorkerFullProfileView';
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
  Briefcase,
  User,
  Camera,
  Upload,
  Landmark,
  Lock,
  ReceiptText
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';
import {
  validateName,
  validateMobile,
  validateAlternateMobile,
  validateEmail,
  validateAadhaar,
  maskAadhaar,
  validatePAN,
  validateBankAccount,
  maskBankAccount,
  validateIFSC,
  validateBankName,
  validateCode,
  calculateAgeFromDOB,
  validateDOB,
  validateDateOfJoining,
  validateSalary,
  sanitizeNameInput,
  sanitizeNumericInput,
  sanitizeAlphaNumericUpper,
  getNextWorkerId,
} from '../utils/validation';

// Salary policies for Permanent Staff Workers
const PERMANENT_POLICIES = [
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
const CONTRACTOR_POLICIES = [
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
  onNavigatePayments,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) => {
  const [activeNav, setActiveNav] = useState('Contractor');
  const [contractors, setContractors] = useState(INITIAL_CONTRACTORS);
  const [selectedContractorId, setSelectedContractorId] = useState(null);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [workersList, setWorkersList] = useState([]);

  // Pop-out Workers directory state
  const [selectedWorkerPopContractor, setSelectedWorkerPopContractor] = useState(null);
  const [isContractorWorkersPopOpen, setIsContractorWorkersPopOpen] = useState(false);
  const [popWorkerSearchQuery, setPopWorkerSearchQuery] = useState('');

  // Edit Contractor state
  const [isEditContractorModalOpen, setIsEditContractorModalOpen] = useState(false);
  const [editContractorForm, setEditContractorForm] = useState(null);

  // Delete Contractor state
  const [isDeleteContractorModalOpen, setIsDeleteContractorModalOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [paymentVouchers, setPaymentVouchers] = useState([]);

  // Load contractors, departments, designations, real workers, and payment vouchers from backend database
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      ContractorService.getAll().catch(() => []),
      DepartmentService.getAll().catch(() => []),
      WorkerService.getAll().catch(() => []),
      DesignationService.getAll().catch(() => []),
      DataStoreService.get('payment_vouchers', []).catch(() => []),
    ]).then(([backendContractors, backendDepts, backendWorkers, backendDesigs, savedVouchers]) => {
      if (!isMounted) return;
      if (Array.isArray(backendDepts)) {
        setDepartmentsList(backendDepts);
      }
      if (Array.isArray(backendWorkers)) {
        setWorkersList(backendWorkers);
      }
      if (Array.isArray(backendContractors)) {
        setContractors(backendContractors);
      }
      if (Array.isArray(backendDesigs)) {
        setDesignationsList(backendDesigs);
      }
      if (Array.isArray(savedVouchers)) {
        setPaymentVouchers(savedVouchers);
      }
    });

    const handlePaymentCompleted = () => {
      ContractorService.getAll().catch(() => []).then((freshContractors) => {
        if (Array.isArray(freshContractors) && freshContractors.length > 0) {
          setContractors(freshContractors);
        } else {
          DataStoreService.get('contractors', []).then((freshList) => {
            if (Array.isArray(freshList) && freshList.length > 0) setContractors(freshList);
          });
        }
      });
      DataStoreService.get('payment_vouchers', []).then((vchs) => {
        if (Array.isArray(vchs)) setPaymentVouchers(vchs);
      });
    };
    window.addEventListener('paysphere-payment-completed', handlePaymentCompleted);

    return () => {
      isMounted = false;
      window.removeEventListener('paysphere-payment-completed', handlePaymentCompleted);
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

  // Helper to dynamically match database workers to a contractor agency
  const getContractorWorkers = (contractor) => {
    if (!contractor) return [];
    const conName = (contractor.name || '').trim().toLowerCase();
    const conCode = (contractor.code || contractor.contractor_id || '').trim().toLowerCase();

    // Check if live workers exist matching this contractor agency
    const matched = workersList.filter((w) => {
      const agency = (w.contractor_agency || w.contractorAgency || '').trim().toLowerCase();
      return agency && (agency === conName || agency === conCode);
    });

    const result = [...matched];
    (contractor.workers || []).forEach((cw) => {
      const exists = result.some(
        (w) => String(w.id || w.worker_id || w.workerId) === String(cw.id || cw.worker_id || cw.workerId)
      );
      if (!exists) {
        result.push(cw);
      }
    });

    return result;
  };

  // Check code uniqueness across Contractors, Departments, and Designations
  const isCodeTaken = (codeToCheck, currentContractorId = null) => {
    const codeUpper = (codeToCheck || '').trim().toUpperCase();
    if (!codeUpper) return null;

    // Check against contractors
    const existsInContractors = contractors.some(
      (c) =>
        ((c.code && c.code.trim().toUpperCase() === codeUpper) ||
          (c.contractor_id && c.contractor_id.trim().toUpperCase() === codeUpper)) &&
        c.id !== currentContractorId
    );
    if (existsInContractors) return `Code "${codeUpper}" is already in use by another contractor.`;

    // Check against departments
    const existsInDepartments = departmentsList.some(
      (d) => d.code && d.code.trim().toUpperCase() === codeUpper
    );
    if (existsInDepartments) return `Code "${codeUpper}" is already in use by a department.`;

    // Check against designations
    const existsInDesignations = departmentsList.flatMap((d) => d.designations || []).some(
      (des) => des.code && des.code.trim().toUpperCase() === codeUpper
    );
    if (existsInDesignations) return `Code "${codeUpper}" is already in use by a designation.`;

    return null;
  };

  const validateContractorForm = (form, isEdit = false, currentId = null) => {
    const errors = {};

    // 1. Contractor / Agency Name
    const nameErr = validateName(form.name, 'Contractor / Agency Name');
    if (nameErr) errors.name = nameErr;

    // 2. Contractor Code (Required: 3 letters + 3 numbers)
    const codeErr = validateCode(form.code, 'Contractor Code');
    if (codeErr) {
      errors.code = codeErr;
    } else {
      const collisionErr = isCodeTaken(form.code, currentId);
      if (collisionErr) errors.code = collisionErr;
    }

    // 3. Owner / Contact Person
    const ownerErr = validateName(form.owner, 'Owner / Contact Person');
    if (ownerErr) errors.owner = ownerErr;

    // 4. Primary Mobile
    const phoneErr = validateMobile(form.phone);
    if (phoneErr) errors.phone = phoneErr;

    // 5. Alternate Mobile
    const altPhoneErr = validateAlternateMobile(form.alternatePhone);
    if (altPhoneErr) errors.alternatePhone = altPhoneErr;

    // 6. Email
    const emailErr = validateEmail(form.email, false);
    if (emailErr) errors.email = emailErr;

    // 7. Aadhaar
    const aadharErr = validateAadhaar(form.aadharNumber, false);
    if (aadharErr) errors.aadharNumber = aadharErr;

    // 8. PAN
    const panErr = validatePAN(form.panNumber, false);
    if (panErr) errors.panNumber = panErr;

    // 9. Bank Name
    const bankNameErr = validateBankName(form.bankName, false);
    if (bankNameErr) errors.bankName = bankNameErr;

    // 10. Bank Account
    const bankAccErr = validateBankAccount(form.bankAccount, false);
    if (bankAccErr) errors.bankAccount = bankAccErr;

    // 11. IFSC
    const ifscErr = validateIFSC(form.ifscCode, false);
    if (ifscErr) errors.ifscCode = ifscErr;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const openEditContractorModal = (contractor) => {
    setContractorEditErrors({});
    setEditContractorForm({
      id: contractor.id,
      name: contractor.name || '',
      code: contractor.code || contractor.contractor_id || '',
      owner: contractor.owner || contractor.contact_person || '',
      phone: contractor.phone || '',
      alternatePhone: contractor.alternatePhone || contractor.alternate_phone || '',
      email: contractor.email || '',
      address: contractor.address || '',
      permanentAddress: contractor.permanentAddress || contractor.permanent_address || '',
      aadharNumber: contractor.aadharNumber || contractor.aadhar_number || '',
      panNumber: contractor.panNumber || contractor.pan_number || '',
      aadharDoc: contractor.aadharDoc || contractor.aadhar_doc || '',
      panDoc: contractor.panDoc || contractor.pan_doc || '',
      bankName: contractor.bankName || contractor.bank_name || '',
      bankAccount: contractor.bankAccount || contractor.bank_account || '',
      ifscCode: contractor.ifscCode || contractor.ifsc_code || '',
      assignedDepartment: contractor.assignedDepartment || contractor.assigned_department || '',
      primaryService: contractor.primaryService || contractor.primary_service || 'Manpower Supply',
      gstin: contractor.gstin || contractor.gst_number || '',
      labourLicense: contractor.labourLicense || contractor.labour_license || '',
      status: contractor.status || (contractor.is_active ? 'Active' : 'Inactive') || 'Active',
    });
    setIsEditContractorModalOpen(true);
  };

  const handleEditContractorSubmit = async (e) => {
    e.preventDefault();
    if (!editContractorForm) return;

    const validation = validateContractorForm(editContractorForm, true, editContractorForm.id);
    if (!validation.isValid) {
      setContractorEditErrors(validation.errors);
      const firstMsg = Object.values(validation.errors)[0];
      showToast(`Validation error: ${firstMsg}`);
      return;
    }

    setIsSubmitting(true);
    const assignedCode = editContractorForm.code.trim().toUpperCase();
    const payload = {
      name: editContractorForm.name.trim(),
      code: assignedCode,
      contractor_id: assignedCode,
      contact_person: editContractorForm.owner?.trim() || '',
      owner: editContractorForm.owner?.trim() || '',
      phone: editContractorForm.phone?.trim() || '',
      alternate_phone: editContractorForm.alternatePhone?.trim() || '',
      alternatePhone: editContractorForm.alternatePhone?.trim() || '',
      email: editContractorForm.email?.trim() || '',
      address: editContractorForm.address?.trim() || '',
      permanent_address: editContractorForm.permanentAddress?.trim() || '',
      permanentAddress: editContractorForm.permanentAddress?.trim() || '',
      aadhar_number: editContractorForm.aadharNumber?.trim() || '',
      aadharNumber: editContractorForm.aadharNumber?.trim() || '',
      pan_number: editContractorForm.panNumber?.trim().toUpperCase() || '',
      panNumber: editContractorForm.panNumber?.trim().toUpperCase() || '',
      aadhar_doc: editContractorForm.aadharDoc || '',
      aadharDoc: editContractorForm.aadharDoc || '',
      pan_doc: editContractorForm.panDoc || '',
      panDoc: editContractorForm.panDoc || '',
      bank_name: editContractorForm.bankName?.trim() || '',
      bankName: editContractorForm.bankName?.trim() || '',
      bank_account: editContractorForm.bankAccount?.trim() || '',
      bankAccount: editContractorForm.bankAccount?.trim() || '',
      ifsc_code: editContractorForm.ifscCode?.trim().toUpperCase() || '',
      ifscCode: editContractorForm.ifscCode?.trim().toUpperCase() || '',
      assigned_department: editContractorForm.assignedDepartment || null,
      assignedDepartment: editContractorForm.assignedDepartment || null,
      gst_number: editContractorForm.gstin?.trim().toUpperCase() || '',
      gstin: editContractorForm.gstin?.trim().toUpperCase() || '',
      labour_license: editContractorForm.labourLicense?.trim() || '',
      labourLicense: editContractorForm.labourLicense?.trim() || '',
      primary_service: editContractorForm.primaryService?.trim() || 'Manpower Supply',
      primaryService: editContractorForm.primaryService?.trim() || 'Manpower Supply',
      status: editContractorForm.status || 'Active',
      is_active: editContractorForm.status === 'Active',
    };

    try {
      const updated = await ContractorService.update(editContractorForm.id, payload);
      setContractors((prev) =>
        prev.map((c) => (c.id === editContractorForm.id ? { ...c, ...updated } : c))
      );
      setIsEditContractorModalOpen(false);
      setContractorEditErrors({});
      showToast(`Contractor agency "${payload.name}" updated successfully!`);
    } catch (err) {
      console.warn('API error updating contractor:', err);
      showToast(`Error updating contractor: ${err.message || 'Please check input data'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;
    try {
      await ContractorService.delete(contractorToDelete.id);
      setContractors((prev) => prev.filter((c) => c.id !== contractorToDelete.id));
      setIsDeleteContractorModalOpen(false);
      const delName = contractorToDelete.name;
      setContractorToDelete(null);
      showToast(`Contractor agency "${delName}" deleted successfully!`);
    } catch (err) {
      console.warn('API error deleting contractor, deleting locally:', err);
      setContractors((prev) => prev.filter((c) => c.id !== contractorToDelete.id));
      setIsDeleteContractorModalOpen(false);
      const delName = contractorToDelete.name;
      setContractorToDelete(null);
      showToast(`Contractor agency "${delName}" removed!`);
    }
  };

  // Filters for Main List
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Detail View Sub-tabs: 'workers' | 'invoices'
  const [activeDetailTab, setActiveDetailTab] = useState('workers');
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [workerDeptFilter, setWorkerDeptFilter] = useState('All');
  const [workerStatusFilter, setWorkerStatusFilter] = useState('All');

  // Deployed Workers Actions & Modals state
  const [viewingWorkerProfile, setViewingWorkerProfile] = useState(null);
  const [payWorkerModal, setPayWorkerModal] = useState(null);
  const [editWorkerModal, setEditWorkerModal] = useState(null);
  const [editWorkerForm, setEditWorkerForm] = useState(null);
  const [deleteWorkerModal, setDeleteWorkerModal] = useState(null);

  // Invoices Generation & Management State
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [invoiceGenForm, setInvoiceGenForm] = useState({
    billingMonth: new Date().toISOString().slice(0, 7),
    periodLabel: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    mandays: 120,
    dailyRate: 700,
    grossAmount: 84000,
    tdsRate: 2,
    deductions: 1680,
    netPayable: 82320,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: 'Contractor monthly attendance & deployed labour billing'
  });

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

  // Comprehensive Worker Form State matching WorkersPage
  const workerFileInputRef = useRef(null);
  const workerAadharFileInputRef = useRef(null);
  const workerPanFileInputRef = useRef(null);
  const contractorAadharFileInputRef = useRef(null);
  const contractorPanFileInputRef = useRef(null);
  const editContractorAadharFileInputRef = useRef(null);
  const editContractorPanFileInputRef = useRef(null);
  const [adminDocPreview, setAdminDocPreview] = useState(null);

  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [sameAsResidentialWorker, setSameAsResidentialWorker] = useState(false);
  const [workerAddErrors, setWorkerAddErrors] = useState({});
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);

  const initialWorkerFormState = {
    workerId: '',
    name: '',
    photo: '',
    department: '',
    designation: '',
    workerType: 'Contractor',
    gender: 'Male',
    dob: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    phone: '',
    emergencyContact: '',
    address: '',
    permanentAddress: '',
    contractorAgency: '',
    salaryPolicy: 'PER_TONNAGE',
    policyRate: '0',
    bankAccount: '',
    ifscCode: '',
    aadharNumber: '',
    panNumber: '',
    aadharDoc: '',
    panDoc: '',
  };

  const [workerForm, setWorkerForm] = useState(initialWorkerFormState);

  // Available designations based on selected department in workerForm
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

  // Central validation for Worker profile (identical to WorkersPage)
  const validateWorkerProfile = (form) => {
    const errors = {};
    const nameErr = validateName(form.name, 'Full Name', 2, 100, true);
    if (nameErr) errors.name = nameErr;

    if (!form.department) errors.department = 'Please select a department.';
    if (!form.designation) errors.designation = 'Please select a designation.';
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

  // Open Add Worker modal with auto-selected contractor
  const openAddWorkerModal = (targetContractor = null) => {
    const contractorObj = targetContractor || selectedContractor || selectedWorkerPopContractor;
    const conName = contractorObj ? contractorObj.name : '';
    const formattedId = getNextWorkerId(workersList);
    
    // Auto-select department: if contractor has assigned department, find it
    const conDept = contractorObj?.assignedDepartmentName || contractorObj?.departments?.[0] || departmentsList[0]?.name || '';
    const matchingDesigs = designationsList.filter(
      (d) => (d.department_name || d.departmentName) === conDept
    );
    const defaultDesig = matchingDesigs.length > 0 ? matchingDesigs[0].title : (designationsList[0]?.title || '');

    setWorkerAddErrors({});
    setSameAsResidentialWorker(false);
    setWorkerForm({
      ...initialWorkerFormState,
      workerId: formattedId,
      photo: '',
      department: conDept,
      designation: defaultDesig,
      workerType: 'Contractor', // ALWAYS Contractor
      contractorAgency: conName, // AUTOMATICALLY SELECT CONTRACTOR AND CONTRACTOR NAME!
      salaryPolicy: 'PER_TONNAGE',
      policyRate: '0',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setIsAddWorkerModalOpen(true);
  };

  const handleWorkerPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWorkerDocUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerForm((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContractorDocUpload = (e, field, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditContractorForm((prev) => ({ ...prev, [field]: reader.result }));
        } else {
          setNewContractorForm((prev) => ({ ...prev, [field]: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isAddContractorModalOpen, setIsAddContractorModalOpen] = useState(false);
  const [contractorAddErrors, setContractorAddErrors] = useState({});
  const [contractorEditErrors, setContractorEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newContractorForm, setNewContractorForm] = useState({
    name: '',
    code: '',
    owner: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    permanentAddress: '',
    aadharNumber: '',
    panNumber: '',
    aadharDoc: '',
    panDoc: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    assignedDepartment: '',
    primaryService: '',
    gstin: '',
    labourLicense: '',
    status: 'Active'
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
    { name: 'Payment Entry', icon: ReceiptText },
    { name: 'Reports', icon: FileBarChart },
    { name: 'Administration Setting', icon: Settings },
  ];

  // View mode: Dedicated Contractor Workers Page (when Box 2 is clicked)
  const [isViewingAllContractorWorkers, setIsViewingAllContractorWorkers] = useState(false);
  const [allWorkerSearchQuery, setAllWorkerSearchQuery] = useState('');
  const [allWorkerContractorFilter, setAllWorkerContractorFilter] = useState('All');
  const [allWorkerDeptFilter, setAllWorkerDeptFilter] = useState('All');

  // ================= Aggregated Stats for Overview =================
  const totalContractorsCount = contractors.length;

  // Aggregate all workers deployed across all contractors
  const allContractorWorkers = useMemo(() => {
    const list = (workersList || []).filter((w) => {
      const isContractorType = (w.worker_type || w.workerType) === 'Contractor';
      const hasAgency = Boolean((w.contractor_agency || w.contractorAgency || '').trim());
      return isContractorType || hasAgency;
    });

    const result = [...list];
    contractors.forEach((c) => {
      (c.workers || []).forEach((cw) => {
        const exists = result.some(
          (w) => String(w.id || w.worker_id) === String(cw.id || cw.worker_id)
        );
        if (!exists) {
          result.push({
            ...cw,
            contractor_agency: cw.contractor_agency || c.name,
            contractorAgency: cw.contractorAgency || c.name,
            contractor_code: c.code || c.contractor_id,
          });
        }
      });
    });

    return result;
  }, [workersList, contractors]);

  // Filtered contractor workers for the dedicated workforce page
  const filteredAllContractorWorkers = useMemo(() => {
    return allContractorWorkers.filter((w) => {
      const q = allWorkerSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.worker_id && String(w.worker_id).toLowerCase().includes(q)) ||
        (w.workerId && String(w.workerId).toLowerCase().includes(q)) ||
        (w.id && String(w.id).toLowerCase().includes(q));

      const agencyName = (w.contractor_agency || w.contractorAgency || '').trim();
      const matchesContractor =
        allWorkerContractorFilter === 'All' ||
        agencyName.toLowerCase() === allWorkerContractorFilter.toLowerCase();

      const deptName = (w.department_name || (typeof w.department === 'string' ? w.department : w.department?.name) || '').trim();
      const matchesDept =
        allWorkerDeptFilter === 'All' ||
        deptName.toLowerCase() === allWorkerDeptFilter.toLowerCase();

      return matchesSearch && matchesContractor && matchesDept;
    });
  }, [allContractorWorkers, allWorkerSearchQuery, allWorkerContractorFilter, allWorkerDeptFilter]);

  const totalWorkersUnderContractor = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (getContractorWorkers(c).length || c.workers?.length || c.totalWorkers || 0), 0) || allContractorWorkers.length;
  }, [contractors, workersList, allContractorWorkers]);

  const totalWorkersPresentToday = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.presentToday || 0), 0);
  }, [contractors]);

  const totalPendingPayments = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.pendingPayment || 0), 0);
  }, [contractors]);

  const totalPaidYTDOverall = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.totalPaidYTD || 0), 0);
  }, [contractors]);

  // Last Month info & calculation for Box 4 (basic last month idea)
  const lastMonthName = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const totalLastMonthSalary = useMemo(() => {
    const fromContractors = contractors.reduce((acc, c) => acc + (parseFloat(c.lastMonthSalary) || 0), 0);
    if (fromContractors > 0) return fromContractors;

    if (allContractorWorkers.length > 0) {
      return allContractorWorkers.reduce((acc, w) => {
        const rate = parseFloat(w.base_wage || w.policy_rate || w.policyRate || w.dailyRate || 0);
        const monthlyAmount = rate > 0 && rate < 3000 ? rate * 26 : rate;
        return acc + monthlyAmount;
      }, 0);
    }

    return 0;
  }, [contractors, allContractorWorkers]);

  // Filtered Contractors for List View - STRICTLY searching on Name and Code ONLY
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.contractor_id && c.contractor_id.toLowerCase().includes(q));

      const matchesDept =
        departmentFilter === 'All' ||
        (c.departments && c.departments.includes(departmentFilter)) ||
        c.assignedDepartmentName === departmentFilter;

      const matchesPayment =
        paymentFilter === 'All' ||
        (paymentFilter === 'Pending' && c.pendingPayment > 0) ||
        (paymentFilter === 'Cleared' && (c.pendingPayment || 0) === 0);

      return matchesSearch && matchesDept && matchesPayment;
    });
  }, [contractors, searchQuery, departmentFilter, paymentFilter]);

  // Currently Selected Contractor Object
  const selectedContractor = useMemo(() => {
    if (!selectedContractorId) return null;
    return contractors.find((c) => c.id === selectedContractorId) || null;
  }, [contractors, selectedContractorId]);

  // Helper to get active deployed workers for selected contractor
  const contractorActiveWorkers = useMemo(() => {
    return getContractorWorkers(selectedContractor);
  }, [selectedContractor, workersList]);

  // Filtered Workers inside Selected Contractor (respects search, dept, status)
  const filteredContractorWorkers = useMemo(() => {
    if (!selectedContractor) return [];
    return contractorActiveWorkers.filter((w) => {
      const q = workerSearchQuery.toLowerCase().trim();
      const wid = String(w.workerId || w.worker_id || w.id || '').toLowerCase();
      const name = (w.name || '').toLowerCase();
      const desig = (w.designation || '').toLowerCase();
      const phone = String(w.phone || '');
      const matchesSearch =
        !q ||
        name.includes(q) ||
        wid.includes(q);

      const deptName = (typeof w.department === 'string' ? w.department : w.department?.name) || w.department_name || '';
      const matchesDept =
        workerDeptFilter === 'All' || deptName.toLowerCase() === workerDeptFilter.toLowerCase();

      const status = w.status || 'Active';
      const matchesStatus =
        workerStatusFilter === 'All' || status.toLowerCase() === workerStatusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [selectedContractor, contractorActiveWorkers, workerSearchQuery, workerDeptFilter, workerStatusFilter]);

  // Payment Vouchers disbursed to Selected Contractor
  const contractorVouchers = useMemo(() => {
    if (!selectedContractor) return [];
    const conId = String(selectedContractor.id);
    const conName = (selectedContractor.name || '').trim().toLowerCase();
    return (paymentVouchers || []).filter((v) => {
      const vWorkerId = String(v.worker_id || v.workerId || '');
      const vWorkerName = (v.worker_name || v.workerName || '').trim().toLowerCase();
      const vType = v.payment_type || v.paymentCategory;
      return (vWorkerId === conId || vWorkerName === conName) || vType === 'Contractor Bill';
    });
  }, [selectedContractor, paymentVouchers]);

  // Worker Edit Handler
  const openEditWorker = (worker) => {
    setEditWorkerModal(worker);
    setEditWorkerForm({
      id: worker.id,
      workerId: worker.workerId || worker.worker_id || worker.id,
      name: worker.name || '',
      designation: worker.designation || 'Worker',
      department: typeof worker.department === 'string' ? worker.department : (worker.department?.name || worker.department_name || 'Production'),
      phone: worker.phone || '',
      dailyRate: worker.dailyRate || worker.policy_rate || worker.base_wage || 700,
      status: worker.status || 'Active',
      joinDate: worker.joinDate || worker.date_of_joining || '2026-01-15'
    });
  };

  const handleEditWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!editWorkerForm) return;

    try {
      if (editWorkerForm.id) {
        await WorkerService.update(editWorkerForm.id, {
          name: editWorkerForm.name,
          designation: editWorkerForm.designation,
          department: editWorkerForm.department,
          phone: editWorkerForm.phone,
          status: editWorkerForm.status
        }).catch(() => {});
      }

      setWorkersList((prev) =>
        prev.map((w) => {
          if (String(w.id || w.worker_id) === String(editWorkerForm.id || editWorkerForm.workerId)) {
            return { ...w, ...editWorkerForm };
          }
          return w;
        })
      );

      saveAndSetContractors((prev) =>
        prev.map((c) => {
          if (c.id !== selectedContractor.id) return c;
          const updatedWorkers = (c.workers || []).map((w) => {
            if (String(w.id || w.worker_id) === String(editWorkerForm.id || editWorkerForm.workerId)) {
              return { ...w, ...editWorkerForm };
            }
            return w;
          });
          return { ...c, workers: updatedWorkers };
        })
      );

      setEditWorkerModal(null);
      showToast(`Worker ${editWorkerForm.name} updated successfully!`);
    } catch (err) {
      showToast(`Failed to update worker: ${err.message || err}`);
    }
  };

  // Worker Delete Handler
  const handleDeleteWorker = async () => {
    if (!deleteWorkerModal || !selectedContractor) return;
    const worker = deleteWorkerModal;
    const wid = String(worker.id || worker.worker_id || worker.workerId);

    try {
      if (worker.id) {
        await WorkerService.delete(worker.id).catch(() => {});
      }

      setWorkersList((prev) => prev.filter((w) => String(w.id || w.worker_id) !== wid));

      saveAndSetContractors((prev) =>
        prev.map((c) => {
          if (c.id !== selectedContractor.id) return c;
          const updatedWorkers = (c.workers || []).filter((w) => String(w.id || w.worker_id || w.workerId) !== wid);
          return {
            ...c,
            totalWorkers: Math.max(0, (c.totalWorkers || 1) - 1),
            workers: updatedWorkers
          };
        })
      );

      setDeleteWorkerModal(null);
      showToast(`Worker ${worker.name} removed from deployment.`);
    } catch (err) {
      showToast(`Failed to remove worker: ${err.message || err}`);
    }
  };

  // Monthly Invoice Generation Handler
  const handleGenerateInvoice = (e) => {
    e.preventDefault();
    if (!selectedContractor) return;

    const gross = Number(invoiceGenForm.grossAmount) || 0;
    const deductions = Number(invoiceGenForm.deductions) || 0;
    const net = Number(invoiceGenForm.netPayable) || (gross - deductions);
    const mandays = Number(invoiceGenForm.mandays) || 0;

    if (net <= 0) {
      showToast('Invoice net payable must be greater than ₹0.');
      return;
    }

    const monthClean = invoiceGenForm.billingMonth ? invoiceGenForm.billingMonth.replace('-', '') : '202611';
    const newInvoice = {
      id: `INV-${monthClean}-${String(Date.now()).slice(-4)}`,
      period: invoiceGenForm.periodLabel || invoiceGenForm.billingMonth,
      dueDate: invoiceGenForm.dueDate,
      mandays,
      grossAmount: gross,
      deductions,
      netAmount: net,
      paidAmount: 0,
      amountPaid: 0,
      pendingAmount: net,
      status: 'Pending Payment',
      createdDate: new Date().toISOString().split('T')[0],
      notes: invoiceGenForm.notes
    };

    saveAndSetContractors((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContractor.id) return c;
        const currentInvoices = Array.isArray(c.invoices) ? c.invoices : [];
        return {
          ...c,
          pendingPayment: (c.pendingPayment || 0) + net,
          invoices: [newInvoice, ...currentInvoices]
        };
      })
    );

    setIsGenerateInvoiceModalOpen(false);
    showToast(`Monthly invoice ${newInvoice.id} generated for ${selectedContractor.name}!`);
  };

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

  // Add Worker to Contractor (Real API persistence matching WorkersPage)
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingWorker) return;

    const errors = validateWorkerProfile(workerForm);
    if (Object.keys(errors).length > 0) {
      setWorkerAddErrors(errors);
      const firstMsg = Object.values(errors)[0];
      showToast(`Validation error: ${firstMsg}`);
      return;
    }
    setWorkerAddErrors({});
    setIsSubmittingWorker(true);

    try {
      const activeContractor = selectedContractor || selectedWorkerPopContractor;
      const targetAgencyName = workerForm.contractorAgency || activeContractor?.name || '';
      const payload = {
        workerId: workerForm.workerId.trim() || `W${String(workersList.length + 1).padStart(3, '0')}`,
        name: workerForm.name.trim(),
        photo: workerForm.photo || '',
        department: workerForm.department,
        designation: workerForm.designation.trim() || 'Worker',
        workerType: 'Contractor',
        gender: workerForm.gender,
        dob: workerForm.dob || '',
        address: workerForm.address || '',
        permanentAddress: workerForm.permanentAddress || '',
        contractorAgency: targetAgencyName,
        joinDate: workerForm.joinDate,
        status: workerForm.status,
        phone: workerForm.phone ? workerForm.phone.trim() : '',
        emergencyContact: workerForm.emergencyContact ? workerForm.emergencyContact.trim() : '',
        salaryPolicy: workerForm.salaryPolicy || 'PER_TONNAGE',
        policyRate: parseFloat(workerForm.policyRate) || 0,
        bankAccount: workerForm.bankAccount ? workerForm.bankAccount.trim() : '',
        ifscCode: workerForm.ifscCode ? workerForm.ifscCode.toUpperCase().trim() : '',
        aadharNumber: workerForm.aadharNumber ? workerForm.aadharNumber.trim() : '',
        panNumber: workerForm.panNumber ? workerForm.panNumber.toUpperCase().trim() : '',
        aadharDoc: workerForm.aadharDoc || '',
        panDoc: workerForm.panDoc || '',
      };

      const created = await WorkerService.create(payload);

      // Add to workersList state so contractor cards and tables update dynamically
      setWorkersList((prev) => [created, ...prev]);

      // Update contractor statistics in local state
      setContractors((prev) =>
        prev.map((c) => {
          if (c.name === targetAgencyName || (activeContractor && c.id === activeContractor.id)) {
            const currentWorkers = c.workers || [];
            return {
              ...c,
              totalWorkers: currentWorkers.length + 1,
              presentToday: (c.presentToday || 0) + 1,
              workers: [created, ...currentWorkers],
            };
          }
          return c;
        })
      );

      setIsAddWorkerModalOpen(false);
      showToast(`Worker ${created.name || payload.name} (${created.workerId || payload.workerId}) added under ${targetAgencyName}!`);
    } catch (err) {
      showToast(`Error creating worker: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  // Add Contractor Submit
  const handleAddContractorSubmit = async (e) => {
    e.preventDefault();
    const validation = validateContractorForm(newContractorForm, false, null);
    if (!validation.isValid) {
      setContractorAddErrors(validation.errors);
      const firstMsg = Object.values(validation.errors)[0];
      showToast(`Validation error: ${firstMsg}`);
      return;
    }

    setIsSubmitting(true);
    const assignedCode = newContractorForm.code.trim().toUpperCase();
    const payload = {
      name: newContractorForm.name.trim(),
      code: assignedCode,
      contractor_id: assignedCode,
      contact_person: newContractorForm.owner.trim(),
      owner: newContractorForm.owner.trim(),
      phone: newContractorForm.phone.trim(),
      alternate_phone: newContractorForm.alternatePhone.trim(),
      alternatePhone: newContractorForm.alternatePhone.trim(),
      email: newContractorForm.email.trim(),
      address: newContractorForm.address.trim(),
      permanent_address: newContractorForm.permanentAddress.trim(),
      permanentAddress: newContractorForm.permanentAddress.trim(),
      aadhar_number: newContractorForm.aadharNumber.trim(),
      aadharNumber: newContractorForm.aadharNumber.trim(),
      pan_number: newContractorForm.panNumber.trim().toUpperCase(),
      panNumber: newContractorForm.panNumber.trim().toUpperCase(),
      aadhar_doc: newContractorForm.aadharDoc || '',
      aadharDoc: newContractorForm.aadharDoc || '',
      pan_doc: newContractorForm.panDoc || '',
      panDoc: newContractorForm.panDoc || '',
      bank_name: newContractorForm.bankName.trim(),
      bankName: newContractorForm.bankName.trim(),
      bank_account: newContractorForm.bankAccount.trim(),
      bankAccount: newContractorForm.bankAccount.trim(),
      ifsc_code: newContractorForm.ifscCode.trim().toUpperCase(),
      ifscCode: newContractorForm.ifscCode.trim().toUpperCase(),
      assigned_department: newContractorForm.assignedDepartment || (departmentsList[0]?.id || null),
      assignedDepartment: newContractorForm.assignedDepartment || (departmentsList[0]?.id || null),
      gst_number: newContractorForm.gstin.trim().toUpperCase(),
      gstin: newContractorForm.gstin.trim().toUpperCase(),
      labour_license: newContractorForm.labourLicense.trim(),
      labourLicense: newContractorForm.labourLicense.trim(),
      primary_service: newContractorForm.primaryService.trim() || 'Manpower Supply',
      primaryService: newContractorForm.primaryService.trim() || 'Manpower Supply',
      status: newContractorForm.status || 'Active',
      is_active: (newContractorForm.status || 'Active') === 'Active',
    };

    try {
      const created = await ContractorService.create(payload);
      setContractors((prev) => [created, ...prev]);
      DataStoreService.save('contractors', [created, ...contractors]).catch(() => {});
      setIsAddContractorModalOpen(false);
      setContractorAddErrors({});
      setNewContractorForm({
        name: '',
        code: '',
        owner: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        permanentAddress: '',
        aadharNumber: '',
        panNumber: '',
        aadharDoc: '',
        panDoc: '',
        bankName: '',
        bankAccount: '',
        ifscCode: '',
        assignedDepartment: '',
        primaryService: '',
        gstin: '',
        labourLicense: '',
        status: 'Active'
      });
      showToast(`Contractor agency "${created.name}" successfully registered!`);
    } catch (err) {
      console.warn('API error creating contractor, saving locally:', err);
      const nextId = contractors.length + 1;
      const deptName = departmentsList.find((d) => String(d.id) === String(payload.assigned_department))?.name || 'General';
      const localContractor = {
        ...payload,
        id: nextId,
        departments: [deptName],
        assignedDepartmentName: deptName,
        totalWorkers: 0,
        presentToday: 0,
        absentToday: 0,
        pendingPayment: 0,
        totalPaidYTD: 0,
        complianceStatus: 'Fully Compliant',
        invoices: [],
        workers: []
      };
      saveAndSetContractors((prev) => [localContractor, ...prev]);
      setIsAddContractorModalOpen(false);
      setContractorAddErrors({});
      setNewContractorForm({
        name: '',
        code: '',
        owner: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        permanentAddress: '',
        aadharNumber: '',
        panNumber: '',
        aadharDoc: '',
        panDoc: '',
        bankName: '',
        bankAccount: '',
        ifscCode: '',
        assignedDepartment: '',
        primaryService: '',
        gstin: '',
        labourLicense: '',
        status: 'Active'
      });
      showToast(`Contractor agency "${localContractor.name}" saved!`);
    } finally {
      setIsSubmitting(false);
    }
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
                      setIsViewingAllContractorWorkers(false);
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

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {viewingWorkerProfile ? (
          <WorkerFullProfileView
            worker={viewingWorkerProfile}
            onBack={() => setViewingWorkerProfile(null)}
            contractorName={selectedContractor?.name || viewingWorkerProfile.contractorAgency || viewingWorkerProfile.contractor_agency}
            onEdit={(w) => {
              setViewingWorkerProfile(null);
              openEditWorker(w);
            }}
            onWorkerUpdated={() => {
              WorkerService.getAll().then((res) => {
                if (Array.isArray(res)) setWorkersList(res);
              }).catch(() => {});
            }}
          />
        ) : selectedContractor ? (
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
                  onClick={() => openAddWorkerModal(selectedContractor)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Worker</span>
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
                    <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                      {(selectedContractor.aadharDoc || selectedContractor.aadhar_doc) && (
                        <button
                          type="button"
                          onClick={() => setAdminDocPreview({ title: `${selectedContractor.name} Aadhaar Card`, data: selectedContractor.aadharDoc || selectedContractor.aadhar_doc })}
                          className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-2.5 h-2.5" /> Aadhaar Doc
                        </button>
                      )}
                      {(selectedContractor.panDoc || selectedContractor.pan_doc) && (
                        <button
                          type="button"
                          onClick={() => setAdminDocPreview({ title: `${selectedContractor.name} PAN Card`, data: selectedContractor.panDoc || selectedContractor.pan_doc })}
                          className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-2.5 h-2.5" /> PAN Doc
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="space-y-1.5 border-b md:border-b-0 xl:border-r border-slate-100 pr-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Bank Details
                    </span>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedContractor.bankName}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="text-slate-400">A/C: </span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedContractor.masked_bank_account || maskBankAccount(selectedContractor.bankAccount || selectedContractor.bank_account)}
                      </span>
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
                  </div>
                </div>
              </div>

              {/* ===================== CONTRACTOR DASHBOARD STAT CARDS ===================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <span>Deployed Workers ({contractorActiveWorkers.length})</span>
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
                </div>

                {/* TAB CONTENT 1: DEPLOYED WORKERS (IDENTICAL OPTIONS TO WORKERS LIST) */}
                {activeDetailTab === 'workers' && (
                  <div className="p-6 space-y-4">
                    {/* Search & Actions Bar inside Workers Tab */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/70">
                      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by ID, name, designation, phone..."
                            value={workerSearchQuery}
                            onChange={(e) => setWorkerSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                          />
                        </div>

                        {/* Department Filter */}
                        <select
                          value={workerDeptFilter}
                          onChange={(e) => setWorkerDeptFilter(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <option value="All">All Departments</option>
                          {departmentsList.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>

                        {/* Status Filter */}
                        <select
                          value={workerStatusFilter}
                          onChange={(e) => setWorkerStatusFilter(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <option value="All">All Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>

                        {/* Clear Filters */}
                        {(workerSearchQuery || workerDeptFilter !== 'All' || workerStatusFilter !== 'All') && (
                          <button
                            type="button"
                            onClick={() => {
                              setWorkerSearchQuery('');
                              setWorkerDeptFilter('All');
                              setWorkerStatusFilter('All');
                            }}
                            className="px-3 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAddWorkerModal(selectedContractor)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Worker</span>
                        </button>
                      </div>
                    </div>

                    {/* Workers Table Matching WorkersPage */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
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
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
                          {filteredContractorWorkers.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-700">No deployed workers match criteria</p>
                                <p className="text-xs text-slate-400 mt-0.5">Try resetting search or filter options</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWorkerSearchQuery('');
                                    setWorkerDeptFilter('All');
                                    setWorkerStatusFilter('All');
                                  }}
                                  className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
                                >
                                  Clear Filters
                                </button>
                              </td>
                            </tr>
                          ) : (
                            filteredContractorWorkers.map((worker, index) => {
                              const workerId = worker.workerId || worker.worker_id || worker.id || `W-${index + 1}`;
                              const dept = typeof worker.department === 'string' ? worker.department : (worker.department?.name || worker.department_name || 'Production');
                              const desig = worker.designation || 'Worker';
                              const joinDate = worker.joinDate || worker.date_of_joining || '2026-01-15';
                              const isActive = (worker.status || 'Active') === 'Active';

                              return (
                                <tr
                                  key={worker.id || workerId || index}
                                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                                  onClick={() => setViewingWorkerProfile(worker)}
                                >
                                  {/* 1. Row # */}
                                  <td className="py-3.5 px-4 pl-6 text-slate-400 font-medium">
                                    {index + 1}
                                  </td>

                                  {/* 2. Worker Photo + ID + Name */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
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
                                            {worker.name ? worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'W'}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5 leading-tight">
                                          {worker.name}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                                          {workerId}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 3. Designation */}
                                  <td className="py-3.5 px-4 font-medium text-slate-700">
                                    {desig}
                                  </td>

                                  {/* 4. Department */}
                                  <td className="py-3.5 px-4 text-slate-600 font-normal">
                                    {dept}
                                  </td>

                                  {/* 5. Employee Type -> CONTRACTOR NAME SHOWS UNDER TYPE */}
                                  <td className="py-3.5 px-4">
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 font-semibold text-xs shadow-2xs"
                                      title={`Contractor Agency: ${selectedContractor.name}`}
                                    >
                                      <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span className="truncate max-w-[150px]">{selectedContractor.name}</span>
                                    </span>
                                  </td>

                                  {/* 6. Join Date */}
                                  <td className="py-3.5 px-4 text-slate-500 font-normal">
                                    {joinDate}
                                  </td>

                                  {/* 7. Status */}
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

                                  {/* 8. Actions (Pay, View, Edit, Delete) */}
                                  <td className="py-3.5 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                      {/* Small Sign of Pay Option Button */}
                                      <button
                                        type="button"
                                        onClick={() => setPayWorkerModal({
                                          ...worker,
                                          worker_id: workerId,
                                          department: dept,
                                          designation: desig
                                        })}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                        title={`Make Payment to ${worker.name}`}
                                      >
                                        <Banknote className="w-4 h-4" />
                                      </button>

                                      {/* View Details Button */}
                                      <button
                                        type="button"
                                        onClick={() => setViewingWorkerProfile(worker)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                        title="View Worker Dossier"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>

                                      {/* Edit Worker Button */}
                                      <button
                                        type="button"
                                        onClick={() => openEditWorker(worker)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                        title="Edit Worker Details"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>

                                      {/* Delete Worker Button */}
                                      <button
                                        type="button"
                                        onClick={() => setDeleteWorkerModal(worker)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                        title="Remove Worker from Deployment"
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
                  </div>
                )}

                {/* TAB CONTENT 2: INVOICES & PAYMENT LEDGER */}
                {activeDetailTab === 'invoices' && (
                  <div className="p-6 space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Contractor Invoices & Payment Ledger</h3>
                        <p className="text-xs text-slate-500">
                          Generate monthly contractor billing invoices, track TDS deductions, and review cleared payments
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const defaultMandays = Math.max(26, (contractorActiveWorkers.length || 1) * 26);
                            const rate = 700;
                            const gross = defaultMandays * rate;
                            const tds = Math.round(gross * 0.02);
                            setInvoiceGenForm({
                              billingMonth: new Date().toISOString().slice(0, 7),
                              periodLabel: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                              mandays: defaultMandays,
                              dailyRate: rate,
                              grossAmount: gross,
                              tdsRate: 2,
                              deductions: tds,
                              netPayable: gross - tds,
                              dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                              notes: `Monthly labour & attendance billing for ${selectedContractor.name}`
                            });
                            setIsGenerateInvoiceModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Generate Monthly Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerPaymentModal(selectedContractor)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <Coins className="w-4 h-4" />
                          <span>Record Payment</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. Monthly Invoices Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Monthly Invoices ({selectedContractor.invoices?.length || 0})
                        </span>
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending Payable: ₹ {(selectedContractor.pendingPayment || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3">Invoice Number</th>
                              <th className="px-4 py-3">Billing Cycle</th>
                              <th className="px-4 py-3 text-center">Billed Man-days</th>
                              <th className="px-4 py-3 text-right">Gross Amount</th>
                              <th className="px-4 py-3 text-right">TDS / Deductions</th>
                              <th className="px-4 py-3 text-right">Net Payable</th>
                              <th className="px-4 py-3 text-right text-emerald-700 font-bold">Amount Paid</th>
                              <th className="px-4 py-3 text-right">Pending Balance</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(selectedContractor.invoices && selectedContractor.invoices.length > 0) ? (
                              selectedContractor.invoices.map((inv) => {
                                const amtPaid = inv.paidAmount !== undefined 
                                  ? inv.paidAmount 
                                  : inv.amountPaid !== undefined 
                                    ? inv.amountPaid 
                                    : Math.max(0, (Number(inv.netAmount) || 0) - (Number(inv.pendingAmount) || 0));

                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                      {inv.id}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      <div className="font-medium text-slate-900">{inv.period}</div>
                                      <div className="text-[11px] text-slate-400">Due: {inv.dueDate}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                      {inv.mandays} shifts
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-700">
                                      ₹ {(Number(inv.grossAmount) || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-rose-600">
                                      - ₹ {(Number(inv.deductions) || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                                      ₹ {(Number(inv.netAmount) || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                      ₹ {amtPaid.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                                      ₹ {(Number(inv.pendingAmount) || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                        inv.pendingAmount === 0 || inv.status === 'Fully Settled'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : inv.status === 'Partially Paid' || amtPaid > 0
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        {inv.pendingAmount === 0 ? 'Fully Settled' : inv.status}
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
                                          onClick={() => showToast(`Invoice ${inv.id} printed.`)}
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                          title="Print Invoice"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                                  <Receipt className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                                  <p className="font-semibold text-slate-700">No monthly invoices generated yet</p>
                                  <p className="text-slate-400 mt-0.5">Click "Generate Monthly Invoice" above to create this month's bill.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Cleared Disbursements / Payment Ledger Section */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Payment Ledger & Cleared Disbursements ({contractorVouchers.length})
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Historical payments disbursed to {selectedContractor.name}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3">Voucher No.</th>
                              <th className="px-4 py-3">Payment Date</th>
                              <th className="px-4 py-3">Payment Mode</th>
                              <th className="px-4 py-3">Disbursed From</th>
                              <th className="px-4 py-3">Narration / Reference</th>
                              <th className="px-4 py-3 text-right">Amount Paid</th>
                              <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {contractorVouchers.length > 0 ? (
                              contractorVouchers.map((vch) => (
                                <tr key={vch.id || vch.voucher_number} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                                    {vch.voucher_number || vch.id}
                                  </td>
                                  <td className="px-4 py-3 text-slate-700 font-medium">
                                    {vch.payment_date}
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                                      {vch.payment_mode || 'Bank Transfer'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700 font-medium">
                                    {vch.bank_account_name || 'ICICI 1'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={vch.narration}>
                                    {vch.narration || vch.transaction_reference || 'Contractor Bill Payment'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                    ₹ {(Number(vch.amount_paid) || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                                  No payment vouchers disbursed to this contractor yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
          ) : isViewingAllContractorWorkers ? (
            /* VIEW 2: DEDICATED CONTRACTOR WORKFORCE PAGE (WHEN BOX 2 IS CLICKED) */
            <div className="flex-1 flex flex-col pb-12">
              {/* Header */}
              <header className="px-8 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsViewingAllContractorWorkers(false)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Back to Contractor List"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <button
                        type="button"
                        onClick={() => setIsViewingAllContractorWorkers(false)}
                        className="hover:text-indigo-600 transition cursor-pointer"
                      >
                        Contractors
                      </button>
                      <span>/</span>
                      <span className="text-slate-800 font-semibold">Contractor Workers Directory</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mt-1">
                      <span>Contractor Workforce</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {allContractorWorkers.length} Total Workers
                      </span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsViewingAllContractorWorkers(false)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                  >
                    <HardHat className="w-4 h-4 text-indigo-600" />
                    <span>View Contractor List</span>
                  </button>
                  {onNavigateWorkers && (
                    <button
                      type="button"
                      onClick={onNavigateWorkers}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Workers Management</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </header>

              <main className="px-8 lg:px-10 space-y-6 mt-6">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search workers by name, ID, phone, or designation..."
                        value={allWorkerSearchQuery}
                        onChange={(e) => setAllWorkerSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>

                    {/* Filter by Contractor */}
                    <div className="flex items-center gap-2">
                      <select
                        value={allWorkerContractorFilter}
                        onChange={(e) => setAllWorkerContractorFilter(e.target.value)}
                        className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Contractors</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.code || c.contractor_id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Department */}
                    <div className="flex items-center gap-2">
                      <select
                        value={allWorkerDeptFilter}
                        onChange={(e) => setAllWorkerDeptFilter(e.target.value)}
                        className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Departments</option>
                        {departmentsList.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(allWorkerSearchQuery || allWorkerContractorFilter !== 'All' || allWorkerDeptFilter !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAllWorkerSearchQuery('');
                          setAllWorkerContractorFilter('All');
                          setAllWorkerDeptFilter('All');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-semibold text-slate-800">{filteredAllContractorWorkers.length}</span> workers
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3.5">Worker ID & Name</th>
                          <th className="px-6 py-3.5">Contractor Agency</th>
                          <th className="px-6 py-3.5">Department</th>
                          <th className="px-6 py-3.5">Designation</th>
                          <th className="px-6 py-3.5">Contact</th>
                          <th className="px-6 py-3.5 text-right">Wage / Rate</th>
                          <th className="px-6 py-3.5 text-center">Status</th>
                          <th className="px-6 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredAllContractorWorkers.length > 0 ? (
                          filteredAllContractorWorkers.map((worker, idx) => {
                            const agencyName = worker.contractor_agency || worker.contractorAgency || 'General Contractor';
                            return (
                              <tr key={worker.id || worker.worker_id || idx} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                      {worker.name ? worker.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'W'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">{worker.name}</div>
                                      <div className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">
                                        {worker.worker_id || worker.id || `W-${idx + 1}`}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs">
                                    <HardHat className="w-3.5 h-3.5" />
                                    <span>{agencyName}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-700 font-medium">
                                  <div>{worker.department_name || (typeof worker.department === 'string' ? worker.department : worker.department?.name) || 'General'}</div>
                                  {(worker.workArea || worker.work_area) && (
                                    <div className="text-[11px] text-indigo-700 font-normal flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                      <span>{worker.workArea || worker.work_area}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                  {worker.designation || 'Contract Worker'}
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                                  {worker.phone || '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-semibold text-slate-900">
                                    ₹ {parseFloat(worker.base_wage || worker.policy_rate || worker.dailyRate || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {parseFloat(worker.base_wage || worker.policy_rate || worker.dailyRate || 0) < 3000 ? '/ day' : '/ month'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                    worker.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      worker.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'
                                    }`} />
                                    {worker.status || 'Active'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="inline-flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPayWorkerModal({
                                        ...worker,
                                        worker_id: worker.worker_id || worker.workerId || worker.id,
                                        department: worker.department_name || (typeof worker.department === 'string' ? worker.department : worker.department?.name) || 'General',
                                        designation: worker.designation || 'Contract Worker'
                                      })}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                      title={`Make Payment to ${worker.name}`}
                                    >
                                      <Banknote className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setViewingWorkerProfile(worker)}
                                      className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 inline-flex items-center justify-center transition cursor-pointer"
                                      title="View Worker Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                              No contractor workers found matching the filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </main>
            </div>
          ) : (
          /* VIEW 3: CONTRACTORS OVERVIEW & LIST VIEW (DEFAULT) */
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
                {/* 1. Total Contractors (Clickable -> Redirects/scrolls to contractor list) */}
                <div
                  onClick={() => {
                    setSelectedContractorId(null);
                    setIsViewingAllContractorWorkers(false);
                    setSearchQuery('');
                    setDepartmentFilter('All');
                    setPaymentFilter('All');
                    const tableEl = document.getElementById('contractor-directory-table');
                    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group active:scale-[0.99]"
                  title="Click to view contractor list"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                      Total Contractors
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
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
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View List &rarr;
                    </span>
                  </div>
                </div>

                {/* 2. Contractor Workers (Clickable -> Redirects to dedicated contractor worker list page) */}
                <div
                  onClick={() => {
                    setSelectedContractorId(null);
                    setIsViewingAllContractorWorkers(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group active:scale-[0.99]"
                  title="Click to view all contractor workers"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      Contractor Workers
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open List &rarr;
                    </span>
                  </div>
                </div>

                {/* 3. Total Pending Payments (Clickable -> Filters list to pending dues) */}
                <div
                  onClick={() => {
                    setSelectedContractorId(null);
                    setIsViewingAllContractorWorkers(false);
                    setPaymentFilter('Pending');
                    const tableEl = document.getElementById('contractor-directory-table');
                    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative overflow-hidden bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group active:scale-[0.99]"
                  title="Click to filter contractors with pending dues"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider group-hover:text-amber-900 transition-colors">
                      Pending Payments
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors">
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
                    <span className="text-amber-800 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Filter Due &rarr;
                    </span>
                  </div>
                </div>

                {/* 4. Last Month Salary Given to Contractor (Replaces Total Paid YTD) */}
                <div
                  className="relative overflow-hidden bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-xs hover:shadow-sm transition-shadow group"
                  title={`Estimated or disbursed contractor salaries for ${lastMonthName}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Last Month Salary (Contractors)
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-800">
                      ₹ {totalLastMonthSalary.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-emerald-700 font-medium">{lastMonthName} Payout</span>
                    <span className="text-slate-400 font-medium">Last Month Idea</span>
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
                      placeholder="Search by contractor name or code..."
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
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
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
              <div id="contractor-directory-table" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
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
                        filteredContractors.map((contractor) => {
                          const assignedWorkers = getContractorWorkers(contractor);
                          const activeWorkersCount = assignedWorkers.filter((w) => w.status === 'Active').length;
                          return (
                            <tr
                              key={contractor.id}
                              onClick={() => setSelectedContractorId(contractor.id)}
                              className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                            >
                              {/* Agency Identity - Name with Code underneath (Click opens Contractor Dashboard) */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                    {(contractor.name || 'C').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                      {contractor.name}
                                    </div>
                                    <div className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">
                                      {contractor.code || contractor.contractor_id || 'CON-NA'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Contact Person */}
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{contractor.owner || contractor.contact_person || '—'}</div>
                                {contractor.phone && (
                                  <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {contractor.phone}
                                  </div>
                                )}
                              </td>

                              {/* Assigned Departments */}
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                  {(contractor.departments || [contractor.assignedDepartmentName || 'General']).map((dept) => (
                                    <span
                                      key={dept}
                                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                                    >
                                      {dept}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              {/* Deployed Workers - Click on {count} Active opens workers pop-out modal */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkerPopContractor(contractor);
                                    setIsContractorWorkersPopOpen(true);
                                  }}
                                  className="inline-flex flex-col items-center hover:opacity-80 transition cursor-pointer"
                                  title="Click to view all workers under this contractor"
                                >
                                  <span className="font-bold text-indigo-600 hover:text-indigo-800 text-sm underline decoration-dotted">
                                    {assignedWorkers.length} Active
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {activeWorkersCount} on-duty today
                                  </span>
                                </button>
                              </td>

                              {/* Pending Payment */}
                              <td className="px-6 py-4 text-right">
                                {contractor.pendingPayment > 0 ? (
                                  <div>
                                    <div className="font-bold text-amber-700 text-sm">
                                      ₹ {contractor.pendingPayment.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-[10px] text-amber-600 font-medium">
                                      {contractor.invoices?.filter((i) => i.pendingAmount > 0).length || 1} Pending Cycle(s)
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

                              {/* Action Buttons: View Workers (Eye), Edit (Pencil), Delete (Trash2) */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWorkerPopContractor(contractor);
                                      setIsContractorWorkersPopOpen(true);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center transition cursor-pointer"
                                    title="View Workers Directory"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditContractorModal(contractor);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition cursor-pointer"
                                    title="Edit Contractor"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setContractorToDelete(contractor);
                                      setIsDeleteContractorModalOpen(true);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                                    title="Delete Contractor"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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

      {/* ===================== MODAL: RECORD / SETTLE PAYMENT (UNIFIED PAYMENT FORUM) ===================== */}
      {isPaymentModalOpen && paymentContractor && (
        <PaymentForumModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          initialContractor={paymentContractor}
          initialCategory="Contractor Bill"
          initialAmount={paymentForm.amount || paymentContractor.pendingPayment || ''}
          title={`Settle Contractor Bill - ${paymentContractor.name}`}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            // Refresh contractor records
            DataStoreService.get('contractors', []).then((freshList) => {
              if (Array.isArray(freshList) && freshList.length > 0) {
                setContractors(freshList);
              }
            });
            showToast(`Payment processed successfully for ${paymentContractor.name}!`);
          }}
        />
      )}

      {/* ===================== MODAL: PAY INDIVIDUAL DEPLOYED WORKER ===================== */}
      {payWorkerModal && (
        <PaymentForumModal
          isOpen={!!payWorkerModal}
          onClose={() => setPayWorkerModal(null)}
          initialWorker={payWorkerModal}
          initialCategory="Salary"
          title={`Make Payment - ${payWorkerModal.name}`}
          onSuccess={() => {
            setPayWorkerModal(null);
            showToast(`Payment processed successfully for ${payWorkerModal.name}!`);
          }}
        />
      )}

      {/* ===================== MODAL: GENERATE MONTHLY INVOICE ===================== */}
      {isGenerateInvoiceModalOpen && selectedContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Generate Monthly Invoice</h3>
                  <p className="text-xs text-slate-500">{selectedContractor.name} ({selectedContractor.code || selectedContractor.contractor_id})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Billing Month */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Month <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={invoiceGenForm.billingMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      const dateObj = new Date(val + '-01');
                      const label = !isNaN(dateObj) ? dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : val;
                      setInvoiceGenForm(prev => ({
                        ...prev,
                        billingMonth: val,
                        periodLabel: label
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceGenForm.dueDate}
                    onChange={(e) => setInvoiceGenForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Billed Man-Days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billed Man-days (Shifts) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={invoiceGenForm.mandays}
                    onChange={(e) => {
                      const days = Math.max(0, parseInt(e.target.value) || 0);
                      const gross = days * (Number(invoiceGenForm.dailyRate) || 0);
                      const tds = Math.round(gross * (Number(invoiceGenForm.tdsRate || 2) / 100));
                      setInvoiceGenForm(prev => ({
                        ...prev,
                        mandays: days,
                        grossAmount: gross,
                        deductions: tds,
                        netPayable: gross - tds
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Deployed Workers: {contractorActiveWorkers.length}
                  </span>
                </div>

                {/* Shift Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wage Rate per Shift (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={invoiceGenForm.dailyRate}
                    onChange={(e) => {
                      const rate = Math.max(0, parseFloat(e.target.value) || 0);
                      const gross = (Number(invoiceGenForm.mandays) || 0) * rate;
                      const tds = Math.round(gross * (Number(invoiceGenForm.tdsRate || 2) / 100));
                      setInvoiceGenForm(prev => ({
                        ...prev,
                        dailyRate: rate,
                        grossAmount: gross,
                        deductions: tds,
                        netPayable: gross - tds
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Amount Breakdown Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Invoice Amount:</span>
                  <span className="font-semibold font-mono text-slate-900">
                    ₹ {Number(invoiceGenForm.grossAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>TDS Deduction (2% u/s 194C):</span>
                  <span className="font-semibold font-mono">
                    - ₹ {Number(invoiceGenForm.deductions || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Net Payable:</span>
                  <span className="text-indigo-600 font-mono">
                    ₹ {Number(invoiceGenForm.netPayable || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Billing Reference
                </label>
                <textarea
                  rows="2"
                  value={invoiceGenForm.notes}
                  onChange={(e) => setInvoiceGenForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Monthly billing narration..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGenerateInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Generate & Issue Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT WORKER ===================== */}
      {editWorkerModal && editWorkerForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Worker Profile</h3>
                  <p className="text-[11px] font-mono text-slate-400">{editWorkerForm.workerId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditWorkerModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditWorkerSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editWorkerForm.name}
                  onChange={(e) => setEditWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editWorkerForm.designation}
                    onChange={(e) => setEditWorkerForm(prev => ({ ...prev, designation: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editWorkerForm.department}
                    onChange={(e) => setEditWorkerForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editWorkerForm.phone}
                    onChange={(e) => setEditWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editWorkerForm.status}
                    onChange={(e) => setEditWorkerForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditWorkerModal(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE WORKER CONFIRMATION ===================== */}
      {deleteWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Worker?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you sure you want to remove <strong className="text-slate-800">{deleteWorkerModal.name}</strong> from deployment under {selectedContractor?.name}?
            </p>
            <div className="flex items-center justify-center gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setDeleteWorkerModal(null)}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorker}
                className="px-4 py-2 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD WORKER TO CONTRACTOR (IDENTICAL TO WORKERSPAGE) ===================== */}
      {isAddWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Register New Worker {workerForm.contractorAgency ? `— ${workerForm.contractorAgency}` : ''}
                  </h3>
                  <p className="text-xs text-slate-400">Complete personal, salary banking &amp; contract details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWorkerModalOpen(false)}
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
                        <User className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => workerFileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                      title="Upload Photo"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={workerFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleWorkerPhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Instructions */}
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-slate-700 block">Worker Profile Photograph</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload worker picture (JPG/PNG). If no photo is uploaded, profile shows no avatar.
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

                {/* ID, Full Name, Designation, Gender, DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Worker ID <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">
                        Auto-Generated ID
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={workerForm.workerId}
                      onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. W001"
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
                          setWorkerAddErrors((prev) => ({ ...prev, name: 'Numeric values are not allowed in name.' }));
                        } else if (workerAddErrors.name) {
                          setWorkerAddErrors((prev) => ({ ...prev, name: null }));
                        }
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.name && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.name}</p>
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
                        if (workerAddErrors.dob) setWorkerAddErrors((prev) => ({ ...prev, dob: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.dob ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.dob && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.dob}</p>
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
                        if (workerAddErrors.phone) setWorkerAddErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.phone && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.phone}</p>
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
                        if (workerAddErrors.emergencyContact) setWorkerAddErrors((prev) => ({ ...prev, emergencyContact: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.emergencyContact ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.emergencyContact && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.emergencyContact}</p>
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
                          ...(sameAsResidentialWorker ? { permanentAddress: val } : {}),
                        }));
                        if (workerAddErrors.address) setWorkerAddErrors((prev) => ({ ...prev, address: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.address && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.address}</p>
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
                        if (sameAsResidentialWorker && val !== workerForm.address) {
                          setSameAsResidentialWorker(false);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={sameAsResidentialWorker}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsResidentialWorker(checked);
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
                      {sameAsResidentialWorker && (
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
                        contractorAgency: workerForm.contractorAgency || selectedContractor?.name || '',
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-amber-900">
                        Contractor Agency <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        Auto-selected Contractor
                      </span>
                    </div>
                    <select
                      required
                      value={workerForm.contractorAgency}
                      onChange={(e) => {
                        setWorkerForm({ ...workerForm, contractorAgency: e.target.value });
                        if (workerAddErrors.contractorAgency) setWorkerAddErrors((prev) => ({ ...prev, contractorAgency: null }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">-- Select Registered Contractor --</option>
                      {contractors.map((c) => (
                        <option key={c.id || c.contractor_id} value={c.name}>
                          {c.name} {c.code ? `(${c.code})` : c.contractor_id ? `(${c.contractor_id})` : ''}
                        </option>
                      ))}
                    </select>
                    {workerAddErrors.contractorAgency && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.contractorAgency}</p>
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
                        if (workerAddErrors.department) setWorkerAddErrors((prev) => ({ ...prev, department: null }));
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
                    {workerAddErrors.department && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={workerForm.designation}
                      onChange={(e) => {
                        setWorkerForm({ ...workerForm, designation: e.target.value });
                        if (workerAddErrors.designation) setWorkerAddErrors((prev) => ({ ...prev, designation: null }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Designation --</option>
                      {availableDesignations.map((d) => (
                        <option key={d.id} value={d.title}>
                          {d.title} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                    {workerAddErrors.designation && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.designation}</p>
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
                        if (workerAddErrors.joinDate) setWorkerAddErrors((prev) => ({ ...prev, joinDate: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.joinDate ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.joinDate && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.joinDate}</p>
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
                    Contractor Work Model
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
                      placeholder="e.g. 98765432101234"
                      value={workerForm.bankAccount}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 18);
                        setWorkerForm({ ...workerForm, bankAccount: clean });
                        if (workerAddErrors.bankAccount) setWorkerAddErrors((prev) => ({ ...prev, bankAccount: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.bankAccount ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.bankAccount && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.bankAccount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={workerForm.ifscCode}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 11);
                        setWorkerForm({ ...workerForm, ifscCode: clean });
                        if (workerAddErrors.ifscCode) setWorkerAddErrors((prev) => ({ ...prev, ifscCode: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.ifscCode ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.ifscCode && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.ifscCode}</p>
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
                      placeholder="e.g. 209736518429"
                      value={workerForm.aadharNumber}
                      onChange={(e) => {
                        const clean = sanitizeNumericInput(e.target.value, 12);
                        setWorkerForm({ ...workerForm, aadharNumber: clean });
                        if (workerAddErrors.aadharNumber) setWorkerAddErrors((prev) => ({ ...prev, aadharNumber: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.aadharNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.aadharNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.aadharNumber}</p>
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
                      ref={workerAadharFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleWorkerDocUpload(e, 'aadharDoc')}
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
                            onClick={() => setAdminDocPreview({ title: 'Worker Aadhaar Card Document', data: workerForm.aadharDoc })}
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
                        onClick={() => workerAadharFileInputRef.current?.click()}
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
                      placeholder="e.g. ABCDE1234F"
                      value={workerForm.panNumber}
                      onChange={(e) => {
                        const clean = sanitizeAlphaNumericUpper(e.target.value, 10);
                        setWorkerForm({ ...workerForm, panNumber: clean });
                        if (workerAddErrors.panNumber) setWorkerAddErrors((prev) => ({ ...prev, panNumber: null }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${
                        workerAddErrors.panNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                      } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                    />
                    {workerAddErrors.panNumber && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{workerAddErrors.panNumber}</p>
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
                      ref={workerPanFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleWorkerDocUpload(e, 'panDoc')}
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
                            onClick={() => setAdminDocPreview({ title: 'Worker PAN Card Document', data: workerForm.panDoc })}
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
                        onClick={() => workerPanFileInputRef.current?.click()}
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
                  onClick={() => setIsAddWorkerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWorker}
                  className={`px-5 py-2 ${
                    isSubmittingWorker ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  } text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition`}
                >
                  {isSubmittingWorker ? 'Saving Worker...' : 'Save Worker Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REGISTER NEW CONTRACTOR ===================== */}
      {isAddContractorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <form onSubmit={handleAddContractorSubmit} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {/* Section 1: Agency & Contact Person */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Agency & Proprietor Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contractor / Agency Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Industrial Solutions"
                      value={newContractorForm.name}
                      onChange={(e) => {
                        const val = sanitizeNameInput(e.target.value);
                        setNewContractorForm({ ...newContractorForm, name: val });
                        if (contractorAddErrors.name) setContractorAddErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.name ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.name && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contractor Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. CON001"
                      value={newContractorForm.code}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 6);
                        setNewContractorForm({ ...newContractorForm, code: val });
                        if (contractorAddErrors.code) setContractorAddErrors((prev) => ({ ...prev, code: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.code ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.code && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Owner / Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={newContractorForm.owner}
                      onChange={(e) => {
                        const val = sanitizeNameInput(e.target.value);
                        setNewContractorForm({ ...newContractorForm, owner: val });
                        if (contractorAddErrors.owner) setContractorAddErrors((prev) => ({ ...prev, owner: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.owner ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.owner && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.owner}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Primary Mobile <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={newContractorForm.phone}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 10);
                        setNewContractorForm({ ...newContractorForm, phone: val });
                        if (contractorAddErrors.phone) setContractorAddErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.phone ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.phone && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alternate Mobile</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. 9812345678"
                      value={newContractorForm.alternatePhone}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 10);
                        setNewContractorForm({ ...newContractorForm, alternatePhone: val });
                        if (contractorAddErrors.alternatePhone) setContractorAddErrors((prev) => ({ ...prev, alternatePhone: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.alternatePhone ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.alternatePhone && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.alternatePhone}</p>}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@apexsolutions.in"
                    value={newContractorForm.email}
                    onChange={(e) => {
                      setNewContractorForm({ ...newContractorForm, email: e.target.value });
                      if (contractorAddErrors.email) setContractorAddErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                      contractorAddErrors.email ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {contractorAddErrors.email && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.email}</p>}
                </div>
              </div>

              {/* Section 2: Addresses */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Address Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Operating Address</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Plot No. 42, Industrial Focal Point, Phase 4, Ludhiana, Punjab"
                      value={newContractorForm.address}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Permanent Residential Address</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. House No. 128, Sector 32-A, Chandigarh"
                      value={newContractorForm.permanentAddress}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, permanentAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Statutory & Identity */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Statutory & Verification</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 209736518429"
                      value={newContractorForm.aadharNumber}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 12);
                        setNewContractorForm({ ...newContractorForm, aadharNumber: val });
                        if (contractorAddErrors.aadharNumber) setContractorAddErrors((prev) => ({ ...prev, aadharNumber: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.aadharNumber ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.aadharNumber && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.aadharNumber}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={newContractorForm.panNumber}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 10);
                        setNewContractorForm({ ...newContractorForm, panNumber: val });
                        if (contractorAddErrors.panNumber) setContractorAddErrors((prev) => ({ ...prev, panNumber: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.panNumber ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.panNumber && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.panNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Upload Aadhaar Card (Image/PDF)</label>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={contractorAadharFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleContractorDocUpload(e, 'aadharDoc', false)}
                      className="hidden"
                    />
                    {newContractorForm.aadharDoc ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: `${newContractorForm.name || 'Contractor'} Aadhaar Card`, data: newContractorForm.aadharDoc })}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewContractorForm({ ...newContractorForm, aadharDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => contractorAadharFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-slate-500" /> Select Aadhaar File
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Upload PAN Card (Image/PDF)</label>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={contractorPanFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleContractorDocUpload(e, 'panDoc', false)}
                      className="hidden"
                    />
                    {newContractorForm.panDoc ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: `${newContractorForm.name || 'Contractor'} PAN Card`, data: newContractorForm.panDoc })}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewContractorForm({ ...newContractorForm, panDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => contractorPanFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-slate-500" /> Select PAN File
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GSTIN (if available)</label>
                    <input
                      type="text"
                      placeholder="e.g. 03AAAAA0000A1Z5"
                      value={newContractorForm.gstin}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Labour License No.</label>
                    <input
                      type="text"
                      placeholder="e.g. PB/LUD/LL/2026/0412"
                      value={newContractorForm.labourLicense}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, labourLicense: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Banking Information */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Bank Account for Disbursements</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={newContractorForm.bankName}
                      onChange={(e) => {
                        setNewContractorForm({ ...newContractorForm, bankName: e.target.value });
                        if (contractorAddErrors.bankName) setContractorAddErrors((prev) => ({ ...prev, bankName: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.bankName ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.bankName && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.bankName}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Account No.</label>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="e.g. 98765432101234"
                      value={newContractorForm.bankAccount}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 18);
                        setNewContractorForm({ ...newContractorForm, bankAccount: val });
                        if (contractorAddErrors.bankAccount) setContractorAddErrors((prev) => ({ ...prev, bankAccount: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.bankAccount ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.bankAccount && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.bankAccount}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={newContractorForm.ifscCode}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 11);
                        setNewContractorForm({ ...newContractorForm, ifscCode: val });
                        if (contractorAddErrors.ifscCode) setContractorAddErrors((prev) => ({ ...prev, ifscCode: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-normal border ${
                        contractorAddErrors.ifscCode ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorAddErrors.ifscCode && <p className="text-xs text-rose-500 font-medium mt-1">{contractorAddErrors.ifscCode}</p>}
                  </div>
                </div>
              </div>

              {/* Section 5: Assignment & Scope */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Assigned Department & Services</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Department*</label>
                    <select
                      value={newContractorForm.assignedDepartment}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, assignedDepartment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    >
                      <option value="">Select Created Department</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Scope / Services</label>
                    <input
                      type="text"
                      placeholder="e.g. Manpower Supply"
                      value={newContractorForm.primaryService}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, primaryService: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={newContractorForm.status}
                      onChange={(e) => setNewContractorForm({ ...newContractorForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Register Contractor Agency'}
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
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-800 border-4 border-white/20 shadow-lg mb-3 flex items-center justify-center">
                {selectedWorkerDetail.photo ? (
                  <img
                    src={selectedWorkerDetail.photo}
                    alt={selectedWorkerDetail.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
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
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Aadhar Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-800">{maskAadhaar(selectedWorkerDetail.aadhar)}</span>
                  {(selectedWorkerDetail.aadharDoc || selectedWorkerDetail.aadhar_doc) && (
                    <button
                      type="button"
                      onClick={() => setAdminDocPreview({ title: `${selectedWorkerDetail.name}'s Aadhaar Card`, data: selectedWorkerDetail.aadharDoc || selectedWorkerDetail.aadhar_doc })}
                      className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                    >
                      View Doc
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">PAN Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-800">{selectedWorkerDetail.pan}</span>
                  {(selectedWorkerDetail.panDoc || selectedWorkerDetail.pan_doc) && (
                    <button
                      type="button"
                      onClick={() => setAdminDocPreview({ title: `${selectedWorkerDetail.name}'s PAN Card`, data: selectedWorkerDetail.panDoc || selectedWorkerDetail.pan_doc })}
                      className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                    >
                      View Doc
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Bank Account:</span>
                <span className="font-mono font-medium text-slate-800">{maskBankAccount(selectedWorkerDetail.bankAccount)}</span>
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

      {/* ===================== MODAL: POP-OUT WORKERS DIRECTORY ===================== */}
      {isContractorWorkersPopOpen && selectedWorkerPopContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      Workers in {selectedWorkerPopContractor.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold">
                      {selectedWorkerPopContractor.code || selectedWorkerPopContractor.contractor_id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      selectedWorkerPopContractor.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {selectedWorkerPopContractor.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contact: {selectedWorkerPopContractor.owner || selectedWorkerPopContractor.contact_person || '—'} {selectedWorkerPopContractor.phone ? `(${selectedWorkerPopContractor.phone})` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsContractorWorkersPopOpen(false);
                  setSelectedWorkerPopContractor(null);
                  setPopWorkerSearchQuery('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pop-Out Search & Action Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workers by name or ID..."
                  value={popWorkerSearchQuery}
                  onChange={(e) => setPopWorkerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Total Deployed:{' '}
                  <strong className="text-indigo-600 font-bold">
                    {getContractorWorkers(selectedWorkerPopContractor).length}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => openAddWorkerModal(selectedWorkerPopContractor)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Worker</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContractorId(selectedWorkerPopContractor.id);
                    setIsContractorWorkersPopOpen(false);
                    setActiveDetailTab('workers');
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Detailed Analytics</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pop-Out Table */}
            <div className="overflow-y-auto flex-1 p-6">
              {(() => {
                const list = getContractorWorkers(selectedWorkerPopContractor).filter((w) => {
                  const q = popWorkerSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    (w.name && w.name.toLowerCase().includes(q)) ||
                    (w.id && String(w.id).toLowerCase().includes(q)) ||
                    (w.worker_id && String(w.worker_id).toLowerCase().includes(q))
                  );
                });

                if (list.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 stroke-1" />
                      <span>No workers found under this contractor agency.</span>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Worker ID</th>
                        <th className="px-4 py-2.5">Worker Name</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5">Designation</th>
                        <th className="px-4 py-2.5">Phone</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((w, idx) => (
                        <tr key={w.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                            {w.id || w.worker_id || `W-${idx + 1}`}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{w.name}</td>
                          <td className="px-4 py-3 text-slate-600">{w.department || 'General'}</td>
                          <td className="px-4 py-3 text-slate-600">{w.designation || 'Worker'}</td>
                          <td className="px-4 py-3 text-slate-500">{w.phone || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                w.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {w.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsContractorWorkersPopOpen(false);
                  setSelectedWorkerPopContractor(null);
                  setPopWorkerSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT CONTRACTOR ===================== */}
      {isEditContractorModalOpen && editContractorForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Edit Contractor Agency</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditContractorModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditContractorSubmit} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {/* Section 1: Agency & Proprietor Details */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Agency & Proprietor Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contractor / Agency Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editContractorForm.name}
                      onChange={(e) => {
                        const val = sanitizeNameInput(e.target.value);
                        setEditContractorForm({ ...editContractorForm, name: val });
                        if (contractorEditErrors.name) setContractorEditErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                        contractorEditErrors.name ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.name && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contractor Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={editContractorForm.code}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 6);
                        setEditContractorForm({ ...editContractorForm, code: val });
                        if (contractorEditErrors.code) setContractorEditErrors((prev) => ({ ...prev, code: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase border ${
                        contractorEditErrors.code ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.code && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Owner / Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editContractorForm.owner}
                      onChange={(e) => {
                        const val = sanitizeNameInput(e.target.value);
                        setEditContractorForm({ ...editContractorForm, owner: val });
                        if (contractorEditErrors.owner) setContractorEditErrors((prev) => ({ ...prev, owner: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                        contractorEditErrors.owner ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.owner && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.owner}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Primary Mobile <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={editContractorForm.phone}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 10);
                        setEditContractorForm({ ...editContractorForm, phone: val });
                        if (contractorEditErrors.phone) setContractorEditErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                        contractorEditErrors.phone ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.phone && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alternate Mobile</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editContractorForm.alternatePhone}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 10);
                        setEditContractorForm({ ...editContractorForm, alternatePhone: val });
                        if (contractorEditErrors.alternatePhone) setContractorEditErrors((prev) => ({ ...prev, alternatePhone: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                        contractorEditErrors.alternatePhone ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.alternatePhone && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.alternatePhone}</p>}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editContractorForm.email}
                    onChange={(e) => {
                      setEditContractorForm({ ...editContractorForm, email: e.target.value });
                      if (contractorEditErrors.email) setContractorEditErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                      contractorEditErrors.email ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {contractorEditErrors.email && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.email}</p>}
                </div>
              </div>

              {/* Section 2: Addresses */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Address Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Operating Address</label>
                    <textarea
                      rows={2}
                      value={editContractorForm.address}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Permanent Residential Address</label>
                    <textarea
                      rows={2}
                      value={editContractorForm.permanentAddress}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, permanentAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Statutory & Identity */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Statutory & Verification
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={editContractorForm.aadharNumber}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 12);
                        setEditContractorForm({ ...editContractorForm, aadharNumber: val });
                        if (contractorEditErrors.aadharNumber) setContractorEditErrors((prev) => ({ ...prev, aadharNumber: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono border ${
                        contractorEditErrors.aadharNumber ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.aadharNumber && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.aadharNumber}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editContractorForm.panNumber}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 10);
                        setEditContractorForm({ ...editContractorForm, panNumber: val });
                        if (contractorEditErrors.panNumber) setContractorEditErrors((prev) => ({ ...prev, panNumber: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase border ${
                        contractorEditErrors.panNumber ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.panNumber && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.panNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Upload Aadhaar Card (Image/PDF)</label>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={editContractorAadharFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleContractorDocUpload(e, 'aadharDoc', true)}
                      className="hidden"
                    />
                    {editContractorForm.aadharDoc ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: `${editContractorForm.name || 'Contractor'} Aadhaar Card`, data: editContractorForm.aadharDoc })}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditContractorForm({ ...editContractorForm, aadharDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editContractorAadharFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-slate-500" /> Select Aadhaar File
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Upload PAN Card (Image/PDF)</label>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <input
                      ref={editContractorPanFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleContractorDocUpload(e, 'panDoc', true)}
                      className="hidden"
                    />
                    {editContractorForm.panDoc ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdminDocPreview({ title: `${editContractorForm.name || 'Contractor'} PAN Card`, data: editContractorForm.panDoc })}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditContractorForm({ ...editContractorForm, panDoc: '' })}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editContractorPanFileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-slate-500" /> Select PAN File
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GSTIN (if available)</label>
                    <input
                      type="text"
                      value={editContractorForm.gstin}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Labour License No.</label>
                    <input
                      type="text"
                      value={editContractorForm.labourLicense}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, labourLicense: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Banking Information */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Bank Account for Disbursements
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editContractorForm.bankName}
                      onChange={(e) => {
                        setEditContractorForm({ ...editContractorForm, bankName: e.target.value });
                        if (contractorEditErrors.bankName) setContractorEditErrors((prev) => ({ ...prev, bankName: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 border ${
                        contractorEditErrors.bankName ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.bankName && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.bankName}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Account No.</label>
                    <input
                      type="text"
                      maxLength={18}
                      value={editContractorForm.bankAccount}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, 18);
                        setEditContractorForm({ ...editContractorForm, bankAccount: val });
                        if (contractorEditErrors.bankAccount) setContractorEditErrors((prev) => ({ ...prev, bankAccount: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono border ${
                        contractorEditErrors.bankAccount ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.bankAccount && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.bankAccount}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={editContractorForm.ifscCode}
                      onChange={(e) => {
                        const val = sanitizeAlphaNumericUpper(e.target.value, 11);
                        setEditContractorForm({ ...editContractorForm, ifscCode: val });
                        if (contractorEditErrors.ifscCode) setContractorEditErrors((prev) => ({ ...prev, ifscCode: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono uppercase border ${
                        contractorEditErrors.ifscCode ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                    {contractorEditErrors.ifscCode && <p className="text-xs text-rose-500 font-medium mt-1">{contractorEditErrors.ifscCode}</p>}
                  </div>
                </div>
              </div>

              {/* Section 5: Assignment & Scope */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Assigned Department & Services
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Department</label>
                    <select
                      value={editContractorForm.assignedDepartment}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, assignedDepartment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    >
                      <option value="">Select Department</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Scope / Services</label>
                    <input
                      type="text"
                      placeholder="e.g. Manpower Supply"
                      value={editContractorForm.primaryService}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, primaryService: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={editContractorForm.status}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditContractorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE CONTRACTOR CONFIRMATION ===================== */}
      {isDeleteContractorModalOpen && contractorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-base">Delete Contractor</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteContractorModalOpen(false);
                  setContractorToDelete(null);
                }}
                className="text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                Are you sure you want to delete contractor{' '}
                <strong className="text-slate-900 font-bold">{contractorToDelete.name}</strong> (
                <span className="font-mono text-indigo-600 font-semibold">{contractorToDelete.code || contractorToDelete.contractor_id}</span>)?
              </p>
              <p className="text-slate-500">
                This will permanently delete this contractor agency record from the database.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteContractorModalOpen(false);
                    setContractorToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteContractor}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  Delete Contractor
                </button>
              </div>
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
    </div>
  );
};

export default ContractorPage;
