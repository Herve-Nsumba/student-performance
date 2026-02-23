import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../auth/session.js'
import ThemeToggle from './ThemeToggle.jsx'

/* ── Nav icons (lightweight SVG) ──────────────────────────────── */

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  students: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 9l-5 5-2-2-4 4" />
    </svg>
  ),
  interventions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
}

function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/app'}
      className={({ isActive }) =>
        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.8125rem] leading-snug transition-all duration-150 ' +
        (isActive
          ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
          : 'text-[var(--muted)] font-medium hover:text-[var(--ink)] hover:bg-[var(--accentSoft)]')
      }
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      {children}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const nav = useNavigate()
  const session = getSession()
  const roleName = session?.role?.charAt(0).toUpperCase() + (session?.role?.slice(1) || '')

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}>
        <div className="max-w-[1320px] mx-auto px-5 flex items-center justify-between h-16">
          <Link to="/app" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-tight tracking-tight">
                Predict<span className="text-[var(--accent)]">Edu</span>
              </div>
              <div className="text-[11px] text-[var(--muted)] leading-tight">Early-warning system</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase bg-[var(--accentSoft)] text-[var(--accent)] border border-[var(--line)]">
              {roleName || 'Guest'}
            </span>
            <button
              onClick={() => { clearSession(); nav('/'); }}
              className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--accentSoft)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────── */}
      <div className="max-w-[1320px] mx-auto px-5 py-6 flex gap-6">
        {/* Sidebar — 240px on desktop, horizontal scroll on mobile */}
        <aside className="shrink-0 hidden md:block w-[240px]">
          <div className="card p-5 sticky top-[88px]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-semibold mb-4 px-1">Menu</div>
            <nav className="flex flex-col gap-1">
              <NavItem to="/app" icon={icons.dashboard}>Dashboard</NavItem>
              {session?.role !== 'student' ? <NavItem to="/app/students" icon={icons.students}>Students</NavItem> : null}
              <NavItem to="/app/analytics" icon={icons.analytics}>Analytics</NavItem>
              <NavItem to="/app/interventions" icon={icons.interventions}>Interventions</NavItem>
            </nav>
          </div>
        </aside>

        {/* Mobile nav — horizontal strip */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--line)] px-3 py-2 flex gap-1 overflow-x-auto" style={{ background: 'color-mix(in srgb, var(--card) 90%, transparent)', backdropFilter: 'blur(12px)' }}>
          <NavItem to="/app" icon={icons.dashboard}>Dashboard</NavItem>
          {session?.role !== 'student' ? <NavItem to="/app/students" icon={icons.students}>Students</NavItem> : null}
          <NavItem to="/app/analytics" icon={icons.analytics}>Analytics</NavItem>
          <NavItem to="/app/interventions" icon={icons.interventions}>Interventions</NavItem>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  )
}
