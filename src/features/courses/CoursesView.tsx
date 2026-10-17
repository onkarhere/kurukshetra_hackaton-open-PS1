import React, { useState } from 'react'
import {
  BookOpen,
  Clock,
  Layers,
  Award,
  Plus,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { store, useStore } from '@/mocks/store'
import { Course } from '@/types'
import { formatINR, cn } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const CoursesView: React.FC = () => {
  const { role } = useApp()
  const { success, error } = useToast()
  const courses = useStore((s) => s.courses)
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '')

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0]

  // Rules state for selected course
  const [rulesAttendance, setRulesAttendance] = useState(
    selectedCourse?.completionRules?.minAttendancePercent || 75
  )
  const [rulesAssignments, setRulesAssignments] = useState(
    selectedCourse?.completionRules?.minAssignmentsPercent || 70
  )
  const [rulesAssessment, setRulesAssessment] = useState(
    selectedCourse?.completionRules?.minAssessmentScore || 60
  )

  // Sync sliders when selected course changes
  React.useEffect(() => {
    if (selectedCourse) {
      setRulesAttendance(selectedCourse.completionRules.minAttendancePercent)
      setRulesAssignments(selectedCourse.completionRules.minAssignmentsPercent)
      setRulesAssessment(selectedCourse.completionRules.minAssessmentScore)
    }
  }, [selectedCourse?.id])

  // New course modal state
  const [showNewCourseModal, setShowNewCourseModal] = useState(false)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('Software Engineering')
  const [mode, setMode] = useState<'offline' | 'online' | 'hybrid'>('hybrid')
  const [durationWeeks, setDurationWeeks] = useState(16)
  const [totalHours, setTotalHours] = useState(160)
  const [fees, setFees] = useState(45000)

  const handleSaveRules = () => {
    if (!selectedCourse) return
    store.updateCourseCompletionRules(selectedCourse.id, {
      minAttendancePercent: rulesAttendance,
      minAssignmentsPercent: rulesAssignments,
      minAssessmentScore: rulesAssessment,
    })
    success('Completion criteria updated', `Rules saved for ${selectedCourse.title}.`)
  }

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !code.trim()) {
      error('Validation error', 'Please provide a course title and unique code.')
      return
    }

    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      category,
      mode,
      durationWeeks: Number(durationWeeks) || 16,
      totalHours: Number(totalHours) || 160,
      activeBatchesCount: 0,
      fees: Number(fees) || 45000,
      syllabus: [
        {
          module: 'Core Foundations',
          hours: Math.round(Number(totalHours) * 0.35),
          topics: ['Architecture overview', 'Environment setup', 'Core paradigms'],
        },
        {
          module: 'Advanced Implementation',
          hours: Math.round(Number(totalHours) * 0.45),
          topics: ['Component lifecycle', 'Performance optimization', 'API contracts'],
        },
        {
          module: 'Capstone Project & Review',
          hours: Math.round(Number(totalHours) * 0.2),
          topics: ['Production deployment', 'Integration tests', 'Portfolio viva'],
        },
      ],
      completionRules: {
        minAttendancePercent: 75,
        minAssignmentsPercent: 70,
        minAssessmentScore: 60,
      },
    }

    store.addCourse(newCourse)
    setSelectedCourseId(newCourse.id)
    setShowNewCourseModal(false)
    setTitle('')
    setCode('')
    success('Course created', `${newCourse.title} (${newCourse.code}) added to academic catalogue.`)
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Courses & curricula</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Syllabus structuring, module milestones, and certificate eligibility rules
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowNewCourseModal(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create course
        </Button>
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => {
          const isSelected = selectedCourse?.id === course.id
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={cn(
                'p-4 rounded-card border cursor-pointer transition-colors',
                isSelected
                  ? 'border-border-strong bg-surface-sunken'
                  : 'border-border bg-surface hover:bg-surface-sunken/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface">
                  {course.code}
                </span>
                <span className="text-[10px] font-medium text-text-muted border border-border px-2 py-0.5 rounded bg-surface capitalize">
                  {course.mode}
                </span>
              </div>

              <h3 className="text-xs font-semibold text-text mt-2.5">{course.title}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">{course.category}</p>

              {(() => {
                const courseBatches = store.batches.filter(
                  (b) => b.courseId === course.id || b.courseName.toLowerCase() === course.title.toLowerCase()
                )
                const totalEnrolled = courseBatches.reduce(
                  (acc, b) => acc + store.getBatchStrength(b.id).enrolled,
                  0
                )

                return (
                  <div
                    className={cn(
                      'grid gap-2 pt-3 mt-3 border-t border-border text-center text-xs',
                      role === 'trainer' ? 'grid-cols-3' : 'grid-cols-4'
                    )}
                  >
                    <div>
                      <div className="font-medium text-text tabular-nums">{course.durationWeeks}w</div>
                      <div className="text-[10px] text-text-muted">Duration</div>
                    </div>
                    <div>
                      <div className="font-medium text-text tabular-nums">{course.activeBatchesCount}</div>
                      <div className="text-[10px] text-text-muted">Batches</div>
                    </div>
                    <div>
                      <div className="font-medium text-text tabular-nums">{totalEnrolled}</div>
                      <div className="text-[10px] text-text-muted">Enrolled</div>
                    </div>
                    {role !== 'trainer' && (
                      <div>
                        <div className="font-medium text-text tabular-nums">{formatINR(course.fees)}</div>
                        <div className="text-[10px] text-text-muted">Tuition</div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* Selected Course Detail Section */}
      {selectedCourse && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text">{selectedCourse.title}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {selectedCourse.totalHours} total scheduled hours · {selectedCourse.syllabus.length} structured modules
              </p>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={handleSaveRules}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Save completion rules
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Syllabus Modules (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Syllabus modules
              </h3>

              <div className="space-y-2">
                {selectedCourse.syllabus.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text">
                        Module {mIdx + 1}: {mod.module}
                      </span>
                      <span className="text-[11px] text-text-muted tabular-nums">
                        {mod.hours} hrs
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {mod.topics.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] text-text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion Rules Builder (5 cols) */}
            <div className="lg:col-span-5 space-y-2.5">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Completion benchmarks
              </h3>

              <div className="p-3.5 rounded-control bg-surface-sunken border border-border space-y-3.5 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-text">
                    <span>Minimum attendance</span>
                    <span className="tabular-nums font-medium text-accent">
                      {rulesAttendance}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={rulesAttendance}
                    onChange={(e) => setRulesAttendance(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <p className="text-[10px] text-text-muted">Threshold required for certificate issuance</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-text">
                    <span>Minimum assignment completion</span>
                    <span className="tabular-nums font-medium text-accent">
                      {rulesAssignments}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={rulesAssignments}
                    onChange={(e) => setRulesAssignments(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <p className="text-[10px] text-text-muted">Hands-on lab submissions cleared</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-text">
                    <span>Passing assessment threshold</span>
                    <span className="tabular-nums font-medium text-accent">
                      {rulesAssessment}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={rulesAssessment}
                    onChange={(e) => setRulesAssessment(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <p className="text-[10px] text-text-muted">Final capstone or viva score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowNewCourseModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-dialog p-5 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">Create new curriculum</h3>
                <p className="text-xs text-text-muted mt-0.5">Define academic metadata, duration and completion criteria</p>
              </div>
              <button
                onClick={() => setShowNewCourseModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-muted font-medium mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Engineering & Pipelines"
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-medium mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DE-01"
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text font-mono focus:outline-none focus:border-border-strong uppercase"
                  />
                </div>
                <div>
                  <label className="block text-text-muted font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-medium mb-1">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="offline">Classroom</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-muted font-medium mb-1">Duration (weeks)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  />
                </div>
                <div>
                  <label className="block text-text-muted font-medium mb-1">Total Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Standard Tuition Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewCourseModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
