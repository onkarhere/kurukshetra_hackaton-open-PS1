import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useApp } from '@/context/AppContext'
import { UserRole, Branch } from '@/types'
import { store } from '@/mocks/store'
import { canAccess } from '@/lib/permissions'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: toastError } = useToast()
  const { login, register } = useApp()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sign in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isOtpSent, setIsOtpSent] = useState(false)

  // Sign up fields (strictly student role)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBranch, setRegBranch] = useState<Branch>('Kothrud')

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

  // Handle direct Email + Password sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (authMethod === 'otp') {
      if (!isOtpSent) {
        if (!phone.trim()) {
          setErrorMessage('Please enter your 10-digit mobile number.')
          return
        }
        setIsOtpSent(true)
        success('Verification code generated', 'Demo code: 482913. Enter below to sign in.')
        return
      }

      const enteredOtp = otp.join('')
      // P0-2: Phone OTP must accept only the demo code 482913; never accept any random 6 digits
      if (enteredOtp !== '482913') {
        setErrorMessage('Invalid verification code. Enter the demo code: 482913.')
        return
      }

      setIsLoading(true)
      const res = await login({
        email: 'priya.nair@gmail.com',
        role: 'student',
        isPersonaSwitch: true,
      })
      setIsLoading(false)

      if (res.success) {
        success('Verified successfully', `Signed in with demo phone verification`)
        redirectAfterAuth('student')
      } else {
        setErrorMessage(res.error || 'Verification failed. Please try again.')
      }
      return
    }

    // Standard Email & Password Authentication
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    setIsLoading(true)
    const res = await login({ email: email.trim(), password })
    setIsLoading(false)

    if (res.success) {
      success('Authentication successful', `Signed in as ${email.trim()}`)
      redirectAfterAuth(res.user?.role)
    } else {
      setErrorMessage(res.error || 'Incorrect email or password.')
      toastError('Authentication failed', res.error || 'Incorrect email or password')
    }
  }

  // Handle Account Registration - strictly Student role
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!regName.trim() || !regEmail.trim() || regPassword.length < 6) {
      setErrorMessage('Please provide your full name, a valid email, and a password of at least 6 characters.')
      return
    }

    setIsLoading(true)
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      branch: regBranch,
    })
    setIsLoading(false)

    if (res.success) {
      if (res.message) {
        success('Registration submitted', res.message)
        setMode('signin')
      } else {
        success('Account created', `Welcome, ${regName}! Signed in as student.`)
        redirectAfterAuth('student')
      }
    } else {
      setErrorMessage(res.error || 'Registration failed. Please try again.')
      toastError('Registration error', res.error)
    }
  }

  // Demo Persona Quick-Login Switcher
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
      isPersonaSwitch: true,
    })
    setIsLoading(false)
    if (res.success) {
      success('Switched persona', `Signed in as ${persona.name} (${persona.role})`)
      redirectAfterAuth(persona.role)
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
            <span className="text-[11px] text-text-muted">Batchwise · Enterprise Platform</span>
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
                <span className="font-medium text-text">Supabase cloud security: </span>
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
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMessage(null)
                  setIsOtpSent(false)
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
                Create student account
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
                  Sign in to your account
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Enter your registered credentials to access your dashboard and tools
                </p>
              </div>

              {/* Method Switcher: Email vs Phone OTP */}
              <div className="flex items-center bg-surface-sunken border border-border rounded-control p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('password')
                    setErrorMessage(null)
                    setIsOtpSent(false)
                  }}
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
                  onClick={() => {
                    setAuthMethod('otp')
                    setErrorMessage(null)
                    setIsOtpSent(false)
                  }}
                  className={`flex-1 py-1.5 rounded-control transition-colors ${
                    authMethod === 'otp'
                      ? 'bg-surface text-text font-medium border border-border shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Phone OTP
                </button>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
                {/* Email + Password fields */}
                {authMethod === 'password' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-text-muted font-normal">Work email address</label>
                      <input
                        type="email"
                        placeholder="rajesh@codecraft.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-text-muted font-normal">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] text-text-muted hover:text-text flex items-center gap-1"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 pr-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Phone OTP fields */}
                {authMethod === 'otp' && (
                  <>
                    {!isOtpSent ? (
                      <div className="space-y-1">
                        <label className="text-text-muted font-normal">Registered mobile number (+91)</label>
                        <input
                          type="tel"
                          placeholder="9820155432"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 font-mono"
                        />
                        <p className="text-[11px] text-text-muted font-mono pt-1">
                          Demo code: <strong>482913</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-muted">Verification code sent to {phone}</span>
                          <button
                            type="button"
                            onClick={() => setIsOtpSent(false)}
                            className="text-accent hover:underline text-[11px]"
                          >
                            Change number
                          </button>
                        </div>
                        <div className="p-2 rounded-control bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
                          Demo code: <strong>482913</strong>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
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
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {authMethod === 'otp'
                    ? isOtpSent
                      ? 'Verify and sign in'
                      : 'Send verification code'
                    : 'Sign in'}
                </Button>
              </form>

              {/* Demo accounts Section */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="text-[11px] font-medium text-text-muted">
                  Demo accounts (Quick sign in):
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
                    <div className="text-[11px] text-text-muted">Owner · Pass: Admin@1234</div>
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
                    <div className="text-[11px] text-text-muted">Trainer · Pass: Trainer@1234</div>
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
                    <div className="text-[11px] text-text-muted">Counselor · Pass: Counselor@1234</div>
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
                    <div className="text-[11px] text-text-muted">Accounts · Pass: Accounts@1234</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPersona({
                        name: 'Priya Nair',
                        email: 'priya.nair@gmail.com',
                        role: 'student',
                        branch: 'Kothrud',
                      })
                    }
                    className="col-span-2 p-2 text-left rounded-control border border-border bg-surface-sunken hover:bg-surface hover:border-border-strong transition-colors"
                  >
                    <div className="font-medium text-text">Priya Nair</div>
                    <div className="text-[11px] text-text-muted">Student · Pass: Student@1234</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CREATE ACCOUNT (SIGN UP) FORM */}
          {mode === 'signup' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-text">Create a student account</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Sign up for course access. Staff roles are assigned by an institute owner.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-text-muted font-normal">Full name</label>
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
                  <label className="text-text-muted font-normal">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted font-normal">Password</label>
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

                <div className="space-y-1">
                  <label className="text-text-muted font-normal">Branch</label>
                  <select
                    value={regBranch}
                    onChange={(e) => setRegBranch(e.target.value as Branch)}
                    className="w-full bg-surface border border-border-strong rounded-control p-2.5 text-xs text-text outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="Kothrud">Kothrud Campus</option>
                    <option value="Baner">Baner Campus</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-3"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Register student account
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
