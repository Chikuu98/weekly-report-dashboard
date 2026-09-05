import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, ManagerRoute, TeamMemberRoute } from './components/auth/ProtectedRoutes';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonalReportPage } from './pages/PersonalReportPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TeamPage } from './pages/TeamPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/my-reports" replace />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected App Layout Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Common Protected Routes */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/reports/:id" element={<ReportDetailPage />} />

                {/* Manager Only Routes */}
                <Route element={<ManagerRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/reports" element={<DashboardPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                </Route>

                {/* Team Member Only Routes */}
                <Route element={<TeamMemberRoute />}>
                  <Route path="/report/new" element={<PersonalReportPage />} />
                  <Route path="/report/edit/:id" element={<PersonalReportPage />} />
                  <Route path="/my-reports" element={<ReportHistoryPage />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
