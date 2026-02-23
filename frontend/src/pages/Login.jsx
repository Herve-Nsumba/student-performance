import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, fetchTeacherOptions, fetchStudentOptions } from '../api/auth.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const ROLES = [
  { key: 'admin',   label: 'Admin' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'student', label: 'Student' },
]

const DEFAULT_PW = '1234'

export default function Login() {
  const nav = useNavigate()
  const [role, setRole] = useState('admin')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState(DEFAULT_PW)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Dropdown options from backend
  const [teachers, setTeachers] = useState([])    // string[]
  const [students, setStudents] = useState([])    // {username, student_code, full_name}[]

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchTeacherOptions().then(setTeachers).catch(() => {})
    fetchStudentOptions().then(setStudents).catch(() => {})
  }, [])

  // When role changes, set sensible defaults
  function switchRole(r) {
    setRole(r)
    setErr('')
    setPassword(DEFAULT_PW)
    if (r === 'admin') {
      setUsername('admin')
    } else if (r === 'teacher') {
      setUsername(teachers[0] || '')
    } else if (r === 'student') {
      setUsername(students[0]?.username || '')
    }
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      await login(username, password)
      nav('/app')
    } catch (e2) {
      setErr(e2.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg)] text-[var(--ink)]">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-xl card p-6 md:p-8">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="mt-2 text-sm md:text-base text-[var(--muted)]">
          Choose your role then sign in with your credentials.
        </div>

        {/* ── Role tabs ─────────────────────────────────────── */}
        <div className="mt-5 flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => switchRole(r.key)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                role === r.key
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--accentSoft)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {err ? <div className="mt-4 card p-4 border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">{err}</div> : null}

        <form onSubmit={submit} className="mt-5 space-y-4">

          {/* ── Admin: simple text input ───────────────────── */}
          {role === 'admin' ? (
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Username</div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
                autoComplete="username"
              />
            </label>
          ) : null}

          {/* ── Teacher: dropdown ──────────────────────────── */}
          {role === 'teacher' ? (
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Teacher account</div>
              {teachers.length > 0 ? (
                <select
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
                >
                  {teachers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="teacher username"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
                />
              )}
            </label>
          ) : null}

          {/* ── Student: dropdown ──────────────────────────── */}
          {role === 'student' ? (
            <label className="block">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Student profile</div>
              {students.length > 0 ? (
                <select
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
                >
                  {students.map((s) => (
                    <option key={s.username} value={s.username}>
                      {s.student_code} — {s.full_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="student code"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
                />
              )}
            </label>
          ) : null}

          {/* ── Password (always shown, pre-filled with 1234) ─ */}
          <label className="block">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
              autoComplete="current-password"
            />
            <div className="mt-1 text-xs text-[var(--muted)]">
              Demo default: <span className="font-mono">{DEFAULT_PW}</span>
            </div>
          </label>

          <button
            disabled={loading || !username || !password}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-white disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
