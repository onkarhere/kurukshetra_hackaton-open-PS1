import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Download,
  ShieldAlert,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store, useStore } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'

export const CertificatesView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [selectedBatchId, setSelectedBatchId] = useState('batch-java-b3')

  // Reactive store slices
  const certificates = useStore((s) => s.certificates)
  const students = useStore((s) => s.students)
  const batches = useStore((s) => s.batches)
  const courses = useStore((s) => s.courses)

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0]
  const course = courses.find((c) => c.id === selectedBatch?.courseId) || courses[0]
  const minAttendance = course?.completionRules?.minAttendancePercent || 80
  const minScore = course?.completionRules?.minAssessmentScore || 70

  // Filter students in selected batch
  const batchStudents = students.filter(
    (s) => s.batchIds.includes(selectedBatch?.id || '') || s.batchNames.includes(selectedBatch?.name || '')
  )

  const candidatesToEvaluate = batchStudents.length > 0 ? batchStudents : students.slice(0, 8)

  const evaluatedCandidates = candidatesToEvaluate.map((s) => {
    const isAttendanceMet = s.attendanceRate >= minAttendance
    const mockScore = Math.min(95, Math.max(45, s.attendanceRate - 2 + (parseInt(s.id.slice(-2), 10) || 5)))
    const isScoreMet = mockScore >= minScore
    const isEligible = isAttendanceMet && isScoreMet
    const existingCert = certificates.find((c) => c.studentId === s.id)

    let reason = ''
    if (!isAttendanceMet && !isScoreMet) {
      reason = `Attendance ${s.attendanceRate}% < ${minAttendance}%; score ${mockScore}% < ${minScore}%`
    } else if (!isAttendanceMet) {
      reason = `Attendance ${s.attendanceRate}% below ${minAttendance}% graduation requirement`
    } else if (!isScoreMet) {
      reason = `Assessment score ${mockScore}% below ${minScore}% pass mark`
    }

    return {
      id: s.id,
      name: s.name,
      attendance: s.attendanceRate,
      score: mockScore,
      isEligible,
      reason,
      certNo: existingCert?.certificateNo,
      certStatus: existingCert?.status,
      certId: existingCert?.id,
    }
  })

  const eligibleCount = evaluatedCandidates.filter((c) => c.isEligible).length

  // P1: Generate certificates creates an approval listing eligible and ineligible students
  const handleGenerate = () => {
    store.createCertificateGenerationApproval(course.id)
    success(
      `Approval staged for ${eligibleCount} certificates`,
      'Staged in Approvals inbox. Approving will issue cryptographic credentials.'
    )
    navigate('/approvals')
  }

  // P1: Revoke certificate
  const handleRevoke = (certId: string) => {
    store.revokeCertificate(certId)
    success('Certificate revoked', 'Status updated to Revoked. Verification registry updated.')
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Certificates & credentials</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Verifiable credentials with QR verification and graduation compliance checks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={eligibleCount === 0}
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
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-text-muted">
          Graduation benchmark: Minimum {minAttendance}% attendance and {minScore}% assessment score ({course.title})
        </div>
      </div>

      {/* Main Layout: Eligibility Table (7 cols) + Certificate Registry & Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Eligibility Table */}
        <div className="lg:col-span-7 rounded-card border border-border bg-surface overflow-hidden">
          <div className="p-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between text-xs">
            <span className="font-medium text-text">Graduation eligibility evaluation</span>
            <span className="text-text-muted tabular-nums">
              {eligibleCount} of {evaluatedCandidates.length} qualified
            </span>
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
              {evaluatedCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                  <td className="px-3 font-medium text-text">{c.name}</td>
                  <td className="px-3 text-right tabular-nums font-medium">
                    <span className={c.attendance < minAttendance ? 'text-danger' : 'text-text'}>
                      {c.attendance}%
                    </span>
                  </td>
                  <td className="px-3 text-right tabular-nums font-medium">
                    <span className={c.score < minScore ? 'text-danger' : 'text-text'}>
                      {c.score}%
                    </span>
                  </td>
                  <td className="px-3">
                    {c.isEligible ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger text-xs font-medium" title={c.reason}>
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

        {/* Certificate Registry & Actions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Registry Card */}
          <div className="rounded-card border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
                Issued credentials ({certificates.length})
              </h3>
              <span className="text-[11px] text-text-muted">Registry ledger</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-2.5 rounded-control border border-border bg-surface-sunken flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{cert.studentName}</span>
                      {cert.status === 'valid' ? (
                        <span className="text-[10px] text-success font-medium">Valid</span>
                      ) : (
                        <span className="text-[10px] text-danger font-bold">Revoked</span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/verify/${cert.certificateNo}`)}
                      className="text-[11px] font-mono text-accent hover:underline"
                    >
                      {cert.certificateNo}
                    </button>
                  </div>

                  {cert.status === 'valid' ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRevoke(cert.id)}
                      leftIcon={<Ban className="w-3 h-3 text-danger" />}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <span className="text-[10px] text-text-muted font-mono">Revoked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Template Preview */}
          <div className="rounded-card border border-border bg-surface p-4 space-y-3">
            <div className="p-4 rounded-control border border-border bg-surface-sunken space-y-3 text-center">
              <div className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center mx-auto text-accent">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                  Certificate of Completion
                </div>
                <div className="text-sm font-semibold text-text mt-1">Tanvi Sharma</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {course.title}
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
    </div>
  )
}
