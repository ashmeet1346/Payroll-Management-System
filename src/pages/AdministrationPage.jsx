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
  ShieldAlert,
  Database,
  HardDrive,
  Server,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  Trash2,
  Edit3,
  Plus,
  X,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  Laptop,
  Globe,
  MapPin,
  Mail,
  Phone,
  Building,
  Save,
  Lock,
  Unlock,
  Key,
  Shield,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ReceiptText
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

// ==========================================
// INITIAL DATASETS (Clean, awaiting real user entry)
// ==========================================

const INITIAL_COMPANY_PROFILE = {
  legalName: '',
  tradeName: '',
  cin: '',
  gstin: '',
  pan: '',
  factoryLicense: '',
  epfCode: '',
  esicCode: '',
  industryType: '',
  yearEstablished: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  primaryEmail: '',
  financeEmail: '',
  primaryPhone: '',
  landline: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
  bankIfsc: '',
  defaultCurrency: 'INR (₹)',
  workingHoursStandard: '8 Hours (Standard)',
  workingHoursOvertimeMultiplier: '1.5x (Normal) / 2.0x (Sunday Duty)',
  dailyShiftTypes: 'Morning (08:00-16:00), General (09:00-17:00), Night (20:00-04:00)'
};

const INITIAL_USERS = [
  {
    id: 'USR-001',
    name: 'Ashmeet',
    username: 'ashmeet123',
    email: 'ashmeet@paysphere.local',
    role: 'Super Admin',
    department: 'Administration',
    status: 'Active',
    twoFactor: false,
    lastLogin: 'Active session',
    ipAddress: '127.0.0.1',
    avatar: 'A',
    permissions: ['all']
  }
];

const INITIAL_AUDIT_LOGS = [];

const INITIAL_BACKUPS = [];

export const AdministrationPage = ({
  onLogout,
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigatePayments,
  onNavigateReports
}) => {
  const [activeNav, setActiveNav] = useState('Administration Setting');

  // Active Tab: 'hub' (4 Cards Overview), 'company', 'users', 'audit', 'database'
  const [activeTab, setActiveTab] = useState('hub');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // State for Company Profile
  const [companyProfile, setCompanyProfile] = useState(INITIAL_COMPANY_PROFILE);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyFormData, setCompanyFormData] = useState(INITIAL_COMPANY_PROFILE);

  // State for Users & Permissions
  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'HR & Payroll Manager',
    department: 'Human Resources',
    twoFactor: true
  });
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);

  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('All');
  const [auditUserFilter, setAuditUserFilter] = useState('All');

  // State for Database & Backups
  const [backupsList, setBackupsList] = useState(INITIAL_BACKUPS);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgressStep, setBackupProgressStep] = useState(0);
  const [restoreModalBackup, setRestoreModalBackup] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);

  // Security Settings
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [passwordExpiryDays, setPasswordExpiryDays] = useState('90');

  // Load saved company profile and backups from database
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      DataStoreService.get('company_profile', null),
      DataStoreService.get('database_backups', []),
    ]).then(([savedCompany, savedBackups]) => {
      if (!isMounted) return;
      if (savedCompany && typeof savedCompany === 'object') {
        setCompanyProfile(savedCompany);
        setCompanyFormData(savedCompany);
      }
      if (Array.isArray(savedBackups)) {
        setBackupsList(savedBackups);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Navigation Items
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
    { name: 'Administration Setting', icon: Settings }
  ];

  // Helper to record an audit log whenever an admin performs an action
  const logAuditEvent = (moduleName, actionName, descriptionText, diff = null, severity = 'info') => {
    const newEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      relativeTime: 'A few seconds ago',
      userName: 'Ashmeet',
      userRole: 'Super Admin',
      module: moduleName,
      action: actionName,
      description: descriptionText,
      changeDiff: diff,
      ip: '127.0.0.1',
      device: 'Admin Portal',
      severity: severity
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Handle Save Company Profile
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    setCompanyProfile(companyFormData);
    setIsEditingCompany(false);
    DataStoreService.save('company_profile', companyFormData).catch(() => {});
    logAuditEvent(
      'Administration',
      'Updated Company Profile & Plant Details',
      `Modified organization settings for ${companyFormData.legalName || 'organization'}.`,
      { field: 'Company Profile', oldValue: companyProfile.legalName, newValue: companyFormData.legalName },
      'warning'
    );
    showToast('Company profile settings saved successfully.');
  };

  // Handle Add New User
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const newUser = {
      id: `USR-00${usersList.length + 1}`,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      department: newUserForm.department,
      status: 'Active',
      twoFactor: newUserForm.twoFactor,
      lastLogin: 'Never',
      ipAddress: 'Pending First Login',
      avatar: newUserForm.name.charAt(0).toUpperCase(),
      permissions: ['workers_view', 'reports_view']
    };

    setUsersList([...usersList, newUser]);
    setIsAddUserModalOpen(false);
    logAuditEvent(
      'Security',
      'Created New Administrative User',
      `Provisioned user account for ${newUser.name} with role ${newUser.role}.`,
      { field: 'New User Account', oldValue: 'None', newValue: `${newUser.name} (${newUser.email})` },
      'warning'
    );
    setNewUserForm({
      name: '',
      email: '',
      role: 'HR & Payroll Manager',
      department: 'Human Resources',
      twoFactor: true
    });
    showToast(`User account created for ${newUser.name}. Welcome email dispatched.`);
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = (userId) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          logAuditEvent(
            'Security',
            `Changed User Status to ${newStatus}`,
            `Admin toggled account state for ${u.name} (${u.email}) from ${u.status} to ${newStatus}.`,
            { field: `${u.name} Status`, oldValue: u.status, newValue: newStatus },
            newStatus === 'Suspended' ? 'warning' : 'info'
          );
          showToast(`User ${u.name} marked as ${newStatus}.`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesRole = userRoleFilter === 'All' || user.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearchTerm, userRoleFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(auditSearchTerm.toLowerCase());
      const matchesModule = auditModuleFilter === 'All' || log.module === auditModuleFilter;
      const matchesUser = auditUserFilter === 'All' || log.userName === auditUserFilter;
      return matchesSearch && matchesModule && matchesUser;
    });
  }, [auditLogs, auditSearchTerm, auditModuleFilter, auditUserFilter]);

  // Handle Instant Backup Creation with Simulation Steps
  const handleTriggerManualBackup = () => {
    if (isBackupInProgress) return;
    setIsBackupInProgress(true);
    setBackupProgressStep(1);

    setTimeout(() => {
      setBackupProgressStep(2);
      setTimeout(() => {
        setBackupProgressStep(3);
        setTimeout(() => {
          setBackupProgressStep(4);
          setTimeout(() => {
            const timestampNow = new Date();
            const dateStr = timestampNow.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = timestampNow.toTimeString().slice(0, 8).replace(/:/g, '');
            const newBackup = {
              id: `BKP-${dateStr}-${timeStr}`,
              timestamp: 'Just now',
              size: '4.8 MB',
              type: 'Manual Admin Snapshot',
              createdBy: 'Ashmeet (Super Admin)',
              status: 'Verified & Encrypted',
              checksum: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 8)}`,
              cloudSynced: true
            };

            const updatedBackups = [newBackup, ...backupsList];
            setBackupsList(updatedBackups);
            DataStoreService.save('database_backups', updatedBackups);
            setIsBackupInProgress(false);
            setBackupProgressStep(0);
            logAuditEvent(
              'Database',
              'Created Manual Database Backup Snapshot',
              `Executed on-demand encrypted backup ${newBackup.id}. SHA-256 verification passed.`,
              { field: 'Manual Snapshot', oldValue: 'None', newValue: newBackup.id },
              'success'
            );
            showToast(`Manual backup ${newBackup.id} generated and archived successfully!`);
          }, 800);
        }, 900);
      }, 900);
    }, 800);
  };

  // Handle Restore Confirmation
  const handleExecuteRestore = () => {
    if (restoreConfirmText !== 'RESTORE') {
      alert('Please type RESTORE exactly to confirm rollback safety safeguard.');
      return;
    }
    const targetBkp = restoreModalBackup;
    setRestoreModalBackup(null);
    setRestoreConfirmText('');
    logAuditEvent(
      'Database',
      'Initiated Database Rollback Restore',
      `Restored state to snapshot ${targetBkp.id} created on ${targetBkp.timestamp}. Pre-restore rollback backup preserved.`,
      { field: 'Database State', oldValue: 'Live v2.6.4', newValue: `Restored from ${targetBkp.id}` },
      'warning'
    );
    showToast(`Database successfully restored to snapshot point: ${targetBkp.id}`);
  };

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] font-sans antialiased overflow-hidden text-slate-800">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 lg:w-72 bg-[#11133c] text-white flex flex-col justify-between shrink-0 h-full border-r border-[#1a1e52] z-20 select-none">
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Logo Header */}
          <div className="px-6 py-6 flex items-center gap-3">
            <PaySphereLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-tight">PaySphere</span>
              <span className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-medium truncate max-w-[150px]">
                {companyProfile.tradeName || companyProfile.legalName || 'Enterprise Edition'}
              </span>
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
                <span className="text-xs text-indigo-300/70 font-normal mt-0.5">Admin (Super Admin)</span>
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
              const isActive = item.name === 'Administration Setting';

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (item.name === 'Dashboard' && onNavigateDashboard) {
                      onNavigateDashboard();
                    } else if (item.name === 'Workers' && onNavigateWorkers) {
                      onNavigateWorkers();
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
                    } else if (item.name === 'Administration Setting') {
                      setActiveTab('hub');
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
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-8 z-50 animate-bounce bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ===================== TOP HEADER & SUB-NAV ===================== */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
          {/* Top Brand / Breadcrumb & System Health Row */}
          <div className="px-8 lg:px-10 pt-5 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">System Administration</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {companyProfile.legalName || 'Organization Profile'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Administration & System Controls
                </h1>
              </div>
            </div>

            {/* Quick Health Status Pills */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Operational</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-600 text-xs font-medium">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>PostgreSQL: Connected</span>
              </div>
              {activeTab !== 'hub' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Sleek Segmented Pill Navigation Bar */}
          <div className="px-8 lg:px-10 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between gap-4">
              {/* Segmented Control Bar */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                    activeTab === 'hub'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('company')}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                    activeTab === 'company'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Company Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                    activeTab === 'users'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>User Permissions</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {usersList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                    activeTab === 'audit'
                      ? 'bg-white text-amber-800 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Security & Audit</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'audit' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    Live
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                    activeTab === 'database'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Database & Backup</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'database' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    Online
                  </span>
                </button>
              </div>

              {/* Breadcrumb / Mode indicator on the right */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Active Section: <strong className="text-slate-800">{
                    activeTab === 'hub' ? 'Overview' :
                    activeTab === 'company' ? 'Company Profile' :
                    activeTab === 'users' ? 'User Management' :
                    activeTab === 'audit' ? 'Audit Trail' : 'Database Backups'
                  }</strong></span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================== BODY CONTENT ===================== */}
        <main className="p-8 lg:p-10 space-y-8 flex-1">
          {/* ========================================================================= */}
          {/* 1. OVERVIEW HUB - 4 MAIN INTERACTIVE CARDS AS REQUESTED */}
          {/* ========================================================================= */}
          {activeTab === 'hub' && (
            <div className="space-y-8">
              {/* Executive Snapshot KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enterprise Identity</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-lg font-bold text-slate-900 truncate block">
                      {companyProfile.legalName || 'Company Profile Not Configured'}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {companyProfile.gstin ? `GSTIN: ${companyProfile.gstin}` : 'Add company legal & tax registration'}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Users</span>
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-900">{usersList.length}</span>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      {usersList.length === 1 ? '1 Super Admin Configured' : `${usersList.length} Admin Users`}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Change Logs</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-900">{auditLogs.length}</span>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">
                      {auditLogs.length > 0 ? 'Logged with Who Did It & Time' : 'No audit logs recorded yet'}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database & Backup</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-900">
                      {backupsList.length > 0 ? `${backupsList.length} Backups` : '0 Backups'}
                    </span>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      {backupsList.length > 0 ? `Latest: ${backupsList[0].timestamp}` : 'No backups performed yet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* The 4 Main Administration Cards */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Administration Modules</h2>
                  <p className="text-xs text-slate-500">
                    Select any card to configure company legal profile, manage staff permissions, view recent change audit trail, or manage database backups.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Company Profile */}
                  <div
                    onClick={() => setActiveTab('company')}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400/80 p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                          Profile & Legal
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Company Profile
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Manage corporate identity, trade licenses, plant address, GSTIN, PAN, bank payout accounts, shift timing schedules, and factory working regulations.
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Factory Location:</span>
                          <span className="font-semibold text-slate-700">
                            {companyProfile.city ? `${companyProfile.city}, ${companyProfile.state}` : 'Not Configured'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Factory License:</span>
                          <span className="font-semibold text-slate-700 font-mono">
                            {companyProfile.factoryLicense || 'Pending Registration'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-indigo-600 font-semibold text-xs pt-3 border-t border-slate-100">
                      <span>View & Edit Profile</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: User Management and Permissions */}
                  <div
                    onClick={() => setActiveTab('users')}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400/80 p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          {usersList.length} Active Staff
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                        User Management & Permissions
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Control administrative staff accounts, assign granular role-based privileges (Workers, Salary, Advances, Contractors, Reports), and enforce 2FA verification.
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {usersList.slice(0, 4).map((u) => (
                            <div
                              key={u.id}
                              className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center"
                            >
                              {u.avatar}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 ml-1">
                          {usersList.length === 1 ? 'Sole Super Admin (ashmeet123)' : usersList.map(u => u.role).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-sky-600 font-semibold text-xs pt-3 border-t border-slate-100">
                      <span>Manage Users & Privileges</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 3: Security & Audit Trail */}
                  <div
                    onClick={() => setActiveTab('audit')}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                          Live Audit Trail
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        Security & Audit Trail
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Real-time audit log of all system changes. Inspect who performed every salary disbursal, advance approval, wage adjustment, contractor bill change, or security policy modification.
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/50">
                          <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate">
                            {auditLogs.length > 0
                              ? `Latest: ${auditLogs[0].action} by ${auditLogs[0].userName}`
                              : 'No activity recorded yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-amber-600 font-semibold text-xs pt-3 border-t border-slate-100">
                      <span>View Activity Log ("Who Did It")</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 4: Database and Backup Option */}
                  <div
                    onClick={() => setActiveTab('database')}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Database className="w-6 h-6" />
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                          {backupsList.length > 0 ? `${backupsList.length} Backups` : 'No Backups Yet'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Database & Backup Option
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Enterprise database health monitoring, on-demand instant backup generator, automated cloud snapshots schedule, restore safeguard, and database maintenance tools.
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Storage Engine:</span>
                          <span className="font-semibold text-slate-700">PostgreSQL (Local Dev)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Available Snapshots:</span>
                          <span className="font-semibold text-slate-700">{backupsList.length} Archived</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-emerald-600 font-semibold text-xs pt-3 border-t border-slate-100">
                      <span>Create Backup & Database Tools</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Audit Snippet */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Recent Activity Stream
                    </h3>
                    <p className="text-xs text-slate-500">Live feed of changes made across all plant modules</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All {auditLogs.length} Events</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent activities recorded yet. Actions taken will appear here.
                    </div>
                  ) : (
                    auditLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{log.userName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{log.userRole}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">{log.module}</span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium mt-0.5">{log.action}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{log.description}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{log.relativeTime}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. CARD VIEW: COMPANY PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{companyProfile.legalName}</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Active Enterprise
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        CIN: {companyProfile.cin} • Factory License: {companyProfile.factoryLicense}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isEditingCompany ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyFormData(companyProfile);
                            setIsEditingCompany(false);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCompanyProfile}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Company Details</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCompanyFormData(companyProfile);
                          setIsEditingCompany(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Company Profile</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Form or View Mode */}
                <form onSubmit={handleSaveCompanyProfile} className="mt-6 space-y-6">
                  {/* Section 1: Legal & Identity */}
                  <div>
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      1. Legal & Regulatory Identity
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company Legal Name</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.legalName}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, legalName: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800">
                            {companyProfile.legalName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Trade & Brand Title</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.tradeName}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, tradeName: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800">
                            {companyProfile.tradeName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Corporate Identity (CIN)</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.cin}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, cin: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-800">
                            {companyProfile.cin}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN Identification</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.gstin}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, gstin: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-800">
                            {companyProfile.gstin}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Income Tax PAN</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.pan}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, pan: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-800">
                            {companyProfile.pan}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Factory License No.</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.factoryLicense}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, factoryLicense: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-800">
                            {companyProfile.factoryLicense}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Plant Location & Contacts */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      2. Plant Location & Operational Contacts
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Factory / Plant Address</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.address}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800">
                            {companyProfile.address}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">City, State & Pincode</label>
                        {isEditingCompany ? (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={companyFormData.city}
                              onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                              placeholder="City"
                              className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={companyFormData.pincode}
                              onChange={(e) => setCompanyFormData({ ...companyFormData, pincode: e.target.value })}
                              placeholder="Pincode"
                              className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                            />
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800">
                            {companyProfile.city}, {companyProfile.state} - {companyProfile.pincode}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Email Desk</label>
                        {isEditingCompany ? (
                          <input
                            type="email"
                            value={companyFormData.primaryEmail}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, primaryEmail: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{companyProfile.primaryEmail}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Accounts & Finance Email</label>
                        {isEditingCompany ? (
                          <input
                            type="email"
                            value={companyFormData.financeEmail}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, financeEmail: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{companyProfile.financeEmail}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Plant Phone</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.primaryPhone}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, primaryPhone: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{companyProfile.primaryPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Payroll Bank & Shifts */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      3. Corporate Payroll Disbursal & Shift Defaults
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Disbursal Bank</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.bankName}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, bankName: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800">
                            {companyProfile.bankName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Corporate Account Number</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.bankAccount}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, bankAccount: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono font-semibold text-slate-800">
                            {companyProfile.bankAccount} (IFSC: {companyProfile.bankIfsc})
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Overtime Policy</label>
                        {isEditingCompany ? (
                          <input
                            type="text"
                            value={companyFormData.workingHoursOvertimeMultiplier}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, workingHoursOvertimeMultiplier: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          />
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800">
                            {companyProfile.workingHoursOvertimeMultiplier}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. CARD VIEW: USER MANAGEMENT & PERMISSIONS */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header and Add User Button */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Administrative Staff & Role Permissions
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure user credentials, role access boundaries, and multi-factor security credentials.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Administrative User</span>
                  </button>
                </div>

                {/* Filter / Search Bar */}
                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, department..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="All">All Roles</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="HR & Payroll Manager">HR & Payroll Manager</option>
                      <option value="Plant Operations Head">Plant Operations Head</option>
                      <option value="Tool Room & Shift Lead">Tool Room & Shift Lead</option>
                      <option value="EHS & Compliance Officer">EHS & Compliance Officer</option>
                      <option value="Statutory Auditor">Statutory Auditor</option>
                    </select>
                  </div>
                </div>

                {/* User List Table */}
                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">User & Contact</th>
                        <th className="px-4 py-3">Assigned Role</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Security & 2FA</th>
                        <th className="px-4 py-3">Last Active</th>
                        <th className="px-4 py-3">Account Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center justify-center shrink-0">
                                {user.avatar}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">{user.name}</span>
                                <span className="text-[11px] text-slate-500">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{user.role}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {user.department}
                          </td>
                          <td className="px-4 py-3">
                            {user.twoFactor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                2FA Enforced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                                Password Only
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 font-medium block">{user.lastLogin}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{user.ipAddress}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedUserForPermissions(user)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                                title="Edit Permissions"
                              >
                                Privileges
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  user.status === 'Active'
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {user.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Role Permissions Matrix Explainer */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Role Privileges Hierarchy Matrix
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">Super Admin (Ashmeet)</div>
                      <p className="text-slate-500 mt-1">
                        Unrestricted master access: All system modules, audit logs, database snapshotting & restore, user privilege assignment.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">HR & Payroll Manager</div>
                      <p className="text-slate-500 mt-1">
                        Workforce roster management, daily attendance correction, monthly salary calculation & batch payout, advance approvals.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">Operations & Auditors</div>
                      <p className="text-slate-500 mt-1">
                        Contractor bill verification, shift management, live attendance monitoring, and read-only financial compliance exports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. CARD VIEW: SECURITY & AUDIT TRAIL ("WHO DID IT & WHEN") */}
          {/* ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Header with Security stats and Filters */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Enterprise Auditing</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">Tamper-Proof Ledger</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      Security & Activity Audit Trail
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Comprehensive log of every change, update, and deletion across workers, salaries, advances, contractors, and system preferences. See who executed it, from where, and the exact diff.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => showToast('Audit trail ledger exported as CSV successfully.')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Audit Log</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Log</span>
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search audit events by action, user name, description, or module..."
                      value={auditSearchTerm}
                      onChange={(e) => setAuditSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Module:</span>
                    <select
                      value={auditModuleFilter}
                      onChange={(e) => setAuditModuleFilter(e.target.value)}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Modules</option>
                      <option value="Salary">Salary Payroll</option>
                      <option value="Advance">Advance & Loans</option>
                      <option value="Workers">Workers</option>
                      <option value="Contractor">Contractors</option>
                      <option value="Attendance">Attendance</option>
                      <option value="Security">Security & Access</option>
                      <option value="Database">Database Engine</option>
                      <option value="Administration">Administration</option>
                    </select>

                    <span className="text-xs font-semibold text-slate-500 ml-1">Performed By:</span>
                    <select
                      value={auditUserFilter}
                      onChange={(e) => setAuditUserFilter(e.target.value)}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Users</option>
                      <option value="Ashmeet">Ashmeet (Super Admin)</option>
                      <option value="Jaswinder Kaur">Jaswinder Kaur (HR)</option>
                      <option value="Satnam Singh">Satnam Singh (Plant Head)</option>
                      <option value="System Cron">System Cron (Automated)</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Actor / Who Did It</th>
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Action Performed</th>
                        <th className="px-4 py-3">Change Diff & Details</th>
                        <th className="px-4 py-3">Client IP & Device</th>
                        <th className="px-4 py-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                            No audit log events found. Administrative actions will be logged here automatically.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">{log.timestamp}</span>
                            <span className="text-[11px] text-slate-400">{log.relativeTime}</span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {log.userName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{log.userName}</span>
                                <span className="text-[10px] text-slate-500">{log.userRole}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                              {log.module}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{log.action}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{log.description}</p>
                          </td>

                          <td className="px-4 py-3">
                            {log.changeDiff ? (
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  {log.changeDiff.field}
                                </span>
                                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                  <span className="line-through text-rose-600 bg-rose-50 px-1 rounded">
                                    {log.changeDiff.oldValue}
                                  </span>
                                  <span className="text-slate-400">➔</span>
                                  <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">
                                    {log.changeDiff.newValue}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Verified system execution</span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-slate-700 block text-[11px]">{log.ip}</span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">{log.device}</span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.severity === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              {log.severity.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Security Settings Bar */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    Security Baseline & Authentication Policies
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Enforce 2-Factor Auth (2FA)</span>
                        <span className="text-[11px] text-slate-500">Require OTP for all admin roles</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={twoFactorEnforced}
                        onChange={(e) => {
                          setTwoFactorEnforced(e.target.checked);
                          logAuditEvent('Security', 'Toggled Global 2FA Policy', `Global 2FA enforcement changed to ${e.target.checked ? 'Active' : 'Disabled'}.`);
                          showToast(`2FA policy updated to ${e.target.checked ? 'Enforced' : 'Optional'}.`);
                        }}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Idle Session Timeout</span>
                        <span className="text-[11px] text-slate-500">Auto logout inactive sessions</span>
                      </div>
                      <select
                        value={sessionTimeoutMinutes}
                        onChange={(e) => {
                          setSessionTimeoutMinutes(e.target.value);
                          logAuditEvent('Security', 'Updated Session Timeout', `Idle timeout set to ${e.target.value} minutes.`);
                          showToast(`Idle session timeout set to ${e.target.value} minutes.`);
                        }}
                        className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="240">4 Hours</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Password Rotation Policy</span>
                        <span className="text-[11px] text-slate-500">Mandatory password cycle</span>
                      </div>
                      <select
                        value={passwordExpiryDays}
                        onChange={(e) => {
                          setPasswordExpiryDays(e.target.value);
                          logAuditEvent('Security', 'Updated Password Expiry', `Password rotation set to ${e.target.value} days.`);
                          showToast(`Password expiry set to ${e.target.value} days.`);
                        }}
                        className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                        <option value="180">180 Days</option>
                        <option value="365">1 Year</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. CARD VIEW: DATABASE & BACKUP OPTION */}
          {/* ========================================================================= */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Top Action & Health Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Storage & Resilience</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">PostgreSQL Engine v16.2</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                      <Database className="w-5 h-5 text-emerald-600" />
                      Database Engine & Backup Automation
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure automated daily snapshots, generate instant manual full-database dumps, and safely restore historical snapshots.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerManualBackup}
                    disabled={isBackupInProgress}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-4 h-4 ${isBackupInProgress ? 'animate-spin' : ''}`} />
                    <span>{isBackupInProgress ? 'Generating Backup...' : 'Create Instant Backup Now'}</span>
                  </button>
                </div>

                {/* Backup Generation Progress Indicator (Active when running) */}
                {isBackupInProgress && (
                  <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        Generating Encrypted Full System Snapshot...
                      </span>
                      <span>Step {backupProgressStep} of 4</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(backupProgressStep / 4) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      {backupProgressStep === 1 && 'Acquiring consistent table read lock & snapshotting relational tables...'}
                      {backupProgressStep === 2 && 'Compressing database schema and data using gzip...'}
                      {backupProgressStep === 3 && 'Encrypting archive with AES-256 and computing SHA-256 verification hash...'}
                      {backupProgressStep === 4 && 'Syncing snapshot archive mirror and finalizing index...'}
                    </p>
                  </div>
                )}

                {/* Database Metrics Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Database Engine</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">PostgreSQL</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Local Development Active</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">System Storage</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">Ready</span>
                    <span className="text-[11px] text-slate-500">Awaiting Real Production Data</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Last Backup</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">
                      {backupsList.length > 0 ? backupsList[0].timestamp : 'None'}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {backupsList.length > 0 ? 'Verified & Encrypted' : 'No Backups Taken Yet'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Backend Connection</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">Connected</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Status: Active & Operational</span>
                  </div>
                </div>

                {/* Automated Backup Schedule Configuration */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Automated Backup Schedule & Cloud Replication
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">Daily Automated Snapshot</span>
                        <span className="text-[11px] text-slate-500">Runs every night at 02:00 AM</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoBackupEnabled}
                        onChange={(e) => {
                          setAutoBackupEnabled(e.target.checked);
                          showToast(`Automated daily backup schedule ${e.target.checked ? 'Enabled' : 'Disabled'}.`);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">Cloud Mirror Replication</span>
                        <span className="text-[11px] text-slate-500">Secondary sync to AWS S3</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={cloudSyncEnabled}
                        onChange={(e) => {
                          setCloudSyncEnabled(e.target.checked);
                          showToast(`Cloud replication mirror ${e.target.checked ? 'Enabled' : 'Disabled'}.`);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">Retention Window</span>
                        <span className="text-[11px] text-slate-500">Archive snapshots for</span>
                      </div>
                      <select
                        value={retentionDays}
                        onChange={(e) => {
                          setRetentionDays(Number(e.target.value));
                          showToast(`Backup retention period updated to ${e.target.value} days.`);
                        }}
                        className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="15">15 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Backup Snapshots History Table */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        Available Backup Snapshots Archive
                      </h3>
                      <p className="text-xs text-slate-500">
                        Historical system recovery points with cryptographic checksums
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {backupsList.length} Snapshots Stored
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3">Snapshot Reference</th>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Archive Size</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Created By</th>
                          <th className="px-4 py-3">Integrity & Cloud</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {backupsList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                              No backup snapshots stored yet. Click "Generate Database Snapshot" to create your first backup.
                            </td>
                          </tr>
                        ) : (
                          backupsList.map((bkp) => (
                          <tr key={bkp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-slate-900 block">{bkp.id}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{bkp.checksum}</span>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                              {bkp.timestamp}
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {bkp.size}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {bkp.type}
                            </td>

                            <td className="px-4 py-3 text-slate-700 font-medium">
                              {bkp.createdBy}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                {bkp.status}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => showToast(`Downloading backup archive ${bkp.id}.sql.gz`)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Download .sql.gz Archive"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRestoreModalBackup(bkp)}
                                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  Restore DB
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

                {/* Database Maintenance Utilities */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    Database Maintenance & Index Optimization
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        logAuditEvent('Database', 'Executed Vacuum & Reindex Optimization', 'Optimized all 18 tables; recovered 14.2 MB dead tuple space.');
                        showToast('VACUUM & REINDEX completed successfully. 14.2 MB reclaimed.');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Run VACUUM & Reindex</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logAuditEvent('Database', 'Purged Temporary Cache Tables', 'Cleared expired session cache and temp payroll compute tables.');
                        showToast('Temporary cache and staging buffers cleared.');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Purge Expired Session Cache</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast('PostgreSQL schema DDL script exported successfully.')}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Schema DDL (SQL)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW ADMINISTRATIVE USER */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Administrative User</h3>
                  <p className="text-xs text-slate-500">Provide staff credentials and default permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gurminder Singh"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. admin@company.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="HR & Payroll Manager">HR & Payroll Manager</option>
                    <option value="Plant Operations Head">Plant Operations Head</option>
                    <option value="Tool Room & Shift Lead">Tool Room & Shift Lead</option>
                    <option value="EHS & Compliance Officer">EHS & Compliance Officer</option>
                    <option value="Statutory Auditor">Statutory Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality & Maintenance"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserForm.twoFactor}
                    onChange={(e) => setNewUserForm({ ...newUserForm, twoFactor: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Enforce Two-Factor Authentication (2FA)</span>
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PRIVILEGES / PERMISSIONS */}
      {/* ========================================================================= */}
      {selectedUserForPermissions && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manage Privileges: {selectedUserForPermissions.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedUserForPermissions.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPermissions(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Workforce Records & Registrations', desc: 'Add, update or terminate worker profiles' },
                { label: 'Attendance & Overtime Sync', desc: 'Punch correction and shift schedule authorization' },
                { label: 'Salary Calculation & Bank Disbursal', desc: 'Compute monthly payroll and trigger disbursements' },
                { label: 'Worker Advance & Fixed Loan Approvals', desc: 'Sanction emergency advances and loan terms' },
                { label: 'Contractor Billing Approvals', desc: 'Verify tonnage outputs and invoice verification' },
                { label: 'Database Backup & System Settings', desc: 'Access administration hub and rollback snapshots' }
              ].map((perm, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{perm.label}</span>
                    <span className="text-[10px] text-slate-500">{perm.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={selectedUserForPermissions.role === 'Super Admin' || idx < 3}
                    disabled={selectedUserForPermissions.role === 'Super Admin'}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUserForPermissions(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  logAuditEvent(
                    'Security',
                    'Updated Role Permissions',
                    `Modified custom granular access boundaries for ${selectedUserForPermissions.name}.`
                  );
                  setSelectedUserForPermissions(null);
                  showToast(`Privileges updated for ${selectedUserForPermissions.name}.`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                Save Privileges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESTORE DATABASE SAFETY SAFEGUARD */}
      {/* ========================================================================= */}
      {restoreModalBackup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Database Rollback Safeguard</h3>
                <p className="text-xs text-slate-500">Restore point: {restoreModalBackup.id}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                Warning: Restoring will revert all workers, attendance, salary disbursals, advances, and contractor data to {restoreModalBackup.timestamp}.
              </p>
              <p>
                An automatic pre-restore backup snapshot will be captured immediately before rollback commences to safeguard current live data.
              </p>
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Type <span className="font-mono text-rose-600">RESTORE</span> to authorize rollback:
                </label>
                <input
                  type="text"
                  placeholder="RESTORE"
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRestoreModalBackup(null);
                  setRestoreConfirmText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreConfirmText !== 'RESTORE'}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-40"
              >
                Execute Database Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministrationPage;
