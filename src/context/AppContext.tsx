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
  login: (userOrCredentials: { email: string; password?: string; role?: UserRole; name?: string; branch?: Branch | 'All' }) => Promise<{ success: boolean; error?: string }>
  register: (params: { name: string; email: string; password: string; role: UserRole; branch: Branch }) => Promise<{ success: boolean; error?: string }>
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

  // Helper to read/write custom registered accounts
  const getStoredAccounts = (): Record<string, { name: string; email: string; password?: string; role: UserRole; branch: Branch }> => {
    try {
      const raw = localStorage.getItem('batchwise_registered_users')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  // Login handler supporting Supabase Auth + registered accounts + demo personas
  const login = async (creds: { email: string; password?: string; role?: UserRole; name?: string; branch?: Branch | 'All' }) => {
    try {
      const normalizedEmail = creds.email.trim().toLowerCase()

      // 1. Attempt Supabase Auth sign in if password provided
      if (creds.password) {
        try {
          const { data, error } = await signInWithSupabase(normalizedEmail, creds.password)
          if (!error && data?.user) {
            const meta = data.user.user_metadata || {}
            const userObj: User = {
              id: data.user.id,
              email: data.user.email || normalizedEmail,
              name: meta.name || creds.name || normalizedEmail.split('@')[0],
              role: (meta.role as UserRole) || creds.role || 'owner',
              branch: (meta.branch as Branch) || creds.branch || 'Kothrud',
            }
            store.login(userObj)
            return { success: true }
          }
        } catch {
          // Continue to fallback
        }
      }

      // 2. Check locally registered users
      const stored = getStoredAccounts()
      const registered = stored[normalizedEmail]
      if (registered) {
        if (creds.password && registered.password && creds.password !== registered.password) {
          return { success: false, error: 'Incorrect password. Please verify and try again.' }
        }
        const userObj: User = {
          id: `usr-${registered.email}`,
          name: registered.name,
          email: registered.email,
          role: registered.role,
          branch: registered.branch,
        }
        store.login(userObj)
        return { success: true }
      }

      // 3. Fallback persona / pre-configured accounts
      const determinedRole: UserRole =
        creds.role ||
        (normalizedEmail.includes('trainer') || normalizedEmail.includes('arjun')
          ? 'trainer'
          : normalizedEmail.includes('counselor') || normalizedEmail.includes('snehal')
          ? 'counselor'
          : normalizedEmail.includes('account') || normalizedEmail.includes('sunita')
          ? 'accounts'
          : normalizedEmail.includes('student') || normalizedEmail.includes('priya')
          ? 'student'
          : 'owner')

      const determinedName: string =
        creds.name ||
        (determinedRole === 'trainer'
          ? 'Arjun Mehta'
          : determinedRole === 'counselor'
          ? 'Snehal Kulkarni'
          : determinedRole === 'accounts'
          ? 'Sunita Accounts'
          : determinedRole === 'student'
          ? 'Priya Nair'
          : 'Rajesh Sharma')

      const determinedBranch: Branch | 'All' =
        creds.branch || (determinedRole === 'trainer' ? 'Kothrud' : determinedRole === 'counselor' ? 'Baner' : 'All')

      const userObj: User = {
        id: `usr-${Date.now()}`,
        name: determinedName,
        email: normalizedEmail,
        role: determinedRole,
        branch: determinedBranch,
      }
      store.login(userObj)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' }
    }
  }

  // Registration handler supporting Supabase Auth + local persistence
  const register = async (params: { name: string; email: string; password: string; role: UserRole; branch: Branch }) => {
    const normalizedEmail = params.email.trim().toLowerCase()
    try {
      // 1. Try Supabase Auth
      try {
        await signUpWithSupabase(normalizedEmail, params.password, {
          name: params.name,
          role: params.role,
          branch: params.branch,
        })
      } catch {
        // Supabase network fallback
      }

      // 2. Persist locally so user can always log in immediately
      const accounts = getStoredAccounts()
      accounts[normalizedEmail] = {
        name: params.name,
        email: normalizedEmail,
        password: params.password,
        role: params.role,
        branch: params.branch,
      }
      localStorage.setItem('batchwise_registered_users', JSON.stringify(accounts))

      const userObj: User = {
        id: `usr-${Date.now()}`,
        name: params.name,
        email: normalizedEmail,
        role: params.role,
        branch: params.branch,
      }

      store.login(userObj)
      return { success: true }
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
