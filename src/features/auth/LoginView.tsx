import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('rajesh@codecraft.ac.in')
  const [password, setPassword] = useState('••••••••••••')
  const [phone, setPhone] = useState('+91 98201 55432')
  const [otp, setOtp] = useState(['4', '8', '1', '9', '2', '0'])
  const [isMfaStep, setIsMfaStep] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (authMethod === 'password' && !isMfaStep) {
      setIsMfaStep(true)
      success('Password accepted', 'Enter the 6-digit MFA security code sent to your registered phone.')
      return
    }

    success('Welcome to Batchwise Copilot', 'Authenticated as Rajesh Sharma (Owner)')
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-bg text-fg select-none font-sans">
      {/* Left Brand Panel (5 cols) */}
      <div className="md:col-span-5 bg-gradient-to-br from-primary/10 via-surface to-bg border-r border-border p-8 md:p-12 flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            BW
          </div>
          <span className="font-bold text-sm text-fg tracking-tight">Batchwise Copilot</span>
        </div>

        <div className="space-y-6 my-auto max-w-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
              Enterprise Operations Copilot
            </span>
            <h1 className="text-2xl font-bold text-fg tracking-tight mt-1 leading-snug">
              Ask your institute anything. Approve what it wants to do. See exactly how it got there.
            </h1>
          </div>

          <div className="space-y-3.5 text-xs text-fg-muted">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-fg">Answers with receipts:</strong> Every result displays the exact read-only SQL, table sources and filters applied.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-fg">Nothing happens without approval:</strong> WhatsApp reminders, timetable adjustments and fee waivers require explicit sign-off.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-fg">Clash-free timetables in seconds:</strong> AI resolves faculty overlaps and room limits with clear before/after diffs.
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono text-fg-muted">
          CodeCraft Academy · Pune, Maharashtra
        </div>
      </div>

      {/* Right Form Panel (7 cols) */}
      <div className="md:col-span-7 p-8 md:p-16 flex items-center justify-center">
        <div className={`w-full max-w-sm space-y-6 ${isShaking ? 'animate-bounce' : ''}`}>
          <div>
            <h2 className="text-xl font-bold text-fg">
              {isMfaStep ? 'Two-Factor Authentication' : 'Sign in to Batchwise'}
            </h2>
            <p className="text-xs text-fg-muted mt-1">
              {isMfaStep
                ? 'Enter the 6-digit verification code sent to +91 98••• ••432'
                : 'Enter your credentials to manage operations, attendance and fees'}
            </p>
          </div>

          {!isMfaStep && (
            <div className="flex items-center bg-surface-2 border border-border rounded-btn p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`flex-1 py-1.5 rounded-btn transition-colors ${
                  authMethod === 'password' ? 'bg-surface text-fg font-semibold shadow-sm' : 'text-fg-muted'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('otp')}
                className={`flex-1 py-1.5 rounded-btn transition-colors ${
                  authMethod === 'otp' ? 'bg-surface text-fg font-semibold shadow-sm' : 'text-fg-muted'
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
                  <label className="text-fg-muted">Institute Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-2 border border-border rounded-btn p-2.5 text-xs text-fg outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-fg-muted">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-surface-2 border border-border rounded-btn p-2.5 text-xs text-fg outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            {!isMfaStep && authMethod === 'otp' && (
              <div className="space-y-1">
                <label className="text-fg-muted">Mobile Number (+91)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-btn p-2.5 text-xs text-fg outline-none focus:border-primary font-mono"
                />
              </div>
            )}

            {/* 6-box OTP input */}
            {(isMfaStep || authMethod === 'otp') && (
              <div className="space-y-2">
                <label className="text-fg-muted">Enter 6-Digit Code</label>
                <div className="flex items-center justify-between gap-1.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-11 h-12 text-center text-base font-mono font-bold bg-surface-2 border border-border rounded-btn text-fg focus:border-primary outline-none"
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-semibold"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {isMfaStep ? 'Verify & Continue' : 'Sign In'}
            </Button>
          </form>

          <div className="p-3 rounded-btn bg-surface-2 border border-border text-[11px] text-fg-muted text-center">
            Demo login enabled: Click Sign In to log in with pre-filled mock credentials.
          </div>
        </div>
      </div>
    </div>
  )
}
