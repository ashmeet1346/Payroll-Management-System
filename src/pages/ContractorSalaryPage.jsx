import React, { useState, useMemo } from 'react';
import {
  HardHat,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  X,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Weight,
  Scissors,
  Cpu,
  Upload,
  UserCheck,
  Users,
  BadgePercent,
  Receipt,
  FileText,
  Plus,
  Pencil,
  RotateCcw
} from 'lucide-react';

// Sample avatars
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

// Helper to generate 31 days for Contractor 1 (Rajinder - Machine Tonnage)
const generateTonnageLogs = (ratePerTon = 480) => {
  const days = [];
  for (let day = 1; day <= 31; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const isSunday = dateObj.getDay() === 0;

    if (isSunday && day % 2 === 0) {
      days.push({
        day,
        date: dateStr,
        dayName: 'Sunday',
        machine: 'Machine Line 1 & 2',
        status: 'Maintenance Shutdown',
        tons: 0,
        ratePerTon: 0,
        amount: 0,
        deployedWorkers: 0,
        note: 'Scheduled Machine Overhaul'
      });
      continue;
    }

    const baseTons = isSunday ? 12.5 : (16.2 + ((day * 7) % 6) * 0.8);
    const tons = Number(baseTons.toFixed(2));
    const amount = Math.round(tons * ratePerTon);
    const deployedWorkers = isSunday ? 6 : 10;

    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      machine: (day % 3 === 0) ? 'Heavy Forging Press #2' : (day % 2 === 0) ? 'Rolling Mill Line 1' : 'Hydraulic Extruder #4',
      status: 'Production Running',
      tons,
      ratePerTon,
      amount,
      deployedWorkers,
      note: `Machine log imported • ${tons} MT verified`
    });
  }
  return days;
};

// Helper to generate 31 days for Contractor 2 (12-hour Shift @ ₹50/hr, ₹600/day, Sunday paid only if worked)
const generate12hWorkerLogs = (workerIndex, sundayWorkDays = [11, 25]) => {
  const days = [];
  const hourlyRate = 50; // ₹50/hour

  for (let day = 1; day <= 31; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const isSunday = dateObj.getDay() === 0;

    if (isSunday) {
      const didWorkSunday = sundayWorkDays.includes(day);
      if (didWorkSunday) {
        days.push({
          day,
          date: dateStr,
          dayName: 'Sun',
          isSunday: true,
          shiftHours: 12,
          ratePerHour: hourlyRate,
          amount: 600,
          inTime: '08:00 AM',
          outTime: '08:00 PM',
          status: 'Sunday Duty (Paid)',
          note: 'Sunday Shift Worked -> Fully Paid (12h @ ₹50/h = ₹600)'
        });
      } else {
        days.push({
          day,
          date: dateStr,
          dayName: 'Sun',
          isSunday: true,
          shiftHours: 0,
          ratePerHour: 0,
          amount: 0,
          inTime: '-',
          outTime: '-',
          status: 'Sunday Off (Unpaid)',
          note: 'Sunday Off -> No Work, No Payment'
        });
      }
      continue;
    }

    const isAbsent = (day + workerIndex) % 19 === 0;
    if (isAbsent) {
      days.push({
        day,
        date: dateStr,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isSunday: false,
        shiftHours: 0,
        ratePerHour: 0,
        amount: 0,
        inTime: '-',
        outTime: '-',
        status: 'Absent',
        note: 'Absent on regular 12h shift'
      });
      continue;
    }

    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      isSunday: false,
      shiftHours: 12,
      ratePerHour: hourlyRate,
      amount: 600,
      inTime: '08:00 AM',
      outTime: '08:00 PM',
      status: '12h Full Duty',
      note: 'Completed 12h shift (12h @ ₹50/h = ₹600/day)'
    });
  }
  return days;
};

// Helper to generate 31 days for Contractor 3 (Baljit - Raw Material Cutting @ ₹1.65/Kg)
const generateCuttingLogs = (ratePerKg = 1.65) => {
  const days = [];
  const materials = ['Steel Billets (EN-8D)', 'Forged Round Bars', 'Ingot Ends Sectioning', 'Alloy Blooms 120mm'];

  for (let day = 1; day <= 31; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, day);
    const isSunday = dateObj.getDay() === 0;

    if (isSunday && day !== 11) {
      days.push({
        day,
        date: dateStr,
        dayName: 'Sunday',
        material: 'Cold Saw Shop Closed',
        status: 'Weekly Saw Maintenance',
        cutKg: 0,
        ratePerKg: 0,
        amount: 0,
        note: 'Saw Shop Closed'
      });
      continue;
    }

    const baseKg = isSunday ? 2200 : (3800 + ((day * 340) % 1800));
    const cutKg = Math.round(baseKg);
    const amount = Math.round(cutKg * ratePerKg);
    const material = materials[(day % materials.length)];

    days.push({
      day,
      date: dateStr,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      material,
      status: 'Cutting Bay Active',
      cutKg,
      ratePerKg,
      amount,
      note: `Cold Saw Cut: ${cutKg.toLocaleString('en-IN')} Kg @ ₹${ratePerKg}/Kg`
    });
  }
  return days;
};

const CONTRACTORS_CONFIG = [];

export default function ContractorSalaryPage({ onBackToSalaryModules }) {
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [contractors, setContractors] = useState(CONTRACTORS_CONFIG);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Import modals state
  const [isHoursImportModalOpen, setIsHoursImportModalOpen] = useState(false);
  const [isCuttingImportModalOpen, setIsCuttingImportModalOpen] = useState(false);

  // Review & Approve state per contractor
  const [approvalStatuses, setApprovalStatuses] = useState({
    'contractor-1': { status: 'Pending Review', approvedAt: null, approvedBy: null, remarks: '' },
    'contractor-2': { status: 'Pending Review', approvedAt: null, approvedBy: null, remarks: '' },
    'contractor-3': { status: 'Pending Review', approvedAt: null, approvedBy: null, remarks: '' }
  });
  const [isReviewApproveModalOpen, setIsReviewApproveModalOpen] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Manual Entry / Edit state
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: '2026-10-15',
    dayNumber: 15,
    machine: 'Heavy Forging Press #2',
    status: 'Production Running',
    deployedWorkers: 10,
    tons: 16.5,
    rate: 480,
    workerId: 'APX-01',
    shiftHours: 12,
    inTime: '08:00 AM',
    outTime: '08:00 PM',
    material: 'Steel Billets (EN-8D)',
    cutKg: 3500,
    note: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Active contractor object
  const activeContractor = useMemo(() => {
    return contractors.find(c => c.id === selectedContractorId) || contractors[0] || null;
  }, [contractors, selectedContractorId]);

  // Current approval status for selected contractor
  const currentApproval = (selectedContractorId && approvalStatuses[selectedContractorId]) || { status: 'Pending Review' };

  // Calculations for Contractor 1 (Rajinder - Tonnage)
  const rajinderStats = useMemo(() => {
    const c1 = contractors[0];
    if (!c1 || !c1.dailyLogs) {
      return { totalTons: 0, grossBilling: 0, tdsAmount: 0, advancePaid: 0, totalDeductions: 0, netPayout: 0, activeRunningDays: 0 };
    }
    const totalTons = c1.dailyLogs.reduce((sum, l) => sum + (l.tons || 0), 0);
    const grossBilling = c1.dailyLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const tdsAmount = Math.round(grossBilling * ((c1.tdsPercent || 0) / 100));
    const totalDeductions = (c1.advancePaid || 0) + tdsAmount;
    const netPayout = Math.max(0, grossBilling - totalDeductions);
    const activeRunningDays = c1.dailyLogs.filter(l => l.tons > 0).length;

    return {
      totalTons: Number(totalTons.toFixed(2)),
      grossBilling,
      tdsAmount,
      advancePaid: c1.advancePaid || 0,
      totalDeductions,
      netPayout,
      activeRunningDays
    };
  }, [contractors]);

  // Calculations for Contractor 2 (12-hour @ ₹50/hr, ₹600/day, Sunday paid only if worked)
  const apexStats = useMemo(() => {
    const c2 = contractors[1];
    if (!c2 || !c2.subWorkers) {
      return { totalWorkers: 0, grandHours: 0, grandGross: 0, grandSundaysWorked: 0, grandRegularDays: 0, tdsAmount: 0, advancePaid: 0, totalDeductions: 0, netPayout: 0 };
    }
    let grandHours = 0;
    let grandGross = 0;
    let grandSundaysWorked = 0;
    let grandRegularDays = 0;

    c2.subWorkers.forEach(w => {
      const logs = w.logs || [];
      const workerHours = logs.reduce((sum, l) => sum + (l.shiftHours || 0), 0);
      const workerGross = logs.reduce((sum, l) => sum + (l.amount || 0), 0);
      const sundaysWorked = logs.filter(l => l.isSunday && l.shiftHours > 0).length;
      const regularDays = logs.filter(l => !l.isSunday && l.shiftHours > 0).length;

      grandHours += workerHours;
      grandGross += workerGross;
      grandSundaysWorked += sundaysWorked;
      grandRegularDays += regularDays;
    });

    const tdsAmount = Math.round(grandGross * ((c2.tdsPercent || 0) / 100));
    const totalDeductions = (c2.advancePaid || 0) + tdsAmount;
    const netPayout = Math.max(0, grandGross - totalDeductions);

    return {
      totalWorkers: c2.subWorkers.length,
      grandHours,
      grandGross,
      grandSundaysWorked,
      grandRegularDays,
      tdsAmount,
      advancePaid: c2.advancePaid || 0,
      totalDeductions,
      netPayout
    };
  }, [contractors]);

  // Calculations for Contractor 3 (Baljit - Raw Material Cutting ₹/Kg)
  const baljitStats = useMemo(() => {
    const c3 = contractors[2];
    if (!c3 || !c3.dailyLogs) {
      return { totalCutKg: 0, totalCutTons: 0, grossBilling: 0, tdsAmount: 0, advancePaid: 0, totalDeductions: 0, netPayout: 0, activeCuttingDays: 0 };
    }
    const totalCutKg = c3.dailyLogs.reduce((sum, l) => sum + (l.cutKg || 0), 0);
    const grossBilling = c3.dailyLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const tdsAmount = Math.round(grossBilling * ((c3.tdsPercent || 0) / 100));
    const totalDeductions = (c3.advancePaid || 0) + tdsAmount;
    const netPayout = Math.max(0, grossBilling - totalDeductions);
    const activeCuttingDays = c3.dailyLogs.filter(l => l.cutKg > 0).length;

    return {
      totalCutKg,
      totalCutTons: Number((totalCutKg / 1000).toFixed(2)),
      grossBilling,
      tdsAmount,
      advancePaid: c3.advancePaid || 0,
      totalDeductions,
      netPayout,
      activeCuttingDays
    };
  }, [contractors]);

  // Current stats based on selection
  const currentActiveStats = useMemo(() => {
    if (!activeContractor) {
      return { gross: 0, tds: 0, advance: 0, net: 0, volume: '0 MT' };
    }
    if (selectedContractorId === 'contractor-1') {
      return {
        gross: rajinderStats.grossBilling,
        tds: rajinderStats.tdsAmount,
        advance: rajinderStats.advancePaid,
        net: rajinderStats.netPayout,
        volume: `${rajinderStats.totalTons} MT`
      };
    } else if (selectedContractorId === 'contractor-2') {
      return {
        gross: apexStats.grandGross,
        tds: apexStats.tdsAmount,
        advance: apexStats.advancePaid,
        net: apexStats.netPayout,
        volume: `${apexStats.grandHours} Shift Hours`
      };
    } else {
      return {
        gross: baljitStats.grossBilling,
        tds: baljitStats.tdsAmount,
        advance: baljitStats.advancePaid,
        net: baljitStats.netPayout,
        volume: `${baljitStats.totalCutKg.toLocaleString('en-IN')} Kg Cut`
      };
    }
  }, [selectedContractorId, activeContractor, rajinderStats, apexStats, baljitStats]);

  // Open Manual Entry Modal
  const handleOpenManualEntry = (existingLog = null, workerId = null) => {
    if (selectedContractorId === 'contractor-1') {
      if (existingLog) {
        setManualForm({
          date: existingLog.date,
          dayNumber: existingLog.day,
          machine: existingLog.machine,
          status: existingLog.status,
          deployedWorkers: existingLog.deployedWorkers || 10,
          tons: existingLog.tons,
          rate: existingLog.ratePerTon || 480,
          workerId: '',
          shiftHours: 12,
          inTime: '',
          outTime: '',
          material: '',
          cutKg: 0,
          note: existingLog.note || ''
        });
      } else {
        setManualForm({
          date: '2026-10-15',
          dayNumber: 15,
          machine: 'Heavy Forging Press #2',
          status: 'Production Running',
          deployedWorkers: 10,
          tons: 16.5,
          rate: 480,
          workerId: '',
          shiftHours: 12,
          inTime: '',
          outTime: '',
          material: '',
          cutKg: 0,
          note: ''
        });
      }
    } else if (selectedContractorId === 'contractor-2') {
      const targetWorkerId = workerId || 'APX-01';
      if (existingLog) {
        setManualForm({
          date: existingLog.date,
          dayNumber: existingLog.day,
          machine: '',
          status: existingLog.status,
          deployedWorkers: 1,
          tons: 0,
          rate: 50,
          workerId: targetWorkerId,
          shiftHours: existingLog.shiftHours !== undefined ? existingLog.shiftHours : 12,
          inTime: existingLog.inTime || '08:00 AM',
          outTime: existingLog.outTime || '08:00 PM',
          material: '',
          cutKg: 0,
          note: existingLog.note || ''
        });
      } else {
        setManualForm({
          date: '2026-10-15',
          dayNumber: 15,
          machine: '',
          status: '12h Full Duty',
          deployedWorkers: 1,
          tons: 0,
          rate: 50,
          workerId: targetWorkerId,
          shiftHours: 12,
          inTime: '08:00 AM',
          outTime: '08:00 PM',
          material: '',
          cutKg: 0,
          note: ''
        });
      }
    } else if (selectedContractorId === 'contractor-3') {
      if (existingLog) {
        setManualForm({
          date: existingLog.date,
          dayNumber: existingLog.day,
          machine: '',
          status: existingLog.status,
          deployedWorkers: 6,
          tons: 0,
          rate: existingLog.ratePerKg || 1.65,
          workerId: '',
          shiftHours: 0,
          inTime: '',
          outTime: '',
          material: existingLog.material,
          cutKg: existingLog.cutKg,
          note: existingLog.note || ''
        });
      } else {
        setManualForm({
          date: '2026-10-15',
          dayNumber: 15,
          machine: '',
          status: 'Cutting Bay Active',
          deployedWorkers: 6,
          tons: 0,
          rate: 1.65,
          workerId: '',
          shiftHours: 0,
          inTime: '',
          outTime: '',
          material: 'Steel Billets (EN-8D)',
          cutKg: 3500,
          note: ''
        });
      }
    }
    setIsManualEntryModalOpen(true);
  };

  // Submit Manual Entry
  const handleSaveManualEntry = (e) => {
    e.preventDefault();
    const dayNum = parseInt(manualForm.date.split('-')[2], 10) || manualForm.dayNumber;
    const dayDate = manualForm.date;
    const dateObj = new Date(manualForm.date);
    const dayName = isNaN(dateObj.getTime()) ? 'Day ' + dayNum : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    setContractors(prev => prev.map(c => {
      if (c.id === selectedContractorId) {
        if (selectedContractorId === 'contractor-1') {
          const tons = Number(manualForm.tons) || 0;
          const rate = Number(manualForm.rate) || 480;
          const amount = Math.round(tons * rate);
          const updatedLogs = c.dailyLogs.map(l => {
            if (l.date === dayDate || l.day === dayNum) {
              return {
                ...l,
                date: dayDate,
                dayName,
                machine: manualForm.machine,
                status: manualForm.status,
                deployedWorkers: Number(manualForm.deployedWorkers) || 0,
                tons,
                ratePerTon: rate,
                amount,
                note: manualForm.note ? `${manualForm.note} (Manual)` : 'Manual entry updated'
              };
            }
            return l;
          });
          return { ...c, dailyLogs: updatedLogs };
        } else if (selectedContractorId === 'contractor-2') {
          const hours = Number(manualForm.shiftHours) || 0;
          const amount = hours * 50;
          const isSunday = dayName.toLowerCase().includes('sun');
          const updatedWorkers = c.subWorkers.map(w => {
            if (w.id === manualForm.workerId) {
              const updatedLogs = w.logs.map(l => {
                if (l.date === dayDate || l.day === dayNum) {
                  return {
                    ...l,
                    shiftHours: hours,
                    inTime: hours > 0 ? manualForm.inTime : '-',
                    outTime: hours > 0 ? manualForm.outTime : '-',
                    amount,
                    status: hours > 0 ? (isSunday ? 'Sunday Duty (Paid)' : '12h Full Duty') : (isSunday ? 'Sunday Off (Unpaid)' : 'Absent / Leave'),
                    note: manualForm.note ? `${manualForm.note} (Manual)` : 'Manual timesheet adjustment'
                  };
                }
                return l;
              });
              return { ...w, logs: updatedLogs };
            }
            return w;
          });

          // Also update selectedItemForModal if it's currently open for this worker
          if (selectedItemForModal && selectedItemForModal.id === manualForm.workerId) {
            setSelectedItemForModal(prev => {
              if (!prev) return null;
              const newLogs = prev.logs.map(l => {
                if (l.date === dayDate || l.day === dayNum) {
                  return {
                    ...l,
                    shiftHours: hours,
                    inTime: hours > 0 ? manualForm.inTime : '-',
                    outTime: hours > 0 ? manualForm.outTime : '-',
                    amount,
                    status: hours > 0 ? (isSunday ? 'Sunday Duty (Paid)' : '12h Full Duty') : (isSunday ? 'Sunday Off (Unpaid)' : 'Absent / Leave'),
                    note: manualForm.note ? `${manualForm.note} (Manual)` : 'Manual timesheet adjustment'
                  };
                }
                return l;
              });
              return { ...prev, logs: newLogs };
            });
          }

          return { ...c, subWorkers: updatedWorkers };
        } else if (selectedContractorId === 'contractor-3') {
          const cutKg = Number(manualForm.cutKg) || 0;
          const rate = Number(manualForm.rate) || 1.65;
          const amount = Math.round(cutKg * rate);
          const updatedLogs = c.dailyLogs.map(l => {
            if (l.date === dayDate || l.day === dayNum) {
              return {
                ...l,
                date: dayDate,
                dayName,
                material: manualForm.material,
                status: manualForm.status,
                cutKg,
                ratePerKg: rate,
                amount,
                note: manualForm.note ? `${manualForm.note} (Manual)` : 'Manual weighbridge entry'
              };
            }
            return l;
          });
          return { ...c, dailyLogs: updatedLogs };
        }
      }
      return c;
    }));

    setIsManualEntryModalOpen(false);
    showToast('Manual entry updated successfully! Contractor ledger updated.');
  };

  // Handle Review & Approval
  const handleApproveBill = () => {
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setApprovalStatuses(prev => ({
      ...prev,
      [selectedContractorId]: {
        status: 'Approved',
        approvedAt: now,
        approvedBy: 'Ashmeet (Admin)',
        remarks: approvalRemarks.trim() || 'Reviewed and approved by Admin'
      }
    }));
    setIsReviewApproveModalOpen(false);
    showToast(`Salary billing for ${activeContractor?.name || 'Contractor'} approved & finalized.`);
  };

  const handleRevokeApproval = () => {
    setApprovalStatuses(prev => ({
      ...prev,
      [selectedContractorId]: {
        status: 'Pending Review',
        approvedAt: null,
        approvedBy: null,
        remarks: ''
      }
    }));
    setIsReviewApproveModalOpen(false);
    showToast(`Approval revoked for ${activeContractor?.name || 'Contractor'}. Bill reopened for edits.`);
  };

  // Handle Tonnage Import Simulation
  const handleSimulateTonnageImport = () => {
    setIsImportModalOpen(false);
    showToast('Machine production tonnage successfully imported from Floor SCADA & Press loggers!');
  };

  // Handle Working Hours Import Simulation
  const handleSimulateHoursImport = () => {
    setIsHoursImportModalOpen(false);
    showToast('12-Hour shift timesheets successfully imported for all 8 contractor workers!');
  };

  // Handle Raw Material Cutting Weight Import Simulation
  const handleSimulateCuttingImport = () => {
    setIsCuttingImportModalOpen(false);
    showToast('Raw material cutting weights successfully imported from Weighbridge scale log!');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#fafbfc]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP SUB-HEADER & BREADCRUMB */}
      <div className="px-8 lg:px-10 py-5 bg-white border-b border-slate-200/80 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSalaryModules}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Salary Categories"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Salary Cards</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  Contractor Salary Management
                  {activeContractor && (
                    currentApproval.status === 'Approved' ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Review
                      </span>
                    )
                  )}
                </h1>
                <p className="text-xs text-slate-500">
                  {activeContractor ? `${activeContractor.name} • ${activeContractor.billingType}` : 'No active contractor records'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          {activeContractor && (
            <div className="flex flex-wrap items-center gap-2">
              {/* MANUAL ENTRY BUTTON */}
              <button
                type="button"
                onClick={() => handleOpenManualEntry()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>

              {/* REVIEW & APPROVE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setApprovalRemarks(currentApproval.remarks || '');
                  setIsReviewApproveModalOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentApproval.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentApproval.status === 'Approved' ? 'Approved (View / Revoke)' : 'Review & Approve'}</span>
              </button>

              {/* IMPORT BUTTONS */}
              {selectedContractorId === 'contractor-1' && (
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Import Tonnage</span>
                </button>
              )}

              {selectedContractorId === 'contractor-2' && (
                <button
                  type="button"
                  onClick={() => setIsHoursImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Import Hours</span>
                </button>
              )}

              {selectedContractorId === 'contractor-3' && (
                <button
                  type="button"
                  onClick={() => setIsCuttingImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Import Cutting (Kg)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Contractor consolidated invoice downloaded.')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Export Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      {!activeContractor || contractors.length === 0 ? (
        <div className="flex-1 p-8 lg:p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-16">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 border border-violet-100">
            <HardHat className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Contractor Salary Records</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            All sample contractor records have been cleared. Register contractors in the Contractors module and enter their billing rates to calculate and disburse contractor salaries.
          </p>
          <button
            type="button"
            onClick={onBackToSalaryModules}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Salary Categories</span>
          </button>
        </div>
      ) : (
      <div className="px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* CONTRACTOR SELECTOR CARDS */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CONTRACTOR 1: RAJINDER */}
            <div
              onClick={() => setSelectedContractorId('contractor-1')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                selectedContractorId === 'contractor-1'
                  ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Model 1 &bull; Tonnage Production
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Weight className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">Rajinder Kumar</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Machine Output Tonnage</p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-amber-900">₹ 480 / MT</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  ₹ {rajinderStats.netPayout.toLocaleString('en-IN')} Net
                </span>
              </div>
            </div>

            {/* CONTRACTOR 2: 12-HOUR SHIFT */}
            <div
              onClick={() => setSelectedContractorId('contractor-2')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                selectedContractorId === 'contractor-2'
                  ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-2 ring-indigo-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Model 2 &bull; 12h Shift
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">Apex Labour Solutions</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">12h Shifts &bull; Biometric Timesheets</p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-900">₹ 50/h &bull; ₹600/d</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  ₹ {apexStats.netPayout.toLocaleString('en-IN')} Net
                </span>
              </div>
            </div>

            {/* CONTRACTOR 3: BALJIT CUTTING */}
            <div
              onClick={() => setSelectedContractorId('contractor-3')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                selectedContractorId === 'contractor-3'
                  ? 'bg-purple-50/70 border-purple-400 shadow-xs ring-2 ring-purple-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    Model 3 &bull; Raw Material Cutting
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Scissors className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">Baljit Scrap &amp; Cutting</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Weighbridge Scale Logs (Kg)</p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-purple-900">₹ 1.65 / Kg</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  ₹ {baljitStats.netPayout.toLocaleString('en-IN')} Net
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTRACTOR 1 VIEW: RAJINDER (TONNAGE PRODUCTION) */}
        {selectedContractorId === 'contractor-1' && (
          <div className="space-y-6">
            {/* Top KPI Cards for Rajinder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Tonnage Output
                </span>
                <span className="text-2xl font-extrabold text-amber-900 font-mono mt-1 block">
                  {rajinderStats.totalTons} <span className="text-xs font-semibold text-slate-400">MT</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">Verified production</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Agreed Tonnage Rate
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹ 480 <span className="text-xs font-semibold text-slate-400">/ MT</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">Per ton produced</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Gross Bill Amount
                </span>
                <span className="text-2xl font-extrabold text-indigo-900 font-mono mt-1 block">
                  ₹ {rajinderStats.grossBilling.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-slate-500 mt-1">Tons &times; ₹480</p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Net Payable to Rajinder
                </span>
                <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
                  ₹ {rajinderStats.netPayout.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-600 mt-1">
                  After TDS (₹{rajinderStats.tdsAmount}) &amp; Adv (₹{rajinderStats.advancePaid})
                </p>
              </div>
            </div>

            {/* Daily Machine Tonnage Register */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Daily Machine Tonnage Production Register (October 2026)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Billed at ₹480 per Metric Ton &bull; Both imported and manual adjustments reflected below
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenManualEntry()}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manual Entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import SCADA</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Machine / Section</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Labour Deployed</th>
                      <th className="py-3 px-3 text-right">Tonnage Output</th>
                      <th className="py-3 px-3 text-right">Rate / MT</th>
                      <th className="py-3 px-4 text-right">Day Amount</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeContractor.dailyLogs.map((log) => (
                      <tr key={log.day} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-medium whitespace-nowrap font-mono">
                          {log.date} <span className="text-[10px] text-slate-400 font-sans block">{log.dayName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.machine}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            log.tons > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {log.deployedWorkers > 0 ? `${log.deployedWorkers} workers` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                          {log.tons > 0 ? `${log.tons} MT` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {log.tons > 0 ? `₹ ${log.ratePerTon}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {log.amount > 0 ? `₹ ${log.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenManualEntry(log)}
                            title="Edit entry manually"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTOR 2 VIEW: 12-HOUR SHIFT */}
        {selectedContractorId === 'contractor-2' && (
          <div className="space-y-6">
            {/* Top KPI Cards for 12h Contractor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Contractor Workers
                </span>
                <span className="text-2xl font-extrabold text-indigo-900 font-mono mt-1 block">
                  {apexStats.totalWorkers} <span className="text-xs font-semibold text-slate-400">deployed</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">All on 12-hour shifts</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Wage Formula Config
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹ 50 / hr <span className="text-xs font-semibold text-slate-400">(₹600 / 12h)</span>
                </span>
                <p className="text-xs text-amber-600 font-medium mt-1">Sundays paid strictly if worked</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Shift Hours Logged
                </span>
                <span className="text-2xl font-extrabold text-indigo-950 font-mono mt-1 block">
                  {apexStats.grandHours.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-400">hrs</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">+{apexStats.grandSundaysWorked} Sunday shifts paid</p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Net Contractor Bill
                </span>
                <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
                  ₹ {apexStats.netPayout.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-600 mt-1">
                  Gross: ₹{apexStats.grandGross.toLocaleString('en-IN')} - Deductions
                </p>
              </div>
            </div>

            {/* Workers Table under 12h Contractor */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Apex Labour Solutions &bull; 12-Hour Worker Muster Roll &amp; Attendance Wages
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    12 hours per day &bull; ₹50/hour (₹600/day) &bull; Sunday shifts paid only if worked
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenManualEntry()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Manual Shift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHoursImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Import Timesheets</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Worker Profile</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3 text-center">Regular 12h Days</th>
                      <th className="py-3 px-3 text-center">Sunday Worked (Paid)</th>
                      <th className="py-3 px-3 text-center">Total 12h Shifts</th>
                      <th className="py-3 px-3 text-center">Total Hours</th>
                      <th className="py-3 px-3 text-right">Wage Rate</th>
                      <th className="py-3 px-4 text-right">Total Worker Pay</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeContractor.subWorkers.map((w) => {
                      const logs = w.logs || [];
                      const regular12hDays = logs.filter(l => !l.isSunday && l.shiftHours > 0).length;
                      const sundayWorkedDays = logs.filter(l => l.isSunday && l.shiftHours > 0).length;
                      const totalDays = regular12hDays + sundayWorkedDays;
                      const totalHours = logs.reduce((sum, l) => sum + (l.shiftHours || 0), 0);
                      const totalPay = logs.reduce((sum, l) => sum + (l.amount || 0), 0);

                      return (
                        <tr
                          key={w.id}
                          className="hover:bg-indigo-50/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{w.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{w.id}</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">{w.role}</td>
                          <td className="py-3 px-3 text-center font-mono">{regular12hDays} d</td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              +{sundayWorkedDays} Sun (Paid)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-indigo-900 font-mono">
                            {totalDays} shifts
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-800">
                            {totalHours} hrs
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            ₹50/h (₹600/d)
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 text-sm">
                            ₹ {totalPay.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenManualEntry(null, w.id)}
                                title="Edit or log manual shift for this worker"
                                className="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedItemForModal(w)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Month</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTOR 3 VIEW: BALJIT (RAW MATERIAL CUTTING) */}
        {selectedContractorId === 'contractor-3' && (
          <div className="space-y-6">
            {/* Top KPI Cards for Cutting Contractor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Material Cut
                </span>
                <span className="text-2xl font-extrabold text-purple-900 font-mono mt-1 block">
                  {baljitStats.totalCutKg.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-400">Kg</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">({baljitStats.totalCutTons} Metric Tons)</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Cutting Price Agreement
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹ 1.65 <span className="text-xs font-semibold text-slate-400">/ Kg</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">Steel billets &amp; scrap cutting</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Gross Cutting Billing
                </span>
                <span className="text-2xl font-extrabold text-indigo-900 font-mono mt-1 block">
                  ₹ {baljitStats.grossBilling.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-slate-500 mt-1">Kg cut &times; ₹1.65/Kg</p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Net Payable to Baljit
                </span>
                <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
                  ₹ {baljitStats.netPayout.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-600 mt-1">
                  After TDS (₹{baljitStats.tdsAmount}) &amp; Adv (₹{baljitStats.advancePaid})
                </p>
              </div>
            </div>

            {/* Daily Cutting Weight Register */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Daily Raw Material Weight &amp; Rate Register (October 2026)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Billed at ₹1.65 per Kilogram &bull; Manual weight overrides supported
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenManualEntry()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Manual Weight</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCuttingImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Import Weights (Kg)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200/70 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Material Processed</th>
                      <th className="py-3 px-3">Operation Status</th>
                      <th className="py-3 px-3 text-right">Cut Weight (Kg)</th>
                      <th className="py-3 px-3 text-right">Rate / Kg</th>
                      <th className="py-3 px-4 text-right">Day Amount</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeContractor.dailyLogs.map((log) => (
                      <tr key={log.day} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-medium whitespace-nowrap font-mono">
                          {log.date} <span className="text-[10px] text-slate-400 font-sans block">{log.dayName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.material}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            log.cutKg > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900">
                          {log.cutKg > 0 ? `${log.cutKg.toLocaleString('en-IN')} Kg` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {log.cutKg > 0 ? `₹ ${log.ratePerKg.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {log.amount > 0 ? `₹ ${log.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenManualEntry(log)}
                            title="Edit entry manually"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
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

      {/* ============================================================== */}
      {/* MODAL: MANUAL ENTRY (FOR CURRENT ACTIVE CONTRACTOR) */}
      {/* ============================================================== */}
      {isManualEntryModalOpen && activeContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Manual Salary Entry &bull; {activeContractor.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Direct entry and override for contractor salary calculations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualEntryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualEntry} className="p-6 space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* MODEL 1 FIELDS: RAJINDER TONNAGE */}
              {selectedContractorId === 'contractor-1' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tonnage (MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualForm.tons}
                        onChange={(e) => setManualForm({ ...manualForm, tons: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rate per MT (₹)
                      </label>
                      <input
                        type="number"
                        value={manualForm.rate}
                        onChange={(e) => setManualForm({ ...manualForm, rate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Machine / Line
                      </label>
                      <input
                        type="text"
                        value={manualForm.machine}
                        onChange={(e) => setManualForm({ ...manualForm, machine: e.target.value })}
                        placeholder="e.g. Heavy Forging Press #2"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Labour Deployed
                      </label>
                      <input
                        type="number"
                        value={manualForm.deployedWorkers}
                        onChange={(e) => setManualForm({ ...manualForm, deployedWorkers: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900">Computed Day Billing:</span>
                    <span className="text-base font-extrabold text-amber-950 font-mono">
                      ₹ {Math.round((Number(manualForm.tons) || 0) * (Number(manualForm.rate) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              {/* MODEL 2 FIELDS: APEX 12-HOUR SHIFT */}
              {selectedContractorId === 'contractor-2' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Worker
                    </label>
                    <select
                      value={manualForm.workerId}
                      onChange={(e) => setManualForm({ ...manualForm, workerId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {activeContractor.subWorkers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.id}) - {w.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Shift Hours Worked
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={manualForm.shiftHours}
                        onChange={(e) => setManualForm({ ...manualForm, shiftHours: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rate (Fixed ₹50/hr)
                      </label>
                      <input
                        type="text"
                        disabled
                        value="₹ 50 / hr (₹600 / 12h)"
                        className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        In Time
                      </label>
                      <input
                        type="text"
                        value={manualForm.inTime}
                        onChange={(e) => setManualForm({ ...manualForm, inTime: e.target.value })}
                        placeholder="08:00 AM"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Out Time
                      </label>
                      <input
                        type="text"
                        value={manualForm.outTime}
                        onChange={(e) => setManualForm({ ...manualForm, outTime: e.target.value })}
                        placeholder="08:00 PM"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-900">Computed Worker Day Pay:</span>
                    <span className="text-base font-extrabold text-indigo-950 font-mono">
                      ₹ {(Number(manualForm.shiftHours) || 0) * 50}
                    </span>
                  </div>
                </>
              )}

              {/* MODEL 3 FIELDS: BALJIT CUTTING */}
              {selectedContractorId === 'contractor-3' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cut Weight (Kg)
                      </label>
                      <input
                        type="number"
                        value={manualForm.cutKg}
                        onChange={(e) => setManualForm({ ...manualForm, cutKg: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rate per Kg (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualForm.rate}
                        onChange={(e) => setManualForm({ ...manualForm, rate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Material Description
                    </label>
                    <input
                      type="text"
                      value={manualForm.material}
                      onChange={(e) => setManualForm({ ...manualForm, material: e.target.value })}
                      placeholder="e.g. Steel Billets (EN-8D)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-900">Computed Day Cutting Bill:</span>
                    <span className="text-base font-extrabold text-purple-950 font-mono">
                      ₹ {Math.round((Number(manualForm.cutKg) || 0) * (Number(manualForm.rate) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Reason for Manual Entry
                </label>
                <input
                  type="text"
                  value={manualForm.note}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  placeholder="e.g. Supervisor manual override on floor"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Save Manual Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REVIEW & APPROVE CONTRACTOR SALARY BILL */}
      {/* ============================================================== */}
      {isReviewApproveModalOpen && activeContractor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Review &amp; Approve Contractor Salary
                  </h3>
                  <p className="text-xs text-slate-300">
                    {activeContractor.name} &bull; {activeContractor.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewApproveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Contractor Agency:</span>
                  <span className="font-bold text-slate-900">{activeContractor.firmName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Total Output / Hours:</span>
                  <span className="font-mono font-bold text-slate-800">{currentActiveStats.volume}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Gross Invoiced Billing:</span>
                  <span className="font-mono font-bold text-slate-900">₹ {currentActiveStats.gross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">TDS Withheld (Section 194C @ 2%):</span>
                  <span className="font-mono font-semibold text-rose-600">- ₹ {currentActiveStats.tds.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Advance Deducted:</span>
                  <span className="font-mono font-semibold text-sky-700">- ₹ {currentActiveStats.advance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1.5 font-bold text-sm text-slate-900">
                  <span>Net Approved Disbursal:</span>
                  <span className="font-mono text-emerald-700 text-base">₹ {currentActiveStats.net.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Status and Audit Checkpoints */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Daily logs reconciled with shopfloor supervisors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sunday shifts cross-checked with overtime rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Statutory TDS @ 2% deducted under section 194C</span>
                </div>
              </div>

              {/* Already Approved Details */}
              {currentApproval.status === 'Approved' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bill Approved and Certified</span>
                  </div>
                  <p className="text-emerald-700">Approved by <strong>{currentApproval.approvedBy}</strong> on {currentApproval.approvedAt}.</p>
                  {currentApproval.remarks && (
                    <p className="text-emerald-600 italic">"{currentApproval.remarks}"</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Approval Remarks / Audit Notes
                  </label>
                  <input
                    type="text"
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder="e.g. Verified by Ashmeet on 15 Oct, ready for accounts disbursal"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {currentApproval.status === 'Approved' ? (
                  <button
                    type="button"
                    onClick={handleRevokeApproval}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revoke &amp; Reopen Bill</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewApproveModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {currentApproval.status !== 'Approved' && (
                    <button
                      type="button"
                      onClick={handleApproveBill}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve &amp; Finalize Bill</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT MACHINE TONNAGE (FOR CONTRACTOR 1) */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Machine Tonnage Logs</h3>
                  <p className="text-xs text-slate-600">Auto-imports daily machine output weights for Rajinder</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-amber-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Production Floor SCADA or Weighbridge Excel/CSV
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Maps Machine Press #1, #2 and Extruder daily outputs
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p><strong>Target Contractor:</strong> Rajinder Kumar</p>
                <p><strong>Billing Rate:</strong> ₹ 480 per Metric Ton</p>
                <p><strong>Month:</strong> October 2026 (31 Days)</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateTonnageImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Import Machine Tonnage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FULL MONTH TIMESHEET FOR 12-HOUR WORKER (CONTRACTOR 2) */}
      {/* ============================================================== */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {selectedItemForModal.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Apex Labour Solutions
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                  <span>ID: <strong className="text-white font-mono">{selectedItemForModal.id}</strong></span>
                  <span>&bull;</span>
                  <span>Role: {selectedItemForModal.role}</span>
                  <span>&bull;</span>
                  <span>Rate: ₹50/hr (12h Shift = ₹600/day)</span>
                  <span>&bull;</span>
                  <span>Sundays: Paid ONLY if work logged</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Daily 31-day table */}
            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Shift Hours</th>
                    <th className="py-2.5 px-3">Timings</th>
                    <th className="py-2.5 px-3 text-right">Daily Pay</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedItemForModal.logs.map((log) => {
                    const isSunUnpaid = log.status.includes('Unpaid');
                    const isSunPaid = log.status.includes('Sunday Duty');

                    return (
                      <tr
                        key={log.day}
                        className={`${
                          isSunUnpaid
                            ? 'bg-slate-50 text-slate-400'
                            : isSunPaid
                            ? 'bg-emerald-50/50 text-slate-900 font-medium'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2 px-3 font-mono">
                          {log.date} <span className="text-[10px] text-slate-400 font-sans block">{log.dayName}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isSunPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isSunUnpaid
                              ? 'bg-slate-200 text-slate-600'
                              : log.shiftHours > 0
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {log.shiftHours > 0 ? `${log.shiftHours} hrs` : '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {log.inTime !== '-' ? `${log.inTime} - ${log.outTime}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {log.amount > 0 ? `₹ ${log.amount}` : '₹ 0'}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">
                          {log.note}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenManualEntry(log, selectedItemForModal.id)}
                            title="Edit shift hours"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                12-Hour shifts strictly conform to contractor billing terms. Unworked Sundays generate zero payment.
              </span>
              <button
                type="button"
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT WORKING HOURS & TIMESHEETS (FOR CONTRACTOR 2) */}
      {/* ============================================================== */}
      {isHoursImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-indigo-50 border-b border-indigo-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Working Hours &amp; Timesheets</h3>
                  <p className="text-xs text-slate-600">Apex Labour Solutions &bull; 12h Shift (@ ₹50/hr, ₹600/day)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHoursImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Biometric / 12h Shift Timesheet (Excel / CSV)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Matches 8 contract workers with daily 12-hour shifts &amp; Sunday duty
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Contractor:</span>
                  <span className="font-bold text-slate-800">Apex Labour Solutions (8 Workers)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Wage Structure:</span>
                  <span className="font-bold text-indigo-900 font-mono">₹50 / hr &bull; 12h = ₹600 / day</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Sunday Policy:</span>
                  <span className="font-bold text-emerald-800">Paid ONLY if worked; otherwise ₹0</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Target Month:</span>
                  <span className="font-mono text-slate-700">October 2026 (31 Days)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsHoursImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateHoursImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Working Hours</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IMPORT RAW MATERIAL CUTTING WEIGHT (FOR CONTRACTOR 3) */}
      {/* ============================================================== */}
      {isCuttingImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-purple-50 border-b border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Raw Material Cutting (Kg)</h3>
                  <p className="text-xs text-slate-600">Baljit Scrap &amp; Cutting &bull; Weighbridge &amp; Saw Scale Sheet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCuttingImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Upload Weighbridge &amp; Saw Bay Digital Scale Sheet (Excel / CSV)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Imports daily kilograms of steel billets, rods and heavy scrap cut
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Contractor:</span>
                  <span className="font-bold text-slate-800">Baljit Scrap &amp; Cutting</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Billing Rate:</span>
                  <span className="font-bold text-purple-900 font-mono">₹ 1.65 / Kilogram (Kg)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Cutting Bays:</span>
                  <span className="text-slate-700 font-medium">Cold Saw Shop &amp; Heavy Sectioning</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-slate-500">Target Month:</span>
                  <span className="font-mono text-slate-700">October 2026 (31 Days)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCuttingImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCuttingImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Cutting Weight (Kg)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
