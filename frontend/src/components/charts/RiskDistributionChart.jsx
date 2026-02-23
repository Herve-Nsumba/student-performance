import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts'
const COLORS = ['#0f766e', '#b45309', '#9f1239'] // teal, amber, rose
export default function RiskDistributionChart({ low=0, medium=0, high=0, title='Risk distribution', note }) {
  const data = [
    { name:'Low', value: low },
    { name:'Medium', value: medium },
    { name:'High', value: high },
  ].filter(d => d.value > 0)

  return (
    <div className="card p-5">
      <div className="text-sm md:text-base font-medium">{title}</div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={2}>
              {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">{note || 'Counts based on latest prediction per student.'}</div>
    </div>
  )
}
