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
  Wallet,
  ArrowDownRight,
  Layers,
  Sparkles,
  TrendingUp,
  Receipt,
  PiggyBank
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';
import RegularAdvancePage from './RegularAdvancePage';
import FixedAdvancePage from './FixedAdvancePage';

export default function AdvancePage({
  onNavigateDashboard,
  onNavigateWorkers,
  onNavigateDepartment,
  onNavigateAttendance,
  onNavigateContractor,
  onNavigateSalary,
  onNavigateReports,
  onNavigateAdministration,
  onLogout
}) {
  const [activeNav, setActiveNav] = useState('Advance');
  // 'regular-advance', 'fixed-advance', or null for 2-cards overview
  const [activeAdvanceModule, setActiveAdvanceModule] = useState(null);

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

  // The 2 Advance cards
  const advanceCards = [
    {
      id: 'regular-advance',
      title: 'Advance',
      subtitle: 'Monthly Running Advance',
      category: 'Short-Term / Mid-Month Payout',
      metricLabel: 'This Month Advance',
      metricValue: '₹ 0',
      metricSub: 'No advances disbursed yet',
      icon: HandCoins,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50 border-sky-200/80',
      badgeBg: 'bg-sky-100/70 text-sky-800 border-sky-200',
      borderAccent: 'border-l-4 border-l-sky-500',
      tag: 'Monthly Salary Advance'
    },
    {
      id: 'fixed-advance',
      title: 'Fixed Advance',
      subtitle: 'Long-Term Installment Loan',
      category: 'Multi-Month EMI Recovery',
      metricLabel: 'Fixed Advance Balance',
      metricValue: '₹ 0',
      metricSub: 'Zero active loans',
      icon: Wallet,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200/80',
      badgeBg: 'bg-indigo-100/70 text-indigo-800 border-indigo-200',
      borderAccent: 'border-l-4 border-l-indigo-500',
      tag: 'Fixed Monthly EMI'
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
                    } else if (item.name === 'Salary' && onNavigateSalary) {
                      onNavigateSalary();
                    } else if (item.name === 'Advance') {
                      setActiveAdvanceModule(null);
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
        {activeAdvanceModule === 'regular-advance' ? (
          <RegularAdvancePage
            onBackToAdvanceCards={() => setActiveAdvanceModule(null)}
            onSwitchToFixedAdvance={() => setActiveAdvanceModule('fixed-advance')}
          />
        ) : activeAdvanceModule === 'fixed-advance' ? (
          <FixedAdvancePage
            onBackToAdvanceCards={() => setActiveAdvanceModule(null)}
            onSwitchToRegularAdvance={() => setActiveAdvanceModule('regular-advance')}
          />
        ) : (
          <>
            {/* TOP HEADER */}
            <header className="px-8 lg:px-10 pt-8 pb-6 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Advance Management
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Manage monthly running advances and fixed installment loans
                  </p>
                </div>
              </div>
            </header>

            {/* BODY CONTENT: THE 2 CARDS */}
            <main className="px-8 lg:px-10 py-8 flex-1 max-w-7xl w-full">
              {/* Consolidated Advance Portfolio */}
              <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Advance Overview
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-6 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        This Month Advance (Running)
                      </span>
                      <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight font-mono">
                        ₹ 0
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        No short-term advances disbursed yet
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>

                  <div className="p-6 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Fixed Advance Balance (Outstanding)
                      </span>
                      <div className="text-3xl font-bold text-indigo-900 mt-2 tracking-tight font-mono">
                        ₹ 0
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        Zero active long-term loan records
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* The 2 Advance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advanceCards.map((card) => {
                  const IconComponent = card.icon;

                  return (
                    <div
                      key={card.id}
                      onClick={() => setActiveAdvanceModule(card.id)}
                      className={`bg-white rounded-2xl border shadow-xs p-6 relative flex flex-col justify-between transition-all select-none cursor-pointer group hover:shadow-md hover:border-sky-400 ${card.borderAccent}`}
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

                        {/* Card Title & Subtitle */}
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors">
                            {card.title}
                          </h3>
                          <span className="text-xs font-semibold text-slate-400">
                            &bull; {card.subtitle}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-1 mb-4">
                          {card.category}
                        </p>

                        {/* Card Metric Box */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {card.metricLabel}
                            </span>
                            <span className="text-xl font-extrabold text-slate-900 font-mono">
                              {card.metricValue}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {card.metricSub}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-xs font-medium text-slate-500">
                          Advance tracking engine
                        </span>
                        <span className="text-xs text-sky-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
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
}
