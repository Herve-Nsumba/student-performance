import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import { listStudents, createStudent, updateStudent, deleteStudent } from '../api/students.js'

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
      />
    </label>
  )
}

/* ── Edit Modal ── */
function EditModal({ student, onClose, onSave, busy }) {
  const [form, setForm] = useState({
    student_code: student.student_code || '',
    full_name: student.full_name || '',
    class_name: student.class_name || '',
  })

  async function handle(e) {
    e.preventDefault()
    if (busy) return
    await onSave(student.id, form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Dialog */}
      <div className="relative w-full max-w-md card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="text-base font-semibold">Edit student</div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handle} className="space-y-3">
          <Field label="Student code" value={form.student_code} onChange={(v)=>setForm(p=>({...p, student_code:v}))} />
          <Field label="Full name" value={form.full_name} onChange={(v)=>setForm(p=>({...p, full_name:v}))} />
          <Field label="Class name" value={form.class_name} onChange={(v)=>setForm(p=>({...p, class_name:v}))} />
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--accentSoft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.student_code || !form.full_name}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white disabled:opacity-50 hover:bg-amber-600 transition-colors"
            >
              {busy ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ student, onClose, onConfirm, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Dialog */}
      <div className="relative w-full max-w-sm card p-6 shadow-2xl">
        <div className="text-base font-semibold mb-2">Delete student</div>
        <p className="text-[0.8125rem] text-[var(--muted)] leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-[var(--ink)]">{student.full_name}</span> ({student.student_code})?
          This will permanently remove the student and all associated records and predictions from the database.
        </p>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--accentSoft)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(student.id)}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white disabled:opacity-50 hover:bg-rose-600 transition-colors"
          >
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Action Buttons Cell ── */
function ActionButtons({ row, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        to={`/app/students/${row.id}`}
      >
        View
      </Link>
      <button
        onClick={() => onEdit(row)}
        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(row)}
        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
      >
        Delete
      </button>
    </div>
  )
}

/* ── Main Page ── */
export default function Students() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ student_code:'', full_name:'', class_name:'' })

  // Edit / Delete state
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyEdit, setBusyEdit] = useState(false)
  const [busyDelete, setBusyDelete] = useState(false)

  async function refresh() {
    setLoading(true); setErr('')
    try {
      const data = await listStudents()
      setStudents(Array.isArray(data) ? data : [])
    } catch (e) {
      setErr(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      String(s.student_code).toLowerCase().includes(q) ||
      String(s.full_name).toLowerCase().includes(q) ||
      String(s.class_name || '').toLowerCase().includes(q)
    )
  }, [students, query])

  async function addStudent(e) {
    e.preventDefault()
    setAdding(true); setErr('')
    try {
      await createStudent(form)
      setForm({ student_code:'', full_name:'', class_name:'' })
      await refresh()
    } catch (e2) {
      setErr(e2.message || 'Create failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleEdit(id, payload) {
    setBusyEdit(true); setErr('')
    try {
      await updateStudent(id, payload)
      setEditTarget(null)
      await refresh()
    } catch (e) {
      setErr(e.message || 'Update failed')
    } finally {
      setBusyEdit(false)
    }
  }

  async function handleDelete(id) {
    setBusyDelete(true); setErr('')
    try {
      await deleteStudent(id)
      setDeleteTarget(null)
      await refresh()
    } catch (e) {
      setErr(e.message || 'Delete failed')
    } finally {
      setBusyDelete(false)
    }
  }

  const columns = [
    { key:'student_code', label:'Code' },
    { key:'full_name', label:'Name' },
    { key:'class_name', label:'Class' },
    { key:'created_at', label:'Created' },
    { key:'action', label:'Actions', render: (r) => <ActionButtons row={r} onEdit={setEditTarget} onDelete={setDeleteTarget} /> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Students"
        subtitle="Manage student profiles and open details for records + predictions."
        right={
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            className="w-full md:w-80 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
            placeholder="Search by code, name, class..."
          />
        }
      />

      {err ? <div className="card p-4 border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">{err}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {loading ? <div className="card p-8 text-center text-[var(--muted)]">Loading students...</div> : <DataTable columns={columns} rows={filtered} empty="No students yet." />}
        </div>
        <div className="card p-5 md:p-6">
          <div className="text-sm md:text-base font-semibold">Add student</div>
          <form onSubmit={addStudent} className="mt-4 space-y-3">
            <Field label="Student code" value={form.student_code} onChange={(v)=>setForm(p=>({...p, student_code:v}))} />
            <Field label="Full name" value={form.full_name} onChange={(v)=>setForm(p=>({...p, full_name:v}))} />
            <Field label="Class name" value={form.class_name} onChange={(v)=>setForm(p=>({...p, class_name:v}))} />
            <button
              disabled={adding || !form.student_code || !form.full_name}
              className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white disabled:opacity-50"
            >
              {adding ? 'Saving...' : 'Create'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          student={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
          busy={busyEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          student={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={busyDelete}
        />
      )}
    </div>
  )
}
