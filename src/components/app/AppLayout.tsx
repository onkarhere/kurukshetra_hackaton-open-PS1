import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/app/Sidebar'
import { TopBar } from '@/components/app/TopBar'
import { CommandPalette } from '@/components/app/CommandPalette'
import { ShortcutsModal } from '@/components/app/ShortcutsModal'
import { CopilotDrawer } from '@/components/app/CopilotDrawer'

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex overflow-x-hidden font-sans">
      {/* Global Command Palette */}
      <CommandPalette />

      {/* Global Keyboard Shortcuts Sheet */}
      <ShortcutsModal />

      {/* Global 440px Copilot Slide-over Drawer (⌘J) */}
      <CopilotDrawer />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 max-w-[1440px] w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
