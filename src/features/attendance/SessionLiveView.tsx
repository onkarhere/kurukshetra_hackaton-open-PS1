import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
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
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { Recording } from '@/types'

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
  const sessionId = id || 'sess-m2'
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [countdown, setCountdown] = useState(30)
  const [fullscreenQR, setFullscreenQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [currentToken, setCurrentToken] = useState<string>('INIT89')

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [recordingTitle, setRecordingTitle] = useState('Spring Boot & Data JPA - Lecture & Doubt Session')
  const [recordingUrl, setRecordingUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
  const [recordingDuration, setRecordingDuration] = useState('1h 50m')
  const [recordingSummary, setRecordingSummary] = useState('Live session covering Spring Data JPA repositories, derived queries, and transaction management.')

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

  // Generate real QR code with rotating token
  const rotateQrToken = () => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase()
    setCurrentToken(newToken)
    store.setSessionQrToken(sessionId, newToken)

    const checkinUrl = `${window.location.origin}/s/checkin?session=${sessionId}&t=${newToken}`
    QRCode.toDataURL(checkinUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1E140E',
        light: '#FFF8F1',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error', err))
  }

  // Initial QR generation
  useEffect(() => {
    rotateQrToken()
  }, [sessionId])

  // 30s rotating QR code countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          rotateQrToken()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [sessionId])

  const handleMatchConfirm = (zoomName: string) => {
    setUnmatchedQueue((prev) => prev.filter((item) => item.zoomName !== zoomName))
    setAttendees((prev) =>
      prev.map((a) => (a.id === 'std-priya-01' ? { ...a, status: 'online', checkInTime: '19:12 IST', method: 'Zoom Sync' } : a))
    )
    success('Confirmed online attendee match', `${zoomName} matched to Priya Nair`)
  }

  // P1: Mark remaining absent - set every unmarked student to Absent in attendanceRecords
  const handleMarkRemainingAbsent = () => {
    const unmarked = attendees.filter((a) => a.status === 'absent')
    store.markRemainingAbsent(sessionId, unmarked)
    success('Marked remaining absent', `${unmarked.length} student(s) marked as Absent in attendance ledger.`)
  }

  // P1: Finalize session - save attendance to store, mark session completed, update batch attendance % and recompute risk
  const handleFinalizeSession = () => {
    store.finalizeSession(sessionId, attendees)
    success('Session finalized', 'Attendance saved to store, batch turnout updated, and risk scores recomputed.')
    navigate('/attendance')
  }

  // P1: Import Meet/Zoom CSV
  const handleProcessCsv = (rawText: string) => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length <= 1) {
      error('Invalid CSV', 'Please provide a CSV with header and attendee rows.')
      return
    }

    let updatedCount = 0
    const newUnmatched: typeof unmatchedQueue = []

    // Lines format: Name, Email, DurationMinutes
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim())
      if (parts.length < 2) continue

      const name = parts[0]
      const email = parts[1]
      const durationMins = parseInt(parts[2] || '95', 10)
      const ratio = durationMins / 120 // 120 mins session

      // Look up student in attendees
      const matchIndex = attendees.findIndex(
        (a) =>
          a.name.toLowerCase() === name.toLowerCase() ||
          a.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(a.name.toLowerCase())
      )

      if (matchIndex >= 0) {
        const student = attendees[matchIndex]
        // Physical check-in wins!
        if (student.method === 'QR Code') {
          continue
        }

        // Rule: Present >= 75%, Partial 40-75%
        let newStatus: Attendee['status'] = 'absent'
        if (ratio >= 0.75) {
          newStatus = 'online'
        } else if (ratio >= 0.4) {
          newStatus = 'late'
        }

        setAttendees((prev) =>
          prev.map((a, idx) =>
            idx === matchIndex
              ? {
                  ...a,
                  status: newStatus,
                  checkInTime: '19:05 IST',
                  method: 'Zoom Sync',
                }
              : a
          )
        )
        updatedCount++
      } else {
        newUnmatched.push({
          zoomName: name,
          suggestedId: 'std-unknown',
          confidence: 65,
        })
      }
    }

    if (newUnmatched.length > 0) {
      setUnmatchedQueue((prev) => [...prev, ...newUnmatched])
    }

    setShowImportModal(false)
    success('Zoom/Meet CSV processed', `Synchronized ${updatedCount} attendees. ${newUnmatched.length} unmatched queued for review.`)
  }

  // P1: Save recording
  const handleSaveRecording = () => {
    if (!recordingTitle) {
      error('Validation error', 'Please enter a recording title.')
      return
    }

    const newRec: Recording = {
      id: `rec-${Date.now()}`,
      title: recordingTitle,
      batchName: 'Java Full-Stack B3 (Kothrud)',
      courseName: 'Java Full-Stack Developer',
      trainerName: 'Arjun Mehta',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      duration: recordingDuration || '1h 50m',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=80',
      videoUrl: recordingUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      aiSummary: recordingSummary || 'Live session on Spring Data JPA, repository queries, and custom finders.',
      chapters: [
        { time: '00:00', title: 'Session introduction' },
        { time: '20:15', title: 'Repository Pattern' },
        { time: '55:30', title: 'Hands-on query execution' },
      ],
      attendanceCount: presentCount,
    }

    store.addRecording(newRec)
    setShowRecordingModal(false)
    success('Recording synchronized', 'Recording saved to store and published for student catch-up.')
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
              <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-accent-subtle text-accent font-mono">
                Present {(() => {
                  const strength = store.getBatchStrength('batch-java-b3')
                  const onlineCount = attendees.filter((a) => a.status === 'online').length || strength.online || 6
                  const presentTotal = Math.max(attendees.filter((a) => a.status === 'present' || a.status === 'online' || a.status === 'late').length, 21)
                  return `${presentTotal} / ${strength.enrolled || 28} (${onlineCount} online)`
                })()}
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
            onClick={handleFinalizeSession}
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

          {/* QR Box with REAL QR CODE */}
          <div className="relative mx-auto w-52 h-52 rounded-card border border-border bg-surface-sunken flex flex-col items-center justify-center p-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Live Classroom QR"
                className="w-40 h-40 rounded border border-border bg-white p-1"
              />
            ) : (
              <div className="w-40 h-40 bg-white flex items-center justify-center text-xs text-text-muted">
                Generating QR...
              </div>
            )}

            <div className="absolute bottom-2 flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-text">
              <Clock className="w-3 h-3 text-text-muted" />
              <span>Rotates in {countdown}s</span>
              <span className="text-accent font-semibold ml-1">[{currentToken}]</span>
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
              onClick={() => {
                rotateQrToken()
                setCountdown(30)
                success('QR code rotated and new token published.')
              }}
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
                onClick={() => setShowRecordingModal(true)}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Sync Zoom recording
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowImportModal(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Import Meet/Zoom CSV
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
          className="fixed inset-0 z-50 bg-[#33251F] flex flex-col items-center justify-center p-8 text-center text-[#F8F4EF] select-none"
          onClick={() => setFullscreenQR(false)}
        >
          <div className="space-y-4 max-w-sm">
            <h2 className="text-xl font-semibold tracking-tight text-[#F8F4EF]">Scan classroom check-in QR</h2>
            <p className="text-xs text-[#E3D2C1]">
              Java Full-Stack B3 (Kothrud) · CodeCraft Academy
            </p>

            <div className="w-64 h-64 bg-white p-3 rounded-card mx-auto flex items-center justify-center shadow-dialog border border-[#D6B48A]">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Fullscreen Classroom QR"
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="text-xs font-mono text-[#E3D2C1]">
              Rotates in {countdown}s · Demo Token: <span className="text-[#D6B48A] font-bold">{currentToken}</span>
            </div>
            <p className="text-[11px] text-[#CDB9A6]">Click anywhere to close</p>
          </div>
        </div>
      )}

      {/* Import Meet/Zoom CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-lg w-full p-5 space-y-4 shadow-dialog">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Import Zoom/Meet Turnout CSV</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Upload or paste Zoom attendance report. Logic: Present ≥75% duration (90m), Partial 40–75% (48m). Physical check-in wins.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text">CSV Payload</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `Name,Email,DurationMinutes\nPriya Nair,priya.nair@gmail.com,105\nRohan Kulkarni,rohan.kulkarni@gmail.com,52\nSunita Rao,sunita.rao@gmail.com,30\nKiran Unknown,kiran.guest@gmail.com,90`
                    setCsvContent(sample)
                  }}
                  className="text-accent hover:underline"
                >
                  Load sample data
                </button>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Name,Email,DurationMinutes&#10;Priya Nair,priya.nair@gmail.com,105"
                rows={5}
                className="w-full text-xs font-mono p-2.5 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer text-xs text-accent hover:underline flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .csv file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const content = event.target?.result as string
                        setCsvContent(content || '')
                      }
                      reader.readAsText(file)
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleProcessCsv(csvContent)}
                  disabled={!csvContent.trim()}
                >
                  Process & sync
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Zoom Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-lg w-full p-5 space-y-4 shadow-dialog">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Link Session Lecture Recording</h3>
              <button
                onClick={() => setShowRecordingModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-text mb-1">Recording Title</label>
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  className="w-full p-2 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-text mb-1">Video Stream / File URL</label>
                <input
                  type="text"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="w-full p-2 font-mono rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-text mb-1">Duration</label>
                  <input
                    type="text"
                    value={recordingDuration}
                    onChange={(e) => setRecordingDuration(e.target.value)}
                    className="w-full p-2 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-medium text-text mb-1">Batch / Cohort</label>
                  <input
                    type="text"
                    disabled
                    value="Java Full-Stack B3 (Kothrud)"
                    className="w-full p-2 rounded-control border border-border bg-surface-sunken text-text-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-text mb-1">AI Lecture Summary & Notes</label>
                <textarea
                  value={recordingSummary}
                  onChange={(e) => setRecordingSummary(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRecordingModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRecording}
              >
                Save & link recording
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
