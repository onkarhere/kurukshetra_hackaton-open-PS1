import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/mocks/store'
import { User, UserRole, Branch, ApprovalAction } from '@/types'
import { signInWithSupabase, signUpWithSupabase, signOutSupabase, getSupabaseSession } from '@/lib/supabase'

interface AppContextType {
  currentUser: User
  role: UserRole
  setRole: (role: UserRole) => void
  branch: Branch | 'All'
  setBranch: (branch: Branch | 'All') => void
  isAuthenticated: boolean
  login: (userOrCredentials: { email: string; password?: string; role?: UserRole; name?: string; branch?: Branch | 'All'; isPersonaSwitch?: boolean }) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (params: { name: string; email: string; password: string; role?: UserRole; branch?: Branch }) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
  copilotOpen: boolean
  setCopilotOpen: (open: boolean) => void
  toggleCopilot: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
  unreadApprovalsCount: number
  pendingAskQuery: string | null
  setPendingAskQuery: (query: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()

  // Track reactive store state cleanly
  const [currentUser, setCurrentUser] = useState<User>({ ...store.currentUser })
  const [currentBranch, setCurrentBranch] = useState<Branch | 'All'>(store.selectedBranch)
  const [approvals, setApprovals] = useState<ApprovalAction[]>([...store.approvals])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(store.isAuthenticated)

  const [copilotOpen, setCopilotOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pendingAskQuery, setPendingAskQuery] = useState<string | null>(null)

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser({ ...store.currentUser })
      setCurrentBranch(store.selectedBranch)
      setApprovals([...store.approvals])
      setIsAuthenticated(store.isAuthenticated)
    })
    return () => {
      unsub()
    }
  }, [])

  // Sync Supabase session on mount if available
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getSupabaseSession()
        if (session?.user) {
          const meta = session.user.user_metadata || {}
          const userObj: User = {
            id: session.user.id,
            email: session.user.email || 'user@codecraft.ac.in',
            name: meta.name || session.user.email?.split('@')[0] || 'Authenticated User',
            role: (meta.role as UserRole) || 'owner',
            branch: (meta.branch as Branch) || 'Kothrud',
          }
          store.login(userObj)
        }
      } catch (err) {
        // Fallback to local store session
      }
    }
    checkSession()
  }, [])

  const toggleCopilot = () => setCopilotOpen((prev) => !prev)

  // P0-2: Strict demo credentials map
  const DEMO_CREDENTIALS: Record<
    string,
    { password: string; name: string; role: UserRole; branch: Branch | 'All' }
  > = {
    'rajesh@codecraft.ac.in': {
      password: 'Admin@1234',
      name: 'Rajesh Sharma',
      role: 'owner',
      branch: 'All',
    },
    'arjun.mehta@codecraft.ac.in': {
      password: 'Trainer@1234',
      name: 'Arjun Mehta',
      role: 'trainer',
      branch: 'Kothrud',
    },
    'snehal@codecraft.ac.in': {
      password: 'Counselor@1234',
      name: 'Snehal Kulkarni',
      role: 'counselor',
      branch: 'Kothrud',
    },
    'accounts@codecraft.ac.in': {
      password: 'Accounts@1234',
      name: 'Sunita Accounts',
      role: 'accounts',
      branch: 'All',
    },
    'priya.nair@gmail.com': {
      password: 'Student@1234',
      name: 'Priya Nair',
      role: 'student',
      branch: 'Kothrud',
    },
  }

  // Login handler: Supabase Auth OR exact Demo Credentials only
  const login = async (creds: {
    email: string
    password?: string
    role?: UserRole
    name?: string
    branch?: Branch | 'All'
    isPersonaSwitch?: boolean
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const normalizedEmail = creds.email.trim().toLowerCase()

      // Quick-access demo persona switch
      if (creds.isPersonaSwitch && creds.role) {
        const demo = Object.values(DEMO_CREDENTIALS).find((d) => d.role === creds.role)
        const demoEmail = Object.keys(DEMO_CREDENTIALS).find((k) => DEMO_CREDENTIALS[k].role === creds.role) || normalizedEmail
        const userObj: User = {
          id: `usr-${creds.role}`,
          email: demoEmail,
          name: demo?.name || creds.name || 'User',
          role: creds.role,
          branch: demo?.branch || creds.branch || 'Kothrud',
        }
        store.login(userObj)
        return { success: true, user: userObj }
      }

      // 1. Attempt Supabase Auth sign in if password provided
      if (creds.password) {
        try {
          const { data, error } = await signInWithSupabase(normalizedEmail, creds.password)
          if (!error && data?.user) {
            const meta = data.user.user_metadata || {}
            const userObj: User = {
              id: data.user.id,
              email: data.user.email || normalizedEmail,
              name: meta.name || normalizedEmail.split('@')[0],
              role: (meta.role as UserRole) || 'student',
              branch: (meta.branch as Branch) || 'Kothrud',
            }
            store.login(userObj)
            return { success: true, user: userObj }
          }
        } catch {
          // Continue to demo credentials verification
        }
      }

      // 2. Check demo accounts and passwords strictly
      const demoAccount = DEMO_CREDENTIALS[normalizedEmail]
      if (demoAccount) {
        if (creds.password === demoAccount.password) {
          const userObj: User = {
            id: `usr-${demoAccount.role}`,
            email: normalizedEmail,
            name: demoAccount.name,
            role: demoAccount.role,
            branch: demoAccount.branch,
          }
          store.login(userObj)
          return { success: true, user: userObj }
        } else {
          return { success: false, error: 'Incorrect email or password' }
        }
      }

      // Reject all unrecognized emails or passwords
      return { success: false, error: 'Incorrect email or password' }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication failed' }
    }
  }

  // Registration handler: Calls Supabase sign-up only, always role 'student'
  const register = async (params: {
    name: string
    email: string
    password: string
    branch?: Branch
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    const normalizedEmail = params.email.trim().toLowerCase()
    try {
      const { data, error } = await signUpWithSupabase(normalizedEmail, params.password, {
        name: params.name,
        role: 'student',
        branch: params.branch || 'Kothrud',
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data?.user && !data.session) {
        return {
          success: true,
          message: 'Check your email to confirm your account',
        }
      }

      if (data?.user && data.session) {
        const userObj: User = {
          id: data.user.id,
          name: params.name,
          email: normalizedEmail,
          role: 'student',
          branch: params.branch || 'Kothrud',
        }
        store.login(userObj)
        return { success: true }
      }

      return {
        success: true,
        message: 'Check your email to confirm your account',
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' }
    }
  }

  // Logout handler
  const logout = async () => {
    await signOutSupabase()
    store.logout()
    navigate('/login')
  }

  // Keyboard shortcut listener
  useEffect(() => {
    let pendingGKey = false
    let gKeyTimeout: any = null

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable

      // ⌘K / Ctrl+K and ⌘J / Ctrl+J both open the command bar
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'j')) {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      if (isInput) return

      // ? : Shortcuts Sheet
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
        return
      }

      // G prefix navigation: G then H/S/B/T/F/A
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        pendingGKey = true
        clearTimeout(gKeyTimeout)
        gKeyTimeout = setTimeout(() => {
          pendingGKey = false
        }, 1200)
        return
      }

      if (pendingGKey) {
        pendingGKey = false
        clearTimeout(gKeyTimeout)
        const key = e.key.toLowerCase()
        if (key === 'h') {
          e.preventDefault()
          navigate('/')
        } else if (key === 's') {
          e.preventDefault()
          navigate('/students')
        } else if (key === 'b') {
          e.preventDefault()
          navigate('/batches')
        } else if (key === 't') {
          e.preventDefault()
          navigate('/timetable')
        } else if (key === 'f') {
          e.preventDefault()
          if (currentUser.role !== 'trainer') {
            navigate('/fees')
          }
        } else if (key === 'a') {
          e.preventDefault()
          navigate('/approvals')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(gKeyTimeout)
    }
  }, [navigate, currentUser.role])

  const unreadApprovalsCount = approvals.filter((a) => a.status === 'pending').length

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        setRole: (role: UserRole) => store.setRole(role),
        branch: currentBranch,
        setBranch: (b) => store.setBranch(b),
        isAuthenticated,
        login,
        register,
        logout,
        copilotOpen,
        setCopilotOpen,
        toggleCopilot,
        commandPaletteOpen,
        setCommandPaletteOpen,
        shortcutsOpen,
        setShortcutsOpen,
        unreadApprovalsCount,
        pendingAskQuery,
        setPendingAskQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
