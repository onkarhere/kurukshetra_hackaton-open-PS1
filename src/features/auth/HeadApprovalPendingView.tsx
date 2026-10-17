import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  ShieldAlert,
  User,
  BookOpen,
  Building2,
  Hash,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useApp } from '@/context/AppContext'
import { useStore, store } from '@/mocks/store'

export const HeadApprovalPendingView: React.FC = () => {
  const { logout } = useApp()
  const { success, info } = useToast()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const approvals = useStore((s) => s.approvals)
  const [isChecking, setIsChecking] = useState(false)

  // Find approval record for this student if available
  const studentApproval = approvals.find(
    (a) =>
      a.type === 'student_registration' &&
      (a.studentRegistration?.email.toLowerCase() === (currentUser.email || '').toLowerCase() ||
        a.studentRegistration?.studentId === currentUser.id)
  )

  const profile = currentUser.studentProfile || studentApproval?.studentRegistration

  const handleCheckStatus = () => {
    setIsChecking(true)
    setTimeout(() => {
      setIsChecking(false)
      // Check latest store state
      const updatedUser = store.currentUser
      const reg = store.studentRegistrations.find(
        (r) => r.email.toLowerCase() === (updatedUser.email || '').toLowerCase()
      )

      if (reg?.status === 'approved' || updatedUser.approvalStatus === 'approved') {
        success('Approval Granted!', 'The Head has approved your registration. Loading dashboard...')
        navigate('/s', { replace: true })
      } else if (reg?.status === 'rejected' || updatedUser.approvalStatus === 'rejected') {
        info('Registration Status', `Your registration was reviewed: ${reg?.rejectionReason || 'Rejected'}. Please contact admissions.`)
      } else {
        info(
          'Head approval pending',
          'Your profile is still awaiting authorization by a Head (Trainer or Owner).'
        )
      }
    }, 600)
  }

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#4A3528] flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-xl bg-[#F6E3D1] text-[#1E140E] rounded-card shadow-2xl border border-[#DDBF9F] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#33251F] text-[#F8F4EF] p-6 sm:p-8 border-b border-[#4F3B2E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-[#4A3528] border border-[#6B5040] text-[#F8F4EF] font-semibold text-xs flex items-center justify-center">
                IO
              </div>
              <div>
                <span className="font-semibold text-sm text-[#F8F4EF] leading-tight block">
                  CodeCraft Academy
                </span>
                <span className="text-[11px] text-[#E3D2C1]">Student Portal Access</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-medium text-amber-300 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Head approval pending</span>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F4EF]">
              Head Approval Pending
            </h1>
            <p className="text-xs text-[#E3D2C1] mt-1.5 leading-relaxed">
              Your student profile has been submitted and is currently waiting for authorization by an
              institute head (Trainer or Owner). Once approved, your student dashboard and courses will
              become accessible automatically.
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="bg-[#FAF5EE] rounded-card border border-[#DDBF9F] p-4.5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E8D4C1]">
              <span className="text-xs font-semibold text-[#1E140E] uppercase tracking-wider">
                Submitted Student Details
              </span>
              <span className="text-[11px] text-[#5C4636] font-mono">
                Status:{' '}
                <strong className="text-amber-800 uppercase font-semibold">
                  {currentUser.approvalStatus || 'Pending'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#5C4636]">
                <User className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Name:{' '}
                  <strong className="text-[#1E140E] font-medium">
                    {profile?.name || currentUser.name}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#5C4636]">
                <Hash className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Roll No:{' '}
                  <strong className="text-[#1E140E] font-mono font-medium">
                    {profile?.rollNo || 'ST-2026-PENDING'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#5C4636] sm:col-span-2">
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Class / Course:{' '}
                  <strong className="text-[#1E140E] font-medium">
                    {profile?.className || 'Java Full-Stack B3 (Kothrud)'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#5C4636]">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Branch:{' '}
                  <strong className="text-[#1E140E] font-medium">
                    {profile?.branch || currentUser.branch || 'Kothrud'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#5C4636]">
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Phone:{' '}
                  <strong className="text-[#1E140E] font-mono font-medium">
                    {profile?.phone || 'Pending'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#5C4636] sm:col-span-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-[#7C5E48]" />
                <span>
                  Google Email:{' '}
                  <strong className="text-[#1E140E] font-mono font-medium">
                    {profile?.email || currentUser.email}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Review Notice */}
          <div className="p-3.5 rounded-control bg-[#EFE3D5] border border-[#DDBF9F] space-y-1.5 text-xs text-[#5C4636]">
            <div className="flex items-center gap-2 font-semibold text-[#1E140E]">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Who can approve this?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Any authorized institute head can review and approve your registration, including:
            </p>
            <ul className="text-[11px] list-disc list-inside space-y-0.5 text-[#33251F] font-medium pl-1">
              <li>Arjun Mehta (Senior Trainer & Academic Head)</li>
              <li>Rajesh Sharma (Owner & Institute Director)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCheckStatus}
              isLoading={isChecking}
              className="w-full sm:flex-1 bg-[#4A3528] hover:bg-[#33251F] text-[#F8F4EF] py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />}
            >
              Check approval status
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleSignOut}
              className="w-full sm:w-auto bg-[#FAF5EE] hover:bg-[#EFE3D5] text-[#1E140E] border border-[#DDBF9F] py-2.5 flex items-center justify-center gap-1.5 text-xs"
              leftIcon={<LogOut className="w-3.5 h-3.5 text-[#5C4636]" />}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
