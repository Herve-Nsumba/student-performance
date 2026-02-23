import React from 'react'
export default function DataTable({ columns, rows, empty }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-auto">
        <table className="min-w-full text-[0.8125rem]">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {columns.map(c => (
                <th key={c.key} className="text-left px-5 py-3.5 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-[var(--muted)]">{empty || 'No data available.'}</td></tr>
            ) : rows.map((r, idx) => (
              <tr key={idx} className="border-t border-[var(--line)] hover:bg-[var(--accentSoft)] transition-colors">
                {columns.map(c => <td key={c.key} className="px-5 py-3.5">{typeof c.render === 'function' ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
