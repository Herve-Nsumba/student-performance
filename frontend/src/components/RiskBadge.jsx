import React from 'react'
const styles = {
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  medium: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  high: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
}
export default function RiskBadge({ level, size = 'md' }) {
  const key = (level || '').toLowerCase()
  const cls = styles[key] || 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
  const sizeClass = size === 'lg'
    ? 'px-4 py-1.5 rounded-xl border text-sm font-semibold'
    : 'px-3 py-1 rounded-xl border text-[0.8125rem] font-medium'
  return <span className={`inline-flex items-center capitalize ${sizeClass} ${cls}`}>{key || 'unknown'}</span>
}
