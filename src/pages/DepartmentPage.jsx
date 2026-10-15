import React, { useState, useMemo, useEffect } from 'react';
import { DepartmentService } from '../services/api';
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
  ShieldAlert,
  Shield,
  Package,
  Truck,
  UserCheck,
  AlertCircle,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

// Initial departments (ready for actual user data)
const INITIAL_DEPARTMENTS = [];


export const DepartmentPage = ({ onNavigateWorkers, onNavigateDashboard, onNavigateAttendance, onNavigateContractor, onNavigateSalary, onNavigateAdvance, onNavigateReports, onNavigateAdministration, onLogout }) => {
  const [activeNav, setActiveNav] = useState('Department');
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(false);

  // Load departments from backend database
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    DepartmentService.getAll()
      .then((data) => {
        if (!isMounted) return;
        const iconColors = {
          cog: 'bg-blue-50 text-blue-600 border-blue-200',
          wrench: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          shield: 'bg-amber-50 text-amber-600 border-amber-200',
          package: 'bg-purple-50 text-purple-600 border-purple-200',
          truck: 'bg-rose-50 text-rose-600 border-rose-200',
          users: 'bg-sky-50 text-sky-600 border-sky-200',
        };
        const mapped = (data || []).map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          totalWorkers: d.total_workers || 0,
          head: d.head || 'Supervisor Assigned',
          status: d.is_active ? 'Active' : 'Inactive',
          iconType: 'cog',
          iconColor: iconColors['cog'],
          location: d.location || 'Industrial Plant Floor',
          permanentCount: Math.ceil(Number(d.total_workers || 0) * 0.6),
          contractorCount: Math.floor(Number(d.total_workers || 0) * 0.4),
        }));
        setDepartments(mapped);
      })
      .catch((err) => {
        console.warn('Could not load departments from API:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Form State for Add / Edit
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    head: '',
    totalWorkers: 0,
    status: 'Active',
    location: 'Main Plant Floor',
    iconType: 'cog'
  });

  // Nav Items matching AdminDashboard and WorkersPage
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

  // Helper to render icon by type
  const renderDeptIcon = (type, colorClass) => {
    switch (type) {
      case 'wrench':
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <Wrench className="w-4.5 h-4.5" />
          </div>
        );
      case 'shield':
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
        );
      case 'package':
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <Package className="w-4.5 h-4.5" />
          </div>
        );
      case 'truck':
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <Truck className="w-4.5 h-4.5" />
          </div>
        );
      case 'users':
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <Users className="w-4.5 h-4.5" />
          </div>
        );
      case 'cog':
      default:
        return (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
            <Cog className="w-4.5 h-4.5" />
          </div>
        );
    }
  };

  // Calculations
  const totalDepartmentsCount = departments.length;
  const totalWorkersCount = departments.reduce((acc, curr) => acc + Number(curr.totalWorkers || 0), 0);
  const activeDepartmentsCount = departments.filter(d => d.status === 'Active').length;

  // Filtered List
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.head && d.head.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'All' || d.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchQuery, selectedStatus]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setDeptForm({
      name: '',
      description: '',
      head: '',
      totalWorkers: 0,
      status: 'Active',
      location: 'Plant Area',
      iconType: 'cog'
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Department
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    const iconColors = {
      cog: 'bg-blue-50 text-blue-600 border-blue-200',
      wrench: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      shield: 'bg-amber-50 text-amber-600 border-amber-200',
      package: 'bg-purple-50 text-purple-600 border-purple-200',
      truck: 'bg-rose-50 text-rose-600 border-rose-200',
      users: 'bg-sky-50 text-sky-600 border-sky-200',
    };

    try {
      const created = await DepartmentService.create({
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || 'General operations department',
        head: deptForm.head.trim() || 'Supervisor Assigned',
        location: deptForm.location.trim() || 'Industrial Plant Floor',
        status: deptForm.status,
      });

      const newDept = {
        id: created.id,
        name: created.name,
        description: created.description || deptForm.description.trim(),
        totalWorkers: created.total_workers || 0,
        head: created.head || deptForm.head.trim(),
        status: created.is_active ? 'Active' : 'Inactive',
        iconType: deptForm.iconType,
        iconColor: iconColors[deptForm.iconType] || 'bg-blue-50 text-blue-600 border-blue-200',
        location: created.location || deptForm.location.trim(),
        permanentCount: 0,
        contractorCount: 0,
      };

      setDepartments([newDept, ...departments]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(`Error creating department: ${err.message || 'Server error'}`);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept) => {
    setSelectedDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description,
      head: dept.head || '',
      totalWorkers: dept.totalWorkers,
      status: dept.status,
      location: dept.location || '',
      iconType: dept.iconType || 'cog'
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Department
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    try {
      await DepartmentService.update(selectedDept.id, {
        name: deptForm.name.trim(),
        description: deptForm.description.trim(),
        head: deptForm.head.trim(),
        location: deptForm.location.trim(),
        status: deptForm.status,
      });

      setDepartments(departments.map(d => {
        if (d.id === selectedDept.id) {
          return {
            ...d,
            name: deptForm.name.trim(),
            description: deptForm.description.trim(),
            head: deptForm.head.trim(),
            totalWorkers: Number(deptForm.totalWorkers) || 0,
            status: deptForm.status,
            location: deptForm.location.trim(),
            iconType: deptForm.iconType
          };
        }
        return d;
      }));

      setIsEditModalOpen(false);
      setSelectedDept(null);
    } catch (err) {
      alert(`Error updating department: ${err.message || 'Server error'}`);
    }
  };

  // Open View Modal
  const handleOpenViewModal = (dept) => {
    setSelectedDept(dept);
    setIsViewModalOpen(true);
  };

  // Delete Department
  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await DepartmentService.delete(id);
        setDepartments(departments.filter(d => d.id !== id));
        if (selectedDept && selectedDept.id === id) {
          setIsViewModalOpen(false);
        }
      } catch (err) {
        alert(`Error deleting department: ${err.message || 'Server error'}`);
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
                    if (item.name === 'Workers' && onNavigateWorkers) {
                      onNavigateWorkers();
                    } else if (item.name === 'Dashboard' && onNavigateDashboard) {
                      onNavigateDashboard();
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
                Departments
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                {totalDepartmentsCount} Total
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Manage company departments and view total workers in each department.
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
              <span>Add Department</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="px-8 lg:px-10 pb-12 flex-1 space-y-6">
          {/* 1. TOP STAT CARDS (USER SPECIFIC REQUIREMENT: NO AVERAGE WORKERS BOX!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
            {/* Card 1: Total Departments */}
            <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300 group-hover:bg-indigo-600 rounded-r transition-colors" />
              <div className="pl-2">
                <span className="text-[13px] font-semibold text-slate-700 block">Total Departments</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                  {totalDepartmentsCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {activeDepartmentsCount} operational departments
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>

            {/* Card 2: Total Workers */}
            <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r transition-colors" />
              <div className="pl-2">
                <span className="text-[13px] font-semibold text-slate-700 block">Total Workers</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                  {totalWorkersCount}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                  Assigned across all departments
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>
          </div>

          {/* 2. TABLE BOX WITH SEARCH BAR */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Search Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-slate-50/40">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search department name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              <div className="flex items-center gap-2.5">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                {(searchQuery || selectedStatus !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('All');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Department Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 pl-6 w-12">#</th>
                    <th className="py-3.5 px-4">Department</th>
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
                        <p className="text-xs text-slate-400 mt-0.5">Try searching with a different term.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept, index) => (
                      <tr
                        key={dept.id}
                        className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                        onClick={() => handleOpenViewModal(dept)}
                      >
                        {/* 1. Row # */}
                        <td className="py-4 px-4 pl-6 text-slate-400 font-medium">
                          {index + 1}
                        </td>

                        {/* 2. Department Icon & Name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {renderDeptIcon(dept.iconType, dept.iconColor)}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                {dept.name}
                              </span>
                              {dept.head && (
                                <span className="text-[11px] text-slate-400 mt-0.5">
                                  {dept.head}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Description */}
                        <td className="py-4 px-4 text-slate-600 font-normal">
                          {dept.description}
                        </td>

                        {/* 4. Total Workers */}
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{dept.totalWorkers}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({dept.permanentCount || 0} Perm • {dept.contractorCount || 0} Contr)
                            </span>
                          </div>
                        </td>

                        {/* 5. Status Pill */}
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

                        {/* 6. Actions */}
                        <td className="py-4 px-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(dept)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="View Department Info"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(dept)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Department"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(dept.id)}
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

            {/* Table Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing 1 to {filteredDepartments.length} of {departments.length} departments
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 opacity-40 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center bg-[#1b1f54] text-white shadow-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 opacity-40 cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===================== MODAL 1: ADD DEPARTMENT ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Department</h3>
                  <p className="text-xs text-slate-400">Create a work division or unit</p>
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

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Tool Room / Quality Control"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Forging and machining operations"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head / Lead</label>
                  <input
                    type="text"
                    value={deptForm.head}
                    onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Workers Assigned</label>
                  <input
                    type="number"
                    min="0"
                    value={deptForm.totalWorkers}
                    onChange={(e) => setDeptForm({ ...deptForm, totalWorkers: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Location</label>
                  <input
                    type="text"
                    value={deptForm.location}
                    onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Bay 1, Ground Floor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Style</label>
                  <select
                    value={deptForm.iconType}
                    onChange={(e) => setDeptForm({ ...deptForm, iconType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cog">Gear (Production)</option>
                    <option value="wrench">Wrench (Maintenance)</option>
                    <option value="shield">Shield (Quality)</option>
                    <option value="package">Package (Store)</option>
                    <option value="truck">Truck (Dispatch)</option>
                    <option value="users">People (Administration)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: EDIT DEPARTMENT ===================== */}
      {isEditModalOpen && selectedDept && (
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
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Head / Supervisor</label>
                  <input
                    type="text"
                    value={deptForm.head}
                    onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Workers</label>
                  <input
                    type="number"
                    min="0"
                    value={deptForm.totalWorkers}
                    onChange={(e) => setDeptForm({ ...deptForm, totalWorkers: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={deptForm.status}
                    onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={deptForm.location}
                    onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: VIEW DEPARTMENT DETAILS ===================== */}
      {isViewModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#11133c] p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Building2 className="w-7 h-7 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{selectedDept.name} Department</h3>
                  <span className="text-xs text-indigo-200 mt-1 block">Boparai Industries Division</span>
                </div>
              </div>
            </div>

            {/* Content Info */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Scope &amp; Description</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{selectedDept.description}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department Head</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedDept.head || 'Assigned Lead'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Workers</span>
                  <span className="text-base font-extrabold text-indigo-700 mt-0.5 block">
                    {selectedDept.totalWorkers} Staff
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Workforce Composition</span>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mt-1.5">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> {selectedDept.permanentCount || 0} Permanent
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <HardHat className="w-3.5 h-3.5" /> {selectedDept.contractorCount || 0} Contractors
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <span className="font-medium">Floor Area: {selectedDept.location || 'Main Factory Unit'}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedDept.status}
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(selectedDept);
                  }}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Edit Department
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#11133c] hover:bg-[#1a1e52] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentPage;
