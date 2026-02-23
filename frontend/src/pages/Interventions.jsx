import React, { useMemo, useState } from 'react'
import SectionHeader from '../components/SectionHeader.jsx'
import DataTable from '../components/DataTable.jsx'

/**
 * ML-first interventions tracking.
 * Stored locally for now (fast demo). Can be moved to Django later.
 */
export default function Interventions() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pi_interventions_v1') || '[]') } catch { return [] }
  })
  const [form, setForm] = useState({ student_code:'', action:'', status:'open' })
  const save = (next) => { setItems(next); localStorage.setItem('pi_interventions_v1', JSON.stringify(next)) }

  function add(e){
    e.preventDefault()
    const it = { id: crypto.randomUUID(), student_code: form.student_code.trim(), action: form.action.trim(), status: form.status, created_at: new Date().toISOString() }
    save([it, ...items])
    setForm({ student_code:'', action:'', status:'open' })
  }

  const columns = [
    { key:'created_at', label:'Date' },
    { key:'student_code', label:'Student code' },
    { key:'action', label:'Action' },
    { key:'status', label:'Status' },
  ]
  const openCount = useMemo(() => items.filter(i=>i.status==='open').length, [items])

  return (
    <div className="space-y-5">
      <SectionHeader title="Interventions" subtitle="Track support actions for at‑risk students." right={<span className="kbd">{openCount} open</span>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><DataTable columns={columns} rows={items} empty="No interventions yet." /></div>
        <div className="card p-5 md:p-6">
          <div className="text-sm md:text-base font-semibold">Add intervention</div>
          <form onSubmit={add} className="mt-4 space-y-3">
            <Field label="Student code" value={form.student_code} onChange={(v)=>setForm(p=>({...p, student_code:v}))} />
            <Field label="Action" value={form.action} onChange={(v)=>setForm(p=>({...p, action:v}))} />
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Status</div>
              <select value={form.status} onChange={(e)=>setForm(p=>({...p, status:e.target.value}))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]">
                <option value="open">Open</option>
                <option value="done">Done</option>
              </select>
            </label>
            <button disabled={!form.student_code || !form.action}
              className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white disabled:opacity-50">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <input value={value} onChange={(e)=>onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]" />
    </label>
  )
}
