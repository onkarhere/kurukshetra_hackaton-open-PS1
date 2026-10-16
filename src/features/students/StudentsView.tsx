import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  SlidersHorizontal,
  ChevronDown,
  UserPlus,
  Plus,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { maskPhone } from '@/lib/utils'
import { Student } from '@/types'
import { cn } from '@/lib/utils'

export const StudentsView: React.FC = () => {
  const { role, setPendingAskQuery, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'at_risk' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')

  const students = store.students

  const filteredStudents = students.filter((s) => {
    if (activeTab === 'at_risk' && s.riskLevel === 'low') return false
    if (activeTab === 'overdue' && s.feeStatus !== 'overdue') return false
    if (selectedBatch !== 'all' && !s.batchIds.includes(selectedBatch)) return false
    if (selectedBranch !== 'all' && s.branch !== selectedBranch) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
    }
    return true
  })

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    )
  }

  const handleBulkMessage = () => {
    success(
      `Draft staged for ${selectedStudentIds.length} students`,
      'Staged in Approvals inbox for review.'
    )
    navigate('/approvals')
  }

  const renderRiskGlyph = (risk: string) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            Critical
          </span>
        )
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-warning font-medium text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            High
          </span>
        )
      case 'watch':
        return (
          <span className="inline-flex items-center gap-1 text-text-muted font-normal text-xs">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Watch
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted font-normal text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            Low
          </span>
        )
    }
  }

  const renderFeeGlyph = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Paid
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            Overdue
          </span>
        )
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 text-warning font-medium text-xs">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Due soon
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Students</h1>
          <p className="text-xs text-text-muted mt-0.5">
            320 enrolled candidates · Attendance, risk monitoring, and academic progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => success('Exporting student directory CSV...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/setup')}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            New student
          </Button>
        </div>
      </div>

      {/* Saved Views as Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'py-2 px-3 border-b-2 font-medium transition-colors',
              activeTab === 'all'
                ? 'border-accent text-text font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            All students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'py-2 px-3 border-b-2 font-medium transition-colors',
              activeTab === 'active'
                ? 'border-accent text-text font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('at_risk')}
            className={cn(
              'py-2 px-3 border-b-2 font-medium transition-colors',
              activeTab === 'at_risk'
                ? 'border-accent text-text font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            At risk ({students.filter((s) => s.riskLevel !== 'low').length})
          </button>
          {role !== 'trainer' && (
            <button
              onClick={() => setActiveTab('overdue')}
              className={cn(
                'py-2 px-3 border-b-2 font-medium transition-colors',
                activeTab === 'overdue'
                  ? 'border-accent text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              )}
            >
              Overdue fees ({students.filter((s) => s.feeStatus === 'overdue').length})
            </button>
          )}
        </div>

        <button
          onClick={() =>
            setDensity(density === 'comfortable' ? 'compact' : 'comfortable')
          }
          className="text-xs text-text-muted hover:text-text p-1.5 rounded-control border border-border bg-surface mb-1"
          title={`Switch to ${density === 'comfortable' ? 'compact (32px)' : 'comfortable (40px)'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filters as Chips above table */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border-strong rounded-control pl-8 pr-3 py-1.5 text-xs text-text outline-none focus:border-accent font-sans"
          />
        </div>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="bg-surface border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
        >
          <option value="all">Batch: All</option>
          {store.batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="bg-surface border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
        >
          <option value="all">Branch: All</option>
          <option value="Kothrud">Kothrud</option>
          <option value="Baner">Baner</option>
        </select>

        {(searchQuery || selectedBatch !== 'all' || selectedBranch !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedBatch('all')
              setSelectedBranch('all')
            }}
            className="text-text-muted hover:text-text text-xs underline ml-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk Action Bar on Selection */}
      {selectedStudentIds.length > 0 && (
        <div className="p-2.5 rounded-card border border-border bg-surface-sunken flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text">
              {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-text-muted hover:text-text text-[11px] underline"
            >
              Deselect
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              onClick={handleBulkMessage}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Draft WhatsApp reminder ({selectedStudentIds.length})
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => success(`Exported ${selectedStudentIds.length} rows to CSV`)}
            >
              Export selected
            </Button>
          </div>
        </div>
      )}

      {/* Table: Row height 40px comfortable, 32px compact. Sticky header. Names lead rows. Numbers right tabular. */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2 px-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    selectedStudentIds.length > 0 &&
                    selectedStudentIds.length === filteredStudents.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                  aria-label="Select all students"
                />
              </th>
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Phone</th>
              <th className="py-2 px-3">Enrolled batch</th>
              <th className="py-2 px-3 text-right">Attendance</th>
              {role !== 'trainer' && <th className="py-2 px-3">Fee status</th>}
              <th className="py-2 px-3">Risk tier</th>
              <th className="py-2 px-3 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudentIds.includes(st.id)
              const rowHeightClass = density === 'compact' ? 'h-8' : 'h-10'

              return (
                <tr
                  key={st.id}
                  onClick={() => navigate(`/students/${st.id}`)}
                  className={cn(
                    'hover:bg-surface-sunken/40 cursor-pointer transition-colors',
                    isSelected ? 'bg-surface-sunken/60' : '',
                    rowHeightClass
                  )}
                >
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(st.id)}
                      className="rounded border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                      aria-label={`Select ${st.name}`}
                    />
                  </td>
                  <td className="px-3 font-medium text-text truncate max-w-[180px]">
                    {st.name}
                  </td>
                  <td className="px-3 font-mono text-[11px] text-text-muted">
                    {maskPhone(st.phone)}
                  </td>
                  <td className="px-3 text-text-muted truncate max-w-[200px]">
                    {st.batchNames[0] || 'Unassigned'}
                  </td>
                  <td className="px-3 text-right tabular-nums font-normal text-text">
                    <span
                      className={
                        st.attendanceRate < 70
                          ? 'text-danger font-medium'
                          : st.attendanceRate < 80
                          ? 'text-warning'
                          : 'text-text'
                      }
                    >
                      {st.attendanceRate}%
                    </span>
                  </td>
                  {role !== 'trainer' && (
                    <td className="px-3">
                      {renderFeeGlyph(st.feeStatus)}
                    </td>
                  )}
                  <td className="px-3">
                    {renderRiskGlyph(st.riskLevel)}
                  </td>
                  <td className="px-3 text-right text-[11px] text-text-muted tabular-nums">
                    {st.lastSeen}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
