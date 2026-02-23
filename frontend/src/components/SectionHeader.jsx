import React from 'react'
export default function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle ? <p className="text-[0.8125rem] md:text-[0.9375rem] text-[var(--muted)] mt-1 leading-relaxed">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}
