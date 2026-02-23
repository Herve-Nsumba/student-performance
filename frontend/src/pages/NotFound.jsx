import React from 'react'
import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] grid place-items-center p-5">
      <div className="card p-10 text-center max-w-md">
        <div className="text-5xl font-bold text-[var(--accent)]">404</div>
        <div className="mt-3 text-lg font-semibold">Page not found</div>
        <div className="mt-2 text-[0.8125rem] text-[var(--muted)]">The page you are looking for does not exist or has been moved.</div>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">Back to home</Link>
      </div>
    </div>
  )
}
