import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '@/mocks/store'
import { User, UserRole, Branch } from '@/types'

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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  
  // Reactively track mockStore updates
  const storeSnapshot = useSyncExternalStore(
    (onStoreChange) => store.subscribe(onStoreChange),
    () => ({
      currentUser: { ...store.currentUser },
      branch: store.selectedBranch,
      approvals: store.approvals,
    })
  )

  const [copilotOpen, setCopilotOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

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

      // ⌘K / Ctrl+K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
        return
      }

      // ⌘J / Ctrl+J: Copilot Drawer
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setCopilotOpen((prev) => !prev)
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
          if (storeSnapshot.currentUser.role !== 'trainer') {
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
  }, [navigate, storeSnapshot.currentUser.role])

  const unreadApprovalsCount = storeSnapshot.approvals.filter((a) => a.status === 'pending').length

  return (
    <AppContext.Provider
      value={{
        currentUser: storeSnapshot.currentUser,
        role: storeSnapshot.currentUser.role,
        setRole: (role: UserRole) => store.setRole(role),
        branch: storeSnapshot.branch,
        setBranch: (b) => store.setBranch(b),
        copilotOpen,
        setCopilotOpen,
        toggleCopilot,
        commandPaletteOpen,
        setCommandPaletteOpen,
        shortcutsOpen,
        setShortcutsOpen,
        unreadApprovalsCount,
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
