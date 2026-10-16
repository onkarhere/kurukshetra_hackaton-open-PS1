import React, { useState } from 'react'
import {
  BookOpen,
  Clock,
  Layers,
  Award,
  Plus,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { Course } from '@/types'
import { formatINR } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const CoursesView: React.FC = () => {
  const { success } = useToast()
  const [courses] = useState<Course[]>([...store.courses])
  const [selectedCourse, setSelectedCourse] = useState<Course>(store.courses[0])

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Courses & Curricula</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Syllabus structuring, graduation criteria & fee structure configuration
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => success('New curriculum modal launched.')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Course
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
              className={`p-4 rounded-card border cursor-pointer transition-all shadow-sm ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-surface hover:border-text-muted/40 hover:shadow-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-fg-muted uppercase tracking-wider bg-surface-2 border border-border px-1.5 py-0.5 rounded">
                  {course.code}
                </span>
                <span className="text-[10px] font-mono uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {course.mode}
                </span>
              </div>

              <h3 className="text-sm font-bold text-fg mt-2">{course.title}</h3>
              <p className="text-xs text-fg-muted mt-0.5">{course.category}</p>

              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border text-center text-xs">
                <div>
                  <div className="font-mono font-bold text-fg">{course.durationWeeks}w</div>
                  <div className="text-[10px] text-fg-muted">Duration</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-fg">{course.activeBatchesCount}</div>
                  <div className="text-[10px] text-fg-muted">Batches</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-fg">{formatINR(course.fees)}</div>
                  <div className="text-[10px] text-fg-muted">Tuition</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Course Detail Section */}
      {selectedCourse && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-fg">{selectedCourse.title} Details</h2>
              <p className="text-xs text-fg-muted">
                {selectedCourse.totalHours} total learning hours · {selectedCourse.syllabus.length} structured modules
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => success('Curriculum settings updated')}
            >
              Save Completion Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Syllabus Modules (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                Syllabus Architecture
              </h3>

              <div className="space-y-2">
                {selectedCourse.syllabus.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-3 rounded-btn bg-surface-2 border border-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">
                        Module {mIdx + 1}: {mod.module}
                      </span>
                      <span className="font-mono text-[11px] text-primary font-semibold">
                        {mod.hours} hrs
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {mod.topics.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] text-fg-muted font-mono"
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
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                Certification Completion Rules
              </h3>

              <div className="p-4 rounded-btn bg-surface-2 border border-border space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-fg font-medium">
                    <span>Minimum Attendance</span>
                    <span className="font-mono font-bold text-primary">
                      {selectedCourse.completionRules.minAttendancePercent}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={selectedCourse.completionRules.minAttendancePercent}
                    readOnly
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center justify-between text-fg font-medium">
                    <span>Minimum Assignments Submission</span>
                    <span className="font-mono font-bold text-primary">
                      {selectedCourse.completionRules.minAssignmentsPercent}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={selectedCourse.completionRules.minAssignmentsPercent}
                    readOnly
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center justify-between text-fg font-medium">
                    <span>Passing Assessment Score</span>
                    <span className="font-mono font-bold text-primary">
                      {selectedCourse.completionRules.minAssessmentScore}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={selectedCourse.completionRules.minAssessmentScore}
                    readOnly
                    className="w-full accent-primary"
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
