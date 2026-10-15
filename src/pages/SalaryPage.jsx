import React, { useState } from 'react';
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
  Factory,
  Briefcase,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';
import ProductionLineSalary from './ProductionLineSalary';
import SalaryWorkersPage from './SalaryWorkersPage';
import FixedSalaryWorkersPage from './FixedSalaryWorkersPage';
import ContractorSalaryPage from './ContractorSalaryPage';

export const SalaryPage = ({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateAdvance,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) => {
  const [activeNav, setActiveNav] = useState('Salary');
  // 'contractor', 'fixed-salary-workers', 'salary-workers', 'production-team', or null for 4-cards overview
  const [activeSalaryModule, setActiveSalaryModule] = useState(null);

  // Sidebar navigation items
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

  // The 4 salary categories
  const salaryCards = [
    {
      id: 'production-team',
      title: 'Production Team Salary',
      category: 'Plant & Floor Operations',
      icon: Factory,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200/80',
      badgeBg: 'bg-amber-100/70 text-amber-800 border-amber-200',
      borderAccent: 'border-l-4 border-l-amber-500',
      tag: 'Production Line'
    },
    {
      id: 'salary-workers',
      title: 'Salary Workers',
      category: 'Shift & Daily Wage Staff',
      icon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200/80',
      badgeBg: 'bg-indigo-100/70 text-indigo-800 border-indigo-200',
      borderAccent: 'border-l-4 border-l-indigo-500',
      tag: 'Daily / Hourly'
    },
    {
      id: 'fixed-salary-workers',
      title: 'Fixed Salary Workers',
      category: 'Permanent Payroll',
      icon: Briefcase,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      badgeBg: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
      borderAccent: 'border-l-4 border-l-emerald-500',
      tag: 'Permanent Staff'
    },
    {
      id: 'contractor',
      title: 'Contractor',
      category: 'Outsourced Agencies',
      icon: HardHat,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50 border-violet-200/80',
      badgeBg: 'bg-violet-100/70 text-violet-800 border-violet-200',
      borderAccent: 'border-l-4 border-l-violet-500',
      tag: 'Third Party Agency'
    }
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
                    } else if (item.name === 'Salary') {
                      setActiveSalaryModule(null);
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
        {activeSalaryModule === 'production-team' ? (
          <ProductionLineSalary onBackToSalaryModules={() => setActiveSalaryModule(null)} />
        ) : activeSalaryModule === 'salary-workers' ? (
          <SalaryWorkersPage onBackToSalaryModules={() => setActiveSalaryModule(null)} />
        ) : activeSalaryModule === 'fixed-salary-workers' ? (
          <FixedSalaryWorkersPage onBackToSalaryModules={() => setActiveSalaryModule(null)} />
        ) : activeSalaryModule === 'contractor' ? (
          <ContractorSalaryPage onBackToSalaryModules={() => setActiveSalaryModule(null)} />
        ) : (
          <>
            {/* TOP HEADER */}
            <header className="px-8 lg:px-10 pt-8 pb-6 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Salary Management
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Select a salary module to calculate and manage payroll disbursements
                  </p>
                </div>
              </div>
            </header>

            {/* BODY CONTENT: THE 4 CARDS */}
            <main className="px-8 lg:px-10 py-8 flex-1 max-w-7xl w-full">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {salaryCards.map((card) => {
                  const IconComponent = card.icon;

                  return (
                    <div
                      key={card.id}
                      onClick={() => setActiveSalaryModule(card.id)}
                      className={`bg-white rounded-2xl border shadow-xs p-6 relative flex flex-col justify-between transition-all select-none cursor-pointer group hover:shadow-md hover:border-indigo-400 ${card.borderAccent}`}
                    >
                      {/* Card Header & Icon */}
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-2xs ${card.iconBg} ${card.iconColor} group-hover:scale-105 transition-transform`}>
                            <IconComponent className="w-6 h-6" strokeWidth={2} />
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${card.badgeBg}`}>
                            {card.tag}
                          </span>
                        </div>

                        {/* Card Title & Category */}
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                          {card.category}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-xs font-medium text-slate-500">
                          Payroll calculation engine
                        </span>
                        <span className="text-xs text-indigo-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Open &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryPage;
