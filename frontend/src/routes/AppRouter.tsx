import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ExamPlayerPage } from '../pages/exam/ExamPlayerPage';
import { StudentDashboardPage } from '../pages/dashboards/StudentDashboardPage';
import { AdminDashboardPage } from '../pages/dashboards/AdminDashboardPage';
import { ProctorPanelPage } from '../pages/dashboards/ProctorPanelPage';
import { ScorecardPage } from '../pages/exam/ScorecardPage';
import { ExamAnalyticsPage } from '../pages/dashboards/ExamAnalyticsPage';
import { ExamManagementPage } from '../pages/dashboards/ExamManagementPage';
import { QuestionBankPage } from '../pages/dashboards/QuestionBankPage';
import { UserManagementPage } from '../pages/dashboards/UserManagementPage';
import { AuditLogExplorerPage } from '../pages/dashboards/AuditLogExplorerPage';
import { SystemHealthPage } from '../pages/dashboards/SystemHealthPage';
import { CustomExamUploadPage } from '../pages/exam/CustomExamUploadPage';
import { PreviousYearPapersPage } from '../pages/exam/PreviousYearPapersPage';
import { PurchaseCreditsPage } from '../pages/student/PurchaseCreditsPage';
import { AdminPaymentRequestsPage } from '../pages/admin/AdminPaymentRequestsPage';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

const AppRouter: React.FC = () => {
  const location = useLocation();
  const isExamPlayer = location.pathname.startsWith('/exam/take/');

  if (isExamPlayer) {
    return (
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Routes>
          <Route
            path="/exam/take/:attemptId"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <ExamPlayerPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Student Dashboard Route */}
          <Route
            path="/student/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <StudentDashboardPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Student Upload Document & Custom Exam Generator Route */}
          <Route
            path="/student/custom-exam"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <CustomExamUploadPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Student Previous Year Papers Catalog Route */}
          <Route
            path="/student/pyp"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <PreviousYearPapersPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Student Purchase Credits Route */}
          <Route
            path="/student/purchase-credits"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <PurchaseCreditsPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Payment Requests & Credits Control Route */}
          <Route
            path="/admin/payment-requests"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN']}>
                  <AdminPaymentRequestsPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin / Examiner Dashboard Route */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <AdminDashboardPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Student Detailed Scorecard Route */}
          <Route
            path="/student/attempts/:attemptId/scorecard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN']}>
                  <ScorecardPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Exam Analytics Route */}
          <Route
            path="/admin/exams/:examId/analytics"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <ExamAnalyticsPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Exam Lifecycle Route */}
          <Route
            path="/admin/exams"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <ExamManagementPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Question Bank Builder Route */}
          <Route
            path="/admin/exams/:examId/questions"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <QuestionBankPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin User Management Directory Route */}
          <Route
            path="/admin/users"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN']}>
                  <UserManagementPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Audit Log Explorer Route */}
          <Route
            path="/admin/audit-logs"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <AuditLogExplorerPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin System Health Telemetry Route */}
          <Route
            path="/admin/system-health"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <SystemHealthPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Admin Proctor Panel Route */}
          <Route
            path="/admin/proctor"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ROLE_ADMIN', 'ROLE_EXAMINER']}>
                  <ProctorPanelPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        CBT Examination Engine Platform &copy; 2026. Core Exam Engine & Fullscreen Player Active.
      </footer>
    </>
  );
};

export default AppRouter;
