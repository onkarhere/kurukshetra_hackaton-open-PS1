import React from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowLeft,
  FileQuestion,
} from 'lucide-react'
import { store, useStore } from '@/mocks/store'

export const CertificateVerifyView: React.FC = () => {
  const { certNo } = useParams<{ certNo: string }>()

  const certificates = useStore((s) => s.certificates)
  const cert = certificates.find((c) => c.certificateNo === certNo)

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col justify-between p-6 select-none font-sans">
      <div className="max-w-md w-full mx-auto">
        <Link
          to="/"
          className="text-xs text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Batchwise Portal</span>
        </Link>

        {/* Case 1: NOT FOUND */}
        {!cert ? (
          <div className="p-6 rounded-dialog border border-border bg-surface shadow-dialog text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full border border-border bg-surface-sunken flex items-center justify-center text-text-muted">
              <FileQuestion className="w-6 h-6 text-warning" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-warning border border-border bg-surface-sunken px-2 py-0.5 rounded-full">
                <AlertOctagon className="w-3.5 h-3.5" />
                Certificate Not Found
              </div>
              <h1 className="text-base font-semibold text-text mt-2">Unregistered Credential</h1>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                No certificate record exists under registration ID{' '}
                <span className="font-mono font-medium text-text">{certNo}</span> in the CodeCraft Academy verified credential registry.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="text-xs text-accent hover:underline inline-flex items-center gap-1"
              >
                Return to homepage
              </Link>
            </div>
          </div>
        ) : cert.status === 'revoked' ? (
          /* Case 2: REVOKED */
          <div className="p-6 rounded-dialog border border-danger/30 bg-surface shadow-dialog text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full border border-danger/30 bg-danger/10 flex items-center justify-center text-danger">
              <XCircle className="w-6 h-6 text-danger" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-danger border border-danger/30 bg-danger/15 px-2.5 py-0.5 rounded-full">
                <AlertOctagon className="w-3.5 h-3.5" />
                Credential Revoked
              </div>
              <h1 className="text-lg font-semibold text-text mt-2">{cert.studentName}</h1>
              <p className="text-xs text-danger mt-1">
                This credential was officially revoked by CodeCraft Academy academic governance.
              </p>
            </div>

            <div className="p-3.5 rounded-control bg-surface-sunken border border-border text-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Credential ID</span>
                <span className="font-mono text-text font-medium">{cert.certificateNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Original Course</span>
                <span className="text-text">{cert.courseName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-danger font-bold uppercase tracking-wider text-[11px]">
                  Revoked
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Case 3: VALID */
          <div className="p-6 rounded-dialog border border-border bg-surface shadow-dialog text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full border border-border bg-surface-sunken flex items-center justify-center text-success">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-success border border-border bg-surface-sunken px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Authenticated Credential
              </div>
              <h1 className="text-lg font-semibold text-text mt-2">{cert.studentName}</h1>
              <p className="text-xs text-text-muted mt-0.5">{cert.courseName}</p>
            </div>

            <div className="p-3.5 rounded-control bg-surface-sunken border border-border text-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Credential ID</span>
                <span className="font-mono text-text font-medium">{cert.certificateNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Issuing Authority</span>
                <span className="text-text font-medium">CodeCraft Academy Pune</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Issue Date</span>
                <span className="text-text tabular-nums">{cert.issueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Academic Grade</span>
                <span className="font-medium text-text">{cert.grade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Attendance Rate</span>
                <span className="tabular-nums font-medium text-text">{cert.attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-success font-semibold text-[11px]">Valid ✓</span>
              </div>
            </div>

            {/* Mastered Skills */}
            <div className="text-left space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Assessed Competencies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cert.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded border border-border bg-surface text-[11px] text-text"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-text-muted font-mono pt-8">
        Secured by Institute OS (Batchwise) Credential Registry · CodeCraft Academy
      </div>
    </div>
  )
}
