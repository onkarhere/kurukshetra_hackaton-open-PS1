import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  UserPlus,
  Plus,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { maskPhone } from '@/lib/utils'
import { Student } from '@/types'

export const StudentsView: React.FC = () => {
  const { role, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'at_risk' | 'overdue' | 'leads'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [density, setDensity] = useState<'compact' | 'normal'>('normal')

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
      `AI Draft Prepared for ${selectedStudentIds.length} students`,
      'Staged in Approvals inbox for your review.'
    )
    navigate('/approvals')
  }

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Students Directory</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Total 320 enrolled candidates · Attendance, Risk monitoring & Payment records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedStudentIds.length > 0 && (
            <Button
              variant="ai"
              size="sm"
              onClick={handleBulkMessage}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Draft WhatsApp ({selectedStudentIds.length})
            </Button>
          )}

          <Button
            variant="outline"
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
            New Student
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('at_risk')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'at_risk'
              ? 'border-danger text-danger font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          At Risk ({students.filter((s) => s.riskLevel !== 'low').length})
        </button>
        {role !== 'trainer' && (
          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'overdue'
                ? 'border-warning text-warning font-semibold'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            Overdue Fees ({students.filter((s) => s.feeStatus === 'overdue').length})
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-2.5 rounded-card border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-fg-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-btn pl-8 pr-3 py-1.5 text-xs text-fg outline-none focus:border-primary"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-surface-2 border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          >
            <option value="all">All Batches</option>
            {store.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-surface-2 border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          >
            <option value="all">All Branches</option>
            <option value="Kothrud">Kothrud</option>
            <option value="Baner">Baner</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDensity(density === 'normal' ? 'compact' : 'normal')}
            className="text-xs text-fg-muted hover:text-fg p-1.5 rounded border border-border"
            title="Toggle Density"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider sticky top-0">
            <tr>
              <th className="py-2.5 px-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    selectedStudentIds.length > 0 &&
                    selectedStudentIds.length === filteredStudents.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                />
              </th>
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Enrolled Batch</th>
              <th className="py-2.5 px-3">Attendance</th>
              {role !== 'trainer' && <th className="py-2.5 px-3">Fee Status</th>}
              <th className="py-2.5 px-3">Risk Tier</th>
              <th className="py-2.5 px-3">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudentIds.includes(st.id)
              return (
                <tr
                  key={st.id}
                  onClick={() => navigate(`/students/${st.id}`)}
                  className={`hover:bg-surface-2/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/5' : ''
                  } ${density === 'compact' ? 'h-9' : 'h-11'}`}
                >
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(st.id)}
                      className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {st.avatar || st.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="font-medium text-fg">{st.name}</div>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-fg-muted">
                    {maskPhone(st.phone)}
                  </td>
                  <td className="py-2 px-3 text-fg-muted truncate max-w-[180px]">
                    {st.batchNames[0]}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                        <div
                          className={`h-full ${
                            st.attendanceRate < 60
                              ? 'bg-danger'
                              : st.attendanceRate < 75
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${st.attendanceRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-fg">
                        {st.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  {role !== 'trainer' && (
                    <td className="py-2 px-3">
                      <StatusPill status={st.feeStatus} size="sm" />
                    </td>
                  )}
                  <td className="py-2 px-3">
                    <StatusPill status={st.riskLevel} size="sm" />
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-fg-muted">
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
