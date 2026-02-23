import React, { useMemo, useState } from 'react'

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        step="any"
        className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
        placeholder="0"
      />
    </label>
  )
}

export default function RecordForm({ studentId, onSubmit, busy }) {
  const [form, setForm] = useState({ previous_scores:'', attendance:'', hours_studied:'', tutoring_sessions:'' })

  const canSubmit = useMemo(() => {
    if (!studentId) return false
    return Object.values(form).every(v => String(v).trim() !== '')
  }, [form, studentId])

  async function handle(e) {
    e.preventDefault()
    if (!canSubmit || busy) return
    const payload = {
      student_id: Number(studentId),
      previous_scores: Number(form.previous_scores),
      attendance: Number(form.attendance),
      hours_studied: Number(form.hours_studied),
      tutoring_sessions: Number(form.tutoring_sessions),
    }
    await onSubmit(payload)
    setForm({ previous_scores:'', attendance:'', hours_studied:'', tutoring_sessions:'' })
  }

  return (
    <form onSubmit={handle} className="card p-5 md:p-6">
      <div className="text-sm md:text-base font-semibold">Add a new record</div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="New score" value={form.previous_scores} onChange={(v)=>setForm(p=>({...p, previous_scores:v}))} />
        <Field label="Attendance" value={form.attendance} onChange={(v)=>setForm(p=>({...p, attendance:v}))} />
        <Field label="Hours studied" value={form.hours_studied} onChange={(v)=>setForm(p=>({...p, hours_studied:v}))} />
        <Field label="Tutoring sessions" value={form.tutoring_sessions} onChange={(v)=>setForm(p=>({...p, tutoring_sessions:v}))} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-[var(--muted)]">Tip: run prediction after saving the record.</div>
        <button
          disabled={!canSubmit || busy}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] bg-[var(--accent)] text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save record'}
        </button>
      </div>
    </form>
  )
}
