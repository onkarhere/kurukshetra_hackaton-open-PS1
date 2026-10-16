import React, { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const OnboardingView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [activeStep, setActiveStep] = useState(4)

  const steps = [
    { title: 'Institute profile', desc: 'CodeCraft Academy, Pune', isDone: true },
    { title: 'Branches & rooms', desc: 'Kothrud & Baner (8 rooms configured)', isDone: true },
    { title: 'Courses & syllabus', desc: '6 technical diploma & stack courses', isDone: true },
    { title: 'Faculty & trainers', desc: '8 instructors with availability grids', isDone: true },
    { title: 'Import students', desc: 'CSV column mapper & deduplication', isDone: false },
    { title: 'Invite staff team', desc: 'Accounts & counseling staff roles', isDone: false },
  ]

  const completionPct = Math.round((4 / 6) * 100)

  const handleUseSampleData = () => {
    success('Sample data loaded', 'Loaded 320 students and 14 batches into CodeCraft Academy.')
    navigate('/')
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
            Setup progress: <span className="tabular-nums font-medium">4 of 6</span> steps completed
          </div>
          <div className="text-[11px] text-text-muted">
            All core infrastructure configured. Import student roster to launch live operations.
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
                : idx === activeStep
                ? 'border-border-strong bg-surface ring-1 ring-accent'
                : 'border-border bg-surface opacity-75'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-control flex items-center justify-center text-xs font-medium ${
                  st.isDone
                    ? 'bg-surface-sunken text-success border border-border'
                    : idx === activeStep
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-sunken text-text-muted border border-border'
                }`}
              >
                {st.isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="tabular-nums">{idx + 1}</span>}
              </div>
              <div>
                <h4 className="text-xs font-medium text-text">{st.title}</h4>
                <p className="text-[11px] text-text-muted">{st.desc}</p>
              </div>
            </div>

            <Button
              variant={idx === activeStep ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                if (st.isDone) {
                  success('Step already configured.')
                } else {
                  handleUseSampleData()
                }
              }}
            >
              {st.isDone ? 'Review' : 'Configure'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
