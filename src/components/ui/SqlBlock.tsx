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

    // Tokenize into keywords, strings, numbers, and plain code
    const tokenRegex = /(\b(?:SELECT|FROM|LEFT\s+JOIN|INNER\s+JOIN|JOIN|ON|WHERE|AND|OR|GROUP\s+BY|ORDER\s+BY|LIMIT|AS|BETWEEN|IN|DESC|ASC|IS|NOT|NULL|ROUND|AVG|SUM|COUNT|DATE_TRUNC)\b|'[^']*'|\b\d+(?:\.\d+)?\b|--[^\n]*)/gi

    const parts = text.split(tokenRegex)

    return parts.map((part, index) => {
      if (!part) return null
      const upper = part.toUpperCase()
      if (keywords.includes(upper)) {
        return (
          <span key={index} className="text-[#D6B48A] font-medium">
            {part}
          </span>
        )
      }
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={index} className="text-[#9FD9AE]">
            {part}
          </span>
        )
      }
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        return (
          <span key={index} className="text-[#F2C46D]">
            {part}
          </span>
        )
      }
      if (part.startsWith('--')) {
        return (
          <span key={index} className="text-[#CDB9A6] italic">
            {part}
          </span>
        )
      }
      return <span key={index} className="text-[#F3E9DE]">{part}</span>
    })
  }

  return (
    <div className={`rounded-card border border-[#4F3B2E] bg-[#33251F] font-mono text-xs overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#4F3B2E] bg-[#2A1C14] text-[#CDB9A6] text-xs">
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9FD9AE] bg-[#9FD9AE]/10 border border-[#9FD9AE]/30 px-1.5 py-0.5 rounded-control">
              <ShieldCheck className="w-3 h-3 text-[#9FD9AE]" strokeWidth={1.5} />
              Read-only
            </span>
          )}
          <span className="text-[11px] text-[#CDB9A6] font-mono">PostgreSQL</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-[#F3E9DE] text-[#CDB9A6] p-1 rounded transition-colors text-xs"
          title="Copy SQL"
        >
          {copied ? <Check className="w-3 h-3 text-[#9FD9AE]" strokeWidth={1.5} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre className="p-3 overflow-x-auto text-[#F3E9DE] text-xs leading-relaxed whitespace-pre font-mono">
        <code>{highlightSql(sql.trim())}</code>
      </pre>
    </div>
  )
}
