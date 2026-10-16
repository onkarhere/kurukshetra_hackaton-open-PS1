import React, { useState } from 'react'
import {
  BookOpen,
  Clock,
  Layers,
  Award,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { store } from '@/mocks/store'
import { Course } from '@/types'
import { formatINR, cn } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const CoursesView: React.FC = () => {
  const { role } = useApp()
  const { success } = useToast()
  const [courses] = useState<Course[]>([...store.courses])
  const [selectedCourse, setSelectedCourse] = useState<Course>(store.courses[0])

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
          onClick={() => success('New curriculum modal opened.')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create course
        </Button>
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => {
          const isSelected = selectedCourse.id === course.id
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
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
                <span className="text-[10px] font-medium text-text-muted border border-border px-2 py-0.5 rounded bg-surface">
                  {course.mode}
                </span>
              </div>

              <h3 className="text-xs font-semibold text-text mt-2.5">{course.title}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">{course.category}</p>

              <div
                className={cn(
                  'grid gap-2 pt-3 mt-3 border-t border-border text-center text-xs',
                  role === 'trainer' ? 'grid-cols-2' : 'grid-cols-3'
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
                {role !== 'trainer' && (
                  <div>
                    <div className="font-medium text-text tabular-nums">{formatINR(course.fees)}</div>
                    <div className="text-[10px] text-text-muted">Tuition</div>
                  </div>
                )}
              </div>
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
              onClick={() => success('Curriculum completion criteria saved.')}
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
                    <span className="tabular-nums font-medium">
                      {selectedCourse.completionRules.minAttendancePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={selectedCourse.completionRules.minAttendancePercent}
                    readOnly
                    className="w-full accent-accent"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-text">
                    <span>Minimum assignment completion</span>
                    <span className="tabular-nums font-medium">
                      {selectedCourse.completionRules.minAssignmentsPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={selectedCourse.completionRules.minAssignmentsPercent}
                    readOnly
                    className="w-full accent-accent"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-text">
                    <span>Passing assessment threshold</span>
                    <span className="tabular-nums font-medium">
                      {selectedCourse.completionRules.minAssessmentScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={selectedCourse.completionRules.minAssessmentScore}
                    readOnly
                    className="w-full accent-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
