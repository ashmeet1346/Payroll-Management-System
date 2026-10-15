import React, { useState, useEffect, useCallback } from 'react';
import DepartmentPage from './pages/DepartmentPage';
import WorkersPage from './pages/WorkersPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import ContractorPage from './pages/ContractorPage';
import SalaryPage from './pages/SalaryPage';
import AdvancePage from './pages/AdvancePage';
import ReportsPage from './pages/ReportsPage';
import AdministrationPage from './pages/AdministrationPage';

// Map page identifiers to clean URL paths
const PAGE_ROUTES = {
  dashboard: '/dashboard',
  workers: '/workers',
  departments: '/departments',
  attendance: '/attendance',
  contractors: '/contractors',
  salary: '/salary',
  advance: '/advance',
  reports: '/reports',
  administration: '/administration',
  login: '/login',
};

// Map URL paths back to page identifiers
const ROUTE_TO_PAGE = {
  '/dashboard': 'dashboard',
  '/workers': 'workers',
  '/departments': 'departments',
  '/attendance': 'attendance',
  '/contractors': 'contractors',
  '/salary': 'salary',
  '/advance': 'advance',
  '/reports': 'reports',
  '/administration': 'administration',
  '/login': 'login',
  '/': 'dashboard',
};

function getPageFromPathname(pathname) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return ROUTE_TO_PAGE[cleanPath] || 'dashboard';
}

function App() {
  // Authentication state stored in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('paysphere_token'));
  });

  // Current page derived from URL
  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = getPageFromPathname(window.location.pathname);
    const hasToken = Boolean(localStorage.getItem('paysphere_token'));
    if (!hasToken) {
      return 'login';
    }
    return pageFromUrl === 'login' ? 'dashboard' : pageFromUrl;
  });

  // Navigate function that syncs state with browser history & URL bar
  const navigateTo = useCallback((page) => {
    const targetPath = PAGE_ROUTES[page] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
    setCurrentPage(page);
  }, []);

  // Sync initial URL & handle browser popstate
  useEffect(() => {
    if (!isAuthenticated) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({ page: 'login' }, '', '/login');
      }
      setCurrentPage('login');
      return;
    }

    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (currentPath === '/' || currentPath === '/login' || !ROUTE_TO_PAGE[currentPath]) {
      window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
      setCurrentPage('dashboard');
    }

    // Handle browser Back / Forward buttons
    const handlePopState = () => {
      const pageFromUrl = getPageFromPathname(window.location.pathname);
      const token = localStorage.getItem('paysphere_token');
      if (!token) {
        setCurrentPage('login');
      } else {
        setCurrentPage(pageFromUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleLogout = () => {
    // Attempt revoke on server
    const token = localStorage.getItem('paysphere_token');
    if (token) {
      fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {});
    }

    localStorage.removeItem('paysphere_token');
    localStorage.removeItem('paysphere_user');
    setIsAuthenticated(false);
    navigateTo('login');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
  };

  // If not authenticated, always display LoginPage
  if (!isAuthenticated || currentPage === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="w-full min-h-screen">
      {currentPage === 'administration' ? (
        <AdministrationPage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'reports' ? (
        <ReportsPage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'advance' ? (
        <AdvancePage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'salary' ? (
        <SalaryPage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'contractors' ? (
        <ContractorPage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'attendance' ? (
        <AttendancePage
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'departments' ? (
        <DepartmentPage
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDashboard={() => navigateTo('dashboard')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'workers' ? (
        <WorkersPage
          onNavigateBack={() => navigateTo('dashboard')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
          onLogout={handleLogout}
        />
      ) : currentPage === 'dashboard' ? (
        <AdminDashboard
          onLogout={handleLogout}
          onNavigateWorkers={() => navigateTo('workers')}
          onNavigateDepartment={() => navigateTo('departments')}
          onNavigateAttendance={() => navigateTo('attendance')}
          onNavigateContractor={() => navigateTo('contractors')}
          onNavigateSalary={() => navigateTo('salary')}
          onNavigateAdvance={() => navigateTo('advance')}
          onNavigateReports={() => navigateTo('reports')}
          onNavigateAdministration={() => navigateTo('administration')}
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
