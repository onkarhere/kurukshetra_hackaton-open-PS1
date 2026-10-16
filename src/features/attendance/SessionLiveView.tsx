import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Maximize2,
  Clock,
  CheckCircle2,
  Users,
  Video,
  Upload,
  UserX,
  ArrowLeft,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

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
    success('Confirmed online attendee match', `${zoomName} matched to Priya Nair`)
  }

  const handleMarkRemainingAbsent = () => {
    success('Marked remaining absent students.')
  }

  const presentCount = attendees.filter((a) => a.status === 'present' || a.status === 'online' || a.status === 'late').length

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/timetable')}
            className="text-xs text-text-muted hover:text-text p-1 rounded-control transition-colors"
            aria-label="Back to timetable"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-text">Live: Java Full-Stack B3 (Kothrud)</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-sunken text-text-muted">
                Room 3 & Zoom Hybrid
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Trainer: Arjun Mehta · Spring Boot & Data JPA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFullscreenQR(true)}
            leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
          >
            Project QR fullscreen
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => success('Session finalized and attendance synced.')}
          >
            End session
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Rotating QR (4 cols) + Right Roster Grid (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left QR Card */}
        <div className="lg:col-span-4 rounded-card border border-border bg-surface p-4 text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
              Dynamic check-in QR
            </h3>
            <p className="text-[11px] text-text-muted">
              Auto-refreshes every 30s to prevent geo and screenshot sharing
            </p>
          </div>

          {/* QR Box */}
          <div className="relative mx-auto w-52 h-52 rounded-card border border-border bg-surface-sunken flex flex-col items-center justify-center p-4">
            <div className="w-36 h-36 bg-white p-2.5 rounded border border-border flex items-center justify-center">
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

            <div className="absolute bottom-2 flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-text-muted">
              <Clock className="w-3 h-3 text-text-muted" />
              <span>Rotates in {countdown}s</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted px-2">
              <span>Geo-fenced radius: 50m</span>
              <span className="text-success font-medium">Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCountdown(30)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Force refresh QR
            </Button>
          </div>
        </div>

        {/* Right Roster Grid & Live Joiners */}
        <div className="lg:col-span-8 rounded-card border border-border bg-surface p-4 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-text-muted" />
                <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                  Check-in roster ({presentCount} of {attendees.length} present)
                </h3>
              </div>
              <span className="text-xs font-medium tabular-nums text-text">
                {Math.round((presentCount / attendees.length) * 100)}% Turnout
              </span>
            </div>

            {/* Unmatched online names queue */}
            {unmatchedQueue.length > 0 && (
              <div className="my-3 p-3 rounded-control border border-border bg-surface-sunken space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-text">
                  <span>Zoom attendee matching queue ({unmatchedQueue.length})</span>
                  <span className="text-[11px] text-text-muted">Confidence match</span>
                </div>
                {unmatchedQueue.map((item) => (
                  <div
                    key={item.zoomName}
                    className="flex items-center justify-between bg-surface p-2 rounded-control border border-border text-xs"
                  >
                    <div>
                      <span className="font-mono text-text font-medium">&quot;{item.zoomName}&quot;</span>
                      <span className="text-text-muted mx-2">→ Match:</span>
                      <span className="font-medium text-text">Priya Nair ({item.confidence}%)</span>
                    </div>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleMatchConfirm(item.zoomName)}
                    >
                      Confirm match
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
                  className="p-2.5 rounded-control border border-border bg-surface hover:bg-surface-sunken/40 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {a.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : a.status === 'online' ? (
                      <span className="inline-flex items-center gap-1 text-accent font-medium">
                        <Video className="w-3.5 h-3.5" /> Online
                      </span>
                    ) : a.status === 'late' ? (
                      <span className="inline-flex items-center gap-1 text-warning font-medium">
                        <Clock className="w-3.5 h-3.5" /> Late
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger font-medium">
                        <AlertOctagon className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                    <span className="font-medium text-text">{a.name}</span>
                    <span className="text-text-muted font-mono text-[11px]">{a.phone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {a.checkInTime && (
                      <span className="text-[11px] text-text-muted font-mono">
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
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        Check in
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => success('Zoom cloud recording sync triggered.')}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Sync Zoom log
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => success('Import CSV modal opened.')}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Import CSV
              </Button>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={handleMarkRemainingAbsent}
              leftIcon={<UserX className="w-3.5 h-3.5" />}
            >
              Mark remaining absent
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Projector Modal */}
      {fullscreenQR && (
        <div
          className="fixed inset-0 z-50 bg-[#111315] flex flex-col items-center justify-center p-8 text-center text-white select-none"
          onClick={() => setFullscreenQR(false)}
        >
          <div className="space-y-4 max-w-sm">
            <h2 className="text-xl font-semibold tracking-tight">Scan check-in QR</h2>
            <p className="text-xs text-neutral-400">
              Java Full-Stack B3 (Kothrud) · CodeCraft Academy
            </p>

            <div className="w-64 h-64 bg-white p-4 rounded-card mx-auto flex items-center justify-center shadow-dialog">
              <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-black rounded">
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

            <div className="text-xs font-mono text-neutral-400">
              Rotates in {countdown}s · Click anywhere to exit
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
