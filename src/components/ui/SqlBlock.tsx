import React, { useState } from 'react'
import { ShieldCheck, Copy, Check } from 'lucide-react'

interface SqlBlockProps {
  sql: string
  readOnly?: boolean
  className?: string
}

export const SqlBlock: React.FC<SqlBlockProps> = ({ sql, readOnly = true, className = '' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Basic syntax highlight tokenizer for SQL keywords
  const highlightSql = (text: string) => {
    const keywords = [
      'SELECT',
      'FROM',
      'JOIN',
      'LEFT JOIN',
      'INNER JOIN',
      'ON',
      'WHERE',
      'AND',
      'OR',
      'GROUP BY',
      'ORDER BY',
      'LIMIT',
      'AS',
      'BETWEEN',
      'IN',
      'DESC',
      'ASC',
      'IS',
      'NOT',
      'NULL',
    ]

    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')

    const parts = text.split(pattern)
    return parts.map((part, index) => {
      if (keywords.includes(part)) {
        return (
          <span key={index} className="text-primary font-semibold">
            {part}
          </span>
        )
      }
      // Highlight string literals
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={index} className="text-success">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={`rounded-btn border border-border bg-surface-2 font-mono text-xs overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface text-fg-muted text-[11px]">
        <div className="flex items-center gap-1.5">
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-success" />
              Read-only
            </span>
          )}
          <span className="font-mono text-[11px] text-fg-muted">PostgreSQL 15</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-fg text-fg-muted p-1 rounded transition-colors text-[11px]"
          title="Copy SQL"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre className="p-3 overflow-x-auto text-fg text-xs leading-relaxed whitespace-pre font-mono selection:bg-primary/20">
        <code>{highlightSql(sql.trim())}</code>
      </pre>
    </div>
  )
}
