import React, { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"

function pickColors(n) {
  // A soft palette (not default neon), still distinct.
  const base = [
    "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#ea580c",
    "#0d9488", "#9333ea", "#4b5563", "#ca8a04", "#0891b2",
    "#be123c", "#15803d", "#1d4ed8", "#a21caf", "#b45309",
  ]
  const out = []
  for (let i = 0; i < n; i++) out.push(base[i % base.length])
  return out
}

export default function AllStudentsTrendChart({
  seriesKeys = [],
  data = [],
  title = "All students prediction trends",
  note = "Each line is a student. Dashed line is the overall average.",
  averageKey = "__avg__",
}) {
  const colors = useMemo(() => pickColors(seriesKeys.length), [seriesKeys])

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm md:text-base font-medium">{title}</div>
          {note ? <div className="mt-1 text-xs text-[var(--muted)]">{note}</div> : null}
        </div>
      </div>

      <div className="mt-4 h-[320px]">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-[var(--muted)]">
            No prediction data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="x" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
              <Legend />

              {/* Average (dashed, neutral) */}
              <Line
                type="monotone"
                dataKey={averageKey}
                name="Average"
                stroke="var(--ink)"
                strokeDasharray="6 6"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* Student lines */}
              {seriesKeys.map((k, idx) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={k}
                  stroke={colors[idx]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
