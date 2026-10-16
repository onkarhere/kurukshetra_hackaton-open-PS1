import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('rajesh@codecraft.ac.in')
  const [password, setPassword] = useState('••••••••••••')
  const [phone, setPhone] = useState('+91 98201 55432')
  const [otp, setOtp] = useState(['4', '8', '1', '9', '2', '0'])
  const [isMfaStep, setIsMfaStep] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (authMethod === 'password' && !isMfaStep) {
      setIsMfaStep(true)
      success('Password verified', 'Enter the 6-digit MFA security code sent to your registered device.')
      return
    }

    success('Authentication successful', 'Signed in as Rajesh Sharma (Owner)')
    navigate('/')
  }

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0]
    const copy = [...otp]
    copy[index] = val
    setOtp(copy)

    // auto focus next
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
            <span className="text-[11px] text-text-muted">Batchwise</span>
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
                <span className="font-medium text-text">Complete provenance: </span>
                Every metric and operational decision is backed by explicit queries and verified records.
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
      <div className="md:col-span-7 p-8 md:p-16 flex items-center justify-center bg-surface">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text">
              {isMfaStep ? 'Two-factor verification' : 'Sign in'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
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
                className={`flex-1 py-1.5 rounded-control transition-colors font-normal ${
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
                className={`flex-1 py-1.5 rounded-control transition-colors font-normal ${
                  authMethod === 'otp'
                    ? 'bg-surface text-text font-medium border border-border shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Phone OTP
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
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
                  <label className="text-text-muted">Password</label>
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

            {/* 6-box OTP input */}
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
              className="w-full"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {isMfaStep ? 'Verify and continue' : 'Sign in'}
            </Button>
          </form>

          <div className="p-3 rounded-control bg-surface-sunken border border-border text-xs text-text-muted text-center">
            Demo login: Click <span className="text-text font-medium">Sign in</span> to access all modules with pre-filled credentials.
          </div>
        </div>
      </div>
    </div>
  )
}
