import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle.jsx'

/* ───────────────────────────────────────────────────────────────
   Animation helpers
   ─────────────────────────────────────────────────────────────── */

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fade}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ───────────────────────────────────────────────────────────────
   Logo
   ─────────────────────────────────────────────────────────────── */

function Logo({ size = 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const text = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dim} rounded-xl bg-[var(--accent)] grid place-items-center`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      </div>
      <span className={`${text} font-semibold tracking-tight`}>
        Predict<span className="text-[var(--accent)]">Edu</span>
      </span>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────
   Section wrapper
   ─────────────────────────────────────────────────────────────── */

function Section({ id, children, className = '', padY = 'py-14' }) {
  return (
    <section id={id} className={`${padY} ${className}`}>
      <div className="max-w-[1120px] mx-auto px-5">{children}</div>
    </section>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--card)]/80 text-xs font-medium text-[var(--muted)] mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
      {children}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────
   Hero illustration — mini analytics dashboard (pure SVG)
   ─────────────────────────────────────────────────────────────── */

function HeroIllustration() {
  return (
    <div className="card p-5 overflow-hidden bg-gradient-to-br from-[var(--card)] to-[var(--bg)]">
      {/* Mini dashboard header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <div className="ml-2 h-2.5 w-24 rounded-full bg-[var(--line)]" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Students', value: '142', color: 'var(--accent)' },
          { label: 'At risk', value: '23', color: '#dc2626' },
          { label: 'Avg score', value: '68.4', color: 'var(--accent2)' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{s.label}</div>
            <div className="mt-1 text-lg font-semibold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">Prediction trends</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
              <span className="w-3 h-[2px] rounded bg-[var(--accent)]" /> Student A
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
              <span className="w-3 h-[2px] rounded bg-[var(--accent2)]" /> Student B
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
              <span className="w-3 h-[2px] rounded bg-rose-400" /> Student C
            </span>
          </div>
        </div>
        <svg viewBox="0 0 320 140" className="w-full" fill="none">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="30" y1={15 + i * 28} x2="310" y2={15 + i * 28} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          ))}
          {/* Y-axis labels */}
          <text x="22" y="19" textAnchor="end" fontSize="8" fill="var(--muted)">100</text>
          <text x="22" y="47" textAnchor="end" fontSize="8" fill="var(--muted)">75</text>
          <text x="22" y="75" textAnchor="end" fontSize="8" fill="var(--muted)">50</text>
          <text x="22" y="103" textAnchor="end" fontSize="8" fill="var(--muted)">25</text>
          <text x="22" y="131" textAnchor="end" fontSize="8" fill="var(--muted)">0</text>

          {/* Risk zone fill (below 50 = high risk) */}
          <rect x="30" y="71" width="280" height="56" rx="2" fill="rgba(220,38,38,0.03)" />
          <text x="315" y="100" textAnchor="end" fontSize="7" fill="rgba(220,38,38,0.3)">risk zone</text>

          {/* Student A - improving (maroon) */}
          <motion.polyline
            points="50,100 100,90 150,72 200,55 250,40 300,30"
            stroke="#7b2d26"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          />
          {[
            [50, 100], [100, 90], [150, 72], [200, 55], [250, 40], [300, 30],
          ].map(([cx, cy], i) => (
            <motion.circle
              key={`a${i}`} cx={cx} cy={cy} r="3" fill="#7b2d26"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
            />
          ))}

          {/* Student B - stable mid-range (teal) */}
          <motion.polyline
            points="50,65 100,58 150,62 200,56 250,52 300,48"
            stroke="#1f6f78"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
          />
          {[
            [50, 65], [100, 58], [150, 62], [200, 56], [250, 52], [300, 48],
          ].map(([cx, cy], i) => (
            <motion.circle
              key={`b${i}`} cx={cx} cy={cy} r="3" fill="#1f6f78"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
            />
          ))}

          {/* Student C - declining, entering risk zone (rose) */}
          <motion.polyline
            points="50,38 100,50 150,68 200,85 250,100 300,110"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
          />
          {[
            [50, 38], [100, 50], [150, 68], [200, 85], [250, 100], [300, 110],
          ].map(([cx, cy], i) => (
            <motion.circle
              key={`c${i}`} cx={cx} cy={cy} r="3" fill="#f43f5e"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.15, type: 'spring' }}
            />
          ))}

          {/* 50-line threshold */}
          <line x1="30" y1="71" x2="310" y2="71" stroke="rgba(220,38,38,0.25)" strokeWidth="1" strokeDasharray="4 3" />
        </svg>
      </div>

      {/* Risk badges row */}
      <div className="mt-3 flex items-center gap-2 justify-end">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">2 Low</span>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">5 Medium</span>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">3 High</span>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────
   1. HERO
   ─────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <Section id="hero" padY="pt-10 pb-16">
      {/* Nav bar */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-16"
      >
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] hover:bg-[var(--accentSoft)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </motion.nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Left column — text */}
        <div>
          <Reveal>
            <SectionLabel>Intelligent Academic Early Warning System</SectionLabel>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-semibold leading-[1.10] tracking-tight">
              Predict performance trends early and intervene{' '}
              <span className="text-[var(--accent)]">before</span> results decline.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-5 text-lg md:text-xl text-[var(--muted)] leading-relaxed">
              PredictEdu monitors learning indicators and uses machine learning to flag
              at-risk students — giving teachers and admins time to act.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 rounded-2xl text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
              <a
                href="#how"
                className="px-6 py-3 rounded-2xl text-sm font-medium border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--accentSoft)] transition-colors"
              >
                See how it works
              </a>
            </div>
          </Reveal>
        </div>

        {/* Right column — dashboard illustration */}
        <Reveal delay={0.2}>
          <HeroIllustration />
        </Reveal>
      </div>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────────────
   2. TRUST ROW
   ─────────────────────────────────────────────────────────────── */

function TrustRow() {
  const items = [
    { label: 'Random Forest ML model', icon: '01' },
    { label: '0 \u2013 100 predicted score', icon: '02' },
    { label: 'R\u00B2 \u2248 0.78 trained evaluation', icon: '03' },
  ]
  return (
    <div className="border-y border-[var(--line)] bg-[var(--card)]/60">
      <div className="max-w-[1120px] mx-auto px-5 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
        {items.map((it) => (
          <Reveal key={it.icon} delay={Number(it.icon) * 0.05}>
            <div className="flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <span className="w-7 h-7 rounded-lg bg-[var(--accentSoft)] text-[var(--accent)] text-[10px] font-bold grid place-items-center">
                {it.icon}
              </span>
              {it.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────
   3. HOW IT WORKS (4 steps)
   ─────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Collect indicators',
      desc: 'Previous scores, attendance rate, study hours, and tutoring sessions.',
      color: 'var(--accent)',
    },
    {
      num: '02',
      title: 'Predict performance',
      desc: 'A trained Random Forest model produces a 0\u2013100 predicted score.',
      color: 'var(--accent2)',
    },
    {
      num: '03',
      title: 'Detect risk level',
      desc: 'Students are classified as low, medium, or high risk automatically.',
      color: 'var(--accent)',
    },
    {
      num: '04',
      title: 'Intervene early',
      desc: 'Teachers and admins get actionable insights to support students in time.',
      color: 'var(--accent2)',
    },
  ]

  return (
    <Section id="how">
      <Reveal>
        <SectionLabel>Process</SectionLabel>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 text-[var(--muted)] text-base max-w-md">
          Four steps from raw data to early intervention.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <Reveal key={s.num} delay={i * 0.08}>
            <div className="card p-6 h-full hover:-translate-y-1 transition-transform duration-300">
              <div
                className="w-10 h-10 rounded-xl text-xs font-bold text-white grid place-items-center"
                style={{ background: s.color }}
              >
                {s.num}
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm md:text-base text-[var(--muted)] leading-relaxed">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────────────
   4. BENEFITS
   ─────────────────────────────────────────────────────────────── */

function Benefits() {
  const items = [
    {
      title: 'Early risk detection',
      desc: 'Identify struggling students weeks before traditional assessments reveal problems.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" /><path d="M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      ),
    },
    {
      title: 'Data-driven interventions',
      desc: 'Base support decisions on predicted trends rather than intuition alone.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.22-8.56" /><path d="M21 3v6h-6" />
        </svg>
      ),
    },
    {
      title: 'Role-based privacy',
      desc: 'Students see only their data. Teachers see their class. Admins see everything.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
    },
    {
      title: 'Trend dashboards',
      desc: 'Visual charts track prediction history so progress is always visible at a glance.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="M18 9l-5 5-2-2-4 4" />
        </svg>
      ),
    },
  ]

  return (
    <Section id="benefits" className="bg-[var(--card)]/50">
      <Reveal>
        <SectionLabel>Outcomes</SectionLabel>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Why it matters</h2>
        <p className="mt-2 text-[var(--muted)] text-base max-w-md">
          Better data, earlier action, improved student outcomes.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.06}>
            <div className="card p-6 flex gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-[var(--accentSoft)] text-[var(--accent)] grid place-items-center">
                {item.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm md:text-base text-[var(--muted)] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────────────
   5. ROLE CARDS
   ─────────────────────────────────────────────────────────────── */

function Roles() {
  const roles = [
    {
      title: 'Admin / Registrar',
      desc: 'Full system visibility. Manage students, teachers, and monitor institution-wide performance trends.',
      abilities: ['View all predictions & analytics', 'Manage student and teacher accounts', 'Monitor system-wide risk distribution'],
      color: 'var(--accent)',
      soft: 'var(--accentSoft)',
    },
    {
      title: 'Teacher',
      desc: 'Class-level insight. Track your students\u2019 progress and take action when risk levels rise.',
      abilities: ['Run predictions for your students', 'View class trends and at-risk rankings', 'Add student records and indicators'],
      color: 'var(--accent2)',
      soft: 'var(--accent2Soft)',
    },
    {
      title: 'Student',
      desc: 'Personal dashboard. See your own predicted performance and understand what factors matter.',
      abilities: ['View your prediction history', 'Track your risk level over time', 'Understand which indicators to improve'],
      color: 'var(--accent)',
      soft: 'var(--accentSoft)',
    },
  ]

  return (
    <Section id="roles">
      <Reveal>
        <SectionLabel>Access levels</SectionLabel>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Built for every role</h2>
        <p className="mt-2 text-[var(--muted)] text-base max-w-md">
          Each user sees only what they need. Privacy and relevance by design.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {roles.map((r, i) => (
          <Reveal key={r.title} delay={i * 0.08}>
            <div className="card p-6 h-full flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div
                className="w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: r.soft }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm md:text-base text-[var(--muted)] leading-relaxed">{r.desc}</p>
              <ul className="mt-4 space-y-1.5 text-sm md:text-base text-[var(--muted)] flex-1">
                {r.abilities.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />
                    {a}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-6 block text-center px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  borderColor: r.color,
                  color: r.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = r.color
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = r.color
                }}
              >
                Sign in ({r.title.split(' /')[0]})
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────────────
   6. FAQ
   ─────────────────────────────────────────────────────────────── */

function FAQ() {
  const faqs = [
    {
      q: 'Is this an LMS?',
      a: 'No. PredictEdu is an early-warning analytics layer. It doesn\u2019t handle course content, assignments, or grading \u2014 it focuses purely on predicting performance and flagging risk.',
    },
    {
      q: 'What data is needed?',
      a: 'Four indicators per student: previous scores (0\u2013100), attendance rate (0\u2013100%), weekly study hours (0\u201344), and number of tutoring sessions (0\u20138).',
    },
    {
      q: 'Who can see what?',
      a: 'Admins see all students and system-wide analytics. Teachers see only the students in their courses. Students see only their own data. Everything is role-isolated.',
    },
    {
      q: 'Does it replace exams?',
      a: 'No. The system complements existing assessments by providing predictive insights earlier in the term, helping educators intervene before final results are in.',
    },
  ]

  return (
    <Section id="faq" className="bg-[var(--card)]/50">
      <Reveal>
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Common questions</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {faqs.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.06}>
            <FAQItem question={f.q} answer={f.a} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="card p-5 cursor-pointer select-none hover:-translate-y-0.5 transition-transform duration-200"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-sm md:text-base">{question}</h3>
        <span
          className="text-[var(--muted)] transition-transform duration-200 text-lg leading-none shrink-0"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? '200px' : '0px',
          opacity: open ? 1 : 0,
          marginTop: open ? '12px' : '0px',
        }}
      >
        <p className="text-sm md:text-base text-[var(--muted)] leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────
   7. CTA BANNER
   ─────────────────────────────────────────────────────────────── */

function CTABanner() {
  return (
    <Section padY="py-10">
      <Reveal>
        <div className="card p-10 md:p-14 text-center bg-gradient-to-br from-[var(--accent)]/[0.04] to-[var(--accent2)]/[0.04]">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-3 text-[var(--muted)] text-base max-w-md mx-auto">
            Sign in with your credentials to access your role-specific dashboard,
            run predictions, and track student performance.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="px-7 py-3 rounded-2xl text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Sign in now
            </Link>
            <a
              href="#how"
              className="px-7 py-3 rounded-2xl text-sm font-medium border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--accentSoft)] transition-colors"
            >
              Learn more
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────────────
   8. FOOTER
   ─────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="max-w-[1120px] mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-[var(--muted)]">
          &copy; {new Date().getFullYear()} PredictEdu &mdash; Intelligent Academic Early Warning System
        </p>
      </div>
    </footer>
  )
}

/* ───────────────────────────────────────────────────────────────
   PAGE
   ─────────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Hero />
      <TrustRow />
      <HowItWorks />
      <Benefits />
      <Roles />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  )
}
