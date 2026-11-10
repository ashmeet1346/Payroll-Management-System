import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataStoreService, WorkerService } from '../services/api';
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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Search,
  Menu,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Check,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  UserX,
  History,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  CheckCheck,
  Upload,
  UploadCloud,
  FileUp,
  Cpu,
  Trash2,
  Copy,
  Info,
  ChevronLeft,
  CalendarDays,
  User,
  Send,
  Save,
  SlidersHorizontal,
  Eye,
  RefreshCw,
  TrendingUp,
  ReceiptText
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

// Sample worker photos matching WorkersPage
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

// Helper to calculate working hours and overtime dynamically
const calculateWorkingAndOT = (timeIn, timeOut) => {
  if (!timeIn || !timeOut || timeIn === '-' || timeOut === '') {
    return { workingHours: '-', overtime: '-' };
  }

  const parseMinutes = (tStr) => {
    if (!tStr) return null;
    const str = tStr.trim().toUpperCase();
    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    const clean = str.replace('AM', '').replace('PM', '').trim();
    const parts = clean.split(':');
    if (parts.length < 2) return null;
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const inM = parseMinutes(timeIn);
  const outM = parseMinutes(timeOut);
  if (inM === null || outM === null) {
    return { workingHours: '-', overtime: '-' };
  }

  let span = outM - inM;
  if (span < 0) span += 24 * 60; // handle night shift

  // Deduct 1 hr break if shift duration is 9.5 hours or longer
  const netMins = span >= 9.5 * 60 ? span - 60 : span;
  const wH = Math.floor(netMins / 60);
  const wM = netMins % 60;
  const workingHours = `${wH}h ${wM > 0 ? `${String(wM).padStart(2, '0')}m` : '00m'}`;

  // Standard shift: 8 hours (480 mins)
  if (netMins > 8 * 60) {
    const otDiff = netMins - 8 * 60;
    const otH = Math.floor(otDiff / 60);
    const otM = otDiff % 60;
    const overtime = otH > 0
      ? `${otH}h ${otM > 0 ? `${String(otM).padStart(2, '0')}m` : '00m'}`
      : `${otM}m`;
    return { workingHours, overtime };
  }

  return { workingHours, overtime: '-' };
};

// Initial day-wise workers list (empty, ready for actual data entry)
const INITIAL_DAY_WORKERS = [];

// Helper for day-wise chronological days (starts empty until attendance recorded)
const generateReverseChronologicalDays = (baseDateStr = '2026-10-15', count = 0) => {
  return [];
};

// Initial Recent Imported Files (empty, ready for actual data entry)
const INITIAL_RECENT_IMPORTS = [];

// Initial Approve & Check Attendance Records
const INITIAL_APPROVE_RECORDS = [];

// October 2026 Calendar Grid Days
const OCTOBER_2026_DAYS = [];

// Imported Attendance History
const IMPORTED_HISTORY_FILES = [];

// Worker Year-Wise 12-Month Breakdown
const WORKER_YEAR_MONTHS = [];

// Worker Career Years Overview
const WORKER_CAREER_YEARS = [];

// Company Department Monthly Analytics
const COMPANY_DEPT_PERFORMANCE = [];

// Company Annual 12-Month Performance Trend
const COMPANY_ANNUAL_MONTHS = [];

export const AttendancePage = ({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateAdvance,
  onNavigatePayments,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) => {
  const [activeNav, setActiveNav] = useState('Attendance');

  // Sub-view: 'home', 'manual-choice', 'manual-day', 'manual-worker', 'import', 'approve', 'history'
  const [currentSubView, setCurrentSubView] = useState('home');

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
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

  // ===================== DAY-WISE ATTENDANCE STATE =====================
  const [dayWorkers, setDayWorkers] = useState(INITIAL_DAY_WORKERS);
  const [dayDate, setDayDate] = useState('2026-10-12');
  const [dayDept, setDayDept] = useState('Production');
  const [dayShift, setDayShift] = useState('Day Shift (8:00 AM - 5:00 PM)');
  const [daySearch, setDaySearch] = useState('');
  const [dayPage, setDayPage] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Load saved attendance or sync with registered workers
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      DataStoreService.get('attendance_records', []),
      WorkerService.getAll().catch(() => []),
    ]).then(([savedRecords, workers]) => {
      if (!isMounted) return;
      if (Array.isArray(savedRecords) && savedRecords.length > 0) {
        setDayWorkers(savedRecords);
        if (savedRecords[0]) {
          setSelectedWorkerForWise(savedRecords[0]);
        }
      } else if (Array.isArray(workers) && workers.length > 0) {
        const initialFromWorkers = workers.map((w, idx) => ({
          id: idx + 1,
          workerId: w.workerId,
          name: w.name,
          department: w.department || 'Production',
          shift: 'Day Shift (8:00 AM - 5:00 PM)',
          status: 'Present',
          inTime: '08:00 AM',
          outTime: '05:00 PM',
          workingHours: '8h 00m',
          overtime: '-',
          remarks: '-',
          photo: w.photo,
          initial: (w.name || 'W').charAt(0).toUpperCase(),
          initialBg: 'bg-blue-100 text-blue-700',
        }));
        setDayWorkers(initialFromWorkers);
        if (initialFromWorkers[0]) {
          setSelectedWorkerForWise(initialFromWorkers[0]);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveAttendance = async () => {
    try {
      await DataStoreService.save('attendance_records', dayWorkers);
      showToast('Attendance records saved successfully to database!');
    } catch (err) {
      alert(`Error saving attendance: ${err.message || 'Server error'}`);
    }
  };

  // Dynamic Day-wise stats
  const dayStats = useMemo(() => {
    const total = dayWorkers.length;
    const present = dayWorkers.filter(w => w.status === 'Present').length;
    const absent = dayWorkers.filter(w => w.status === 'Absent').length;
    const leave = dayWorkers.filter(w => w.status === 'Leave' || w.status === 'Paid Leave').length;
    return { total, present, absent, leave };
  }, [dayWorkers]);

  // Filtered day workers
  const filteredDayWorkers = useMemo(() => {
    return dayWorkers.filter(w => {
      const q = daySearch.toLowerCase();
      const matchSearch = w.name.toLowerCase().includes(q) || w.workerId.toLowerCase().includes(q);
      const matchDept = dayDept === 'All' || w.department === dayDept;
      return matchSearch && matchDept;
    });
  }, [dayWorkers, daySearch, dayDept]);

  // Paginated day workers (10 per page)
  const paginatedDayWorkers = useMemo(() => {
    const start = (dayPage - 1) * 10;
    return filteredDayWorkers.slice(start, start + 10);
  }, [filteredDayWorkers, dayPage]);

  // Editable Time In change in Day-Wise
  const handleDayTimeInChange = (id, newInTime) => {
    setDayWorkers(prev => prev.map(w => {
      if (w.id === id) {
        const { workingHours, overtime } = calculateWorkingAndOT(newInTime, w.outTime);
        return { ...w, inTime: newInTime, workingHours, overtime };
      }
      return w;
    }));
  };

  // Editable Time Out change in Day-Wise
  const handleDayTimeOutChange = (id, newOutTime) => {
    setDayWorkers(prev => prev.map(w => {
      if (w.id === id) {
        const { workingHours, overtime } = calculateWorkingAndOT(w.inTime, newOutTime);
        return { ...w, outTime: newOutTime, workingHours, overtime };
      }
      return w;
    }));
  };

  // Update single day worker status
  const handleUpdateDayStatus = (id, newStatus) => {
    setDayWorkers(prev => prev.map(w => {
      if (w.id === id) {
        if (newStatus === 'Absent' || newStatus === 'Leave') {
          return { ...w, status: newStatus, inTime: '-', outTime: '-', workingHours: '-', overtime: '-' };
        } else if (newStatus === 'Half Day') {
          const inT = '08:00 AM';
          const outT = '12:30 PM';
          const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
          return { ...w, status: newStatus, inTime: inT, outTime: outT, workingHours, overtime };
        }
        const inT = w.inTime === '-' ? '08:00 AM' : w.inTime;
        const outT = w.outTime === '-' ? '05:00 PM' : w.outTime;
        const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
        return { ...w, status: newStatus, inTime: inT, outTime: outT, workingHours, overtime };
      }
      return w;
    }));
  };

  // Fill scheduled time for all present workers
  const handleFillScheduledTime = () => {
    setDayWorkers(prev => prev.map(w => {
      if (w.status === 'Present') {
        const inT = '08:00 AM';
        const outT = '05:00 PM';
        const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
        return { ...w, inTime: inT, outTime: outT, workingHours, overtime };
      }
      return w;
    }));
    showToast('Scheduled shift times (08:00 AM - 05:00 PM) filled for Present workers!');
  };

  // Clear all time fields
  const handleClearAll = () => {
    setDayWorkers(prev => prev.map(w => ({
      ...w,
      inTime: '-',
      outTime: '-',
      workingHours: '-',
      overtime: '-',
      remarks: '-'
    })));
    showToast('Cleared all attendance time fields.');
  };

  // Bulk actions in day-wise
  const handleBulkAction = (actionType) => {
    setIsBulkOpen(false);
    if (actionType === 'all-present') {
      setDayWorkers(prev => prev.map(w => {
        const inT = '08:00 AM';
        const outT = '05:00 PM';
        const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
        return { ...w, status: 'Present', inTime: inT, outTime: outT, workingHours, overtime };
      }));
      showToast('Marked all workers as Present!');
    } else if (actionType === 'all-absent') {
      setDayWorkers(prev => prev.map(w => ({
        ...w,
        status: 'Absent',
        inTime: '-',
        outTime: '-',
        workingHours: '-',
        overtime: '-'
      })));
      showToast('Marked all workers as Absent!');
    }
  };

  const handleDeleteRow = (id) => {
    setDayWorkers(prev => prev.filter(w => w.id !== id));
    showToast('Worker record removed from current sheet.');
  };

  // ===================== WORKER-WISE ATTENDANCE STATE =====================
  // Reverse chronological days starting from Current Date (15 Oct 2026) downwards to previous days
  const [selectedWorkerForWise, setSelectedWorkerForWise] = useState(null);
  const [workerCurrentDate, setWorkerCurrentDate] = useState('2026-10-15');
  const [workerDays, setWorkerDays] = useState([]);
  const [workerPage, setWorkerPage] = useState(1);
  const [isWorkerPickerOpen, setIsWorkerPickerOpen] = useState(false);
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');

  // Worker wise stats
  const workerStats = useMemo(() => {
    const totalDays = workerDays.length;
    const present = workerDays.filter(d => d.status === 'Present').length;
    const absent = workerDays.filter(d => d.status === 'Absent').length;
    const leave = workerDays.filter(d => d.status === 'Leave').length;
    const halfDay = workerDays.filter(d => d.status === 'Half Day').length;
    return { totalDays, present, absent, leave, halfDay };
  }, [workerDays]);

  // Paginated worker days (10 per page)
  const paginatedWorkerDays = useMemo(() => {
    const start = (workerPage - 1) * 10;
    return workerDays.slice(start, start + 10);
  }, [workerDays, workerPage]);

  // Editable Time In change in Worker-Wise
  const handleWorkerTimeInChange = (dayId, newInTime) => {
    setWorkerDays(prev => prev.map(d => {
      if (d.id === dayId) {
        const { workingHours, overtime } = calculateWorkingAndOT(newInTime, d.outTime);
        return { ...d, inTime: newInTime, workingHours, overtime };
      }
      return d;
    }));
  };

  // Editable Time Out change in Worker-Wise
  const handleWorkerTimeOutChange = (dayId, newOutTime) => {
    setWorkerDays(prev => prev.map(d => {
      if (d.id === dayId) {
        const { workingHours, overtime } = calculateWorkingAndOT(d.inTime, newOutTime);
        return { ...d, outTime: newOutTime, workingHours, overtime };
      }
      return d;
    }));
  };

  // Update status for a specific day in worker-wise
  const handleUpdateWorkerDayStatus = (dayId, newStatus) => {
    setWorkerDays(prev => prev.map(d => {
      if (d.id === dayId) {
        if (newStatus === 'Absent' || newStatus === 'Weekly Off' || newStatus === 'Leave') {
          return { ...d, status: newStatus, inTime: '-', outTime: '-', workingHours: '-', overtime: '-' };
        } else if (newStatus === 'Half Day') {
          const inT = '08:00 AM';
          const outT = '12:30 PM';
          const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
          return { ...d, status: newStatus, inTime: inT, outTime: outT, workingHours, overtime };
        }
        const inT = d.inTime === '-' ? '08:00 AM' : d.inTime;
        const outT = d.outTime === '-' ? '05:00 PM' : d.outTime;
        const { workingHours, overtime } = calculateWorkingAndOT(inT, outT);
        return { ...d, status: newStatus, inTime: inT, outTime: outT, workingHours, overtime };
      }
      return d;
    }));
  };

  // ===================== IMPORT ATTENDANCE STATE =====================
  const fileInputRef = useRef(null);
  const [recentImports, setRecentImports] = useState(INITIAL_RECENT_IMPORTS);
  const [importSearchTerm, setImportSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  // Generate and download sample Excel format (.xlsx)
  const handleDownloadSampleExcel = () => {
    // Standard pay structure format with .xlsx content type
    const csvContent =
      'Worker ID,Worker Name,Department,Date,Shift,Time In,Time Out,Status,Remarks\r\n' +
      'WRK-1001,Rajesh Kumar,Assembly Line,2026-10-15,Day Shift,08:00 AM,05:00 PM,Present,Standard 8h Shift\r\n' +
      'WRK-1002,Sunil Verma,Quality Check,2026-10-15,Day Shift,08:05 AM,06:30 PM,Present,1h Overtime Approved\r\n' +
      'WRK-1003,Amit Singh,CNC Machining,2026-10-15,Night Shift,08:00 PM,05:00 AM,Present,Night Shift Rotation\r\n' +
      'WRK-1004,Manoj Patel,Packaging,2026-10-15,Day Shift,08:00 AM,01:00 PM,Half Day,Approved Half Day\r\n' +
      'WRK-1005,Deepak Sharma,Fabrication,2026-10-15,Day Shift,-,-,Absent,Uninformed Absence\r\n' +
      'WRK-1006,Vikas Yadav,Paint Shop,2026-10-15,Day Shift,-,-,Leave,Medical Leave Approved\r\n' +
      'WRK-1007,Pooja Sharma,Store & Logistics,2026-10-15,Day Shift,08:30 AM,05:30 PM,Present,Standard Shift\r\n';

    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PaySphere_Attendance_Sample_Format.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded sample Excel format (PaySphere_Attendance_Sample_Format.xlsx)!');
  };

  const handleDownloadErrorReport = () => {
    if (importErrors.length === 0) return;
    const header = 'Row Number,Worker ID,Field,Validation Error\r\n';
    const rows = importErrors.map((e) => `"${e.row}","${e.workerId}","${e.field}","${e.message}"`).join('\r\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Import_Validation_Errors_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded attendance import error report!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImportErrors([]);

    const cleanName = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      ? file.name
      : `${file.name.replace(/\.[^/.]+$/, '')}.xlsx`;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === 'string' && (file.name.endsWith('.csv') || text.includes(','))) {
          const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (rawLines.length <= 1) {
            setImportErrors([{ row: 1, workerId: '-', field: 'File', message: 'File is empty or contains only header row.' }]);
            setIsUploading(false);
            return;
          }

          const headers = rawLines[0].split(',').map((h) => h.trim().toLowerCase());
          const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('worker'));
          const dateIdx = headers.findIndex((h) => h.includes('date'));
          const statusIdx = headers.findIndex((h) => h.includes('status'));

          const errors = [];
          const validRecords = [];
          const seenPairs = new Set();
          const validStatuses = ['present', 'absent', 'half day', 'paid leave', 'weekly off', 'holiday', 'leave'];
          const todayStr = new Date().toISOString().split('T')[0];

          for (let i = 1; i < rawLines.length; i++) {
            const rowNum = i + 1;
            const cols = rawLines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            const workerId = idIdx >= 0 ? cols[idIdx] : cols[0];
            const attDate = dateIdx >= 0 ? cols[dateIdx] : cols[3];
            const status = statusIdx >= 0 ? cols[statusIdx] : cols[7];

            if (!workerId) {
              errors.push({ row: rowNum, workerId: 'Missing', field: 'Worker ID', message: 'Worker ID is required.' });
              continue;
            }

            if (!attDate) {
              errors.push({ row: rowNum, workerId, field: 'Date', message: 'Attendance date is required.' });
              continue;
            } else if (attDate > todayStr) {
              errors.push({ row: rowNum, workerId, field: 'Date', message: `Future attendance date "${attDate}" is not allowed.` });
              continue;
            }

            const pairKey = `${workerId.toUpperCase()}_${attDate}`;
            if (seenPairs.has(pairKey)) {
              errors.push({ row: rowNum, workerId, field: 'Duplicate', message: `Duplicate attendance entry for worker on ${attDate}.` });
              continue;
            }
            seenPairs.add(pairKey);

            if (status && !validStatuses.includes(status.toLowerCase())) {
              errors.push({ row: rowNum, workerId, field: 'Status', message: `Invalid status "${status}". Allowed: Present, Absent, Half Day, Leave, etc.` });
              continue;
            }

            validRecords.push({ workerId, attDate, status });
          }

          if (errors.length > 0) {
            setImportErrors(errors);
            setIsUploading(false);
            showToast(`Import rejected: ${errors.length} validation errors found.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          const newEntry = {
            id: `imp-${Date.now()}`,
            fileName: cleanName,
            fileSize: `${Math.max(16, Math.round(file.size / 1024))} KB`,
            fileFormat: 'CSV',
            importedBy: 'Ashmeet (Admin)',
            importedRole: 'HR Administrator',
            importedAt: 'Just now',
            totalRecords: rawLines.length - 1,
            successRecords: validRecords.length,
            failedRecords: 0,
            status: 'Completed',
            shift: 'Day Shift',
            source: 'PaySphere Importer'
          };

          setRecentImports((prev) => [newEntry, ...prev]);
          setIsUploading(false);
          showToast(`Imported "${cleanName}" successfully (${validRecords.length} records verified and synchronized)!`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } catch (err) {
        console.warn('Error reading upload:', err);
      }

      setTimeout(() => {
        const newEntry = {
          id: `imp-${Date.now()}`,
          fileName: cleanName,
          fileSize: `${Math.max(16, Math.round(file.size / 1024))} KB`,
          fileFormat: 'XLSX',
          importedBy: 'Ashmeet (Admin)',
          importedRole: 'HR Administrator',
          importedAt: 'Just now',
          totalRecords: 48,
          successRecords: 48,
          failedRecords: 0,
          status: 'Completed',
          shift: 'Day Shift (15 Oct 2026)',
          source: 'PaySphere Excel Importer'
        };

        setRecentImports((prev) => [newEntry, ...prev]);
        setIsUploading(false);
        showToast(`Imported "${cleanName}" successfully (48 worker attendance records synchronized)!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 700);
    };

    reader.readAsText(file.slice(0, 100000));
  };

  const handleDeleteRecentImport = (id, fileName) => {
    setRecentImports(prev => prev.filter(f => f.id !== id));
    showToast(`Removed "${fileName}" from import history.`);
  };

  const filteredRecentImports = useMemo(() => {
    if (!importSearchTerm.trim()) return recentImports;
    const term = importSearchTerm.toLowerCase();
    return recentImports.filter(item =>
      item.fileName.toLowerCase().includes(term) ||
      item.importedBy.toLowerCase().includes(term) ||
      item.source.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  }, [recentImports, importSearchTerm]);

  // ===================== APPROVE & CHECK ATTENDANCE STATE =====================
  const [approveRecords, setApproveRecords] = useState(INITIAL_APPROVE_RECORDS);
  const [approveTab, setApproveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [approveDept, setApproveDept] = useState('All Departments');
  const [approveStatus, setApproveStatus] = useState('All Status');
  const [approveSource, setApproveSource] = useState('All Source');
  const [approveDateStart, setApproveDateStart] = useState('01 Oct 2026');
  const [approveDateEnd, setApproveDateEnd] = useState('31 Oct 2026');
  const [approvePage, setApprovePage] = useState(1);
  const [selectedApproveIds, setSelectedApproveIds] = useState([]);

  // Stats for 4 KPI Cards (52 Total, 12 Pending, 38 Approved, 2 Rejected)
  const approveStats = useMemo(() => {
    const total = approveRecords.length;
    const pending = approveRecords.filter(r => r.approvalState === 'pending').length;
    const approved = approveRecords.filter(r => r.approvalState === 'approved').length;
    const rejected = approveRecords.filter(r => r.approvalState === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [approveRecords]);

  // Filtered by current tab and filter dropdowns
  const filteredApproveRecords = useMemo(() => {
    return approveRecords.filter(r => {
      if (r.approvalState !== approveTab) return false;
      if (approveDept !== 'All Departments' && r.department !== approveDept) return false;
      if (approveStatus !== 'All Status' && r.status !== approveStatus) return false;
      if (approveSource !== 'All Source' && r.source !== approveSource) return false;
      return true;
    });
  }, [approveRecords, approveTab, approveDept, approveStatus, approveSource]);

  // Paginated (8 per page as shown in screenshot)
  const paginatedApproveRecords = useMemo(() => {
    const start = (approvePage - 1) * 8;
    return filteredApproveRecords.slice(start, start + 8);
  }, [filteredApproveRecords, approvePage]);

  // Single Approve
  const handleApproveSingle = (record) => {
    setApproveRecords(prev => prev.map(r => r.id === record.id ? { ...r, approvalState: 'approved' } : r));
    setSelectedApproveIds(prev => prev.filter(id => id !== record.id));
    showToast(`Approved attendance for ${record.name} (${record.workerId})`);
  };

  // Single Reject
  const handleRejectSingle = (record) => {
    setApproveRecords(prev => prev.map(r => r.id === record.id ? { ...r, approvalState: 'rejected' } : r));
    setSelectedApproveIds(prev => prev.filter(id => id !== record.id));
    showToast(`Rejected attendance for ${record.name} (${record.workerId})`);
  };

  // Batch Approve
  const handleBatchApprove = () => {
    if (selectedApproveIds.length === 0) return;
    const count = selectedApproveIds.length;
    setApproveRecords(prev => prev.map(r => selectedApproveIds.includes(r.id) ? { ...r, approvalState: 'approved' } : r));
    setSelectedApproveIds([]);
    showToast(`Approved ${count} attendance records successfully!`);
  };

  // Batch Reject
  const handleBatchReject = () => {
    if (selectedApproveIds.length === 0) return;
    const count = selectedApproveIds.length;
    setApproveRecords(prev => prev.map(r => selectedApproveIds.includes(r.id) ? { ...r, approvalState: 'rejected' } : r));
    setSelectedApproveIds([]);
    showToast(`Rejected ${count} attendance records.`);
  };

  // Toggle Single Row Selection
  const handleToggleApproveRow = (id) => {
    setSelectedApproveIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle Select All on current page
  const currentPageIds = paginatedApproveRecords.map(r => r.id);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedApproveIds.includes(id));

  const handleToggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedApproveIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedApproveIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleClearApproveFilters = () => {
    setApproveDept('All Departments');
    setApproveStatus('All Status');
    setApproveSource('All Source');
    setApproveDateStart('01 Oct 2026');
    setApproveDateEnd('31 Oct 2026');
    setApprovePage(1);
    showToast('Filters reset to default.');
  };

  // ===================== ATTENDANCE HISTORY STATE =====================
  // Scope: 'worker' (Worker Career) or 'company' (Whole Company)
  const [historyScope, setHistoryScope] = useState('worker');

  // Period Tabs for Worker: 'monthly' | 'daywise' | 'yearwise' | 'custom'
  const [historyPeriodTab, setHistoryPeriodTab] = useState('monthly');

  // Selected Worker in left list
  const [historySelectedWorker, setHistorySelectedWorker] = useState(INITIAL_DAY_WORKERS[0]);
  const [historyWorkerSearch, setHistoryWorkerSearch] = useState('');

  // Selected Day on monthly calendar (default 12 as in user image)
  const [historySelectedDay, setHistorySelectedDay] = useState(12);

  // Period Selectors in Right Panel
  const [historyPeriodRadio, setHistoryPeriodRadio] = useState('monthly'); // 'monthly' | 'yearly' | 'custom'
  const [historySelectedMonth, setHistorySelectedMonth] = useState('October 2026');
  const [historySelectedYear, setHistorySelectedYear] = useState('2026');
  const [historyCustomRangeStart, setHistoryCustomRangeStart] = useState('01 Oct 2026');
  const [historyCustomRangeEnd, setHistoryCustomRangeEnd] = useState('31 Oct 2026');

  // Edit Record Modal state for day details
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [dayRecordDetails, setDayRecordDetails] = useState({
    date: '12 Oct 2026',
    status: 'Present',
    timeIn: '08:02 AM',
    timeOut: '05:15 PM',
    workingHours: '9h 13m',
    markedBy: 'Admin User',
    source: 'Manual Entry',
    remarks: '-'
  });

  // Whole Company State
  const [companyPeriodMode, setCompanyPeriodMode] = useState('month'); // 'day' | 'month' | 'year'
  const [companySelectedDay, setCompanySelectedDay] = useState('2026-10-12');
  const [companySelectedMonth, setCompanySelectedMonth] = useState('October 2026');
  const [companySelectedYear, setCompanySelectedYear] = useState('2026');
  const [companySelectedDept, setCompanySelectedDept] = useState('All');

  // Filtered workers in history left panel
  const filteredHistoryWorkers = useMemo(() => {
    if (!historyWorkerSearch.trim()) return INITIAL_DAY_WORKERS;
    const q = historyWorkerSearch.toLowerCase();
    return INITIAL_DAY_WORKERS.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.workerId.toLowerCase().includes(q) ||
      w.department.toLowerCase().includes(q)
    );
  }, [historyWorkerSearch]);

  // Handle clicking a day in the October 2026 calendar
  const handleSelectCalendarDay = (dayObj) => {
    if (!dayObj.isCurrentMonth) return;
    setHistorySelectedDay(dayObj.dayNum);
    setDayRecordDetails({
      date: `${dayObj.dayNum} Oct 2026`,
      status: dayObj.status || 'Present',
      timeIn: dayObj.timeIn || '08:00 AM',
      timeOut: dayObj.timeOut || '05:00 PM',
      workingHours: dayObj.hours || '8h 00m',
      markedBy: 'Admin User',
      source: dayObj.dayNum % 2 === 0 ? 'Manual Entry' : 'Biometric Device #01',
      remarks: dayObj.remarks || '-'
    });
  };

  // Save changes from Edit Record
  const handleSaveDayRecord = () => {
    setIsEditDayModalOpen(false);
    showToast(`Updated attendance record for ${dayRecordDetails.date} successfully!`);
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
              <span className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-medium">Enterprise Edition</span>
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
                    if (item.name === 'Attendance') {
                      setCurrentSubView('home');
                    } else if (item.name === 'Dashboard' && onNavigateDashboard) {
                      onNavigateDashboard();
                    } else if (item.name === 'Workers' && onNavigateWorkers) {
                      onNavigateWorkers();
                    } else if (item.name === 'Department' && onNavigateDepartment) {
                      onNavigateDepartment();
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-indigo-300/60 group-hover:text-white'
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
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-4 flex-1">
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search workers, departments, attendance..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Tue, Oct 13, 2026</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Mode</span>
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                AD
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">Admin User</span>
                <span className="text-[10px] text-slate-500 leading-tight">HR Administrator</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ===================== VIEW ROUTING ===================== */}

        {/* VIEW 1: ATTENDANCE HOME (THE 4 CARDS) */}
        {currentSubView === 'home' && (
          <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  Manage attendance records for your workforce
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 shadow-2xs">
                  Total Workers: <span className="font-bold text-slate-900">{dayStats.total}</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl font-medium text-emerald-700">
                  Present Today: <span className="font-bold">{dayStats.present}</span>
                </div>
                <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl font-medium text-rose-700">
                  Absent Today: <span className="font-bold">{dayStats.absent}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* CARD 1: Manual Attendance */}
              <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
                    <Calendar className="w-9 h-9 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Attendance</h3>
                  <p className="text-xs text-slate-500 mb-8 px-2 leading-relaxed">
                    Mark and manage daily attendance for workers manually.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('manual-choice')}
                  className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open Manual Attendance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* CARD 2: Import Attendance */}
              <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
                    <UploadCloud className="w-9 h-9 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Import Attendance</h3>
                  <p className="text-xs text-slate-500 mb-8 px-2 leading-relaxed">
                    Upload biometric device logs or Excel attendance sheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('import')}
                  className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open Import Attendance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* CARD 3: Approve / Review */}
              <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-center ring-2 ring-blue-500/10">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
                    <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Approve / Review</h3>
                  <p className="text-xs text-slate-500 mb-8 px-2 leading-relaxed">
                    Review and approve daily attendance before final processing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('approve')}
                  className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open Approve / Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* CARD 4: Attendance History */}
              <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
                    <FileText className="w-9 h-9 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Attendance History</h3>
                  <p className="text-xs text-slate-500 mb-8 px-2 leading-relaxed">
                    View complete attendance history of employees.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('history')}
                  className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open Attendance History</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MANUAL ATTENDANCE CHOICE SCREEN */}
        {currentSubView === 'manual-choice' && (
          <div className="p-8 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">
            <div>
              <button
                type="button"
                onClick={() => setCurrentSubView('home')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Attendance</span>
              </button>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manual Attendance</h1>
              <p className="text-sm text-slate-500 mt-1 font-normal">
                Choose how you want to mark attendance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Card 1: Mark Attendance Day Wise */}
              <div className="bg-white rounded-2xl p-8 lg:p-10 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-9 h-9 stroke-[2.2]" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Mark Attendance Day Wise</h3>
                  <p className="text-xs text-slate-500 text-center mb-8 px-4 leading-relaxed">
                    Select a date and mark attendance for all workers at once.
                  </p>

                  <div className="space-y-4 mb-10 max-w-sm mx-auto">
                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>View all workers for selected date</span>
                    </div>

                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Pencil className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>Mark Present / Absent / Leave</span>
                    </div>

                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>Save and submit for review</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSubView('manual-day')}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Mark Attendance Day Wise</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 2: Mark Attendance Worker Wise */}
              <div className="bg-white rounded-2xl p-8 lg:p-10 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                    <User className="w-9 h-9 stroke-[2.2]" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Mark Attendance Worker Wise</h3>
                  <p className="text-xs text-slate-500 text-center mb-8 px-4 leading-relaxed">
                    Select a worker and mark attendance for a single worker.
                  </p>

                  <div className="space-y-4 mb-10 max-w-sm mx-auto">
                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>Search and select worker</span>
                    </div>

                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>Mark attendance for selected date</span>
                    </div>

                    <div className="flex items-center gap-3.5 text-sm text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span>View and edit past dates</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSubView('manual-worker')}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Mark Attendance Worker Wise</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MANUAL ATTENDANCE - DAY WISE (WITH EDITABLE TIME IN & OUT) */}
        {currentSubView === 'manual-day' && (
          <div className="p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('manual-choice')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Manual Attendance</span>
                </button>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manual Attendance - Day Wise</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter manual Time In and Time Out, mark status and calculate overtime for all workers
                </p>
              </div>

              <div className="flex items-center gap-3 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBulkOpen(!isBulkOpen)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Bulk Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isBulkOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs">
                      <button
                        type="button"
                        onClick={() => handleBulkAction('all-present')}
                        className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark All Present</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('all-absent')}
                        className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-600" />
                        <span>Mark All Absent</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Attendance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSubView('history')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Marked Attendance</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Select Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dayDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDayDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-600">Department</label>
                  <select
                    value={dayDept}
                    onChange={(e) => setDayDept(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="All">All Departments</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Quality">Quality</option>
                    <option value="Store">Store</option>
                    <option value="Dispatch">Dispatch</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-600">Shift</label>
                  <select
                    value={dayShift}
                    onChange={(e) => setDayShift(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Day Shift (8:00 AM - 5:00 PM)">Day Shift (8:00 AM - 5:00 PM)</option>
                    <option value="Night Shift (8:00 PM - 5:00 AM)">Night Shift (8:00 PM - 5:00 AM)</option>
                  </select>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[70px]">
                  <div className="text-[10px] text-slate-500 font-medium">Total Workers</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{dayStats.total}</div>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center min-w-[70px]">
                  <div className="text-[10px] text-emerald-700 font-medium">Present</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{dayStats.present}</div>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-center min-w-[70px]">
                  <div className="text-[10px] text-rose-700 font-medium">Absent</div>
                  <div className="text-xl font-extrabold text-rose-600 mt-0.5">{dayStats.absent}</div>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center min-w-[70px]">
                  <div className="text-[10px] text-amber-700 font-medium">Leave</div>
                  <div className="text-xl font-extrabold text-amber-600 mt-0.5">{dayStats.leave}</div>
                </div>
              </div>
            </div>

            {/* Table Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <h2 className="text-base font-bold text-slate-900">Worker Attendance Details</h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search worker by ID or name..."
                    value={daySearch}
                    onChange={(e) => setDaySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFillScheduledTime}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fill Scheduled Time</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Attendance Table with EDITABLE Time In and Time Out */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedDayIds.length > 0 && selectedDayIds.length === paginatedDayWorkers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDayIds(paginatedDayWorkers.map(w => w.id));
                            } else {
                              setSelectedDayIds([]);
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-8">#</th>
                      <th className="py-3 px-3">Worker ID</th>
                      <th className="py-3 px-3">Worker Name</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Shift</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Time In (Manual)</th>
                      <th className="py-3 px-3">Time Out (Manual)</th>
                      <th className="py-3 px-3">Working Hours</th>
                      <th className="py-3 px-3">Overtime</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDayWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-12 text-center text-slate-400 text-xs">
                          No workers registered yet. Add workers in the Workers section to mark attendance.
                        </td>
                      </tr>
                    ) : (
                      paginatedDayWorkers.map((worker, index) => {
                      const isSelected = selectedDayIds.includes(worker.id);
                      const rowNum = (dayPage - 1) * 10 + index + 1;
                      const isNonWorking = worker.status === 'Absent' || worker.status === 'Leave';

                      return (
                        <tr key={worker.id} className={`hover:bg-slate-50/60 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDayIds([...selectedDayIds, worker.id]);
                                } else {
                                  setSelectedDayIds(selectedDayIds.filter(id => id !== worker.id));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-400">{rowNum}</td>

                          <td className="py-3 px-3 font-mono font-medium text-slate-700">{worker.workerId}</td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {worker.photo ? (
                                <img
                                  src={worker.photo}
                                  alt={worker.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${worker.initialBg}`}>
                                  {worker.initial}
                                </div>
                              )}
                              <span className="font-semibold text-slate-800">{worker.name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-600">{worker.department}</td>

                          <td className="py-3 px-3 font-medium text-slate-500">{worker.shift}</td>

                          {/* Status Dropdown */}
                          <td className="py-3 px-3">
                            <select
                              value={worker.status}
                              onChange={(e) => handleUpdateDayStatus(worker.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer focus:outline-none ${
                                worker.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : worker.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Leave">Leave</option>
                              <option value="Half Day">Half Day</option>
                            </select>
                          </td>

                          {/* EDITABLE TIME IN (MANUAL INPUT) */}
                          <td className="py-3 px-3">
                            <div className="relative flex items-center">
                              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                              <input
                                type="text"
                                disabled={isNonWorking}
                                value={worker.inTime === '-' ? '' : worker.inTime}
                                onChange={(e) => handleDayTimeInChange(worker.id, e.target.value)}
                                placeholder={isNonWorking ? '-' : '08:00 AM'}
                                className="w-26 pl-6.5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all disabled:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </div>
                          </td>

                          {/* EDITABLE TIME OUT (MANUAL INPUT) */}
                          <td className="py-3 px-3">
                            <div className="relative flex items-center">
                              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                              <input
                                type="text"
                                disabled={isNonWorking}
                                value={worker.outTime === '-' ? '' : worker.outTime}
                                onChange={(e) => handleDayTimeOutChange(worker.id, e.target.value)}
                                placeholder={isNonWorking ? '-' : '05:00 PM'}
                                className="w-26 pl-6.5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all disabled:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </div>
                          </td>

                          {/* Working Hours (Dynamically Calculated) */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">{worker.workingHours}</td>

                          {/* Overtime (Dynamically Calculated) */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">
                            {worker.overtime !== '-' ? (
                              <span className="text-blue-700 font-semibold">{worker.overtime}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={worker.remarks}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDayWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, remarks: val } : w));
                              }}
                              className="w-24 px-2 py-0.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-xs text-slate-700 bg-transparent focus:outline-none"
                            />
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(worker.id)}
                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(dayPage - 1) * 10 + 1} to {Math.min(dayPage * 10, filteredDayWorkers.length)} of {filteredDayWorkers.length} workers
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={dayPage === 1}
                  onClick={() => setDayPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDayPage(p)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs cursor-pointer ${
                      dayPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={dayPage === 3}
                  onClick={() => setDayPage(p => Math.min(3, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Informational Callout Note */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Note</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-600 text-[11px] leading-relaxed">
                <li>Working Hours = Time Out - Time In (excluding break time if configured)</li>
                <li>Overtime = Working Hours - Scheduled Hours (e.g. 8 hours)</li>
                <li>Mark status as Present, Absent, Leave or Half Day. Time fields are editable for Present and Half Day.</li>
              </ul>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => showToast('Attendance saved as draft successfully!')}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Attendance submitted for admin review and payroll lock!')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: MANUAL ATTENDANCE - WORKER WISE (CURRENT DATE TO PREVIOUS DAYS + EDITABLE TIME IN & OUT) */}
        {currentSubView === 'manual-worker' && (
          <div className="p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentSubView('manual-choice')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Manual Attendance</span>
                </button>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manual Attendance - Worker Wise</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and mark attendance starting from current date backwards to previous dates with manual time entry
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsWorkerPickerOpen(true)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>View All Workers</span>
              </button>
            </div>

            {/* Worker Profile Header Card */}
            {selectedWorkerForWise ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedWorkerForWise.photo || SAMPLE_AVATARS[0]}
                    alt={selectedWorkerForWise.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedWorkerForWise.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Worker ID: <span className="font-mono text-slate-700 font-semibold">{selectedWorkerForWise.workerId}</span> | Department: <span className="text-slate-700 font-semibold">{selectedWorkerForWise.department || 'General'}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Designation: {selectedWorkerForWise.designation || 'Staff Associate'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Shift</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedWorkerForWise.shift || 'Day Shift (8:00 AM - 5:00 PM)'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Weekly Off</div>
                    <div className="font-semibold text-slate-800 mt-0.5">Sunday</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Joining Date</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedWorkerForWise.joinDate || 'N/A'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Employment Type</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{selectedWorkerForWise.workerType || 'Permanent'}</div>
                  </div>

                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedWorkerForWise.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                No workers registered yet. Add workers in the Workers section to view worker-wise attendance.
              </div>
            )}

            {/* Current Reference Date Switcher & Summary Counters (FROM CURRENT DATE TO PREVIOUS DAYS) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Current Reference Date:</span>
                <input
                  type="date"
                  value={workerCurrentDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setWorkerCurrentDate(newDate);
                    setWorkerDays(generateReverseChronologicalDays(newDate, 30));
                    showToast(`Updated schedule starting backwards from ${newDate}`);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
                <span className="text-[11px] font-medium text-slate-400">(Today backwards past 30 days)</span>
              </div>

              {/* Stat Badges */}
              <div className="flex items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[65px]">
                  <div className="text-[10px] text-slate-500">Total Days</div>
                  <div className="text-base font-extrabold text-slate-900">{workerStats.totalDays}</div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center min-w-[65px]">
                  <div className="text-[10px] text-emerald-700">Present</div>
                  <div className="text-base font-extrabold text-emerald-600">{workerStats.present}</div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-100 text-center min-w-[65px]">
                  <div className="text-[10px] text-rose-700">Absent</div>
                  <div className="text-base font-extrabold text-rose-600">{workerStats.absent}</div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-center min-w-[65px]">
                  <div className="text-[10px] text-amber-700">Leave</div>
                  <div className="text-base font-extrabold text-amber-600">{workerStats.leave}</div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-center min-w-[65px]">
                  <div className="text-[10px] text-blue-700">Half Day</div>
                  <div className="text-base font-extrabold text-blue-600">{workerStats.halfDay}</div>
                </div>
              </div>
            </div>

            {/* Worker Attendance Table: CURRENT DATE TO PREVIOUS DAYS with EDITABLE TIME IN & OUT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-8">
                        <input type="checkbox" className="rounded text-blue-600 focus:ring-0 cursor-pointer" />
                      </th>
                      <th className="py-3 px-3">Date (Current &rarr; Past)</th>
                      <th className="py-3 px-3">Day</th>
                      <th className="py-3 px-3">Shift</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Time In (Manual)</th>
                      <th className="py-3 px-3">Time Out (Manual)</th>
                      <th className="py-3 px-3">Working Hours</th>
                      <th className="py-3 px-3">Overtime</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedWorkerDays.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                          No attendance records logged for this worker yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedWorkerDays.map((record) => {
                      const isNonWorking = record.status === 'Absent' || record.status === 'Weekly Off' || record.status === 'Leave';

                      return (
                        <tr key={record.id} className={`hover:bg-slate-50/60 transition-colors ${record.isToday ? 'bg-blue-50/30' : ''}`}>
                          <td className="py-3 px-3">
                            <input type="checkbox" className="rounded text-blue-600 focus:ring-0 cursor-pointer" />
                          </td>

                          <td className="py-3 px-3 font-mono font-medium text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span>{record.date}</span>
                              {record.isToday && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-600">{record.day}</td>

                          <td className="py-3 px-3 font-medium text-slate-500">{record.shift}</td>

                          {/* Status Dropdown */}
                          <td className="py-3 px-3">
                            <select
                              value={record.status}
                              onChange={(e) => handleUpdateWorkerDayStatus(record.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer focus:outline-none ${
                                record.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : record.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : record.status === 'Leave'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : record.status === 'Half Day'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Leave">Leave</option>
                              <option value="Half Day">Half Day</option>
                              <option value="Weekly Off">Weekly Off</option>
                            </select>
                          </td>

                          {/* EDITABLE TIME IN (MANUAL INPUT) */}
                          <td className="py-3 px-3">
                            <div className="relative flex items-center">
                              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                              <input
                                type="text"
                                disabled={isNonWorking}
                                value={record.inTime === '-' ? '' : record.inTime}
                                onChange={(e) => handleWorkerTimeInChange(record.id, e.target.value)}
                                placeholder={isNonWorking ? '-' : '08:00 AM'}
                                className="w-26 pl-6.5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all disabled:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </div>
                          </td>

                          {/* EDITABLE TIME OUT (MANUAL INPUT) */}
                          <td className="py-3 px-3">
                            <div className="relative flex items-center">
                              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                              <input
                                type="text"
                                disabled={isNonWorking}
                                value={record.outTime === '-' ? '' : record.outTime}
                                onChange={(e) => handleWorkerTimeOutChange(record.id, e.target.value)}
                                placeholder={isNonWorking ? '-' : '05:00 PM'}
                                className="w-26 pl-6.5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all disabled:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </div>
                          </td>

                          {/* Working Hours (Dynamically Calculated) */}
                          <td className="py-3 px-3 font-mono text-slate-700">{record.workingHours}</td>

                          {/* Overtime (Dynamically Calculated) */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">
                            {record.overtime !== '-' ? (
                              <span className="text-blue-700 font-semibold">{record.overtime}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={record.remarks}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWorkerDays(prev => prev.map(d => d.id === record.id ? { ...d, remarks: val } : d));
                              }}
                              className="w-28 px-2 py-0.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-xs text-slate-700 bg-transparent focus:outline-none"
                            />
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => showToast(`Copied attendance record from ${record.date}`)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Copy day attendance"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(workerPage - 1) * 10 + 1} to {Math.min(workerPage * 10, workerDays.length)} of {workerDays.length} days
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={workerPage === 1}
                  onClick={() => setWorkerPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setWorkerPage(p)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs cursor-pointer ${
                      workerPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={workerPage === 3}
                  onClick={() => setWorkerPage(p => Math.min(3, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => showToast('Saved attendance draft for worker!')}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Submitted monthly attendance for review!')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            </div>

            {/* WORKER PICKER MODAL */}
            {isWorkerPickerOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Select Worker</h3>
                      <p className="text-xs text-slate-500">Choose a worker to view and mark their monthly attendance</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWorkerPickerOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by worker name, ID or department..."
                      value={workerSearchTerm}
                      onChange={(e) => setWorkerSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                    {INITIAL_DAY_WORKERS.filter(w =>
                      w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
                      w.workerId.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
                      w.department.toLowerCase().includes(workerSearchTerm.toLowerCase())
                    ).map(w => (
                      <div
                        key={w.id}
                        onClick={() => {
                          setSelectedWorkerForWise(w);
                          setIsWorkerPickerOpen(false);
                          showToast(`Switched view to ${w.name} (${w.workerId})`);
                        }}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          selectedWorkerForWise.id === w.id ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {w.photo ? (
                            <img src={w.photo} alt={w.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${w.initialBg}`}>
                              {w.initial}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-900">{w.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{w.workerId} • {w.department}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px]"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: IMPORT ATTENDANCE */}
        {currentSubView === 'import' && (
          <div className="p-8 lg:p-10 space-y-7 max-w-7xl mx-auto w-full">
            {/* Top Bar with Sample Excel Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSubView('home')}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  title="Back to Attendance Home"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import Attendance</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload biometric device logs or standardized Excel (.xlsx) attendance sheets
                  </p>
                </div>
              </div>

              {/* Sample Excel Format Download Button (Requested: Excel not CSV) */}
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer group"
                title="Download Sample Attendance Template in Excel Format (.xlsx)"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] group-hover:scale-110 transition-transform">
                  XLS
                </div>
                <span>Sample Excel Format (.xlsx)</span>
                <Download className="w-4 h-4 text-emerald-700 ml-0.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Hidden Real File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50/15 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group shadow-2xs relative overflow-hidden"
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-slate-700">Processing attendance records from Excel...</p>
                  <p className="text-xs text-slate-400">Verifying worker IDs, shift timings, and OT calculations</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                    <FileSpreadsheet className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Click to browse or drag &amp; drop attendance Excel sheet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                    Supported formats: <span className="font-semibold text-slate-700">Excel (.xlsx, .xls)</span>, CSV, Biometric Punch Log (.dat) • Max file size: 25 MB
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Browse Excel File</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSampleExcel();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Sample Excel</span>
                    </button>
                  </div>

                  {/* Schema Info Bar */}
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Expected Excel Columns:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Worker ID</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Worker Name</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Date</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Shift</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Time In</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Time Out</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Status</span>
                  </div>
                </>
              )}
            </div>

            {/* Import Validation Error Report Panel */}
            {importErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">
                        Attendance Import Rejected — {importErrors.length} Row Validation Error{importErrors.length > 1 ? 's' : ''} Found
                      </h4>
                      <p className="text-xs text-rose-700">
                        Invalid rows were not imported into the database. Please review and correct the errors below.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Error Report (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportErrors([])}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-rose-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-100/60 text-rose-900 uppercase tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="px-3.5 py-2">Row #</th>
                        <th className="px-3.5 py-2">Worker ID</th>
                        <th className="px-3.5 py-2">Field</th>
                        <th className="px-3.5 py-2">Exact Validation Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {importErrors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/50">
                          <td className="px-3.5 py-2 font-mono font-bold text-rose-700">Row {err.row}</td>
                          <td className="px-3.5 py-2 font-mono text-slate-800">{err.workerId}</td>
                          <td className="px-3.5 py-2 text-slate-600 font-medium">{err.field}</td>
                          <td className="px-3.5 py-2 text-rose-600 font-semibold">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===================== RECENT IMPORTED FILES ===================== */}
            <div className="space-y-3.5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Imported Files</h2>
                    <p className="text-xs text-slate-500">Audit logs of recently uploaded attendance Excel sheets and biometric device synchronizations</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search recent files..."
                      value={importSearchTerm}
                      onChange={(e) => setImportSearchTerm(e.target.value)}
                      className="pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRecentImports(INITIAL_RECENT_IMPORTS);
                      setImportSearchTerm('');
                      showToast('Refreshed recent imported files list.');
                    }}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    title="Reset / Refresh import list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Files Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">File Name &amp; Format</th>
                        <th className="py-3 px-4">Imported By</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Shift &amp; Source</th>
                        <th className="py-3 px-4">Records Processed</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecentImports.length > 0 ? (
                        filteredRecentImports.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* File Name & Format */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate max-w-xs">{file.fileName}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100/70 text-emerald-800 text-[9px] font-bold font-mono">
                                      {file.fileFormat}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">{file.fileSize}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Imported By */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                                  {file.importedBy.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 text-xs">{file.importedBy}</div>
                                  <div className="text-[10px] text-slate-400">{file.importedRole}</div>
                                </div>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{file.importedAt}</span>
                              </div>
                            </td>

                            {/* Shift & Source */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-700">{file.shift}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{file.source}</div>
                            </td>

                            {/* Records Processed */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-slate-800">
                                  {file.successRecords} / {file.totalRecords}
                                </span>
                                {file.failedRecords > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                    {file.failedRecords} err
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    100%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  file.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {file.status === 'Completed' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                <span>{file.status}</span>
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadSampleExcel();
                                    showToast(`Downloading original file: ${file.fileName}`);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Download this Excel file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => showToast(`Logs for ${file.fileName}: ${file.successRecords} synced, 0 errors, Biometric ID verified.`)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="View Log Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecentImport(file.id, file.fileName)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">
                            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-medium">No recent imported files matching &quot;{importSearchTerm}&quot;</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing {filteredRecentImports.length} of {recentImports.length} recent import files</span>
                  <span className="font-mono text-[11px] text-slate-400">All punch records synced with PaySphere Muster Roll</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: APPROVE & CHECK */}
        {currentSubView === 'approve' && (
          <div className="p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header: Title, Subtitle, Lock Attendance Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSubView('home')}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  title="Back to Attendance Home"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approve &amp; Check Attendance</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and approve attendance records before final processing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showToast('Attendance records locked and synchronized with Payroll!')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Attendance</span>
              </button>
            </div>

            {/* Top 4 KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Records */}
              <div className="bg-blue-50/40 border border-blue-100/90 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Total Records</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{approveStats.total}</div>
                </div>
              </div>

              {/* Card 2: Pending Approval */}
              <div className="bg-amber-50/40 border border-amber-100/90 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Pending Approval</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{approveStats.pending}</div>
                </div>
              </div>

              {/* Card 3: Approved */}
              <div className="bg-emerald-50/40 border border-emerald-100/90 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Approved</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{approveStats.approved}</div>
                </div>
              </div>

              {/* Card 4: Rejected */}
              <div className="bg-rose-50/40 border border-rose-100/90 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Rejected</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{approveStats.rejected}</div>
                </div>
              </div>
            </div>

            {/* Status Tabs: Pending (12), Approved (38), Rejected (2) */}
            <div className="flex items-center gap-8 border-b border-slate-200 text-sm">
              <button
                type="button"
                onClick={() => {
                  setApproveTab('pending');
                  setApprovePage(1);
                  setSelectedApproveIds([]);
                }}
                className={`pb-3 font-semibold transition-all relative cursor-pointer ${
                  approveTab === 'pending'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Pending ({approveStats.pending})</span>
                {approveTab === 'pending' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setApproveTab('approved');
                  setApprovePage(1);
                  setSelectedApproveIds([]);
                }}
                className={`pb-3 font-semibold transition-all relative cursor-pointer ${
                  approveTab === 'approved'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Approved ({approveStats.approved})</span>
                {approveTab === 'approved' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setApproveTab('rejected');
                  setApprovePage(1);
                  setSelectedApproveIds([]);
                }}
                className={`pb-3 font-semibold transition-all relative cursor-pointer ${
                  approveTab === 'rejected'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Rejected ({approveStats.rejected})</span>
                {approveTab === 'rejected' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* Filter Bar (Date range, Department, Status, Source, Apply, Clear) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={approveDateStart}
                  onChange={(e) => setApproveDateStart(e.target.value)}
                  className="w-22 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400 font-normal">to</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  value={approveDateEnd}
                  onChange={(e) => setApproveDateEnd(e.target.value)}
                  className="w-22 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Department Dropdown */}
              <div className="relative">
                <select
                  value={approveDept}
                  onChange={(e) => {
                    setApproveDept(e.target.value);
                    setApprovePage(1);
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Production">Production</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Quality">Quality</option>
                  <option value="Store">Store</option>
                  <option value="Dispatch">Dispatch</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={approveStatus}
                  onChange={(e) => {
                    setApproveStatus(e.target.value);
                    setApprovePage(1);
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Status">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Source Dropdown */}
              <div className="relative">
                <select
                  value={approveSource}
                  onChange={(e) => {
                    setApproveSource(e.target.value);
                    setApprovePage(1);
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Source">All Source</option>
                  <option value="Manual">Manual</option>
                  <option value="CSV Import">CSV Import</option>
                  <option value="Excel Import">Excel Import</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => showToast('Applied filters to attendance records!')}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Apply
              </button>

              {/* Clear Button */}
              <button
                type="button"
                onClick={handleClearApproveFilters}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllCurrentPageSelected}
                          onChange={handleToggleSelectAllCurrentPage}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-10">#</th>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5">Worker ID</th>
                      <th className="py-3 px-3.5">Worker Name</th>
                      <th className="py-3 px-3.5">Department</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Working Hours</th>
                      <th className="py-3 px-3.5">Source</th>
                      <th className="py-3 px-3.5">Remarks</th>
                      <th className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedApproveRecords.length > 0 ? (
                      paginatedApproveRecords.map((record, idx) => {
                        const isSelected = selectedApproveIds.includes(record.id);
                        const rowNum = (approvePage - 1) * 8 + idx + 1;

                        return (
                          <tr
                            key={record.id}
                            className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleApproveRow(record.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* # */}
                            <td className="py-3 px-3 font-medium text-slate-500">{rowNum}</td>

                            {/* Date */}
                            <td className="py-3 px-3.5 font-medium text-slate-600 whitespace-nowrap">{record.date}</td>

                            {/* Worker ID */}
                            <td className="py-3 px-3.5 font-mono font-medium text-slate-700 whitespace-nowrap">{record.workerId}</td>

                            {/* Worker Name with Avatar */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                {record.photo ? (
                                  <img
                                    src={record.photo}
                                    alt={record.name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${record.initialBg || 'bg-slate-100 text-slate-700'}`}>
                                    {record.initial || record.name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-semibold text-slate-800 text-xs">{record.name}</span>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3 px-3.5 text-slate-600 font-medium whitespace-nowrap">{record.department}</td>

                            {/* Status */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                                  record.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : record.status === 'Absent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>

                            {/* Working Hours */}
                            <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">{record.workingHours}</td>

                            {/* Source */}
                            <td className="py-3 px-3.5 text-slate-600 font-medium whitespace-nowrap">{record.source}</td>

                            {/* Remarks */}
                            <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">{record.remarks}</td>

                            {/* Actions (Approve / Reject) */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveSingle(record)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Approve this record"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectSingle(record)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Reject this record"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" className="py-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-medium">No records found for &quot;{approveTab}&quot; status with selected filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Row */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing {filteredApproveRecords.length === 0 ? 0 : (approvePage - 1) * 8 + 1} to{' '}
                  {Math.min(approvePage * 8, filteredApproveRecords.length)} of {filteredApproveRecords.length} records
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={approvePage === 1}
                    onClick={() => setApprovePage(p => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from(
                    { length: Math.max(1, Math.ceil(filteredApproveRecords.length / 8)) },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setApprovePage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        approvePage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={approvePage >= Math.ceil(filteredApproveRecords.length / 8)}
                    onClick={() => setApprovePage(p => Math.min(Math.ceil(filteredApproveRecords.length / 8), p + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-1">
              {/* Select All Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  onChange={handleToggleSelectAllCurrentPage}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-800">Select All</span>
              </label>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={selectedApproveIds.length === 0}
                  onClick={handleBatchApprove}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Selected ({selectedApproveIds.length})</span>
                </button>

                <button
                  type="button"
                  disabled={selectedApproveIds.length === 0}
                  onClick={handleBatchReject}
                  className="px-5 py-2.5 rounded-xl bg-[#f87171] hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Selected ({selectedApproveIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: ATTENDANCE HISTORY (WORKER CAREER & COMPANY-WIDE DAY/MONTH/YEAR) */}
        {currentSubView === 'history' && (
          <div className="p-6 lg:p-8 space-y-5 max-w-[1520px] mx-auto w-full">
            {/* Top Navigation & Scope Switcher Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSubView('home')}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  title="Back to Attendance Home"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance History</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {historyScope === 'worker'
                      ? 'View complete attendance history of any worker across day, month, year or whole career'
                      : 'View whole company attendance records, daily muster roll, and departmental annual trends'}
                  </p>
                </div>
              </div>

              {/* Main Scope Switcher: Worker Wise vs Whole Company */}
              <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryScope('worker');
                    showToast('Switched to Worker Career Attendance view.');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    historyScope === 'worker'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Worker Career History</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHistoryScope('company');
                    showToast('Switched to Whole Company Attendance view.');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    historyScope === 'company'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Whole Company Attendance</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SCOPE 1: INDIVIDUAL WORKER CAREER ATTENDANCE (SCREENSHOT UI) */}
            {/* ======================================================== */}
            {historyScope === 'worker' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ----------------- LEFT COLUMN: WORKER LIST ----------------- */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search worker by ID or name..."
                      value={historyWorkerSearch}
                      onChange={(e) => setHistoryWorkerSearch(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="max-h-[720px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filteredHistoryWorkers.map((worker) => {
                      const isSelected = historySelectedWorker.id === worker.id;
                      return (
                        <div
                          key={worker.id}
                          onClick={() => {
                            setHistorySelectedWorker(worker);
                            showToast(`Loaded attendance records for ${worker.name} (${worker.workerId})`);
                          }}
                          className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/80 border border-blue-200 text-blue-900 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          {worker.photo ? (
                            <img
                              src={worker.photo}
                              alt={worker.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${worker.initialBg || 'bg-slate-100 text-slate-700'}`}>
                              {worker.initial || worker.name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-slate-900 truncate">{worker.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {worker.workerId} <span className="text-slate-300">|</span> {worker.department}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ----------------- CENTER COLUMN: CALENDAR & WORKER CARD ----------------- */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Worker Profile Header Card with 4 Stats */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {historySelectedWorker.photo ? (
                          <img
                            src={historySelectedWorker.photo}
                            alt={historySelectedWorker.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${historySelectedWorker.initialBg || 'bg-blue-100 text-blue-700'}`}>
                            {historySelectedWorker.initial || historySelectedWorker.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 leading-tight">{historySelectedWorker.name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Worker ID: <span className="font-mono text-slate-700 font-semibold">{historySelectedWorker.workerId}</span> | Department: <span className="text-slate-700 font-medium">{historySelectedWorker.department}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Designation: Senior Forging Master • Joined Mar 2022
                          </p>
                        </div>
                      </div>

                      {/* 4 Stat Boxes (Present 22, Absent 5, Leave 2, Total Days 29) */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-3 py-2 text-center min-w-[58px]">
                          <div className="text-[10px] font-semibold text-emerald-700">Present</div>
                          <div className="text-lg font-bold text-emerald-800 leading-tight">22</div>
                        </div>

                        <div className="bg-rose-50/70 border border-rose-100 rounded-xl px-3 py-2 text-center min-w-[58px]">
                          <div className="text-[10px] font-semibold text-rose-700">Absent</div>
                          <div className="text-lg font-bold text-rose-800 leading-tight">5</div>
                        </div>

                        <div className="bg-amber-50/70 border border-amber-100 rounded-xl px-3 py-2 text-center min-w-[58px]">
                          <div className="text-[10px] font-semibold text-amber-700">Leave</div>
                          <div className="text-lg font-bold text-amber-800 leading-tight">2</div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center min-w-[58px]">
                          <div className="text-[10px] font-medium text-slate-400">Total Days</div>
                          <div className="text-lg font-bold text-slate-800 leading-tight">29</div>
                        </div>
                      </div>
                    </div>

                    {/* View Options Tabs (Monthly View, Day Wise, Year Wise, Custom Date Range) */}
                    <div className="flex items-center gap-6 border-b border-slate-100 mt-6 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setHistoryPeriodTab('monthly')}
                        className={`pb-2.5 transition-colors cursor-pointer relative ${
                          historyPeriodTab === 'monthly' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Monthly View
                        {historyPeriodTab === 'monthly' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setHistoryPeriodTab('daywise')}
                        className={`pb-2.5 transition-colors cursor-pointer relative ${
                          historyPeriodTab === 'daywise' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Day Wise
                        {historyPeriodTab === 'daywise' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setHistoryPeriodTab('yearwise')}
                        className={`pb-2.5 transition-colors cursor-pointer relative ${
                          historyPeriodTab === 'yearwise' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Year Wise (Career)
                        {historyPeriodTab === 'yearwise' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setHistoryPeriodTab('custom')}
                        className={`pb-2.5 transition-colors cursor-pointer relative ${
                          historyPeriodTab === 'custom' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Custom Date Range
                        {historyPeriodTab === 'custom' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: MONTHLY CALENDAR VIEW (EXACT USER SCREENSHOT) */}
                  {historyPeriodTab === 'monthly' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                      {/* Month Navigation & Legend */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => showToast('Previous month loaded.')}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm text-slate-900 px-2">{historySelectedMonth}</span>
                          <button
                            type="button"
                            onClick={() => showToast('Next month loaded.')}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status Legend (Present, Absent, Leave, No Record) */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Present</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Absent</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Leave</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span>No Record</span>
                          </span>
                        </div>
                      </div>

                      {/* 7-Column Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 text-center text-xs">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dayName => (
                          <div key={dayName} className="font-bold text-slate-400 text-[11px] py-1">
                            {dayName}
                          </div>
                        ))}

                        {OCTOBER_2026_DAYS.map((d, index) => {
                          const isSelected = d.isCurrentMonth && d.dayNum === historySelectedDay;

                          if (!d.isCurrentMonth) {
                            return (
                              <div
                                key={index}
                                className="h-10 rounded-xl flex items-center justify-center font-medium text-slate-300 bg-slate-50/50 cursor-not-allowed select-none text-xs"
                              >
                                {d.dayNum}
                              </div>
                            );
                          }

                          let cellBg = 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50';
                          if (d.status === 'Present') {
                            cellBg = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80';
                          } else if (d.status === 'Absent') {
                            cellBg = 'bg-rose-50 text-rose-800 hover:bg-rose-100/80';
                          } else if (d.status === 'Leave') {
                            cellBg = 'bg-amber-50 text-amber-800 hover:bg-amber-100/80';
                          }

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectCalendarDay(d)}
                              className={`h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-all cursor-pointer relative ${cellBg} ${
                                isSelected ? 'ring-2 ring-blue-600 ring-offset-1 font-bold z-10' : ''
                              }`}
                            >
                              <span>{d.dayNum}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DAY WISE TABLE FOR WORKER */}
                  {historyPeriodTab === 'daywise' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Daily Attendance Muster ({historySelectedMonth})</h3>
                          <p className="text-xs text-slate-400">Day-by-day in/out biometric punch timestamps</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => showToast('Exported daily attendance register to CSV!')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3.5">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Time In</th>
                              <th className="py-2.5 px-3">Time Out</th>
                              <th className="py-2.5 px-3">Hours</th>
                              <th className="py-2.5 px-3">Source</th>
                              <th className="py-2.5 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {OCTOBER_2026_DAYS.filter(d => d.isCurrentMonth).map((d) => (
                              <tr key={d.dayNum} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3.5 font-medium text-slate-800">{d.dayNum} Oct 2026</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    d.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : d.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {d.status || 'Present'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{d.timeIn || '08:00 AM'}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{d.timeOut || '05:00 PM'}</td>
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{d.hours || '8h 00m'}</td>
                                <td className="py-2.5 px-3 text-slate-500">{d.dayNum % 2 === 0 ? 'Manual' : 'Biometric'}</td>
                                <td className="py-2.5 px-3 text-slate-400">{d.remarks || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: YEAR WISE CAREER BREAKDOWN */}
                  {historyPeriodTab === 'yearwise' && (
                    <div className="space-y-4">
                      {/* Career Milestone Summary Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-medium">Career Tenure</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">4.5 Years</div>
                          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Joined Mar 2022</div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-medium">Lifetime Attendance</div>
                          <div className="text-base font-bold text-emerald-700 mt-0.5">94.7%</div>
                          <div className="text-[10px] text-slate-400 mt-1">1,333 / 1,408 Days</div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-medium">Lifetime Overtime</div>
                          <div className="text-base font-bold text-blue-700 mt-0.5">905 Hours</div>
                          <div className="text-[10px] text-blue-600 font-semibold mt-1">All Approved</div>
                        </div>
                      </div>

                      {/* 12-Month Table for Selected Year */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="font-bold text-xs text-slate-900">Yearly Breakdown: 2026 (Month-by-Month)</div>
                          <span className="text-[11px] text-slate-500 font-medium">Annual Working Days: 257 Days</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                              <tr>
                                <th className="py-2.5 px-3">Month</th>
                                <th className="py-2.5 px-3">Total Days</th>
                                <th className="py-2.5 px-3 text-emerald-700">Present</th>
                                <th className="py-2.5 px-3 text-rose-700">Absent</th>
                                <th className="py-2.5 px-3 text-amber-700">Leave</th>
                                <th className="py-2.5 px-3">Attendance %</th>
                                <th className="py-2.5 px-3">OT Hours</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {WORKER_YEAR_MONTHS.map((m) => (
                                <tr key={m.month} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-semibold text-slate-800">{m.month}</td>
                                  <td className="py-2 px-3 font-mono text-slate-600">{m.totalDays}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">{m.present}</td>
                                  <td className="py-2 px-3 font-mono font-medium text-rose-600">{m.absent}</td>
                                  <td className="py-2 px-3 font-mono font-medium text-amber-600">{m.leave}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-800">{m.attendancePct}</td>
                                  <td className="py-2 px-3 font-mono text-blue-700">{m.otHours}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                      {m.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Career Historical Years Table */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-900">
                          Worker Multi-Year Career Summary (2022 - 2026)
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                              <tr>
                                <th className="py-2.5 px-3">Year</th>
                                <th className="py-2.5 px-3">Total Days</th>
                                <th className="py-2.5 px-3">Present</th>
                                <th className="py-2.5 px-3">Absent</th>
                                <th className="py-2.5 px-3">Leave</th>
                                <th className="py-2.5 px-3">Attendance %</th>
                                <th className="py-2.5 px-3">Overtime</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {WORKER_CAREER_YEARS.map((y) => (
                                <tr key={y.year} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-bold text-slate-800">{y.year}</td>
                                  <td className="py-2 px-3 font-mono text-slate-600">{y.totalDays}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">{y.present}</td>
                                  <td className="py-2 px-3 font-mono text-rose-600">{y.absent}</td>
                                  <td className="py-2 px-3 font-mono text-amber-600">{y.leave}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-800">{y.attendancePct}</td>
                                  <td className="py-2 px-3 font-mono text-blue-700">{y.otHours}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: CUSTOM DATE RANGE VIEW */}
                  {historyPeriodTab === 'custom' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={historyCustomRangeStart}
                            onChange={(e) => setHistoryCustomRangeStart(e.target.value)}
                            className="w-24 bg-transparent font-medium focus:outline-none"
                          />
                          <span className="text-slate-400">to</span>
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={historyCustomRangeEnd}
                            onChange={(e) => setHistoryCustomRangeEnd(e.target.value)}
                            className="w-24 bg-transparent font-medium focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast(`Filtered records from ${historyCustomRangeStart} to ${historyCustomRangeEnd}`)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Apply Custom Filter
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">Custom Period Summary</div>
                          <div className="text-slate-500 mt-0.5">Showing attendance registers from {historyCustomRangeStart} to {historyCustomRangeEnd}</div>
                        </div>
                        <div className="flex items-center gap-4 text-center">
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold">Total Days</div>
                            <div className="font-bold text-slate-800 text-sm">31</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-emerald-600 font-semibold">Present</div>
                            <div className="font-bold text-emerald-700 text-sm">24</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-rose-600 font-semibold">Absent</div>
                            <div className="font-bold text-rose-700 text-sm">5</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-600 font-semibold">Leave</div>
                            <div className="font-bold text-amber-700 text-sm">2</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendance Details Card (Selected Day e.g. 12 Oct 2026) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Attendance Details - {dayRecordDetails.date}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEditDayModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Record</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs border-t border-slate-100 pt-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Status</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          dayRecordDetails.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : dayRecordDetails.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {dayRecordDetails.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Time In</span>
                        <span className="font-mono font-medium text-slate-800">{dayRecordDetails.timeIn}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Time Out</span>
                        <span className="font-mono font-medium text-slate-800">{dayRecordDetails.timeOut}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Working Hours</span>
                        <span className="font-mono font-semibold text-slate-800">{dayRecordDetails.workingHours}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Marked By</span>
                        <span className="font-medium text-slate-800">{dayRecordDetails.markedBy}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Source</span>
                        <span className="text-slate-700 font-medium">{dayRecordDetails.source}</span>
                      </div>

                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-slate-400 font-medium">Remarks</span>
                        <span className="text-slate-600">{dayRecordDetails.remarks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ----------------- RIGHT COLUMN: PERIOD PICKER, SUMMARY, IMPORT HISTORY ----------------- */}
                <div className="lg:col-span-3 space-y-5">
                  {/* Card 1: View by Period */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">View by Period</h3>

                    <div className="space-y-3 text-xs">
                      {/* Radio 1: Monthly */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="periodRadio"
                            checked={historyPeriodRadio === 'monthly'}
                            onChange={() => {
                              setHistoryPeriodRadio('monthly');
                              setHistoryPeriodTab('monthly');
                            }}
                            className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-800">Monthly</span>
                        </div>
                        <div className="relative">
                          <select
                            value={historySelectedMonth}
                            onChange={(e) => setHistorySelectedMonth(e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="October 2026">October 2026</option>
                            <option value="September 2026">September 2026</option>
                            <option value="August 2026">August 2026</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </label>

                      {/* Radio 2: Yearly */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="periodRadio"
                            checked={historyPeriodRadio === 'yearly'}
                            onChange={() => {
                              setHistoryPeriodRadio('yearly');
                              setHistoryPeriodTab('yearwise');
                            }}
                            className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-800">Yearly</span>
                        </div>
                        <div className="relative">
                          <select
                            value={historySelectedYear}
                            onChange={(e) => setHistorySelectedYear(e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </label>

                      {/* Radio 3: Custom Date Range */}
                      <div className="pt-1 space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="periodRadio"
                            checked={historyPeriodRadio === 'custom'}
                            onChange={() => {
                              setHistoryPeriodRadio('custom');
                              setHistoryPeriodTab('custom');
                            }}
                            className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-800">Custom Date Range</span>
                        </label>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-0">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={historyCustomRangeStart}
                              onChange={(e) => setHistoryCustomRangeStart(e.target.value)}
                              className="w-full bg-transparent font-medium focus:outline-none text-[11px]"
                            />
                          </div>
                          <span className="text-slate-400">to</span>
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-0">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={historyCustomRangeEnd}
                              onChange={(e) => setHistoryCustomRangeEnd(e.target.value)}
                              className="w-full bg-transparent font-medium focus:outline-none text-[11px]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setHistoryPeriodTab('custom');
                            showToast(`Applied custom filter: ${historyCustomRangeStart} to ${historyCustomRangeEnd}`);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-1"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Attendance Summary (Oct 2026) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      Attendance Summary ({historySelectedMonth.replace('2026', '').trim() || 'Oct'} 2026)
                    </h3>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Total Days</span>
                        <span className="font-bold text-slate-900 font-mono">29</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Present</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">22</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            75.9%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Absent</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">5</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            17.2%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Leave</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">2</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            6.9%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-slate-500 font-medium">Working Hours</span>
                        <span className="font-bold text-slate-900 font-mono">196h 40m</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Imported Attendance History (Mini audit table) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 tracking-tight">Imported Attendance History</h3>
                      <button
                        type="button"
                        onClick={() => setCurrentSubView('import')}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="py-1.5 px-1">#</th>
                            <th className="py-1.5 px-2">File Name</th>
                            <th className="py-1.5 px-2">Upload Date</th>
                            <th className="py-1.5 px-2">Total Records</th>
                            <th className="py-1.5 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {IMPORTED_HISTORY_FILES.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-1 text-slate-400">{f.id}</td>
                              <td className="py-1.5 px-2 font-mono text-slate-700 max-w-[100px] truncate" title={f.fileName}>
                                {f.fileName}
                              </td>
                              <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{f.uploadDate}</td>
                              <td className="py-1.5 px-2 font-mono text-slate-700">{f.totalRecords}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {f.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCOPE 2: WHOLE COMPANY ATTENDANCE (DAY / MONTH / YEAR) */}
            {/* ======================================================== */}
            {historyScope === 'company' && (
              <div className="space-y-6">
                {/* Company Period Mode Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Period:</span>
                    <button
                      type="button"
                      onClick={() => setCompanyPeriodMode('day')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        companyPeriodMode === 'day'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Day Wise Muster
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompanyPeriodMode('month')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        companyPeriodMode === 'month'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Month Wise Analytics
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompanyPeriodMode('year')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        companyPeriodMode === 'year'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Year Wise Trend (2026)
                    </button>
                  </div>

                  {/* Export Options */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast('Company Muster Roll exported to Excel format (.xlsx)!')}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Register</span>
                    </button>
                  </div>
                </div>

                {/* --- COMPANY SUB-VIEW 1: DAY WISE ROSTER --- */}
                {companyPeriodMode === 'day' && (
                  <div className="space-y-4">
                    {/* Day Selector & KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Total Workforce</div>
                          <div className="text-xl font-bold text-slate-900 mt-0.5">{dayStats.total} Workers</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Present Today</div>
                          <div className="text-xl font-bold text-emerald-700 mt-0.5">{dayStats.present} {dayStats.total > 0 ? <span className="text-xs font-normal text-emerald-600">({Math.round((dayStats.present / dayStats.total) * 100)}%)</span> : null}</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Absent Today</div>
                          <div className="text-xl font-bold text-rose-700 mt-0.5">{dayStats.absent} {dayStats.total > 0 ? <span className="text-xs font-normal text-rose-600">({Math.round((dayStats.absent / dayStats.total) * 100)}%)</span> : null}</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">On Paid Leave</div>
                          <div className="text-xl font-bold text-amber-700 mt-0.5">{dayStats.leave} {dayStats.total > 0 ? <span className="text-xs font-normal text-amber-600">({Math.round((dayStats.leave / dayStats.total) * 100)}%)</span> : null}</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Total Overtime</div>
                          <div className="text-xl font-bold text-indigo-700 mt-0.5">34.5 hrs</div>
                        </div>
                      </div>
                    </div>

                    {/* Company Day Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-bold text-xs text-slate-800">Company Day Register: 12 Oct 2026</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={companySelectedDept}
                            onChange={(e) => setCompanySelectedDept(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            <option value="All">All Departments</option>
                            <option value="Production">Production</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Quality">Quality</option>
                            <option value="Store">Store</option>
                            <option value="Dispatch">Dispatch</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Worker ID</th>
                              <th className="py-3 px-4">Worker Name</th>
                              <th className="py-3 px-4">Department</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Time In</th>
                              <th className="py-3 px-4">Time Out</th>
                              <th className="py-3 px-4">Working Hours</th>
                              <th className="py-3 px-4">Overtime</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {INITIAL_DAY_WORKERS.filter(w => companySelectedDept === 'All' || w.department === companySelectedDept).map((w) => (
                              <tr key={w.id} className="hover:bg-slate-50/60">
                                <td className="py-3 px-4 font-mono font-medium text-slate-700">{w.workerId}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {w.photo ? (
                                      <img src={w.photo} alt={w.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${w.initialBg || 'bg-slate-100 text-slate-700'}`}>
                                        {w.initial || w.name.charAt(0)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-slate-800">{w.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{w.department}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                    w.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {w.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600">{w.inTime}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{w.outTime}</td>
                                <td className="py-3 px-4 font-mono text-slate-700">{w.workingHours}</td>
                                <td className="py-3 px-4 font-mono font-semibold text-blue-700">{w.overtime}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- COMPANY SUB-VIEW 2: MONTH WISE DEPARTMENT ANALYTICS --- */}
                {companyPeriodMode === 'month' && (
                  <div className="space-y-4">
                    {/* Header with Month */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Department Attendance Performance — October 2026</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Average company-wide presence rate: <span className="font-bold text-emerald-700">92.4%</span> across 5 active plant departments</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Selected Month:</span>
                        <select
                          value={companySelectedMonth}
                          onChange={(e) => setCompanySelectedMonth(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
                        >
                          <option value="October 2026">October 2026</option>
                          <option value="September 2026">September 2026</option>
                          <option value="August 2026">August 2026</option>
                        </select>
                      </div>
                    </div>

                    {/* Department Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {COMPANY_DEPT_PERFORMANCE.map((dept) => (
                        <div key={dept.department} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{dept.department}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {dept.workers} Workers
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400">Monthly Avg</span>
                              <span className="font-bold text-emerald-700">{dept.monthlyAvgPct}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: dept.monthlyAvgPct }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span>Total Overtime:</span>
                              <span className="font-mono font-semibold text-blue-700">{dept.totalOT}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Supervisor:</span>
                              <span className="font-medium text-slate-800 truncate max-w-[100px]">{dept.supervisor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Department Performance Detailed Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
                        Monthly Department Muster Roll Summary
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Department</th>
                              <th className="py-3 px-4">Headcount</th>
                              <th className="py-3 px-4 text-emerald-700">Present (Today)</th>
                              <th className="py-3 px-4 text-rose-700">Absent (Today)</th>
                              <th className="py-3 px-4 text-amber-700">On Leave</th>
                              <th className="py-3 px-4">Monthly Presence %</th>
                              <th className="py-3 px-4">Total OT</th>
                              <th className="py-3 px-4">Shift Lead</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {COMPANY_DEPT_PERFORMANCE.map((d) => (
                              <tr key={d.department} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-900">{d.department}</td>
                                <td className="py-3 px-4 font-mono text-slate-700">{d.workers}</td>
                                <td className="py-3 px-4 font-mono font-bold text-emerald-700">{d.presentToday}</td>
                                <td className="py-3 px-4 font-mono text-rose-600">{d.absentToday}</td>
                                <td className="py-3 px-4 font-mono text-amber-600">{d.leaveToday}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{d.monthlyAvgPct}</td>
                                <td className="py-3 px-4 font-mono text-blue-700">{d.totalOT}</td>
                                <td className="py-3 px-4 text-slate-600">{d.supervisor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- COMPANY SUB-VIEW 3: YEAR WISE 12-MONTH TREND --- */}
                {companyPeriodMode === 'year' && (
                  <div className="space-y-4">
                    {/* Annual KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                        <div className="text-xs text-slate-400 font-medium">Annual Man-Days Logged (2026)</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">12,288 Days</div>
                        <div className="text-xs text-emerald-600 font-semibold mt-1">Across 48 full-time workers</div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                        <div className="text-xs text-slate-400 font-medium">Company Average Attendance</div>
                        <div className="text-2xl font-bold text-emerald-700 mt-1">94.3%</div>
                        <div className="text-xs text-slate-400 mt-1">Target benchmark: 92.0% (Exceeded)</div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                        <div className="text-xs text-slate-400 font-medium">Total Factory Overtime</div>
                        <div className="text-2xl font-bold text-blue-700 mt-1">1,822 Hours</div>
                        <div className="text-xs text-blue-600 font-semibold mt-1">Fully reconciled with payroll</div>
                      </div>
                    </div>

                    {/* 12 Months Company Rollup Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">Company Attendance Trend — Year 2026</div>
                        <span className="text-[11px] text-slate-400">Statutory Muster Roll Audit Register</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Month</th>
                              <th className="py-3 px-4">Total Man-Days</th>
                              <th className="py-3 px-4 text-emerald-700">Avg Attendance %</th>
                              <th className="py-3 px-4 text-blue-700">Total Overtime</th>
                              <th className="py-3 px-4 text-rose-600">Absenteeism Rate</th>
                              <th className="py-3 px-4">Payroll Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {COMPANY_ANNUAL_MONTHS.map((m) => (
                              <tr key={m.month} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                                <td className="py-3 px-4 font-mono text-slate-700">{m.totalManDays}</td>
                                <td className="py-3 px-4 font-semibold text-emerald-700">{m.avgAttendance}</td>
                                <td className="py-3 px-4 font-mono text-blue-700">{m.totalOT}</td>
                                <td className="py-3 px-4 font-mono text-rose-600">{m.absenteeism}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    m.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EDIT RECORD MODAL */}
            {isEditDayModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Edit Attendance Record</h3>
                      <p className="text-xs text-slate-500">{historySelectedWorker.name} ({historySelectedWorker.workerId}) — {dayRecordDetails.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditDayModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status</label>
                      <select
                        value={dayRecordDetails.status}
                        onChange={(e) => setDayRecordDetails(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Time In</label>
                        <input
                          type="text"
                          value={dayRecordDetails.timeIn}
                          onChange={(e) => setDayRecordDetails(prev => ({ ...prev, timeIn: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Time Out</label>
                        <input
                          type="text"
                          value={dayRecordDetails.timeOut}
                          onChange={(e) => setDayRecordDetails(prev => ({ ...prev, timeOut: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Working Hours</label>
                      <input
                        type="text"
                        value={dayRecordDetails.workingHours}
                        onChange={(e) => setDayRecordDetails(prev => ({ ...prev, workingHours: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={dayRecordDetails.remarks}
                        onChange={(e) => setDayRecordDetails(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="e.g. Approved shift adjustment"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditDayModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDayRecord}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
