import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Certificates</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Verifiable credentials with QR verification and graduation compliance checks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              success(
                `Approval staged for ${eligibleCount} certificates`,
                'Review issuance in Approvals inbox.'
              )
              navigate('/approvals')
            }}
          >
            Issue for {eligibleCount} eligible candidates
          </Button>
        </div>
      </div>

      {/* Select Batch */}
      <div className="p-3.5 rounded-card border border-border bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">Select cohort:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            {store.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-text-muted">
          Graduation benchmark: Minimum 80% attendance and 70% assessment score
        </div>
      </div>

      {/* Main Layout: Eligibility Table (7 cols) + Certificate Preview Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Eligibility Table */}
        <div className="lg:col-span-7 rounded-card border border-border bg-surface overflow-hidden">
          <div className="p-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between text-xs">
            <span className="font-medium text-text">Graduation eligibility evaluation</span>
            <span className="text-text-muted tabular-nums">{eligibleCount} of 5 qualified</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
              <tr>
                <th className="py-2 px-3">Student</th>
                <th className="py-2 px-3 text-right">Attendance</th>
                <th className="py-2 px-3 text-right">Score</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {eligibleCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                  <td className="px-3 font-medium text-text">{c.name}</td>
                  <td className="px-3 text-right tabular-nums font-medium">
                    <span className={c.attendance < 80 ? 'text-danger' : 'text-text'}>
                      {c.attendance}%
                    </span>
                  </td>
                  <td className="px-3 text-right tabular-nums font-medium">
                    <span className={c.score < 70 ? 'text-danger' : 'text-text'}>
                      {c.score}%
                    </span>
                  </td>
                  <td className="px-3">
                    {c.isEligible ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger text-xs font-medium">
                        <AlertOctagon className="w-3.5 h-3.5" /> Not met
                      </span>
                    )}
                  </td>
                  <td className="px-3 text-right">
                    {c.certNo ? (
                      <button
                        onClick={() => navigate(`/verify/${c.certNo}`)}
                        className="text-accent hover:underline inline-flex items-center gap-1 text-xs font-mono"
                      >
                        <span>{c.certNo}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-text-muted text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate Preview Card */}
        <div className="lg:col-span-5 rounded-card border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
              Certificate template preview
            </h3>
            <span className="text-[11px] font-mono text-text-muted">SVG / PDF Export</span>
          </div>

          <div className="p-4 rounded-control border border-border bg-surface-sunken space-y-3 text-center">
            <div className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center mx-auto text-accent">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted">
                Certificate of Completion
              </div>
              <div className="text-sm font-semibold text-text mt-1">Tanvi Sharma</div>
              <div className="text-xs text-text-muted mt-0.5">
                Advanced Data Analytics & Power BI
              </div>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
              <span className="font-mono">ID: CC-2026-JFS-0891</span>
              <span>16 Oct 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
