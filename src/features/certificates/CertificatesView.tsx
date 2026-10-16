import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  QrCode,
  Sparkles,
  Download,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'

export const CertificatesView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [selectedBatchId, setSelectedBatchId] = useState('batch-dbi-b2')
  const certificates = store.certificates

  const eligibleCandidates = [
    { id: 'std-tanvi-07', name: 'Tanvi Sharma', attendance: 98, score: 94, isEligible: true, certNo: 'CC-2026-JFS-0891' },
    { id: 'std-aarav-06', name: 'Aarav Deshmukh', attendance: 96, score: 89, isEligible: true, certNo: 'CC-2026-PYD-0412' },
    { id: 'std-sneha-09', name: 'Sneha Shinde', attendance: 92, score: 84, isEligible: true, certNo: 'CC-2026-FED-0199' },
    { id: 'std-priya-01', name: 'Priya Nair', attendance: 44, score: 48, isEligible: false, reason: 'Attendance 44% below 80% threshold; 2 assessments missed' },
    { id: 'std-rohan-02', name: 'Rohan Kulkarni', attendance: 62, score: 55, isEligible: false, reason: 'Attendance 62% below 80% threshold' },
  ]

  const eligibleCount = eligibleCandidates.filter((c) => c.isEligible).length

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Certificates & Credentials</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Cryptographically verifiable credentials with QR codes and graduation compliance checks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            onClick={() => {
              success(
                `Approval Staged for ${eligibleCount} certificates`,
                'Review and approve certificate issuance in Approvals Inbox.'
              )
              navigate('/approvals')
            }}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Generate for {eligibleCount} Students (Approval)
          </Button>
        </div>
      </div>

      {/* Select Batch */}
      <div className="p-4 rounded-card border border-border bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-fg">Select Cohort / Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-surface-2 border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          >
            {store.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-fg-muted">
          Graduation Rule: Min 80% Attendance & 70% Score
        </div>
      </div>

      {/* Main Layout: Eligibility Table (7 cols) + Certificate Preview Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Eligibility Table */}
        <div className="lg:col-span-7 rounded-card border border-border bg-surface overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-border bg-surface-2 flex items-center justify-between text-xs font-semibold">
            <span>Candidate Eligibility Evaluation</span>
            <span className="text-primary font-mono">{eligibleCount} of 5 Qualified</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2/60 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3">Student</th>
                <th className="py-2 px-3">Attendance</th>
                <th className="py-2 px-3">Score</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {eligibleCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-fg">{c.name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={c.attendance < 80 ? 'text-danger' : 'text-success'}>
                      {c.attendance}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={c.score < 70 ? 'text-danger' : 'text-fg'}>{c.score}%</span>
                  </td>
                  <td className="py-2.5 px-3">
                    {c.isEligible ? (
                      <span className="inline-flex items-center gap-1 text-success font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Eligible
                      </span>
                    ) : (
                      <ReasonChip reason={c.reason || 'Not Eligible'} variant="danger" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {c.certNo ? (
                      <button
                        onClick={() => navigate(`/verify/${c.certNo}`)}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-fg-muted text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate Template Preview Card (PDF-like design) */}
        <div className="lg:col-span-5 rounded-card border border-border bg-surface p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
              Certificate Template Preview
            </h3>
            <p className="text-[11px] text-fg-muted">
              Includes QR code verification pointing to public verify endpoint
            </p>
          </div>

          {/* Certificate Mock Sheet */}
          <div className="rounded-card border-2 border-primary/30 bg-surface-2 p-5 text-center space-y-3 relative overflow-hidden shadow-inner">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm mx-auto">
              BW
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-fg-muted">
                CodeCraft Academy Pune
              </div>
              <h2 className="text-sm font-bold text-fg mt-1">Certificate of Completion</h2>
              <div className="text-[11px] text-fg-muted mt-0.5">This certifies that</div>
            </div>

            <div className="py-1">
              <span className="text-base font-serif font-bold text-primary">Tanvi Sharma</span>
            </div>

            <p className="text-[10px] text-fg leading-relaxed">
              has successfully fulfilled all required curriculum, laboratory evaluations and project assignments for
              the course <strong>Advanced Data Analytics & Power BI</strong> with Grade A+ (Distinction).
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-border/80 text-[10px] font-mono text-fg-muted">
              <div>Issue Date: 10 Oct 2026</div>
              <div className="flex items-center gap-1 text-fg font-semibold">
                <QrCode className="w-4 h-4 text-primary" />
                <span>CC-2026-JFS-0891</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/verify/CC-2026-JFS-0891')}
            >
              Open Public Verification Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
