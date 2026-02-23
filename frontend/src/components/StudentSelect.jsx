import React from 'react'
export default function StudentSelect({ students, value, onChange }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="w-full md:w-auto px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
    >
      <option value="">Select a student…</option>
      {students.map(s => (
        <option key={s.id} value={s.id}>{s.student_code} — {s.full_name}</option>
      ))}
    </select>
  )
}
