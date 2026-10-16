import React from 'react'
import {
  User,
  Shield,
  Bell,
  Sun,
  Moon,
  Keyboard,
  Building2,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'

export const ProfileView: React.FC = () => {
  const { currentUser, role, setShortcutsOpen, logout } = useApp()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { success } = useToast()

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none py-4">
      <div className="pb-3 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight text-text">Account and profile</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Personal credentials, security preferences and keyboard shortcuts
        </p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-card border border-border bg-surface flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-control bg-surface-sunken border border-border text-text font-medium text-base flex items-center justify-center shrink-0">
            {role.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text capitalize">{currentUser.name}</h2>
            <div className="text-xs text-text-muted font-mono">{currentUser.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-control text-[11px] bg-surface-sunken text-text-muted border border-border font-normal">
                Role: <span className="capitalize font-medium text-text">{role}</span>
              </span>
              <span className="text-xs text-text-muted">CodeCraft Academy Pune</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & MFA Card */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 text-xs">
        <div className="text-xs font-medium text-text">
          Security and authentication
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <div className="font-medium text-text">Two-factor authentication (MFA)</div>
            <div className="text-text-muted text-[11px]">SMS OTP verification on logins</div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium text-text">Active session duration</div>
            <div className="text-text-muted text-[11px]">Auto logout after 8 hours of inactivity</div>
          </div>
          <span className="tabular-nums text-text font-medium">8h 00m</span>
        </div>
      </div>

      {/* Appearance & Shortcuts */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 text-xs">
        <div className="text-xs font-medium text-text">
          Preferences
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <div className="font-medium text-text">Color theme</div>
            <div className="text-text-muted text-[11px]">Currently using {resolvedTheme} mode</div>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Toggle theme
          </Button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium text-text">Keyboard cheat sheet</div>
            <div className="text-text-muted text-[11px]">Quick navigation shortcuts and actions</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShortcutsOpen(true)}>
            View shortcuts (?)
          </Button>
        </div>
      </div>

      {/* Session Management */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 text-xs">
        <div className="text-xs font-medium text-text">Session management</div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium text-text">Sign out of session</div>
            <div className="text-text-muted text-[11px]">End your active session on this workstation</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-danger" />}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
