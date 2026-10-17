import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Building2,
  Layers,
  BookOpen,
  UserCog,
  Upload,
  UserPlus,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'

export const OnboardingView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const courses = useStore((s) => s.courses)
  const trainers = useStore((s) => s.trainers)
  const batches = useStore((s) => s.batches)
  const students = useStore((s) => s.students)
  const instalments = useStore((s) => s.feeInstalments)
  const settings = useStore((s) => s.settings)

  const steps = [
    {
      title: 'Institute profile',
      desc: `${settings.instituteName || 'CodeCraft Academy'}, Pune Campus`,
      route: '/settings',
      isDone: !!settings.instituteName,
    },
    {
      title: 'Campuses & active rooms',
      desc: `${batches.length} active cohorts mapped across campus facilities`,
      route: '/batches',
      isDone: batches.length > 0,
    },
    {
      title: 'Courses & curricula',
      desc: `${courses.length} certified diploma & technology curricula`,
      route: '/courses',
      isDone: courses.length > 0,
    },
    {
      title: 'Faculty & trainers',
      desc: `${trainers.length} qualified instructors with availability calendars`,
      route: '/trainers',
      isDone: trainers.length > 0,
    },
    {
      title: 'Student directory & rosters',
      desc: `${students.length} candidates enrolled with attendance baselines`,
      route: '/students',
      isDone: students.length > 0,
    },
    {
      title: 'Fee schedules & reconciliations',
      desc: `${instalments.length} payment instalments and collection ledgers`,
      route: '/fees',
      isDone: instalments.length > 0,
    },
  ]

  const completedCount = steps.filter((s) => s.isDone).length
  const completionPct = Math.round((completedCount / steps.length) * 100)

  const handleUseSampleData = () => {
    store.resetDemo()
    success('Sample data loaded', 'Restored complete seed dataset across all academic and financial entities.')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">Institute setup</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Configure campuses, cohorts, and import rosters to initialize operations
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUseSampleData}
          leftIcon={<Database className="w-3.5 h-3.5 text-text-muted" />}
        >
          Load Pune sample dataset
        </Button>
      </div>

      {/* Progress Card */}
      <div className="p-5 rounded-card border border-border bg-surface flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-text">
            Setup progress: <span className="tabular-nums font-medium">{completedCount} of {steps.length}</span> steps completed
          </div>
          <div className="text-[11px] text-text-muted">
            {completedCount === steps.length
              ? 'All core academic infrastructure is configured and operational.'
              : 'Complete pending modules or click "Load Pune sample dataset" to bootstrap demonstration data.'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center tabular-nums text-xs font-medium text-accent">
            {completionPct}%
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((st, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-card border flex items-center justify-between transition-colors ${
              st.isDone
                ? 'border-border bg-surface'
                : 'border-border-strong bg-surface ring-1 ring-accent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-control flex items-center justify-center text-xs font-medium ${
                  st.isDone
                    ? 'bg-surface-sunken text-success border border-border'
                    : 'bg-accent text-accent-fg'
                }`}
              >
                {st.isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="tabular-nums">{idx + 1}</span>}
              </div>
              <div>
                <h4 className="text-xs font-medium text-text">{st.title}</h4>
                <p className="text-[11px] text-text-muted">{st.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={st.isDone ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => navigate(st.route)}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                {st.isDone ? 'Manage' : 'Configure'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
