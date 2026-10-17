export interface CsvColumn {
  key: string
  label: string
}

/**
 * Escapes a cell value for CSV, preventing CSV injection / formula injection.
 * Formula triggers: =, +, -, @
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  let str = String(value)

  // Prevent formula injection in spreadsheet applications (Excel, Google Sheets)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`
  }

  // If the cell contains quotes, commas, or newlines, escape quotes by doubling them and enclose in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Exports data rows as a downloadable CSV file.
 * Supports both signatures:
 * 1. exportToCsv(filename, columns, rows)
 * 2. exportToCsv(rows, filename, columns?)
 */
export function exportToCsv(
  arg1: string | Record<string, any>[],
  arg2: CsvColumn[] | string,
  arg3?: Record<string, any>[]
): void {
  let filename = 'export.csv'
  let columns: CsvColumn[] = []
  let rows: Record<string, any>[] = []

  if (typeof arg1 === 'string') {
    filename = arg1
    columns = (arg2 as CsvColumn[]) || []
    rows = arg3 || []
  } else if (Array.isArray(arg1)) {
    rows = arg1
    filename = typeof arg2 === 'string' ? arg2 : 'export.csv'
    if (Array.isArray(arg3)) {
      columns = arg3 as CsvColumn[]
    } else if (rows.length > 0) {
      columns = Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
    }
  }

  if (columns.length === 0 && rows.length > 0) {
    columns = Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
  }

  const headerLine = columns.map((c) => escapeCsvCell(c.label)).join(',')
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.key])).join(',')
  )

  const csvContent = [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
