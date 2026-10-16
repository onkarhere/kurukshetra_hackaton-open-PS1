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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const OnboardingView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [activeStep, setActiveStep] = useState(4) // e.g. at student import

  const steps = [
    { title: 'Institute Profile', desc: 'CodeCraft Academy, Pune', isDone: true },
    { title: 'Branches & Rooms', desc: 'Kothrud & Baner (8 rooms setup)', isDone: true },
    { title: 'Courses & Curricula', desc: '6 structured technical courses', isDone: true },
    { title: 'Faculty & Trainers', desc: '8 instructors with availability grids', isDone: true },
    { title: 'Import Students', desc: 'CSV column mapper & deduplication', isDone: false },
    { title: 'Invite Staff Team', desc: 'Accounts & counseling staff', isDone: false },
  ]

  const completionPct = Math.round((4 / 6) * 100)

  const handleUseSampleData = () => {
    success('Sample data loaded', 'Imported 320 students and 14 batches into CodeCraft Academy.')
    navigate('/')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in select-none py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Institute Onboarding Setup</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Configure campuses, cohorts, and import rosters to activate operations copilot
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseSampleData}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-ai" />}
        >
          Use Sample Pune Data
        </Button>
      </div>

      {/* Progress Card */}
      <div className="p-5 rounded-card border border-border bg-surface flex items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-fg">Setup Progress: 4 of 6 Steps Finished</div>
          <div className="text-[11px] text-fg-muted">
            All core infrastructure configured. Complete student import to launch.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center font-mono font-bold text-xs text-primary">
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
                ? 'border-success/30 bg-success/5'
                : idx === activeStep
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  st.isDone
                    ? 'bg-success text-white'
                    : idx === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-surface-2 text-fg-muted border border-border'
                }`}
              >
                {st.isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-fg">{st.title}</h4>
                <p className="text-[11px] text-fg-muted">{st.desc}</p>
              </div>
            </div>

            <Button
              variant={st.isDone ? 'ghost' : 'primary'}
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
