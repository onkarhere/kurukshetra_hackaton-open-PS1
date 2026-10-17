import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle2,
  Building2,
  ShieldCheck,
  Lock,
  User,
  Plus,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useApp } from '@/context/AppContext'
import { UserRole, Branch } from '@/types'
import { store } from '@/mocks/store'
import { canAccess } from '@/lib/permissions'
import { signInWithGoogle, isSupabaseConfigured } from '@/lib/supabase'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: toastError } = useToast()
  const { login } = useApp()

  const [isLoading, setIsLoading] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [isCustomAccount, setIsCustomAccount] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  // Pre-configured Google Accounts for testing all roles seamlessly
  const GOOGLE_ACCOUNTS = [
    {
      id: 'acc-new-student',
      name: 'New Student (First-time Login)',
      email: 'student.new@gmail.com',
      role: 'student' as UserRole,
      badge: 'First-time Onboarding',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      avatar: '🎓',
      desc: 'Triggers basic info form (Name, Class, Branch, Roll No, Phone, Email) -> Head Approval Pending',
    },
    {
      id: 'acc-priya',
      name: 'Priya Nair',
      email: 'priya.nair@gmail.com',
      role: 'student' as UserRole,
      badge: 'Approved Student',
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      avatar: '👩‍🎓',
      desc: 'Already approved student · Directly opens Student Dashboard',
    },
    {
      id: 'acc-arjun',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@codecraft.ac.in',
      role: 'trainer' as UserRole,
      badge: 'Academic Head / Trainer',
      badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      avatar: '👨‍🏫',
      desc: 'Head authorized to review and approve student admissions in Approvals',
    },
    {
      id: 'acc-rajesh',
      name: 'Rajesh Sharma',
      email: 'rajesh@codecraft.ac.in',
      role: 'owner' as UserRole,
      badge: 'Institute Head / Owner',
      badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      avatar: '👑',
      desc: 'Executive Head authorized to review and approve student admissions',
    },
    {
      id: 'acc-sunita',
      name: 'Sunita Accounts',
      email: 'accounts@codecraft.ac.in',
      role: 'accounts' as UserRole,
      badge: 'Accounts Head',
      badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
      avatar: '💼',
      desc: 'Financial ledger, fee payment extraction, and banking reconciliation',
    },
    {
      id: 'acc-snehal',
      name: 'Snehal Kulkarni',
      email: 'snehal@codecraft.ac.in',
      role: 'counselor' as UserRole,
      badge: 'Academic Counselor',
      badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
      avatar: '🤝',
      desc: 'Student risk monitoring, academic counseling, and parent outreach',
    },
  ]

  const redirectAfterAuth = (userRole?: UserRole) => {
    const currentRole = userRole || store.currentUser.role
    if (currentRole === 'student') {
      navigate('/s', { replace: true })
      return
    }
    const from = (location.state as any)?.from?.pathname
    if (from && from !== '/login' && !from.startsWith('/s') && canAccess(currentRole, from)) {
      navigate(from, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  // Handle Google Sign In button click
  const handleGoogleClick = async () => {
    setShowAccountModal(true)
  }

  // Handle Account selection
  const handleSelectAccount = async (account: {
    name: string
    email: string
    role?: UserRole
    branch?: Branch | 'All'
    approvalStatus?: 'approved' | 'pending'
  }) => {
    setIsLoading(true)
    setShowAccountModal(false)

    try {
      const isNewStudentTest = account.email === 'student.new@gmail.com'
      const resolvedApproval = account.approvalStatus || (isNewStudentTest ? 'pending' : 'approved')

      const res = await login({
        email: account.email,
        name: account.name,
        role: account.role || 'student',
        branch: account.branch || 'Kothrud',
        isGoogleAuth: true,
        approvalStatus: resolvedApproval,
      })

      setIsLoading(false)

      if (res.success && res.user) {
        success('Signed in successfully', `Welcome, ${account.name}!`)
        redirectAfterAuth(res.user.role)
      } else {
        toastError('Login error', res.error || 'Failed to sign in.')
      }
    } catch (err: any) {
      setIsLoading(false)
      toastError('Authentication error', err?.message || 'Sign-in failed.')
    }
  }

  // Handle custom Google email sign-in
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customEmail.trim() || !customEmail.includes('@')) {
      toastError('Invalid email', 'Please enter a valid Google email address.')
      return
    }
    handleSelectAccount({
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
      role: 'student',
      branch: 'Kothrud',
    })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-[#4A3528] text-[#F8F4EF] select-none font-sans">
      {/* Left Brand Panel (5 cols) */}
      <div className="md:col-span-5 bg-[#33251F] border-r border-[#4F3B2E] p-8 md:p-12 flex flex-col justify-between text-[#F8F4EF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-[#4A3528] border border-[#6B5040] text-[#F8F4EF] font-medium text-xs flex items-center justify-center">
            IO
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-[#F8F4EF] leading-tight">Institute OS</span>
            <span className="text-[11px] text-[#E3D2C1]">CodeCraft Academy · Enterprise</span>
          </div>
        </div>

        <div className="space-y-6 my-auto max-w-sm">
          <div>
            <div className="text-xs text-[#E3D2C1] uppercase tracking-wider font-normal">
              Student & Faculty Platform
            </div>
            <h1 className="text-2xl font-semibold text-[#F8F4EF] tracking-tight mt-2 leading-snug">
              Unified classroom learning, attendance, and student governance.
            </h1>
          </div>

          <div className="space-y-3.5 text-xs text-[#E3D2C1]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D6B48A] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#F8F4EF]">Single Sign-On with Google: </span>
                Instant authentication with your verified institutional or personal Google account.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D6B48A] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#F8F4EF]">Head Admission Approval: </span>
                First-time student registrations are routed to institute heads (Trainer or Owner) for authorization.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D6B48A] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#F8F4EF]">Zero-reprompt onboarding: </span>
                Fill your student admission profile once. Never asked again on subsequent logins.
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#E3D2C1] flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>CodeCraft Academy · Pune Campuses (Kothrud & Baner)</span>
        </div>
      </div>

      {/* Right Login Panel (7 cols) - STRICTLY ONLY "CONTINUE WITH GOOGLE" */}
      <div className="md:col-span-7 p-6 sm:p-10 md:p-16 flex items-center justify-center bg-[#F6E3D1] text-[#1E140E]">
        <div className="w-full max-w-md space-y-8 text-center sm:text-left">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8D4C1] border border-[#DDBF9F] text-xs font-medium text-[#5C4636]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4A3528]" />
              <span>Secure Institute Authentication</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E140E]">
              Sign in to CodeCraft
            </h2>
            <p className="text-xs text-[#5C4636] leading-relaxed max-w-sm">
              Access your student portal, lecture schedules, QR check-in, and course materials.
            </p>
          </div>

          {/* Primary Action: ONLY "Continue with Google" */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full group bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 font-medium text-sm py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer select-none"
            >
              {/* Official Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-slate-800 text-[14px]">
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-[#7C5E48]">
                Protected by Google Identity & CodeCraft Academy RBAC policies.
              </p>
            </div>

            {/* Demo Accounts (Instant 1-Click Access Without Approval) */}
            <div className="pt-4 border-t border-[#DDBF9F] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1E140E]">
                  Demo Accounts (Instant access without approval):
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  Pre-approved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount({
                      name: 'Rajesh Sharma',
                      email: 'rajesh@codecraft.ac.in',
                      role: 'owner',
                      branch: 'All',
                      approvalStatus: 'approved',
                    })
                  }
                  className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DDBF9F] hover:border-[#4A3528] shadow-2xs hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="font-semibold text-[#1E140E] group-hover:text-[#4A3528] flex items-center gap-1.5">
                    <span>👑 Rajesh (Owner)</span>
                  </div>
                  <div className="text-[10px] text-[#5C4636] mt-0.5 truncate font-mono">
                    rajesh@codecraft.ac.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount({
                      name: 'Arjun Mehta',
                      email: 'arjun.mehta@codecraft.ac.in',
                      role: 'trainer',
                      branch: 'Kothrud',
                      approvalStatus: 'approved',
                    })
                  }
                  className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DDBF9F] hover:border-[#4A3528] shadow-2xs hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="font-semibold text-[#1E140E] group-hover:text-[#4A3528] flex items-center gap-1.5">
                    <span>👨‍🏫 Arjun (Trainer / Head)</span>
                  </div>
                  <div className="text-[10px] text-[#5C4636] mt-0.5 truncate font-mono">
                    arjun.mehta@codecraft.ac.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount({
                      name: 'Priya Nair',
                      email: 'priya.nair@gmail.com',
                      role: 'student',
                      branch: 'Kothrud',
                      approvalStatus: 'approved',
                    })
                  }
                  className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DDBF9F] hover:border-[#4A3528] shadow-2xs hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="font-semibold text-[#1E140E] group-hover:text-[#4A3528] flex items-center gap-1.5">
                    <span>👩‍🎓 Priya (Student)</span>
                  </div>
                  <div className="text-[10px] text-[#5C4636] mt-0.5 truncate font-mono">
                    priya.nair@gmail.com
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount({
                      name: 'Sunita Accounts',
                      email: 'accounts@codecraft.ac.in',
                      role: 'accounts',
                      branch: 'All',
                      approvalStatus: 'approved',
                    })
                  }
                  className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DDBF9F] hover:border-[#4A3528] shadow-2xs hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="font-semibold text-[#1E140E] group-hover:text-[#4A3528] flex items-center gap-1.5">
                    <span>💼 Sunita (Accounts)</span>
                  </div>
                  <div className="text-[10px] text-[#5C4636] mt-0.5 truncate font-mono">
                    accounts@codecraft.ac.in
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Security Guarantee Box */}
          <div className="p-4 rounded-xl bg-[#EFE3D5] border border-[#DDBF9F] space-y-2 text-xs text-[#5C4636]">
            <div className="flex items-center gap-2 font-medium text-[#1E140E]">
              <Lock className="w-3.5 h-3.5 text-[#5C4636]" />
              <span>Admission Verification Workflow</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>First-time Student:</strong> You'll enter your Name, Class, Branch, Roll No, Phone, and Email.
              Your profile is then forwarded to the Head (Trainer or Owner). While awaiting approval, your
              status is displayed as <em>"Head Approval Pending"</em>.
            </p>
          </div>
        </div>
      </div>

      {/* Google Account Selector Dialog (Modal) */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                    Choose an account
                  </h3>
                  <p className="text-[11px] text-slate-500">to continue to CodeCraft Academy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(false)
                  setIsCustomAccount(false)
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account List */}
            {!isCustomAccount ? (
              <div className="p-3 space-y-1.5 max-h-[65vh] overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Google Account:
                </div>

                {GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                      {acc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {acc.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${acc.badgeColor}`}
                        >
                          {acc.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">{acc.email}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-tight">{acc.desc}</div>
                    </div>
                  </button>
                ))}

                {/* Option to type custom Google email */}
                <button
                  type="button"
                  onClick={() => setIsCustomAccount(true)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-dashed border-slate-300 hover:border-slate-400 transition-all flex items-center gap-3 cursor-pointer mt-2"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-800">
                      Use another Google account
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Enter any custom name and @gmail.com to test new student admission
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Account Form */
              <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
                <div className="text-xs text-slate-600">
                  Enter your Google account details to sign in as a student:
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Google Email</label>
                  <input
                    type="email"
                    placeholder="rahul.sharma@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomAccount(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    Continue with this account
                  </button>
                </div>
              </form>
            )}

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Google Single Sign-On · CodeCraft Academy Security Gateway
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
