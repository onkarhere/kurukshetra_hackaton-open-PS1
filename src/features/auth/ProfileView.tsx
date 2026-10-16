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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'

export const ProfileView: React.FC = () => {
  const { currentUser, role, setShortcutsOpen } = useApp()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { success } = useToast()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in select-none py-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-fg">Account & Profile</h1>
        <p className="text-xs text-fg-muted mt-0.5">
          Personal credentials, security preferences, and keyboard shortcuts
        </p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-card border border-border bg-surface flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-lg flex items-center justify-center shrink-0">
            {role.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-fg capitalize">{currentUser.name}</h2>
            <div className="text-xs text-fg-muted font-mono">{currentUser.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Role: {role}
              </span>
              <span className="text-[11px] text-fg-muted">CodeCraft Academy Pune</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & MFA Card */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 shadow-sm text-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
          Security & Authentication
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <div className="font-semibold text-fg">Two-Factor Authentication (MFA)</div>
            <div className="text-fg-muted text-[11px]">SMS OTP verification on logins</div>
          </div>
          <span className="text-success font-semibold">Enabled ✓</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-fg">Active Session Duration</div>
            <div className="text-fg-muted text-[11px]">Auto logout after 8 hours of inactivity</div>
          </div>
          <span className="font-mono text-fg">8h 00m</span>
        </div>
      </div>

      {/* Appearance & Shortcuts */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 shadow-sm text-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
          Preferences
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <div className="font-semibold text-fg">Color Theme</div>
            <div className="text-fg-muted text-[11px]">Currently using {resolvedTheme} mode</div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Toggle Theme
          </Button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-fg">Keyboard Cheat Sheet</div>
            <div className="text-fg-muted text-[11px]">Quick navigation shortcuts and actions</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShortcutsOpen(true)}>
            View Shortcuts (?)
          </Button>
        </div>
      </div>
    </div>
  )
}
