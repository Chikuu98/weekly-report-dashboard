import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, ManagerRoute, TeamMemberRoute } from './components/auth/ProtectedRoutes';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Manager Pages
import { DashboardPage } from './pages/manager/DashboardPage';
import { AllSubmissionsPage } from './pages/manager/AllSubmissionsPage';
import { ManagerReviewPage } from './pages/manager/ManagerReviewPage';
import { TeamPage } from './pages/manager/TeamPage';
import { TeamMemberProfilePage } from './pages/manager/TeamMemberProfilePage';
import { UserManagementPage } from './pages/manager/UserManagementPage';

// Member Pages
import { PersonalReportPage } from './pages/member/PersonalReportPage';
import { ReportHistoryPage } from './pages/member/ReportHistoryPage';

// Shared Pages
import { ProjectsPage } from './pages/shared/ProjectsPage';
import { ReportDetailPage } from './pages/shared/ReportDetailPage';
import { ProfilePage } from './pages/shared/ProfilePage';

// Error Pages
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { ForbiddenPage } from './pages/errors/ForbiddenPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                <Route path="/profile" element={<ProfilePage />} />

                {/* Manager Only Routes */}
                <Route element={<ManagerRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/reports" element={<AllSubmissionsPage />} />
                  <Route path="/reports/:id/review" element={<ManagerReviewPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/team/:id" element={<TeamMemberProfilePage />} />
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
