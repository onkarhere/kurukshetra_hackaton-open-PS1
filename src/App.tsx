import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppProvider } from '@/context/AppContext'
import { AppLayout } from '@/components/app/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ROUTE_ROLES } from '@/lib/permissions'

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
import { ClassroomListView } from '@/features/classroom/ClassroomListView'
import { ClassDetailView } from '@/features/classroom/ClassDetailView'
import { AssignmentDetailView } from '@/features/classroom/AssignmentDetailView'
import { SubmissionReviewView } from '@/features/classroom/SubmissionReviewView'
import { ClassroomReviewView } from '@/features/classroom/ClassroomReviewView'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppProvider>
              <ErrorBoundary>
                <Routes>
                  {/* Public & Isolated Routes */}
                  <Route path="/login" element={<LoginView />} />
                  <Route path="/verify/:certNo" element={<CertificateVerifyView />} />

                  {/* Student Portal (Requires logged in student, owner, or admin) */}
                  <Route
                    path="/s/*"
                    element={
                      <ProtectedRoute allowedRoles={ROUTE_ROLES['/s']}>
                        <StudentPortalView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/s"
                    element={
                      <ProtectedRoute allowedRoles={ROUTE_ROLES['/s']}>
                        <StudentPortalView />
                      </ProtectedRoute>
                    }
                  />

                  {/* Authenticated Application Shell protected by ProtectedRoute */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/']}>
                          <DashboardView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/setup"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/setup']}>
                          <OnboardingView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/copilot"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/copilot']}>
                          <CopilotView pageContext="On: Copilot Full View" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/approvals"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/approvals']}>
                          <ApprovalsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/timetable"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/timetable']}>
                          <TimetableView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/sessions/:id"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/sessions']}>
                          <SessionLiveView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/attendance"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/attendance']}>
                          <AttendanceView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/recordings"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/recordings']}>
                          <RecordingsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/students']}>
                          <StudentsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students/:id"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/students']}>
                          <StudentProfileView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/risk"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/risk']}>
                          <RiskBoardView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/trainers"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/trainers']}>
                          <TrainersView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/trainers/:id"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/trainers']}>
                          <TrainerProfileView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/courses']}>
                          <CoursesView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/batches"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/batches']}>
                          <BatchesView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/batches/:id"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/batches']}>
                          <BatchDetailView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/certificates"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/certificates']}>
                          <CertificatesView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fees"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/fees']}>
                          <FeesView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/payments']}>
                          <PaymentsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments/reconcile"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/payments/reconcile']}>
                          <PaymentsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/analytics']}>
                          <AnalyticsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/messages']}>
                          <MessagesView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/audit']}>
                          <AuditLogView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/settings']}>
                          <SettingsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/*"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/settings']}>
                          <SettingsView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/me"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/me']}>
                          <ProfileView />
                        </ProtectedRoute>
                      }
                    />

                    {/* Classroom Module Routes */}
                    <Route
                      path="/classroom"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/classroom']}>
                          <ClassroomListView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classroom/review"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/classroom/review']}>
                          <ClassroomReviewView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classroom/:classId"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/classroom']}>
                          <ClassDetailView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classroom/:classId/assignments/:assignmentId"
                      element={
                        <ProtectedRoute allowedRoles={ROUTE_ROLES['/classroom']}>
                          <AssignmentDetailView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classroom/:classId/assignments/:assignmentId/submissions/:submissionId"
                      element={
                        <ProtectedRoute allowedRoles={['owner', 'admin', 'trainer']}>
                          <SubmissionReviewView />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </AppProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
