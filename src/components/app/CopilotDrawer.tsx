import React from 'react'
import { useApp } from '@/context/AppContext'
import { CopilotView } from '@/features/copilot/CopilotView'
import { useLocation } from 'react-router-dom'

export const CopilotDrawer: React.FC = () => {
  const { copilotOpen, setCopilotOpen } = useApp()
  const location = useLocation()

  if (!copilotOpen) return null

  // In full-screen /copilot route, don't show drawer
  if (location.pathname === '/copilot') return null

  const getContextLabel = () => {
    if (location.pathname.startsWith('/students/')) return 'Context: Student Profile'
    if (location.pathname.startsWith('/batches/')) return 'Context: Batch Details'
    if (location.pathname === '/timetable') return 'Context: Timetable Scheduling'
    if (location.pathname === '/fees') return 'Context: Fees & Instalments Ledger'
    if (location.pathname === '/risk') return 'Context: At-Risk Board'
    return 'Context: CodeCraft Academy'
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={() => setCopilotOpen(false)}
    >
      <div
        className="w-full max-w-[440px] h-full bg-surface shadow-2xl border-l border-border animate-slide-in-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CopilotView
          pageContext={getContextLabel()}
          isDrawer={true}
          onCloseDrawer={() => setCopilotOpen(false)}
        />
      </div>
    </div>
  )
}
