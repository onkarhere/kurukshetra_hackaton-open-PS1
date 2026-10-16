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

  // Syntax highlight for SQL keywords
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
      'ROUND',
      'AVG',
      'SUM',
      'COUNT',
      'DATE_TRUNC',
    ]

    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
    const parts = text.split(pattern)

    return parts.map((part, index) => {
      if (keywords.includes(part)) {
        return (
          <span key={index} className="text-accent font-medium">
            {part}
          </span>
        )
      }
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={index} className="text-text-muted">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={`rounded-card border border-border bg-surface-sunken font-mono text-xs overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface text-text-muted text-xs">
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted bg-surface-sunken border border-border px-1.5 py-0.5 rounded-control">
              <ShieldCheck className="w-3 h-3 text-accent" strokeWidth={1.5} />
              Read-only
            </span>
          )}
          <span className="text-[11px] text-text-muted font-mono">PostgreSQL</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-text text-text-muted p-1 rounded transition-colors text-xs"
          title="Copy SQL"
        >
          {copied ? <Check className="w-3 h-3 text-success" strokeWidth={1.5} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre className="p-3 overflow-x-auto text-text text-xs leading-relaxed whitespace-pre font-mono">
        <code>{highlightSql(sql.trim())}</code>
      </pre>
    </div>
  )
}
