import React, { useState } from 'react'
import {
  GraduationCap,
  Building2,
  User,
  BookOpen,
  Hash,
  Phone,
  Mail,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useStore, store } from '@/mocks/store'
import { Branch } from '@/types'

interface StudentOnboardingViewProps {
  onComplete?: () => void
}

export const StudentOnboardingView: React.FC<StudentOnboardingViewProps> = ({ onComplete }) => {
  const { success, error: toastError } = useToast()
  const currentUser = useStore((s) => s.currentUser)
  const batches = useStore((s) => s.batches)
  const courses = useStore((s) => s.courses)

  // Pre-fill from current user if available
  const [name, setName] = useState(currentUser.name && currentUser.name !== 'User' ? currentUser.name : '')
  const [className, setClassName] = useState(batches[0]?.name || 'Java Full-Stack B3 (Kothrud)')
  const [branch, setBranch] = useState<Branch>((currentUser.branch as Branch) || 'Kothrud')
  const [rollNo, setRollNo] = useState(`ST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(currentUser.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validations
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (!className.trim()) {
      setErrorMsg('Please select or specify your class/course.')
      return
    }
    if (!rollNo.trim()) {
      setErrorMsg('Please enter your roll number.')
      return
    }
    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      store.submitStudentRegistration({
        name: name.trim(),
        className: className.trim(),
        branch,
        rollNo: rollNo.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      })

      success(
        'Admission profile submitted',
        'Your profile has been forwarded to the Head (Trainer / Owner) for approval.'
      )
      onComplete?.()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit profile. Please try again.')
      toastError('Submission failed', err?.message)
    } finally {
      setIsSubmitting(false)
    }
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
                <span className="text-[11px] text-[#E3D2C1]">Student Admission Onboarding</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#4A3528] border border-[#6B5040] text-[11px] font-medium text-[#D6B48A] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>First-time setup</span>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F4EF]">
              Complete Your Student Information
            </h1>
            <p className="text-xs text-[#E3D2C1] mt-1.5 leading-relaxed">
              Welcome! Since this is your first time logging in with Google, please fill in your basic
              admission details. Your registration will be reviewed by the institute head (Trainer or Owner)
              for authorization.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-control bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#5C4636]" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Nair"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#FAF5EE] border border-[#DDBF9F] focus:border-[#4A3528] focus:ring-1 focus:ring-[#4A3528] rounded-control px-3 py-2 text-xs text-[#1E140E] outline-none"
              />
            </div>

            {/* Roll Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#5C4636]" />
                <span>Roll No. *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ST-2026-042"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
                className="w-full bg-[#FAF5EE] border border-[#DDBF9F] focus:border-[#4A3528] focus:ring-1 focus:ring-[#4A3528] rounded-control px-3 py-2 text-xs font-mono text-[#1E140E] outline-none"
              />
            </div>

            {/* Class / Course */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#5C4636]" />
                <span>Enrolled Class / Batch *</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#FAF5EE] border border-[#DDBF9F] focus:border-[#4A3528] focus:ring-1 focus:ring-[#4A3528] rounded-control px-3 py-2 text-xs text-[#1E140E] outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.branch})
                  </option>
                ))}
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#5C4636]" />
                <span>Campus Branch *</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full bg-[#FAF5EE] border border-[#DDBF9F] focus:border-[#4A3528] focus:ring-1 focus:ring-[#4A3528] rounded-control px-3 py-2 text-xs text-[#1E140E] outline-none"
              >
                <option value="Kothrud">Kothrud, Pune</option>
                <option value="Baner">Baner, Pune</option>
              </select>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#5C4636]" />
                <span>Phone No. *</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98201 55432"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-[#FAF5EE] border border-[#DDBF9F] focus:border-[#4A3528] focus:ring-1 focus:ring-[#4A3528] rounded-control px-3 py-2 text-xs text-[#1E140E] outline-none font-mono"
              />
            </div>

            {/* Email Address (Pre-filled from Google) */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-[#1E140E] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#5C4636]" />
                  <span>Verified Google Email</span>
                </span>
                <span className="text-[11px] text-[#5C4636] font-normal">Linked via Google Auth</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#EFE3D5] border border-[#DDBF9F] rounded-control px-3 py-2 text-xs text-[#1E140E] outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-control bg-[#EFE3D5] border border-[#DDBF9F] text-[11px] text-[#5C4636] leading-relaxed">
            <strong>Head Approval Policy:</strong> Once you submit this form, your admission request is
            sent to the Head (Trainer or Owner). Until approval is granted, your account will be in{' '}
            <em>"Head Approval Pending"</em> status.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full bg-[#4A3528] hover:bg-[#33251F] text-[#F8F4EF] py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit for Head approval
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
