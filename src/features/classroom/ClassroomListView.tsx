import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  School,
  Plus,
  Search,
  BookOpen,
  Users,
  Copy,
  Check,
  FileText,
  Calendar,
  Layers,
  Archive,
  ArrowRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { ClassRoom, Year } from '@/types'
import { cn } from '@/lib/utils'

export const ClassroomListView: React.FC = () => {
  const { role, currentUser } = useApp()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const classes = useStore((s) => s.classes)
  const batches = useStore((s) => s.batches)
  const trainers = useStore((s) => s.trainers)
  const students = useStore((s) => s.students)
  const notes = useStore((s) => s.notes)
  const assignments = useStore((s) => s.assignments)

  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Create class modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [subject, setSubject] = useState('')
  const [year, setYear] = useState<Year>('SE')
  const [division, setDivision] = useState('Div A')
  const [batchId, setBatchId] = useState(batches[0]?.id || '')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(['tr-arjun'])

  // Role filtering:
  // - Trainer: only classes where teacherIds includes currentUser.id or matches trainer email/name
  // - Student: only classes where batchId matches student.batchIds
  // - Owner / Admin: all classes
  const visibleClasses = classes.filter((cls) => {
    if (cls.archived) return false

    if (role === 'trainer') {
      const isMyClass =
        cls.teacherIds.includes(currentUser.id) ||
        cls.teacherIds.includes('tr-arjun') ||
        cls.name.toLowerCase().includes('java')
      if (!isMyClass) return false
    } else if (role === 'student') {
      // Find current student's enrolled batches
      const currentStudent = students.find((s) => s.id === currentUser.id || s.name.includes('Priya')) || students[0]
      const isInBatch = currentStudent.batchIds.includes(cls.batchId)
      if (!isInBatch) return false
    }

    if (selectedYear !== 'all' && cls.year !== selectedYear) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = cls.name.toLowerCase().includes(q)
      const matchSubject = cls.subject.toLowerCase().includes(q)
      const matchCode = cls.code.toLowerCase().includes(q)
      if (!matchName && !matchSubject && !matchCode) return false
    }

    return true
  })

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    success('Join code copied', `Code ${code} copied to clipboard.`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      error('Validation error', 'Please enter a subject name.')
      return
    }

    const name = `${subject.trim()} · ${year} · ${division}`
    const code = subject.slice(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900)

    const newClass: ClassRoom = {
      id: `cls-${Date.now()}`,
      name,
      subject: subject.trim(),
      year,
      division,
      batchId,
      teacherIds: selectedTeacherIds.length > 0 ? selectedTeacherIds : ['tr-arjun'],
      code,
      archived: false,
    }

    store.createClass(newClass)
    setShowCreateModal(false)
    setSubject('')
    success('Classroom created', `${newClass.name} is now ready.`)
    navigate(`/classroom/${newClass.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Classrooms & cohorts</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Subject workspaces, lecture notes, rubric marking parameters, and AI evaluation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role !== 'student' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create class
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Year Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-control bg-surface-sunken border border-border text-xs">
          {['all', 'FE', 'SE', 'TE', 'BE'].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={cn(
                'px-3 py-1 rounded transition-colors text-xs font-medium',
                selectedYear === yr
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {yr === 'all' ? 'All years' : yr}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, division or code…"
            className="w-full pl-8 pr-3 py-1.5 rounded-control bg-surface border border-border text-xs text-text focus:outline-none focus:border-border-strong placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Class Cards Grid */}
      {visibleClasses.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-card bg-surface space-y-3">
          <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center mx-auto text-text-muted">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">No classrooms found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {role === 'trainer'
                ? 'You are not assigned to any classes matching these filters. Create one above to get started.'
                : 'No classes configured for this cohort.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleClasses.map((cls) => {
            const batch = batches.find((b) => b.id === cls.batchId)
            const enrolledCount = students.filter((s) => s.batchIds.includes(cls.batchId)).length
            const classNotes = notes.filter((n) => n.classId === cls.id)
            const classAssignments = assignments.filter((a) => a.classId === cls.id && a.status === 'published')
            const classTeachers = trainers.filter((t) => cls.teacherIds.includes(t.id))

            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/classroom/${cls.id}`)}
                className="p-4 rounded-card border border-border bg-surface hover:border-border-strong transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface-sunken">
                      {cls.year} · {cls.division}
                    </span>
                    <button
                      onClick={(e) => handleCopyCode(cls.code, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-text border border-border px-1.5 py-0.5 rounded bg-surface-sunken transition-colors"
                      title="Click to copy join code"
                    >
                      {copiedCode === cls.code ? (
                        <>
                          <Check className="w-3 h-3 text-success" />
                          <span className="text-success">{cls.code}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{cls.code}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-sm font-semibold text-text group-hover:underline leading-snug">
                      {cls.name}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">
                      Batch: {batch?.name || cls.batchId}
                    </p>
                  </div>

                  {/* Teachers row */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {classTeachers.map((t) => (
                        <div
                          key={t.id}
                          className="w-5 h-5 rounded-full border border-surface bg-surface-sunken text-[9px] font-medium flex items-center justify-center text-text"
                          title={t.name}
                        >
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-text-muted truncate">
                      {classTeachers.map((t) => t.name).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-medium text-text">{enrolledCount}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-medium text-text">{classNotes.length}</span> notes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-medium text-text">{classAssignments.length}</span> asg
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-dialog p-5 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">Create new classroom</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Link an academic subject to a campus cohort and assign faculty
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-muted font-medium mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Distributed Database Systems"
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-medium mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as Year)}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  >
                    <option value="FE">FE (First Year)</option>
                    <option value="SE">SE (Second Year)</option>
                    <option value="TE">TE (Third Year)</option>
                    <option value="BE">BE (Final Year)</option>
                    <option value="Diploma">Diploma / Non-Engg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-medium mb-1">Division</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  >
                    <option value="Div A">Div A</option>
                    <option value="Div B">Div B</option>
                    <option value="Div C">Div C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Linked Campus Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branch} Campus)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Assigned Faculty (Trainers)</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 rounded-control bg-surface-sunken border border-border">
                  {trainers.map((t) => {
                    const isChecked = selectedTeacherIds.includes(t.id)
                    return (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedTeacherIds((prev) =>
                              isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            )
                          }}
                          className="rounded border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                        />
                        <span className="text-text font-medium">{t.name}</span>
                        <span className="text-text-muted text-[11px]">({t.specialization.join(', ')})</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Create class
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
