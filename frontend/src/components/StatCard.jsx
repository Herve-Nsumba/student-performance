import React from 'react'
export default function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-[0.8125rem] text-[var(--muted)] leading-relaxed">{hint}</div> : null}
    </div>
  )
}
