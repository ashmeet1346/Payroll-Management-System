import React, { useState, useMemo, useEffect } from 'react';
import { DepartmentService, DesignationService, WorkerService, ContractorService, WorkAreaService } from '../services/api';
import { validateName, validateWorkAreaName, validateCode, sanitizeAlphaNumericUpper } from '../utils/validation';
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
  Cog,
  Wrench,
  Shield,
  Package,
  Truck,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Tag,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MapPin,
  Compass,
  ReceiptText
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

export const DepartmentPage = ({
  onNavigateWorkers,
  onNavigateDashboard,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigatePayments,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) => {
  const [activeNav, setActiveNav] = useState('Department');
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'designations' | 'workareas'

  // Data states
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [workAreas, setWorkAreas] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalWorkerSearch, setModalWorkerSearch] = useState('');

  // Load departments, designations, work areas & workers
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptsData, desigsData, workAreasData, workersData, contractorsData] = await Promise.all([
        DepartmentService.getAll(),
        DesignationService.getAll(),
        WorkAreaService.getAll().catch(() => []),
        WorkerService.getAll().catch(() => []),
        ContractorService.getAll().catch(() => []),
      ]);

      const rawWorkers = workersData || [];
      setWorkers(rawWorkers);
      setContractorsList(Array.isArray(contractorsData) ? contractorsData : contractorsData?.results || []);

      const mappedDepts = (deptsData || []).map((d) => {
        const assigned = rawWorkers.filter(
          (w) =>
            w.department === d.id ||
            w.department_id === d.id ||
            String(w.department_name || '').toLowerCase() === d.name.toLowerCase()
        );
        const activeCount = assigned.filter((w) => w.status === 'Active').length;
        const permanent = assigned.filter((w) => w.worker_type === 'Permanent').length;
        const contractor = assigned.filter((w) => w.worker_type === 'Contractor').length;

        return {
          id: d.id,
          name: d.name,
          code: d.code || '',
          description: d.description || '',
          totalWorkers: activeCount,
          head: d.head || '',
          status: d.is_active ? 'Active' : 'Inactive',
          permanentCount: permanent,
          contractorCount: contractor,
        };
      });
      setDepartments(mappedDepts);

      const mappedDesigs = (desigsData || []).map((des) => {
        const assigned = rawWorkers.filter(
          (w) =>
            w.designation &&
            (w.designation.toLowerCase() === des.title.toLowerCase() ||
              (des.code && w.designation.toLowerCase().includes(des.code.toLowerCase())))
        );
        const activeCount = assigned.filter((w) => w.status === 'Active').length;

        return {
          id: des.id,
          title: des.title,
          code: des.code || '',
          departmentId: des.department,
          departmentName:
            des.department_name || mappedDepts.find((d) => d.id === des.department)?.name || 'General',
          description: des.description || '',
          totalWorkers: activeCount,
          status: des.is_active ? 'Active' : 'Inactive',
        };
      });
      setDesignations(mappedDesigs);

      const mappedAreas = (workAreasData || []).map((wa) => {
        const assigned = rawWorkers.filter(
          (w) =>
            String(w.workArea || w.work_area || '').toLowerCase() === wa.name.toLowerCase() ||
            (wa.code && String(w.workArea || w.work_area || '').toLowerCase().includes(wa.code.toLowerCase()))
        );
        const activeCount = assigned.filter((w) => w.status === 'Active').length;
        const permanent = assigned.filter((w) => w.worker_type === 'Permanent').length;
        const contractor = assigned.filter((w) => w.worker_type === 'Contractor').length;

        return {
          id: wa.id,
          name: wa.name,
          code: wa.code || '',
          floor: wa.floor || 'Ground Floor',
          department: wa.department || 'Plant-Wide / Multi-Dept',
          description: wa.description || '',
          status: wa.status || (wa.is_active ? 'Active' : 'Inactive'),
          totalWorkers: activeCount,
          permanentCount: permanent,
          contractorCount: contractor,
        };
      });
      setWorkAreas(mappedAreas);
    } catch (err) {
      console.warn('Could not load departments, designations, work areas or workers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search & Filter for Departments
  const [deptSearch, setDeptSearch] = useState('');
  const [deptStatus, setDeptStatus] = useState('All');
  const [deptSortConfig, setDeptSortConfig] = useState({ key: 'name', direction: 'asc' });
  const handleDeptSort = (key) => {
    setDeptSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Search & Filter for Designations
  const [desigSearch, setDesigSearch] = useState('');
  const [desigDeptFilter, setDesigDeptFilter] = useState('All');
  const [desigStatus, setDesigStatus] = useState('All');
  const [desigSortConfig, setDesigSortConfig] = useState({ key: 'title', direction: 'asc' });
  const handleDesigSort = (key) => {
    setDesigSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Search & Filter for Work Areas
  const [areaSearch, setAreaSearch] = useState('');
  const [areaStatusFilter, setAreaStatusFilter] = useState('All');
  const [areaSortConfig, setAreaSortConfig] = useState({ key: 'name', direction: 'asc' });
  const handleAreaSort = (key) => {
    setAreaSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Modal Worker Roster Sort
  const [modalWorkerSortConfig, setModalWorkerSortConfig] = useState({ key: 'name', direction: 'asc' });
  const handleModalWorkerSort = (key) => {
    setModalWorkerSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Helper to render sort arrow beside column header
  const renderSortArrow = (config, colKey) => {
    if (config.key === colKey) {
      return config.direction === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-indigo-600 inline ml-1 shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-indigo-600 inline ml-1 shrink-0" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 inline ml-1 shrink-0 transition" />;
  };

  // Modals for Work Area
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [isViewAreaModalOpen, setIsViewAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // Form State for Add Work Area
  const [areaAddForm, setAreaAddForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  });
  const [areaAddErrors, setAreaAddErrors] = useState({});

  // Form State for Edit Work Area
  const [areaEditForm, setAreaEditForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  });
  const [areaEditErrors, setAreaEditErrors] = useState({});

  // Modals for Department
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [isViewDeptModalOpen, setIsViewDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Form State for Add Department: name, code, description, status
  const [deptAddForm, setDeptAddForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  });
  const [deptAddErrors, setDeptAddErrors] = useState({});

  // Form State for Edit Department
  const [deptEditForm, setDeptEditForm] = useState({
    name: '',
    code: '',
    description: '',
    head: '',
    status: 'Active',
  });
  const [deptEditErrors, setDeptEditErrors] = useState({});

  // Modals for Designation
  const [isAddDesigModalOpen, setIsAddDesigModalOpen] = useState(false);
  const [isEditDesigModalOpen, setIsEditDesigModalOpen] = useState(false);
  const [isViewDesigModalOpen, setIsViewDesigModalOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState(null);

  // Form State for Designation: title, code, description, status
  const [desigForm, setDesigForm] = useState({
    title: '',
    code: '',
    department: '',
    description: '',
    status: 'Active',
  });
  const [desigAddErrors, setDesigAddErrors] = useState({});
  const [desigEditErrors, setDesigEditErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractorsList, setContractorsList] = useState([]);

  // Nav Items
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

  // Calculations
  const totalDepartmentsCount = departments.length;
  const activeDepartmentsCount = departments.filter((d) => d.status === 'Active').length;
  const totalDesignationsCount = designations.length;
  const activeDesignationsCount = designations.filter((d) => d.status === 'Active').length;
  const totalWorkAreasCount = workAreas.length;
  const activeWorkAreasCount = workAreas.filter((a) => a.status === 'Active').length;
  const totalWorkersCount = workers.filter((w) => w.status === 'Active').length;

  // Filtered & Sorted Departments (Search STRICTLY on Name and Code only)
  const filteredDepartments = useMemo(() => {
    const list = departments.filter((d) => {
      const q = deptSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q));
      const matchesStatus = deptStatus === 'All' || d.status === deptStatus;
      return matchesSearch && matchesStatus;
    });

    return [...list].sort((a, b) => {
      const factor = deptSortConfig.direction === 'asc' ? 1 : -1;
      return factor * a.name.localeCompare(b.name);
    });
  }, [departments, deptSearch, deptStatus, deptSortConfig]);

  // Filtered & Sorted Designations (Search STRICTLY on Name/Title and Code only)
  const filteredDesignations = useMemo(() => {
    const list = designations.filter((des) => {
      const q = desigSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        des.title.toLowerCase().includes(q) ||
        (des.code && des.code.toLowerCase().includes(q));
      const matchesDept =
        desigDeptFilter === 'All' || String(des.departmentId) === String(desigDeptFilter);
      const matchesStatus = desigStatus === 'All' || des.status === desigStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });

    return [...list].sort((a, b) => {
      const factor = desigSortConfig.direction === 'asc' ? 1 : -1;
      return factor * a.title.localeCompare(b.title);
    });
  }, [designations, desigSearch, desigDeptFilter, desigStatus, desigSortConfig]);

  // Filtered & Sorted Work Areas (Search STRICTLY on Name and Code only)
  const filteredWorkAreas = useMemo(() => {
    const list = workAreas.filter((a) => {
      const q = areaSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q));
      const matchesStatus = areaStatusFilter === 'All' || a.status === areaStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...list].sort((a, b) => {
      const factor = areaSortConfig.direction === 'asc' ? 1 : -1;
      return factor * a.name.localeCompare(b.name);
    });
  }, [workAreas, areaSearch, areaStatusFilter, areaSortConfig]);

  // Workers assigned to currently viewed department (STRICT Name or Code search)
  const deptAssignedWorkers = useMemo(() => {
    if (!selectedDept) return [];
    const q = modalWorkerSearch.toLowerCase().trim();
    const list = workers.filter((w) => {
      const matchDept =
        w.department === selectedDept.id ||
        w.department_id === selectedDept.id ||
        String(w.department_name || '').toLowerCase() === selectedDept.name.toLowerCase();
      if (!matchDept) return false;
      if (!q) return true;
      return (
        String(w.name || '').toLowerCase().includes(q) ||
        String(w.worker_id || w.workerId || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const factor = modalWorkerSortConfig.direction === 'asc' ? 1 : -1;
      return factor * String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [workers, selectedDept, modalWorkerSearch, modalWorkerSortConfig]);

  // Workers assigned to currently viewed designation (STRICT Name or Code search)
  const desigAssignedWorkers = useMemo(() => {
    if (!selectedDesig) return [];
    const q = modalWorkerSearch.toLowerCase().trim();
    const list = workers.filter((w) => {
      const matchDesig =
        w.designation &&
        (w.designation.toLowerCase() === selectedDesig.title.toLowerCase() ||
          (selectedDesig.code && w.designation.toLowerCase().includes(selectedDesig.code.toLowerCase())));
      if (!matchDesig) return false;
      if (!q) return true;
      return (
        String(w.name || '').toLowerCase().includes(q) ||
        String(w.worker_id || w.workerId || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const factor = modalWorkerSortConfig.direction === 'asc' ? 1 : -1;
      return factor * String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [workers, selectedDesig, modalWorkerSearch, modalWorkerSortConfig]);

  // Workers assigned to currently viewed work area (STRICT Name or Code search)
  const areaAssignedWorkers = useMemo(() => {
    if (!selectedArea) return [];
    const q = modalWorkerSearch.toLowerCase().trim();
    const list = workers.filter((w) => {
      const wArea = String(w.workArea || w.work_area || '').toLowerCase();
      const matchArea =
        wArea === selectedArea.name.toLowerCase() ||
        (selectedArea.code && wArea.includes(selectedArea.code.toLowerCase()));
      if (!matchArea) return false;
      if (!q) return true;
      return (
        String(w.name || '').toLowerCase().includes(q) ||
        String(w.worker_id || w.workerId || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const factor = modalWorkerSortConfig.direction === 'asc' ? 1 : -1;
      return factor * String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [workers, selectedArea, modalWorkerSearch, modalWorkerSortConfig]);

  // Helper to check if a code is valid (3 letters + 3 numbers) and unique across all departments, designations, work areas, and contractors
  const checkCodeCollision = (codeToCheck, currentEntity = { type: null, id: null }) => {
    const code = (codeToCheck || '').trim().toUpperCase();
    const formatErr = validateCode(code, 'Code', true);
    if (formatErr) return formatErr;

    // Check departments (exclude current editing department)
    const deptMatch = departments.find(
      (d) => d.code && d.code.toUpperCase() === code && !(currentEntity.type === 'dept' && d.id === currentEntity.id)
    );
    if (deptMatch) {
      return `Code "${code}" is already in use by department "${deptMatch.name}".`;
    }

    // Check designations (exclude current editing designation)
    const desigMatch = designations.find(
      (des) => des.code && des.code.toUpperCase() === code && !(currentEntity.type === 'desig' && des.id === currentEntity.id)
    );
    if (desigMatch) {
      return `Code "${code}" is already in use by designation "${desigMatch.title}".`;
    }

    // Check work areas (exclude current editing work area)
    const areaMatch = workAreas.find(
      (a) => a.code && a.code.toUpperCase() === code && !(currentEntity.type === 'area' && a.id === currentEntity.id)
    );
    if (areaMatch) {
      return `Code "${code}" is already in use by work area "${areaMatch.name}".`;
    }

    // Check contractors
    const conMatch = contractorsList.find(
      (c) => ((c.code && c.code.toUpperCase() === code) || (c.contractor_id && c.contractor_id.toUpperCase() === code))
    );
    if (conMatch) {
      return `Code "${code}" is already in use by contractor agency "${conMatch.name}".`;
    }

    return null;
  };

  // Helper to extract clean error message from API response
  const getApiErrorMessage = (err, fallback) => {
    if (err.response?.data) {
      const data = err.response.data;
      if (Array.isArray(data.code) && data.code.length > 0) return data.code[0];
      if (typeof data.code === 'string') return data.code;
      if (Array.isArray(data.name) && data.name.length > 0) return data.name[0];
      if (typeof data.name === 'string') return data.name;
      if (Array.isArray(data.title) && data.title.length > 0) return data.title[0];
      if (typeof data.title === 'string') return data.title;
      if (data.detail) return data.detail;
      if (typeof data === 'string') return data;
    }
    return err.message || fallback;
  };

  // Handle Add Department Submit
  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = {};
    const nameErr = validateName(deptAddForm.name, 'Department Name', 2, 100, true);
    if (nameErr) errors.name = nameErr;

    const codeErr = checkCodeCollision(deptAddForm.code);
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setDeptAddErrors(errors);
      return;
    }
    setDeptAddErrors({});
    setIsSubmitting(true);

    try {
      const created = await DepartmentService.create({
        name: deptAddForm.name.trim(),
        code: deptAddForm.code.trim().toUpperCase(),
        description: deptAddForm.description.trim(),
        status: deptAddForm.status,
      });

      const newDept = {
        id: created.id,
        name: created.name,
        code: created.code || deptAddForm.code.trim().toUpperCase(),
        description: created.description || deptAddForm.description.trim(),
        totalWorkers: created.total_workers || 0,
        head: created.head || '',
        status: created.is_active ? 'Active' : 'Inactive',
        permanentCount: 0,
        contractorCount: 0,
      };

      setDepartments([newDept, ...departments]);
      setIsAddDeptModalOpen(false);
      setDeptAddForm({ name: '', code: '', description: '', status: 'Active' });
    } catch (err) {
      alert(`Error creating department: ${getApiErrorMessage(err, 'Server error')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Department Submit
  const handleEditDeptSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedDept) return;

    const errors = {};
    const nameErr = validateName(deptEditForm.name, 'Department Name', 2, 100, true);
    if (nameErr) errors.name = nameErr;

    const codeErr = checkCodeCollision(deptEditForm.code, { type: 'dept', id: selectedDept.id });
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setDeptEditErrors(errors);
      return;
    }
    setDeptEditErrors({});
    setIsSubmitting(true);

    try {
      await DepartmentService.update(selectedDept.id, {
        name: deptEditForm.name.trim(),
        code: deptEditForm.code.trim().toUpperCase(),
        description: deptEditForm.description.trim(),
        head: deptEditForm.head.trim(),
        status: deptEditForm.status,
      });

      setDepartments(
        departments.map((d) =>
          d.id === selectedDept.id
            ? {
                ...d,
                name: deptEditForm.name.trim(),
                code: deptEditForm.code.trim().toUpperCase(),
                description: deptEditForm.description.trim(),
                head: deptEditForm.head.trim(),
                status: deptEditForm.status,
              }
            : d
        )
      );

      setIsEditDeptModalOpen(false);
      setSelectedDept(null);
    } catch (err) {
      alert(`Error updating department: ${getApiErrorMessage(err, 'Server error')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Department
  const handleDeleteDept = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? Any associated records might be affected.')) {
      try {
        await DepartmentService.delete(id);
        setDepartments(departments.filter((d) => d.id !== id));
        if (selectedDept && selectedDept.id === id) {
          setIsViewDeptModalOpen(false);
        }
      } catch (err) {
        alert(`Error deleting department: ${getApiErrorMessage(err, 'Server error')}`);
      }
    }
  };

  // Handle Add Designation Submit
  const handleAddDesigSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = {};
    const titleErr = validateName(desigForm.title, 'Designation Title', 2, 100, true);
    if (titleErr) errors.title = titleErr;

    const codeErr = checkCodeCollision(desigForm.code);
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setDesigAddErrors(errors);
      return;
    }
    setDesigAddErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        title: desigForm.title.trim(),
        code: desigForm.code.trim().toUpperCase(),
        department: desigForm.department ? Number(desigForm.department) : null,
        description: desigForm.description.trim(),
        status: desigForm.status,
      };

      const created = await DesignationService.create(payload);
      const deptObj = departments.find((d) => d.id === created.department);

      const newDesig = {
        id: created.id,
        title: created.title,
        code: created.code || desigForm.code.trim().toUpperCase(),
        departmentId: created.department,
        departmentName: created.department_name || (deptObj ? deptObj.name : 'General'),
        description: created.description || '',
        totalWorkers: created.total_workers || 0,
        status: created.is_active ? 'Active' : 'Inactive',
      };

      setDesignations([newDesig, ...designations]);
      setIsAddDesigModalOpen(false);
      setDesigForm({ title: '', code: '', department: '', description: '', status: 'Active' });
    } catch (err) {
      alert(`Error creating designation: ${getApiErrorMessage(err, 'Server error')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Designation Submit
  const handleEditDesigSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedDesig) return;

    const errors = {};
    const titleErr = validateName(desigForm.title, 'Designation Title', 2, 100, true);
    if (titleErr) errors.title = titleErr;

    const codeErr = checkCodeCollision(desigForm.code, { type: 'desig', id: selectedDesig.id });
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setDesigEditErrors(errors);
      return;
    }
    setDesigEditErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        title: desigForm.title.trim(),
        code: desigForm.code.trim().toUpperCase(),
        department: desigForm.department ? Number(desigForm.department) : null,
        description: desigForm.description.trim(),
        status: desigForm.status,
      };

      const updated = await DesignationService.update(selectedDesig.id, payload);
      const deptObj = departments.find((d) => d.id === updated.department);

      setDesignations(
        designations.map((des) =>
          des.id === selectedDesig.id
            ? {
                ...des,
                title: updated.title,
                code: updated.code || desigForm.code.trim().toUpperCase(),
                departmentId: updated.department,
                departmentName: updated.department_name || (deptObj ? deptObj.name : 'General'),
                description: updated.description || '',
                status: updated.is_active ? 'Active' : 'Inactive',
              }
            : des
        )
      );

      setIsEditDesigModalOpen(false);
      setSelectedDesig(null);
    } catch (err) {
      alert(`Error updating designation: ${getApiErrorMessage(err, 'Server error')}`);
    }
  };

  // Handle Delete Designation
  const handleDeleteDesig = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await DesignationService.delete(id);
        setDesignations(designations.filter((des) => des.id !== id));
      } catch (err) {
        alert(`Error deleting designation: ${err.message || 'Server error'}`);
      }
    }
  };

  // Handle Add Work Area Submit
  const handleAddAreaSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = {};
    const nameErr = validateWorkAreaName(areaAddForm.name, true);
    if (nameErr) errors.name = nameErr;

    const codeErr = checkCodeCollision(areaAddForm.code);
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setAreaAddErrors(errors);
      return;
    }
    setAreaAddErrors({});
    setIsSubmitting(true);

    try {
      const created = await WorkAreaService.create({
        name: areaAddForm.name.trim(),
        code: areaAddForm.code.trim().toUpperCase(),
        description: areaAddForm.description.trim(),
        status: areaAddForm.status,
      });

      const newArea = {
        id: created.id,
        name: created.name,
        code: created.code,
        description: created.description,
        totalWorkers: 0,
        status: created.status,
        permanentCount: 0,
        contractorCount: 0,
      };

      setWorkAreas([newArea, ...workAreas]);
      setIsAddAreaModalOpen(false);
      setAreaAddForm({
        name: '',
        code: '',
        description: '',
        status: 'Active',
      });
    } catch (err) {
      alert(`Error creating work area: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Work Area Submit
  const handleEditAreaSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedArea) return;

    const errors = {};
    const nameErr = validateWorkAreaName(areaEditForm.name, true);
    if (nameErr) errors.name = nameErr;

    const codeErr = checkCodeCollision(areaEditForm.code, { type: 'area', id: selectedArea.id });
    if (codeErr) errors.code = codeErr;

    if (Object.keys(errors).length > 0) {
      setAreaEditErrors(errors);
      return;
    }
    setAreaEditErrors({});
    setIsSubmitting(true);

    try {
      await WorkAreaService.update(selectedArea.id, {
        name: areaEditForm.name.trim(),
        code: areaEditForm.code.trim().toUpperCase(),
        description: areaEditForm.description.trim(),
        status: areaEditForm.status,
      });

      setWorkAreas(
        workAreas.map((a) =>
          a.id === selectedArea.id
            ? {
                ...a,
                name: areaEditForm.name.trim(),
                code: areaEditForm.code.trim().toUpperCase(),
                description: areaEditForm.description.trim(),
                status: areaEditForm.status,
              }
            : a
        )
      );

      setIsEditAreaModalOpen(false);
      setSelectedArea(null);
    } catch (err) {
      alert(`Error updating work area: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Work Area
  const handleDeleteArea = async (id) => {
    if (window.confirm('Are you sure you want to delete this work area?')) {
      try {
        await WorkAreaService.delete(id);
        setWorkAreas(workAreas.filter((a) => a.id !== id));
        if (selectedArea && selectedArea.id === id) {
          setIsViewAreaModalOpen(false);
        }
      } catch (err) {
        alert(`Error deleting work area: ${err.message || 'Server error'}`);
      }
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

          {/* User Profile Card: Real photo instead of letter box */}
          <div className="px-4 mb-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Ashmeet Admin"
                className="w-10 h-10 rounded-xl object-cover border border-indigo-400/30 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate leading-tight">Ashmeet</span>
                <span className="text-xs text-indigo-300/70 font-normal mt-0.5">Super Admin</span>
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
                    if (item.name === 'Workers' && onNavigateWorkers) onNavigateWorkers();
                    else if (item.name === 'Dashboard' && onNavigateDashboard) onNavigateDashboard();
                    else if (item.name === 'Attendance' && onNavigateAttendance) onNavigateAttendance();
                    else if (item.name === 'Contractor' && onNavigateContractor) onNavigateContractor();
                    else if (item.name === 'Salary' && onNavigateSalary) onNavigateSalary();
                    else if (item.name === 'Advance' && onNavigateAdvance) onNavigateAdvance();
                    else if (item.name === 'Payment Entry' && onNavigatePayments) onNavigatePayments();
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

                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />}
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
                Departments, Designations &amp; Work Areas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                Setup Stage
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Manage departments, role designations, and factory work floors / physical operational areas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Mode</span>
            </div>

            {/* Dynamic Add Button depending on Tab */}
            {activeTab === 'departments' && (
              <button
                type="button"
                onClick={() => {
                  setDeptAddForm({
                    name: '',
                    code: '',
                    description: '',
                    status: 'Active',
                  });
                  setIsAddDeptModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Department</span>
              </button>
            )}

            {activeTab === 'designations' && (
              <button
                type="button"
                onClick={() => {
                  if (departments.length === 0) {
                    alert('Please create at least one Department first before adding Designations.');
                    return;
                  }
                  setDesigForm({
                    title: '',
                    code: '',
                    department: departments[0]?.id ? String(departments[0].id) : '',
                    description: '',
                    status: 'Active',
                  });
                  setIsAddDesigModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Designation</span>
              </button>
            )}

            {activeTab === 'workareas' && (
              <button
                type="button"
                onClick={() => {
                  setAreaAddForm({
                    name: '',
                    code: '',
                    description: '',
                    status: 'Active',
                  });
                  setIsAddAreaModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Work Area</span>
              </button>
            )}
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="px-8 lg:px-10 pb-12 flex-1 space-y-6">
          {/* 1. TOP STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {/* Card 1: Total Departments */}
            <div
              onClick={() => setActiveTab('departments')}
              className={`relative overflow-hidden bg-white rounded-xl border p-4 shadow-xs hover:shadow-sm transition cursor-pointer flex justify-between items-center group ${
                activeTab === 'departments' ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200/80'
              }`}
            >
              <div
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r transition-colors ${
                  activeTab === 'departments' ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-600'
                }`}
              />
              <div className="pl-2">
                <span className="text-xs font-semibold text-slate-700 block">Total Departments</span>
                <span className="text-2xl font-bold text-slate-900 block mt-0.5 tracking-tight">
                  {totalDepartmentsCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {activeDepartmentsCount} operational units
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* Card 2: Total Designations */}
            <div
              onClick={() => setActiveTab('designations')}
              className={`relative overflow-hidden bg-white rounded-xl border p-4 shadow-xs hover:shadow-sm transition cursor-pointer flex justify-between items-center group ${
                activeTab === 'designations' ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200/80'
              }`}
            >
              <div
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r transition-colors ${
                  activeTab === 'designations' ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-600'
                }`}
              />
              <div className="pl-2">
                <span className="text-xs font-semibold text-slate-700 block">Total Designations</span>
                <span className="text-2xl font-bold text-slate-900 block mt-0.5 tracking-tight">
                  {totalDesignationsCount}
                </span>
                <span className="text-[11px] text-indigo-600 block mt-0.5 font-medium">
                  {activeDesignationsCount} active roles
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* Card 3: Work Floors & Areas */}
            <div
              onClick={() => setActiveTab('workareas')}
              className={`relative overflow-hidden bg-white rounded-xl border p-4 shadow-xs hover:shadow-sm transition cursor-pointer flex justify-between items-center group ${
                activeTab === 'workareas' ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200/80'
              }`}
            >
              <div
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r transition-colors ${
                  activeTab === 'workareas' ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-600'
                }`}
              />
              <div className="pl-2">
                <span className="text-xs font-semibold text-slate-700 block">Work Areas</span>
                <span className="text-2xl font-bold text-slate-900 block mt-0.5 tracking-tight">
                  {totalWorkAreasCount}
                </span>
                <span className="text-[11px] text-sky-600 block mt-0.5 font-medium">
                  {activeWorkAreasCount} operational areas
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* Card 4: Total Workers */}
            <div
              onClick={() => onNavigateWorkers && onNavigateWorkers()}
              className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex justify-between items-center group"
              title="Click to view all workers"
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 group-hover:bg-emerald-500 rounded-r transition-colors" />
              <div className="pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors block">Total Workers</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="text-2xl font-bold text-slate-900 block mt-0.5 tracking-tight">
                  {totalWorkersCount}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                  View workers directory →
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'departments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Departments ({departments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('designations')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'designations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Designations ({designations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workareas')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'workareas'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Work Areas ({workAreas.length})</span>
            </button>
          </div>

          {/* ========================================================
              TAB 1: DEPARTMENTS LIST & MANAGEMENT
             ======================================================== */}
          {activeTab === 'departments' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Search & Filter Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-slate-50/40">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by department name or code..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                  />
                  {deptSearch && (
                    <button
                      type="button"
                      onClick={() => setDeptSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={deptStatus}
                    onChange={(e) => setDeptStatus(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {(deptSearch || deptStatus !== 'All' || deptSortConfig.key !== 'name' || deptSortConfig.direction !== 'asc') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeptSearch('');
                        setDeptStatus('All');
                        setDeptSortConfig({ key: 'name', direction: 'asc' });
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Departments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4 pl-6 w-12">#</th>
                      <th
                        onClick={() => handleDeptSort('name')}
                        className="py-3.5 px-4 cursor-pointer group hover:text-indigo-600 transition"
                        title="Click to sort by Department Name"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Department Name &amp; Code
                          {renderSortArrow(deptSortConfig, 'name')}
                        </span>
                      </th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Total Workers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center pr-6">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No departments found</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Click "Add Department" above to create your first department.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((dept, index) => (
                        <tr
                          key={dept.id}
                          className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedDept(dept);
                            setIsViewDeptModalOpen(true);
                          }}
                        >
                          <td className="py-4 px-4 pl-6 text-slate-400 font-medium">{index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs bg-blue-50 text-blue-600 border-blue-200">
                                <Building2 className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                  {dept.name}
                                </span>
                                {dept.code && (
                                  <span className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">
                                    Code: {dept.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-normal">
                            {dept.description || <span className="text-slate-400 italic">No description</span>}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-600">{dept.totalWorkers}</span>
                              <span className="text-[11px] text-slate-400 font-normal">Active</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {dept.status === 'Active' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-semibold text-xs">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDept(dept);
                                  setIsViewDeptModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDept(dept);
                                  setDeptEditForm({
                                    name: dept.name,
                                    code: dept.code,
                                    description: dept.description,
                                    head: dept.head || '',
                                    status: dept.status,
                                  });
                                  setIsEditDeptModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="Edit Department"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDept(dept.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: DESIGNATIONS LIST & MANAGEMENT
             ======================================================== */}
          {activeTab === 'designations' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Guidance notice */}
              {departments.length === 0 && (
                <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-amber-900 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>You have not created any departments yet. Please create a Department first before adding Designations.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('departments')}
                    className="font-semibold underline hover:text-amber-700 cursor-pointer"
                  >
                    Go to Departments
                  </button>
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-slate-50/40">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by designation name or code..."
                    value={desigSearch}
                    onChange={(e) => setDesigSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                  />
                  {desigSearch && (
                    <button
                      type="button"
                      onClick={() => setDesigSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={desigDeptFilter}
                    onChange={(e) => setDesigDeptFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={desigStatus}
                    onChange={(e) => setDesigStatus(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {(desigSearch || desigDeptFilter !== 'All' || desigStatus !== 'All' || desigSortConfig.key !== 'title' || desigSortConfig.direction !== 'asc') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDesigSearch('');
                        setDesigDeptFilter('All');
                        setDesigStatus('All');
                        setDesigSortConfig({ key: 'title', direction: 'asc' });
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Designations Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4 pl-6 w-12">#</th>
                      <th
                        onClick={() => handleDesigSort('title')}
                        className="py-3.5 px-4 cursor-pointer group hover:text-indigo-600 transition"
                        title="Click to sort by Designation Title"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Designation Name &amp; Code
                          {renderSortArrow(desigSortConfig, 'title')}
                        </span>
                      </th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Total Workers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center pr-6">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {filteredDesignations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No designations found</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Click "Add Designation" above to define roles like Operator, Supervisor, Helper, etc.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredDesignations.map((des, index) => (
                        <tr
                          key={des.id}
                          className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedDesig(des);
                            setIsViewDesigModalOpen(true);
                          }}
                        >
                          <td className="py-4 px-4 pl-6 text-slate-400 font-medium">{index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs bg-purple-50 text-purple-600 border-purple-200">
                                <Briefcase className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                  {des.title}
                                </span>
                                {des.code && (
                                  <span className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">
                                    Code: {des.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs">
                              <Building2 className="w-3.5 h-3.5" />
                              {des.departmentName}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-normal">
                            {des.description || <span className="text-slate-400 italic">No description</span>}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-600">{des.totalWorkers}</span>
                              <span className="text-[11px] text-slate-400 font-normal">Active</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {des.status === 'Active' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-semibold text-xs">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDesig(des);
                                  setIsViewDesigModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDesig(des);
                                  setDesigForm({
                                    title: des.title,
                                    code: des.code || '',
                                    department: des.departmentId ? String(des.departmentId) : '',
                                    description: des.description,
                                    status: des.status,
                                  });
                                  setIsEditDesigModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="Edit Designation"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDesig(des.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Designation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: WORK AREAS LIST & MANAGEMENT
             ======================================================== */}
          {activeTab === 'workareas' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Search & Filter Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-slate-50/40">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                  />
                  {areaSearch && (
                    <button
                      type="button"
                      onClick={() => setAreaSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={areaStatusFilter}
                    onChange={(e) => setAreaStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {(areaSearch || areaStatusFilter !== 'All' || areaSortConfig.key !== 'name' || areaSortConfig.direction !== 'asc') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAreaSearch('');
                        setAreaStatusFilter('All');
                        setAreaSortConfig({ key: 'name', direction: 'asc' });
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Work Areas Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4 pl-6 w-12">#</th>
                      <th
                        onClick={() => handleAreaSort('name')}
                        className="py-3.5 px-4 cursor-pointer group hover:text-indigo-600 transition"
                        title="Click to sort by Work Area Name"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Work Area Name &amp; Code
                          {renderSortArrow(areaSortConfig, 'name')}
                        </span>
                      </th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Stationed Workers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center pr-6">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {filteredWorkAreas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No work areas found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Click "Add Work Area" to define factory operational areas</p>
                        </td>
                      </tr>
                    ) : (
                      filteredWorkAreas.map((area, index) => (
                        <tr
                          key={area.id}
                          className="hover:bg-slate-50/60 transition cursor-pointer group"
                          onClick={() => {
                            setSelectedArea(area);
                            setModalWorkerSearch('');
                            setIsViewAreaModalOpen(true);
                          }}
                        >
                          <td className="py-4 px-4 pl-6 text-slate-400 font-mono text-xs">{index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs bg-sky-50 text-sky-600 border-sky-200">
                                <Compass className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                  {area.name}
                                </span>
                                {area.code && (
                                  <span className="text-[11px] font-mono text-sky-700 font-semibold mt-0.5">
                                    Code: {area.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-normal max-w-sm truncate" title={area.description}>
                            {area.description || <span className="text-slate-400 italic">No description</span>}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sky-700 font-mono text-sm">{area.totalWorkers}</span>
                              <span className="text-[11px] text-slate-400 font-normal">Active</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {area.status === 'Active' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-semibold text-xs">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArea(area);
                                  setModalWorkerSearch('');
                                  setIsViewAreaModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="View Stationed Workers"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArea(area);
                                  setAreaEditForm({
                                    name: area.name,
                                    code: area.code || '',
                                    description: area.description || '',
                                    status: area.status,
                                  });
                                  setIsEditAreaModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="Edit Work Area"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArea(area.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Work Area"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================== MODAL 1: ADD DEPARTMENT ===================== */}
      {/* Options: Department Name, Department Code, Department Type, Description, Status */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Department</h3>
                  <p className="text-xs text-slate-400">Configure department details and functional type</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production & Assembly"
                  value={deptAddForm.name}
                  onChange={(e) => {
                    setDeptAddForm({ ...deptAddForm, name: e.target.value });
                    if (deptAddErrors.name) setDeptAddErrors({ ...deptAddErrors, name: null });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    deptAddErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {deptAddErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{deptAddErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. PRD001"
                  value={deptAddForm.code}
                  onChange={(e) => {
                    const clean = sanitizeAlphaNumericUpper(e.target.value, 6);
                    setDeptAddForm({ ...deptAddForm, code: clean });
                    if (deptAddErrors.code) setDeptAddErrors({ ...deptAddErrors, code: null });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    deptAddErrors.code ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-sans placeholder:normal-case focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {deptAddErrors.code && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{deptAddErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Responsible for factory machining, component assembly, and shop floor operations"
                  value={deptAddForm.description}
                  onChange={(e) => setDeptAddForm({ ...deptAddForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={deptAddForm.status}
                  onChange={(e) => setDeptAddForm({ ...deptAddForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-900 text-xs">
                <p className="font-semibold">Department Head &amp; Workforce Count:</p>
                <p className="text-indigo-700/80 mt-0.5">
                  The department head will be selected later after managers/staff are added. Total workers calculate automatically when workers are registered.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
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
                  {isSubmitting ? 'Saving Department...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: EDIT DEPARTMENT ===================== */}
      {isEditDeptModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Department</h3>
                  <p className="text-xs text-slate-400">{selectedDept.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production & Assembly"
                  value={deptEditForm.name}
                  onChange={(e) => {
                    setDeptEditForm({ ...deptEditForm, name: e.target.value });
                    if (deptEditErrors.name) setDeptEditErrors({ ...deptEditErrors, name: null });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    deptEditErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {deptEditErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{deptEditErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. PRD001"
                  value={deptEditForm.code}
                  onChange={(e) => {
                    const clean = sanitizeAlphaNumericUpper(e.target.value, 6);
                    setDeptEditForm({ ...deptEditForm, code: clean });
                    if (deptEditErrors.code) setDeptEditErrors({ ...deptEditErrors, code: null });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    deptEditErrors.code ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-sans placeholder:normal-case focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {deptEditErrors.code && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{deptEditErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Responsible for factory machining and shop floor operations"
                  value={deptEditForm.description}
                  onChange={(e) => setDeptEditForm({ ...deptEditForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head (Assign Later)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sukhwinder Singh"
                    value={deptEditForm.head}
                    onChange={(e) => setDeptEditForm({ ...deptEditForm, head: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={deptEditForm.status}
                    onChange={(e) => setDeptEditForm({ ...deptEditForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditDeptModalOpen(false)}
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
                  {isSubmitting ? 'Updating...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: VIEW DEPARTMENT DETAILS & WORKERS ===================== */}
      {isViewDeptModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#11133c] px-6 py-5 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setIsViewDeptModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold text-white leading-tight">{selectedDept.name}</h3>
                    {selectedDept.code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                        Code: {selectedDept.code}
                      </span>
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      selectedDept.status === 'Active'
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30'
                        : 'text-rose-300 bg-rose-500/20 border-rose-400/30'
                    }`}>
                      {selectedDept.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 mt-1">
                    {selectedDept.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Meta Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200/70 shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department Head</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {selectedDept.head || 'Assigned Later'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Assigned</span>
                <span className="font-extrabold text-indigo-700 block mt-0.5">
                  {deptAssignedWorkers.length} Workers ({selectedDept.totalWorkers} Active)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Permanent Staff</span>
                <span className="font-bold text-blue-700 block mt-0.5">
                  {deptAssignedWorkers.filter(w => w.worker_type === 'Permanent').length} Workers
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contractor Staff</span>
                <span className="font-bold text-amber-700 block mt-0.5">
                  {deptAssignedWorkers.filter(w => w.worker_type === 'Contractor').length} Workers
                </span>
              </div>
            </div>

            {/* Workers Pop-Out List Section */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Workers in this Department ({deptAssignedWorkers.length})
                  </h4>
                </div>

                {deptAssignedWorkers.length > 0 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by worker name or ID/code..."
                      value={modalWorkerSearch}
                      onChange={(e) => setModalWorkerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {deptAssignedWorkers.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                  <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">No workers in this department yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When you register workers in the Workers module and select "{selectedDept.name}", they will automatically appear here.
                  </p>
                  {onNavigateWorkers && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewDeptModalOpen(false);
                        onNavigateWorkers();
                      }}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add / Assign Workers</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th
                          onClick={() => handleModalWorkerSort('name')}
                          className="py-2.5 px-3 cursor-pointer group hover:text-indigo-600 transition"
                          title="Click to sort by Worker Name"
                        >
                          <span className="inline-flex items-center gap-1">
                            Worker ID &amp; Name
                            {renderSortArrow(modalWorkerSortConfig, 'name')}
                          </span>
                        </th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {deptAssignedWorkers.map((w, idx) => (
                        <tr key={w.id || w.worker_id || idx} className="hover:bg-indigo-50/40 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                                {w.name ? w.name.slice(0, 2) : 'WK'}
                              </div>
                              <div className="flex flex-col">
                                <span>{w.name}</span>
                                <span className="text-[10px] font-mono text-indigo-600 font-semibold">{w.worker_id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {w.designation || <span className="text-slate-400 italic">Not Assigned</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              w.worker_type === 'Permanent'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {w.worker_type || 'Permanent'}
                              {w.contractor_agency ? ` • ${w.contractor_agency}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {w.phone || <span className="text-slate-400 font-sans italic">N/A</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              w.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {w.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                {deptAssignedWorkers.length} worker{deptAssignedWorkers.length !== 1 ? 's' : ''} listed
              </div>
              <div className="flex items-center gap-2.5">
                {onNavigateWorkers && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewDeptModalOpen(false);
                      onNavigateWorkers();
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Workers Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsViewDeptModalOpen(false);
                    setDeptEditForm({
                      name: selectedDept.name,
                      code: selectedDept.code,
                      description: selectedDept.description,
                      head: selectedDept.head || '',
                      status: selectedDept.status,
                    });
                    setIsEditDeptModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Edit Department
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewDeptModalOpen(false)}
                  className="px-4 py-2 bg-[#11133c] hover:bg-[#1a1e52] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: VIEW DESIGNATION DETAILS & WORKERS ===================== */}
      {isViewDesigModalOpen && selectedDesig && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#11133c] px-6 py-5 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setIsViewDesigModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Briefcase className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold text-white leading-tight">{selectedDesig.title}</h3>
                    {selectedDesig.code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 font-semibold">
                        Code: {selectedDesig.code}
                      </span>
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      selectedDesig.status === 'Active'
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30'
                        : 'text-rose-300 bg-rose-500/20 border-rose-400/30'
                    }`}>
                      {selectedDesig.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 mt-1">
                    {selectedDesig.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Meta Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200/70 shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {selectedDesig.departmentName || 'General / Plant Wide'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Assigned</span>
                <span className="font-extrabold text-purple-700 block mt-0.5">
                  {desigAssignedWorkers.length} Workers ({selectedDesig.totalWorkers} Active)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Permanent Staff</span>
                <span className="font-bold text-blue-700 block mt-0.5">
                  {desigAssignedWorkers.filter(w => w.worker_type === 'Permanent').length} Workers
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contractor Staff</span>
                <span className="font-bold text-amber-700 block mt-0.5">
                  {desigAssignedWorkers.filter(w => w.worker_type === 'Contractor').length} Workers
                </span>
              </div>
            </div>

            {/* Workers Pop-Out List Section */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Workers with this Designation ({desigAssignedWorkers.length})
                  </h4>
                </div>

                {desigAssignedWorkers.length > 0 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by worker name or ID/code..."
                      value={modalWorkerSearch}
                      onChange={(e) => setModalWorkerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {desigAssignedWorkers.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                  <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">No workers hold this designation yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When you assign "{selectedDesig.title}" to workers in the Workers module, they will automatically appear here.
                  </p>
                  {onNavigateWorkers && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewDesigModalOpen(false);
                        onNavigateWorkers();
                      }}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add / Assign Workers</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th
                          onClick={() => handleModalWorkerSort('name')}
                          className="py-2.5 px-3 cursor-pointer group hover:text-indigo-600 transition"
                          title="Click to sort by Worker Name"
                        >
                          <span className="inline-flex items-center gap-1">
                            Worker ID &amp; Name
                            {renderSortArrow(modalWorkerSortConfig, 'name')}
                          </span>
                        </th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {desigAssignedWorkers.map((w, idx) => (
                        <tr key={w.id || w.worker_id || idx} className="hover:bg-purple-50/40 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                                {w.name ? w.name.slice(0, 2) : 'WK'}
                              </div>
                              <div className="flex flex-col">
                                <span>{w.name}</span>
                                <span className="text-[10px] font-mono text-purple-600 font-semibold">{w.worker_id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {w.department_name || (selectedDesig.departmentName || 'General')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              w.worker_type === 'Permanent'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {w.worker_type || 'Permanent'}
                              {w.contractor_agency ? ` • ${w.contractor_agency}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {w.phone || <span className="text-slate-400 font-sans italic">N/A</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              w.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {w.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                {desigAssignedWorkers.length} worker{desigAssignedWorkers.length !== 1 ? 's' : ''} listed
              </div>
              <div className="flex items-center gap-2.5">
                {onNavigateWorkers && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewDesigModalOpen(false);
                      onNavigateWorkers();
                    }}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Workers Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsViewDesigModalOpen(false);
                    setDesigForm({
                      title: selectedDesig.title,
                      code: selectedDesig.code || '',
                      department: selectedDesig.departmentId ? String(selectedDesig.departmentId) : '',
                      description: selectedDesig.description,
                      status: selectedDesig.status,
                    });
                    setIsEditDesigModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-purple-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Edit Designation
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewDesigModalOpen(false)}
                  className="px-4 py-2 bg-[#11133c] hover:bg-[#1a1e52] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: ADD DESIGNATION ===================== */}
      {/* Options: Designation Name, Code, Description, Status */}
      {isAddDesigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Designation</h3>
                  <p className="text-xs text-slate-400">Define role designation and code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDesigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDesigSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior CNC Operator"
                  value={desigForm.title}
                  onChange={(e) => {
                    setDesigForm({ ...desigForm, title: e.target.value });
                    if (desigAddErrors.title) setDesigAddErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 border ${
                    desigAddErrors.title ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                {desigAddErrors.title && <p className="text-xs text-rose-500 font-medium mt-1">{desigAddErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. DES001"
                    value={desigForm.code}
                    onChange={(e) => {
                      const val = sanitizeAlphaNumericUpper(e.target.value, 6);
                      setDesigForm({ ...desigForm, code: val });
                      if (desigAddErrors.code) setDesigAddErrors((prev) => ({ ...prev, code: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-sans placeholder:normal-case focus:bg-white focus:outline-none focus:border-indigo-500 border ${
                      desigAddErrors.code ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {desigAddErrors.code && <p className="text-xs text-rose-500 font-medium mt-1">{desigAddErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={desigForm.department}
                    onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Operates multi-axis CNC machines, runs component tooling, and ensures tolerance"
                  value={desigForm.description}
                  onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={desigForm.status}
                  onChange={(e) => setDesigForm({ ...desigForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDesigModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: EDIT DESIGNATION ===================== */}
      {isEditDesigModalOpen && selectedDesig && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Designation</h3>
                  <p className="text-xs text-slate-400">{selectedDesig.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDesigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDesigSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior CNC Operator"
                  value={desigForm.title}
                  onChange={(e) => {
                    setDesigForm({ ...desigForm, title: e.target.value });
                    if (desigEditErrors.title) setDesigEditErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 border ${
                    desigEditErrors.title ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                {desigEditErrors.title && <p className="text-xs text-rose-500 font-medium mt-1">{desigEditErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. DES001"
                    value={desigForm.code}
                    onChange={(e) => {
                      const val = sanitizeAlphaNumericUpper(e.target.value, 6);
                      setDesigForm({ ...desigForm, code: val });
                      if (desigEditErrors.code) setDesigEditErrors((prev) => ({ ...prev, code: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase placeholder:text-slate-400 placeholder:font-sans placeholder:normal-case focus:bg-white focus:outline-none focus:border-indigo-500 border ${
                      desigEditErrors.code ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {desigEditErrors.code && <p className="text-xs text-rose-500 font-medium mt-1">{desigEditErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={desigForm.department}
                    onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- General / Plant Wide --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Operates multi-axis CNC machines and executes component toolings"
                  value={desigForm.description}
                  onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={desigForm.status}
                  onChange={(e) => setDesigForm({ ...desigForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditDesigModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===================== MODAL: ADD WORK AREA ===================== */}
      {isAddAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                  <Compass className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Work Area</h3>
                  <p className="text-xs text-slate-400">Define factory workplace area (applies to all departments)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAreaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAreaSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Area Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bay 1, Line 2, Machine Shop 3"
                  value={areaAddForm.name}
                  onChange={(e) => {
                    setAreaAddForm({ ...areaAddForm, name: e.target.value });
                    if (areaAddErrors.name) setAreaAddErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    areaAddErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {areaAddErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{areaAddErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. WA01"
                  value={areaAddForm.code}
                  onChange={(e) => {
                    const clean = sanitizeAlphaNumericUpper(e.target.value, 6);
                    setAreaAddForm({ ...areaAddForm, code: clean });
                    if (areaAddErrors.code) setAreaAddErrors((prev) => ({ ...prev, code: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    areaAddErrors.code ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {areaAddErrors.code && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{areaAddErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Operational machines and factory section notes"
                  value={areaAddForm.description}
                  onChange={(e) => setAreaAddForm({ ...areaAddForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={areaAddForm.status}
                  onChange={(e) => setAreaAddForm({ ...areaAddForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAreaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Work Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT WORK AREA ===================== */}
      {isEditAreaModalOpen && selectedArea && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Work Area</h3>
                  <p className="text-xs text-slate-400">Update workplace area details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditAreaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAreaSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Area Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={areaEditForm.name}
                  onChange={(e) => {
                    setAreaEditForm({ ...areaEditForm, name: e.target.value });
                    if (areaEditErrors.name) setAreaEditErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    areaEditErrors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {areaEditErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{areaEditErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={areaEditForm.code}
                  onChange={(e) => {
                    const clean = sanitizeAlphaNumericUpper(e.target.value, 6);
                    setAreaEditForm({ ...areaEditForm, code: clean });
                    if (areaEditErrors.code) setAreaEditErrors((prev) => ({ ...prev, code: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border ${
                    areaEditErrors.code ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  } rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500`}
                />
                {areaEditErrors.code && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{areaEditErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={areaEditForm.description}
                  onChange={(e) => setAreaEditForm({ ...areaEditForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={areaEditForm.status}
                  onChange={(e) => setAreaEditForm({ ...areaEditForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditAreaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Work Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: VIEW WORK AREA & STATIONED WORKERS ===================== */}
      {isViewAreaModalOpen && selectedArea && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{selectedArea.name}</h3>
                    {selectedArea.code && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-100 text-sky-800">
                        {selectedArea.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Status: <strong className="text-slate-700">{selectedArea.status || 'Active'}</strong></span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewAreaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedArea.description && (
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-600 shrink-0">
                <span className="font-semibold text-slate-700">Area Description: </span>
                {selectedArea.description}
              </div>
            )}

            {/* Stationed Workers Header & Search */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Stationed Workers ({areaAssignedWorkers.length})
                </span>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by worker name or ID/code..."
                  value={modalWorkerSearch}
                  onChange={(e) => setModalWorkerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Stationed Workers Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {areaAssignedWorkers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No workers assigned to this work area yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select "{selectedArea.name}" in the "Work Floor / Area" dropdown when registering or editing workers.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider select-none">
                      <th
                        onClick={() => handleModalWorkerSort('name')}
                        className="py-2.5 px-3 cursor-pointer group hover:text-indigo-600 transition"
                        title="Click to sort by Worker Name"
                      >
                        <span className="inline-flex items-center gap-1">
                          Worker
                          {renderSortArrow(modalWorkerSortConfig, 'name')}
                        </span>
                      </th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {areaAssignedWorkers.map((w) => (
                      <tr key={w.id || w.worker_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{w.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({w.worker_id})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{w.designation || 'Staff'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.department || 'Production'}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              w.workerType === 'Contractor'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {w.workerType || 'Permanent'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{w.phone || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsViewAreaModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentPage;
