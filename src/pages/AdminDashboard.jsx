import React, { useState, useEffect } from 'react';
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
  UserCheck,
  UserX,
  ShieldCheck,
  Wallet,
  Receipt,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Coins
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';
import { DashboardService, WorkerService, DataStoreService } from '../services/api';

export const AdminDashboard = ({ onLogout, onNavigateWorkers, onNavigateDepartment, onNavigateAttendance, onNavigateContractor, onNavigateSalary, onNavigateAdvance, onNavigateReports, onNavigateAdministration }) => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [stats, setStats] = useState({
    total_workers: 0,
    active_workers: 0,
    present_today: 0,
    absent_today: 0,
    leave_today: 0,
    payroll_month: 'None',
    total_salary: 0,
    net_salary: 0,
    total_paid: 0,
    outstanding_salary: 0,
    total_advances_outstanding: 0,
  });

  useEffect(() => {
    let isMounted = true;

    DashboardService.getStats()
      .then((data) => {
        if (!isMounted || !data) return;
        setStats(data);
      })
      .catch((err) => {
        console.warn('Dashboard stats load error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Navigation Items with "Contractor" added under Attendance:
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

  // Top 4 Overview Stat Cards
  const topStats = [
    {
      title: 'Total Workers',
      value: String(stats.total_workers),
      subtext: stats.total_workers === 0 ? 'No registered workers yet' : `${stats.total_workers} registered workers`,
      icon: Users,
    },
    {
      title: 'Present Today',
      value: String(stats.present_today),
      subtext: stats.present_today === 0 ? 'No attendance marked today' : `${stats.present_today} on duty`,
      icon: UserCheck,
      iconColor: 'text-emerald-700',
    },
    {
      title: 'Absent Today',
      value: String(stats.absent_today),
      subtext: `${stats.leave_today || 0} on approved leave`,
      icon: UserX,
      iconColor: 'text-rose-600',
    },
    {
      title: 'Total Outstanding Advances',
      value: `₹ ${Number(stats.total_advances_outstanding || 0).toLocaleString('en-IN')}`,
      subtext: 'Active workforce balances',
      icon: TrendingUp,
      iconColor: 'text-indigo-900',
    },
  ];

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

      {/* ===================== MAIN OVERVIEW AREA ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header */}
        <header className="px-8 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeNav === 'Dashboard' ? 'Dashboard' : activeNav}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Welcome back, Admin — here's your overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Mode</span>
            </div>
          </div>
        </header>

        {/* Overview Body */}
        <main className="px-8 lg:px-10 pb-12 flex-1 space-y-6">
          {/* 1. TOP 4 STAT CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-2">
            {topStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex justify-between items-center group"
                >
                  {/* Subtle vertical accent bar on left edge */}
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300 group-hover:bg-indigo-600 rounded-r transition-colors" />

                  {/* Left Content */}
                  <div className="pl-2">
                    <span className="text-[13px] font-semibold text-slate-700 block">
                      {stat.title}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 block mt-1 tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {stat.subtext}
                    </span>
                  </div>

                  {/* Right Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconColor || 'text-[#11133c]'}`}>
                    <Icon className="w-7 h-7 stroke-[1.6]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. COMBINED SEPARATED BOX: ADVANCE OVERVIEW */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Box Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <HandCoins className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Advance Overview</h2>
                  <p className="text-[11px] text-slate-400">Current month advances and fixed outstanding balances</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateAdvance}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-sky-700 hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
              >
                Advance Records &rarr;
              </button>
            </div>

            {/* Separated Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Item: This Month Advance */}
              <div className="p-6 flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    This Month Advance
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                    ₹ {monthAdvanceTotal.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Total advance given to workers this month
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              {/* Right Item: Fixed Advance Balance */}
              <div className="p-6 flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Fixed Advance Balance
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                    ₹ {fixedAdvanceBalance.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Cumulative fixed advance balance outstanding across all workers
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. COMBINED SEPARATED BOX: PREVIOUS MONTH SALARY OVERVIEW */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Box Header - Only Heading */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Receipt className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Previous Month Salary Summary</h2>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audited</span>
              </span>
            </div>

            {/* Separated Content Grid: 5 Clean Columns with Headings & Real Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Metric 1: Total Gross Salary */}
              <div className="p-5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Gross Salary ({stats.payroll_month || 'Current'})
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                  ₹ {Number(stats.total_salary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Metric 2: Net Payable Salary */}
              <div className="p-5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Net Payable Salary
                </span>
                <div className="text-2xl font-bold text-sky-700 mt-2 tracking-tight">
                  ₹ {Number(stats.net_salary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Metric 3: Total Deductions */}
              <div className="p-5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Deductions (PF, ESI, Adv)
                </span>
                <div className="text-2xl font-bold text-rose-600 mt-2 tracking-tight">
                  ₹ {Number(stats.total_deductions || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Metric 4: Outstanding Salary */}
              <div className="p-5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Outstanding Unpaid Salary
                </span>
                <div className="text-2xl font-bold text-amber-600 mt-2 tracking-tight">
                  ₹ {Number(stats.outstanding_salary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Metric 5: Salary Paid */}
              <div className="p-5 bg-slate-50/30">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Disbursed Salary Paid
                </span>
                <div className="text-2xl font-bold text-emerald-700 mt-2 tracking-tight">
                  ₹ {Number(stats.total_paid || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
