import React from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Award,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import { store } from '@/mocks/store'

export const CertificateVerifyView: React.FC = () => {
  const { certNo } = useParams<{ certNo: string }>()

  const cert =
    store.certificates.find((c) => c.certificateNo === certNo) ||
    store.certificates[0]

  const isValid = cert.status === 'valid'

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between p-6 select-none animate-fade-in font-sans">
      <div className="max-w-md w-full mx-auto">
        <Link
          to="/"
          className="text-xs text-fg-muted hover:text-fg inline-flex items-center gap-1.5 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Batchwise Portal</span>
        </Link>

        {/* Verification Card */}
        <div className="p-6 rounded-modal border border-border bg-surface shadow-modal text-center space-y-5">
          {/* Status Badge Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success">
            {isValid ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : (
              <XCircle className="w-8 h-8 text-danger" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-success bg-success/10 border border-success/30 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Authenticated Credential
            </div>
            <h1 className="text-xl font-bold text-fg mt-2">{cert.studentName}</h1>
            <p className="text-xs text-fg-muted mt-0.5">{cert.courseName}</p>
          </div>

          <div className="p-4 rounded-card bg-surface-2 border border-border text-xs space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Credential ID</span>
              <span className="font-mono font-bold text-fg">{cert.certificateNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Issuing Authority</span>
              <span className="font-semibold text-fg">CodeCraft Academy Pune</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Issue Date</span>
              <span className="font-mono text-fg">{cert.issueDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Academic Grade</span>
              <span className="font-bold text-primary">{cert.grade}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Attendance Rate</span>
              <span className="font-mono font-bold text-success">{cert.attendanceRate}%</span>
            </div>
          </div>

          {/* Mastered Skills */}
          <div className="text-left space-y-1.5">
            <div className="text-[11px] font-mono text-fg-muted uppercase tracking-wider font-semibold">
              Assessed Competencies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cert.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[11px] text-fg"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-fg-muted font-mono pt-8">
        Secured by Batchwise Cryptographic Credential Ledger · CodeCraft Academy
      </div>
    </div>
  )
}
