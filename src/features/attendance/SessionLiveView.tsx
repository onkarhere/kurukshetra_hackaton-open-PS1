import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  QrCode,
  Maximize2,
  Clock,
  CheckCircle2,
  Users,
  Video,
  Upload,
  UserX,
  FileSpreadsheet,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'

interface Attendee {
  id: string
  name: string
  phone: string
  status: 'present' | 'absent' | 'online' | 'late'
  checkInTime?: string
  method?: 'QR Code' | 'Zoom Sync' | 'Manual'
}

export const SessionLiveView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success } = useToast()

  const [countdown, setCountdown] = useState(30)
  const [fullscreenQR, setFullscreenQR] = useState(false)
  const [unmatchedQueue, setUnmatchedQueue] = useState([
    { zoomName: 'priya_nair_iphone', suggestedId: 'std-priya-01', confidence: 94 },
    { zoomName: 'aditya_p_desktop', suggestedId: 'std-aditya-08', confidence: 88 },
  ])

  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: 'std-aarav-06', name: 'Aarav Deshmukh', phone: '+91 98223 77112', status: 'present', checkInTime: '18:58 IST', method: 'QR Code' },
    { id: 'std-tanvi-07', name: 'Tanvi Sharma', phone: '+91 98908 22345', status: 'present', checkInTime: '19:01 IST', method: 'QR Code' },
    { id: 'std-sneha-09', name: 'Sneha Shinde', phone: '+91 98224 88711', status: 'online', checkInTime: '19:04 IST', method: 'Zoom Sync' },
    { id: 'std-devendra-03', name: 'Devendra Joshi', phone: '+91 98902 44781', status: 'present', checkInTime: '19:08 IST', method: 'QR Code' },
    { id: 'std-amit-04', name: 'Amit Sane', phone: '+91 97631 88920', status: 'late', checkInTime: '19:16 IST', method: 'Manual' },
    { id: 'std-priya-01', name: 'Priya Nair', phone: '+91 98201 55432', status: 'absent' },
    { id: 'std-rohan-02', name: 'Rohan Kulkarni', phone: '+91 98450 11988', status: 'absent' },
    { id: 'std-sunita-05', name: 'Sunita Rao', phone: '+91 98810 66324', status: 'absent' },
  ])

  // 30s rotating QR code countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleMatchConfirm = (zoomName: string) => {
    setUnmatchedQueue((prev) => prev.filter((item) => item.zoomName !== zoomName))
    setAttendees((prev) =>
      prev.map((a) => (a.id === 'std-priya-01' ? { ...a, status: 'online', checkInTime: '19:12 IST', method: 'Zoom Sync' } : a))
    )
    success('Confirmed online attendee match', `${zoomName} linked to Priya Nair`)
  }

  const handleMarkRemainingAbsent = () => {
    success('Marked remaining 3 students absent and logged attendance records.')
  }

  const presentCount = attendees.filter((a) => a.status === 'present' || a.status === 'online' || a.status === 'late').length

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/timetable')}
            className="text-xs text-fg-muted hover:text-fg p-1 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
              <h1 className="text-lg font-bold text-fg">Live Class: Java Full-Stack B3</h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Room 3 & Zoom Hybrid
              </span>
            </div>
            <p className="text-xs text-fg-muted mt-0.5">
              Faculty: Arjun Mehta · Spring Boot & Data JPA Transaction Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreenQR(true)}
            leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
          >
            Project QR Fullscreen
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => success('Session finalized and attendance synced.')}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Rotating QR (4 cols) + Right Roster Grid (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left QR Card */}
        <div className="lg:col-span-4 rounded-card border border-border bg-surface p-5 text-center space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
              Dynamic Check-in QR
            </h3>
            <p className="text-[11px] text-fg-muted">
              Auto-refreshes every 30s to prevent geo & screenshot forwarding
            </p>
          </div>

          {/* QR Box with animated ring */}
          <div className="relative mx-auto w-56 h-56 rounded-card border-2 border-primary/30 bg-surface-2 flex flex-col items-center justify-center p-4 shadow-inner">
            <div className="w-40 h-40 bg-white p-3 rounded-card shadow-sm flex items-center justify-center">
              {/* Scalable QR SVG placeholder representation */}
              <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-black rounded">
                {[...Array(36)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-white'
                        : 'bg-black'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="absolute bottom-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-border text-[11px] font-mono text-fg-muted shadow-sm">
              <Clock className="w-3 h-3 text-primary animate-spin" />
              <span>Rotates in {countdown}s</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-fg-muted px-2">
              <span>Geo-fenced radius: 50m</span>
              <span className="text-success font-semibold">Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCountdown(30)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Force Refresh QR
            </Button>
          </div>
        </div>

        {/* Right Roster Grid & Live Joiners */}
        <div className="lg:col-span-8 rounded-card border border-border bg-surface p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                  Live Check-in Roster ({presentCount} of {attendees.length} Present)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-success">
                {Math.round((presentCount / attendees.length) * 100)}% Turnout
              </span>
            </div>

            {/* Unmatched online names queue */}
            {unmatchedQueue.length > 0 && (
              <div className="my-3 p-3 rounded-btn border border-warning/40 bg-warning/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-warning">
                  <span>Zoom Attendee Matching Queue ({unmatchedQueue.length})</span>
                  <span className="text-[10px] font-mono">AI Name Match</span>
                </div>
                {unmatchedQueue.map((item) => (
                  <div
                    key={item.zoomName}
                    className="flex items-center justify-between bg-surface p-2 rounded border border-warning/20 text-xs"
                  >
                    <div>
                      <span className="font-mono text-fg font-medium">"{item.zoomName}"</span>
                      <span className="text-fg-muted mx-2">→ Match:</span>
                      <span className="font-semibold text-primary">Priya Nair ({item.confidence}%)</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => handleMatchConfirm(item.zoomName)}
                    >
                      Confirm Match
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Roster list */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 mt-3">
              {attendees.map((a) => (
                <div
                  key={a.id}
                  className={`p-2.5 rounded-btn border flex items-center justify-between text-xs transition-all ${
                    a.status === 'present'
                      ? 'border-success/30 bg-success/5'
                      : a.status === 'online'
                      ? 'border-info/30 bg-info/5'
                      : a.status === 'late'
                      ? 'border-warning/30 bg-warning/5'
                      : 'border-border bg-surface-2/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <StatusPill status={a.status} size="sm" />
                    <span className="font-medium text-fg">{a.name}</span>
                    <span className="text-fg-muted font-mono text-[11px]">{a.phone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {a.checkInTime && (
                      <span className="text-[11px] font-mono text-fg-muted">
                        {a.checkInTime} ({a.method})
                      </span>
                    )}
                    {a.status === 'absent' && (
                      <button
                        onClick={() => {
                          setAttendees((prev) =>
                            prev.map((item) =>
                              item.id === a.id
                                ? { ...item, status: 'present', checkInTime: '19:15 IST', method: 'Manual' }
                                : item
                            )
                          )
                          success(`Marked ${a.name} present manually`)
                        }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => success('Zoom cloud recording sync triggered.')}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Sync Zoom Log
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => success('Upload attendance CSV modal opened.')}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Import CSV
              </Button>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleMarkRemainingAbsent}
              leftIcon={<UserX className="w-3.5 h-3.5" />}
            >
              Mark Remaining Absent
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Projector Modal */}
      {fullscreenQR && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 animate-fade-in"
          onClick={() => setFullscreenQR(false)}
        >
          <div className="text-center text-white space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Scan with Camera or Student Portal</h2>
            <p className="text-sm text-neutral-400">Java Full-Stack B3 · CodeCraft Academy Kothrud</p>

            <div className="w-80 h-80 bg-white p-6 rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
              <div className="grid grid-cols-6 gap-2 w-full h-full p-2 bg-black rounded">
                {[...Array(36)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-white'
                        : 'bg-black'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-sm font-mono text-neutral-400">
              Rotates in {countdown}s · Tap anywhere to exit fullscreen
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
