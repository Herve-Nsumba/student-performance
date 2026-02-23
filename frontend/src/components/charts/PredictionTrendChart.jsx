import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatShort } from '../../utils/time.js'

export default function PredictionTrendChart({ data, title='Predicted performance trend', note }) {
  return (
    <div className="card p-5">
      <div className="text-sm md:text-base font-medium">{title}</div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="x" tickFormatter={formatShort} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <Tooltip
              formatter={(v)=>[Number(v).toFixed(2),'Value']}
              labelFormatter={(l)=>formatShort(l)}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }}
            />
            <Line type="monotone" dataKey="y" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{note || 'Based on stored predictions.'}</div>
    </div>
  )
}
