import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/mocks/store'
import { User, UserRole, Branch, ApprovalAction } from '@/types'

interface AppContextType {
  currentUser: User
  role: UserRole
  setRole: (role: UserRole) => void
  branch: Branch | 'All'
  setBranch: (branch: Branch | 'All') => void
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

  const [copilotOpen, setCopilotOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pendingAskQuery, setPendingAskQuery] = useState<string | null>(null)

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser({ ...store.currentUser })
      setCurrentBranch(store.selectedBranch)
      setApprovals([...store.approvals])
    })
    return () => {
      unsub()
    }
  }, [])

  const toggleCopilot = () => setCopilotOpen((prev) => !prev)

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
