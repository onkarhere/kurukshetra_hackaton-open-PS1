import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Building2,
  User,
  Mail,
  KeyRound,
  Sparkles,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useApp } from '@/context/AppContext'
import { UserRole, Branch } from '@/types'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: toastError } = useToast()
  const { login, register } = useApp()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sign in fields
  const [email, setEmail] = useState('rajesh@codecraft.ac.in')
  const [password, setPassword] = useState('Admin@1234')
  const [phone, setPhone] = useState('+91 98201 55432')
  const [otp, setOtp] = useState(['4', '8', '1', '9', '2', '0'])
  const [isMfaStep, setIsMfaStep] = useState(false)

  // Sign up fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<UserRole>('trainer')
  const [regBranch, setRegBranch] = useState<Branch>('Kothrud')

  const redirectAfterAuth = () => {
    const from = (location.state as any)?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (authMethod === 'password' && !isMfaStep) {
      setIsMfaStep(true)
      success('Credentials accepted', 'Enter the 6-digit MFA security code sent to your registered device.')
      return
    }

    setIsLoading(true)
    const res = await login({ email, password })
    setIsLoading(false)

    if (res.success) {
      success('Authentication successful', `Signed in as ${email}`)
      redirectAfterAuth()
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.')
      toastError('Authentication failed', res.error)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!regName.trim() || !regEmail.trim() || regPassword.length < 6) {
      setErrorMessage('Please provide your name, valid email, and a password of at least 6 characters.')
      return
    }

    setIsLoading(true)
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      branch: regBranch,
    })
    setIsLoading(false)

    if (res.success) {
      success('Account created', `Welcome, ${regName}! Signed in as ${regRole}.`)
      redirectAfterAuth()
    } else {
      setErrorMessage(res.error || 'Registration failed. Please try again.')
      toastError('Registration error', res.error)
    }
  }

  const handleQuickPersona = async (persona: {
    name: string
    email: string
    role: UserRole
    branch: Branch | 'All'
  }) => {
    setIsLoading(true)
    setEmail(persona.email)
    const res = await login({
      email: persona.email,
      name: persona.name,
      role: persona.role,
      branch: persona.branch,
    })
    setIsLoading(false)
    if (res.success) {
      success('Switched persona', `Authenticated as ${persona.name} (${persona.role})`)
      if (persona.role === 'student') {
        navigate('/s', { replace: true })
      } else {
        redirectAfterAuth()
      }
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0]
    const copy = [...otp]
    copy[index] = val
    setOtp(copy)

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`)
      nextInput?.focus()
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-canvas text-text select-none font-sans">
      {/* Left Brand Panel (5 cols) */}
      <div className="md:col-span-5 bg-surface-sunken border-r border-border p-8 md:p-12 flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-accent text-accent-fg font-medium text-xs flex items-center justify-center">
            IO
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-text leading-tight">Institute OS</span>
            <span className="text-[11px] text-text-muted">Batchwise · Supabase Auth</span>
          </div>
        </div>

        <div className="space-y-6 my-auto max-w-sm">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider font-normal">
              Enterprise Operations Platform
            </div>
            <h1 className="text-2xl font-semibold text-text tracking-tight mt-2 leading-snug">
              Precision operations, attendance, timetable scheduling and fee governance.
            </h1>
          </div>

          <div className="space-y-3.5 text-xs text-text-muted">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-text">Supabase identity security: </span>
                Multi-tenant session tokens, encrypted credentials, and automated schema policies.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-text">Dual-control safety: </span>
                Automated reminders, timetable replans, and waivers require explicit owner authorization.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-text">Role-based privacy: </span>
                Strict financial opacity ensures instructors focus purely on academics and student outcomes.
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-text-muted flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>CodeCraft Academy · Pune, Maharashtra</span>
        </div>
      </div>

      {/* Right Form Panel (7 cols) */}
      <div className="md:col-span-7 p-6 sm:p-10 md:p-14 flex items-center justify-center bg-surface overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Top Switcher: Sign In vs Create Account */}
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMessage(null)
                }}
                className={`text-sm font-semibold transition-colors pb-2 border-b-2 ${
                  mode === 'signin'
                    ? 'border-accent text-text'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setErrorMessage(null)
                }}
                className={`text-sm font-semibold transition-colors pb-2 border-b-2 ${
                  mode === 'signup'
                    ? 'border-accent text-text'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                Create account
              </button>
            </div>
            <span className="text-xs text-text-muted">CodeCraft Pune</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-control bg-surface-sunken border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  {isMfaStep ? 'Two-factor verification' : 'Sign in to your account'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {isMfaStep
                    ? 'Enter the 6-digit verification code sent to +91 98••• ••432'
                    : 'Enter your credentials to access operations, attendance and fees'}
                </p>
              </div>

              {!isMfaStep && (
                <div className="flex items-center bg-surface-sunken border border-border rounded-control p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`flex-1 py-1.5 rounded-control transition-colors ${
                      authMethod === 'password'
                        ? 'bg-surface text-text font-medium border border-border shadow-sm'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Email and password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('otp')}
                    className={`flex-1 py-1.5 rounded-control transition-colors ${
                      authMethod === 'otp'
                        ? 'bg-surface text-text font-medium border border-border shadow-sm'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Phone OTP
                  </button>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
                {!isMfaStep && authMethod === 'password' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-text-muted">Work email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-text-muted">Password</label>
                        <span className="text-[11px] text-text-muted">Default: Admin@1234</span>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      />
                    </div>
                  </>
                )}

                {!isMfaStep && authMethod === 'otp' && (
                  <div className="space-y-1">
                    <label className="text-text-muted">Mobile number (+91)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 font-mono"
                    />
                  </div>
                )}

                {(isMfaStep || authMethod === 'otp') && (
                  <div className="space-y-2">
                    <label className="text-text-muted">Enter 6-digit code</label>
                    <div className="flex items-center justify-between gap-1.5">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-box-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-11 h-12 text-center text-base font-mono font-medium bg-surface border border-border-strong rounded-control text-text focus:ring-2 focus:ring-accent outline-none"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {isMfaStep ? 'Verify and sign in' : 'Sign in'}
                </Button>
              </form>

              {/* Persona Quick-Login Switcher */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="text-[11px] font-medium text-text-muted">
                  Quick demo sign in (select persona):
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPersona({
                        name: 'Rajesh Sharma',
                        email: 'rajesh@codecraft.ac.in',
                        role: 'owner',
                        branch: 'All',
                      })
                    }
                    className="p-2 text-left rounded-control border border-border bg-surface-sunken hover:bg-surface hover:border-border-strong transition-colors"
                  >
                    <div className="font-medium text-text">Rajesh Sharma</div>
                    <div className="text-[11px] text-text-muted">Owner (Full access)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPersona({
                        name: 'Arjun Mehta',
                        email: 'arjun.mehta@codecraft.ac.in',
                        role: 'trainer',
                        branch: 'Kothrud',
                      })
                    }
                    className="p-2 text-left rounded-control border border-border bg-surface-sunken hover:bg-surface hover:border-border-strong transition-colors"
                  >
                    <div className="font-medium text-text">Arjun Mehta</div>
                    <div className="text-[11px] text-text-muted">Trainer (Zero fee view)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPersona({
                        name: 'Snehal Kulkarni',
                        email: 'snehal@codecraft.ac.in',
                        role: 'counselor',
                        branch: 'Baner',
                      })
                    }
                    className="p-2 text-left rounded-control border border-border bg-surface-sunken hover:bg-surface hover:border-border-strong transition-colors"
                  >
                    <div className="font-medium text-text">Snehal Kulkarni</div>
                    <div className="text-[11px] text-text-muted">Counselor (Admissions)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPersona({
                        name: 'Sunita Accounts',
                        email: 'accounts@codecraft.ac.in',
                        role: 'accounts',
                        branch: 'All',
                      })
                    }
                    className="p-2 text-left rounded-control border border-border bg-surface-sunken hover:bg-surface hover:border-border-strong transition-colors"
                  >
                    <div className="font-medium text-text">Sunita Accounts</div>
                    <div className="text-[11px] text-text-muted">Finance & Collections</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CREATE ACCOUNT (SIGN UP) FORM */}
          {mode === 'signup' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-text">Register staff or student</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Create a new user account with Supabase Authentication
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-text-muted">Full name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Joshi"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@codecraft.ac.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-text-muted">Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="owner">Owner / Director</option>
                      <option value="trainer">Trainer / Faculty</option>
                      <option value="counselor">Counselor</option>
                      <option value="accounts">Accounts</option>
                      <option value="student">Student</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-muted">Branch</label>
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value as Branch)}
                      className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Kothrud">Kothrud Campus</option>
                      <option value="Baner">Baner Campus</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-3"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Create account
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
