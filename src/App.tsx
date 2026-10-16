import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppProvider } from '@/context/AppContext'
import { AppLayout } from '@/components/app/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Features
import { DashboardView } from '@/features/dashboard/DashboardView'
import { CopilotView } from '@/features/copilot/CopilotView'
import { ApprovalsView } from '@/features/approvals/ApprovalsView'
import { TimetableView } from '@/features/timetable/TimetableView'
import { SessionLiveView } from '@/features/attendance/SessionLiveView'
import { AttendanceView } from '@/features/attendance/AttendanceView'
import { RecordingsView } from '@/features/recordings/RecordingsView'
import { StudentsView } from '@/features/students/StudentsView'
import { StudentProfileView } from '@/features/students/StudentProfileView'
import { RiskBoardView } from '@/features/risk/RiskBoardView'
import { TrainersView } from '@/features/trainers/TrainersView'
import { TrainerProfileView } from '@/features/trainers/TrainerProfileView'
import { CoursesView } from '@/features/courses/CoursesView'
import { BatchesView } from '@/features/batches/BatchesView'
import { BatchDetailView } from '@/features/batches/BatchDetailView'
import { CertificatesView } from '@/features/certificates/CertificatesView'
import { CertificateVerifyView } from '@/features/certificates/CertificateVerifyView'
import { FeesView } from '@/features/fees/FeesView'
import { PaymentsView } from '@/features/payments/PaymentsView'
import { AnalyticsView } from '@/features/analytics/AnalyticsView'
import { MessagesView } from '@/features/messages/MessagesView'
import { AuditLogView } from '@/features/audit/AuditLogView'
import { SettingsView } from '@/features/settings/SettingsView'
import { LoginView } from '@/features/auth/LoginView'
import { OnboardingView } from '@/features/setup/OnboardingView'
import { StudentPortalView } from '@/features/student_portal/StudentPortalView'
import { ProfileView } from '@/features/auth/ProfileView'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppProvider>
              <Routes>
                {/* Public & Isolated Routes */}
                <Route path="/login" element={<LoginView />} />
                <Route path="/verify/:certNo" element={<CertificateVerifyView />} />

                {/* Student Portal (Direct or mobile access) */}
                <Route path="/s/*" element={<StudentPortalView />} />
                <Route path="/s" element={<StudentPortalView />} />

                {/* Authenticated Application Shell protected by ProtectedRoute */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardView />} />
                  <Route path="/setup" element={<OnboardingView />} />
                  <Route path="/copilot" element={<CopilotView pageContext="On: Copilot Full View" />} />
                  <Route path="/approvals" element={<ApprovalsView />} />
                  <Route path="/timetable" element={<TimetableView />} />
                  <Route path="/sessions/:id" element={<SessionLiveView />} />
                  <Route path="/attendance" element={<AttendanceView />} />
                  <Route path="/recordings" element={<RecordingsView />} />
                  <Route path="/students" element={<StudentsView />} />
                  <Route path="/students/:id" element={<StudentProfileView />} />
                  <Route path="/risk" element={<RiskBoardView />} />
                  <Route path="/trainers" element={<TrainersView />} />
                  <Route path="/trainers/:id" element={<TrainerProfileView />} />
                  <Route path="/courses" element={<CoursesView />} />
                  <Route path="/batches" element={<BatchesView />} />
                  <Route path="/batches/:id" element={<BatchDetailView />} />
                  <Route path="/certificates" element={<CertificatesView />} />
                  <Route path="/fees" element={<FeesView />} />
                  <Route path="/payments" element={<PaymentsView />} />
                  <Route path="/payments/reconcile" element={<PaymentsView />} />
                  <Route path="/analytics" element={<AnalyticsView />} />
                  <Route path="/messages" element={<MessagesView />} />
                  <Route path="/audit" element={<AuditLogView />} />
                  <Route path="/settings" element={<SettingsView />} />
                  <Route path="/settings/*" element={<SettingsView />} />
                  <Route path="/me" element={<ProfileView />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
