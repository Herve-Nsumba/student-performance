import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function FeatureBarChart({ record }) {
  const data = record ? [
    { name: 'Prev', value: record.previous_scores },
    { name: 'Attend', value: record.attendance },
    { name: 'Hours', value: record.hours_studied },
    { name: 'Tutor', value: record.tutoring_sessions },
  ] : []

  return (
    <div className="card p-5">
      <div className="text-sm md:text-base font-medium">Latest learning indicators</div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
            <Bar dataKey="value" fill="var(--accent2)" radius={[10,10,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{record ? 'Newest record for the selected student.' : 'Add a record to see indicators.'}</div>
    </div>
  )
}
