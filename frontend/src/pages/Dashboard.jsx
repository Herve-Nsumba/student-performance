import React, { useEffect, useMemo, useState } from 'react'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import StudentSelect from '../components/StudentSelect.jsx'
import PredictionTrendChart from '../components/charts/PredictionTrendChart.jsx'
import FeatureBarChart from '../components/charts/FeatureBarChart.jsx'
import RiskDistributionChart from '../components/charts/RiskDistributionChart.jsx'
import AllStudentsTrendChart from '../components/charts/AllStudentsTrendChart.jsx'
import { getSession } from '../auth/session.js'
import { listStudents, predictStudent } from '../api/students.js'
import { listRecords } from '../api/records.js'
import { listPredictions } from '../api/predictions.js'
import { filterPredictionsForStudent } from '../utils/predictions.js'
import {
  adminRiskDistribution,
  adminClassComparison,
  adminStudentTrends,
  teacherClassTrend,
  teacherAtRisk,
  studentMyTrend,
  studentMyRisk,
} from '../api/analytics.js'


export default function Dashboard() {
  const session = getSession()
  const role = session?.role || 'guest'

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Shared state
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [records, setRecords] = useState([])
  const [predictions, setPredictions] = useState([])
  const [busyPredict, setBusyPredict] = useState(false)

  // Server-side analytics state
  const [riskDist, setRiskDist] = useState({ low: 0, medium: 0, high: 0 })
  const [classTrend, setClassTrend] = useState([])       // teacher: per-student trend
  const [atRiskList, setAtRiskList] = useState([])        // teacher: at-risk ranking
  const [classComp, setClassComp] = useState([])          // admin: class comparison
  const [adminTrends, setAdminTrends] = useState([])      // admin: per-prediction trends
  const [myTrend, setMyTrend] = useState([])             // student: own trend
  const [myRisk, setMyRisk] = useState(null)             // student: own risk

  // ─── Data loading ─────────────────────────────────────────────

  async function refreshPredictions() {
    const p = await listPredictions()
    setPredictions(Array.isArray(p) ? p : [])
  }

  useEffect(() => {
    let mounted = true
    async function boot() {
      setLoading(true)
      setErr('')
      try {
        // All roles need the student list (admin/teacher for selector, student for own)
        const s = await listStudents()
        if (!mounted) return
        setStudents(s)
        const preset = role === 'student' ? session?.studentId : null
        setSelectedId(preset || (s[0]?.id ?? null))

        // Fetch predictions for the selected-student charts
        await refreshPredictions()

        // Fetch role-specific analytics from backend
        if (role === 'admin') {
          const [rd, cc, at] = await Promise.all([
            adminRiskDistribution(),
            adminClassComparison(),
            adminStudentTrends(),
          ])
          if (!mounted) return
          setRiskDist(rd)
          setClassComp(cc)
          setAdminTrends(Array.isArray(at) ? at : [])
        } else if (role === 'teacher') {
          const [ct, ar] = await Promise.all([
            teacherClassTrend(),
            teacherAtRisk(),
          ])
          if (!mounted) return
          // Compute risk distribution from at-risk list
          const teacherRisk = ar.reduce(
            (acc, s) => {
              acc[s.risk_level] = (acc[s.risk_level] || 0) + 1
              return acc
            },
            { low: 0, medium: 0, high: 0 }
          )
          setRiskDist(teacherRisk)
          setClassTrend(ct)
          setAtRiskList(ar)
        } else if (role === 'student') {
          const [mt, mr] = await Promise.all([
            studentMyTrend(),
            studentMyRisk(),
          ])
          if (!mounted) return
          setMyTrend(mt)
          setMyRisk(mr)
        }
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load dashboard data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    boot()
    return () => { mounted = false }
  }, [])

  // Load records when selected student changes (admin/teacher)
  useEffect(() => {
    let mounted = true
    async function loadStudentData() {
      if (!selectedId) { setRecords([]); return }
      setErr('')
      try {
        const r = await listRecords(selectedId)
        if (!mounted) return
        setRecords(Array.isArray(r) ? r : [])
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load records')
      }
    }
    loadStudentData()
    return () => { mounted = false }
  }, [selectedId])

  // ─── Derived data ─────────────────────────────────────────────

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) || null,
    [students, selectedId]
  )
  const latestRecord = useMemo(() => records?.[0] || null, [records])

  // Per-student prediction trend for the selected student (admin/teacher drill-down)
  const studentPreds = useMemo(() => {
    if (!selectedStudent) return []
    return filterPredictionsForStudent(predictions, selectedStudent)
  }, [predictions, selectedStudent])

  const selectedTrendData = useMemo(
    () =>
      studentPreds
        .slice()
        .reverse()
        .map((p) => ({ x: p.created_at, y: p.predicted_value })),
    [studentPreds]
  )

  // Admin: multi-line trends from backend (one line per student, every prediction in sequence)
  const allStudentsTrend = useMemo(() => {
    if (role !== 'admin' || adminTrends.length === 0) {
      return { seriesKeys: [], data: [], averageKey: '__avg__' }
    }

    // Collect unique student keys (student_code)
    const seriesKeys = [...new Set(adminTrends.map((p) => p.student_code))]

    // Build per-student prediction sequences (each student has their own counter)
    const perStudent = new Map()
    for (const p of adminTrends) {
      if (!perStudent.has(p.student_code)) perStudent.set(p.student_code, [])
      perStudent.get(p.student_code).push(p.predicted_value)
    }

    // Find the max number of predictions any student has
    let maxLen = 0
    for (const seq of perStudent.values()) {
      if (seq.length > maxLen) maxLen = seq.length
    }

    // Build chart rows: x = "Prediction #1", "#2", etc.
    const data = []
    for (let i = 0; i < maxLen; i++) {
      const row = { x: `#${i + 1}` }
      let sum = 0, count = 0
      for (const k of seriesKeys) {
        const seq = perStudent.get(k)
        const v = seq && i < seq.length ? seq[i] : null
        row[k] = v !== null ? Number(v.toFixed(2)) : null
        if (v !== null) { sum += v; count++ }
      }
      row.__avg__ = count ? Number((sum / count).toFixed(2)) : null
      data.push(row)
    }

    return { seriesKeys, data, averageKey: '__avg__' }
  }, [adminTrends, role])

  // Teacher: build multi-line chart data from backend classTrend
  const teacherTrendChart = useMemo(() => {
    if (role !== 'teacher' || classTrend.length === 0) {
      return { seriesKeys: [], data: [], averageKey: '__avg__' }
    }

    const studentKeys = [...new Set(classTrend.map((r) => r.student_code))]
    const periodMap = new Map()

    for (const r of classTrend) {
      if (!periodMap.has(r.period)) periodMap.set(r.period, {})
      periodMap.get(r.period)[r.student_code] = r.avg_value
    }

    const sortedPeriods = [...periodMap.keys()].sort()
    const data = sortedPeriods.map((period) => {
      const values = periodMap.get(period)
      const row = { x: period }
      let sum = 0, count = 0
      for (const k of studentKeys) {
        const v = values[k] ?? null
        row[k] = v
        if (v !== null) { sum += v; count++ }
      }
      row.__avg__ = count ? Number((sum / count).toFixed(2)) : null
      return row
    })

    return { seriesKeys: studentKeys, data, averageKey: '__avg__' }
  }, [classTrend, role])

  // Student: trend data from backend
  const studentTrendData = useMemo(
    () => myTrend.map((p) => ({ x: p.date, y: p.predicted_value })),
    [myTrend]
  )

  // KPIs
  const kpis = useMemo(() => {
    const totalStudents = students.length
    const totalRecords = records.length
    const totalPreds = studentPreds.length
    const raw = studentPreds[0]?.predicted_value
    const latestPred = typeof raw === 'number' ? Math.round(raw * 10) / 10 : raw
    return { totalStudents, totalRecords, totalPreds, latestPred }
  }, [students, records, studentPreds])

  // ─── Actions ──────────────────────────────────────────────────

  async function handlePredict() {
    if (!selectedId) return
    setBusyPredict(true)
    setErr('')
    try {
      await predictStudent(selectedId)
      await refreshPredictions()
    } catch (e) {
      setErr(e.message || 'Prediction failed')
    } finally {
      setBusyPredict(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────

  if (loading) return <div className="card p-8 text-center text-[var(--muted)]">Loading dashboard...</div>

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          role === 'teacher'
            ? 'Teacher Dashboard'
            : role === 'student'
            ? 'Student Dashboard'
            : 'Admin Dashboard'
        }
        subtitle="Indicators → prediction → intervention."
        right={
          <div className="flex items-center gap-3">
            {role !== 'student' ? (
              <StudentSelect students={students} value={selectedId} onChange={setSelectedId} />
            ) : (
              <div className="text-sm text-[var(--muted)]">{selectedStudent?.student_code}</div>
            )}
            <button
              onClick={handlePredict}
              disabled={!selectedId || busyPredict}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white disabled:opacity-50"
            >
              {busyPredict ? 'Running…' : 'Run prediction'}
            </button>
          </div>
        }
      />

      {err ? <div className="card p-4 border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">{err}</div> : null}

      {/* ─── ADMIN DASHBOARD ────────────────────────────────── */}
      {role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Students" value={kpis.totalStudents} hint="Total in system" />
            <StatCard label="Records" value={kpis.totalRecords} hint="For selected student" />
            <StatCard label="Predictions" value={kpis.totalPreds} hint="For selected student" />
            <StatCard label="Latest predicted" value={kpis.latestPred ?? '—'} hint="Most recent prediction" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <AllStudentsTrendChart
                data={allStudentsTrend.data}
                seriesKeys={allStudentsTrend.seriesKeys}
                averageKey={allStudentsTrend.averageKey}
                title="All students prediction trends"
                note="One line per student, every prediction shown. Dashed = system average."
              />
            </div>
            <RiskDistributionChart
              low={riskDist.low}
              medium={riskDist.medium}
              high={riskDist.high}
              title="Risk distribution (system-wide)"
              note="Based on each student's latest prediction."
            />
          </div>

          {classComp.length > 0 ? (
            <div className="card p-5 md:p-6">
              <div className="text-sm md:text-base font-semibold">Average performance by course</div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-left">
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Course</th>
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Students</th>
                      <th className="py-3 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Avg predicted value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classComp.map((c, i) => (
                      <tr key={i} className="border-b border-[var(--line)]">
                        <td className="py-3 pr-4 font-medium">{c.course_name}</td>
                        <td className="py-3 pr-4">{c.student_count}</td>
                        <td className="py-3">{c.avg_predicted_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FeatureBarChart record={latestRecord} />
            <PredictionTrendChart
              data={selectedTrendData}
              title="Selected student prediction trend"
              note="Updates when you run prediction for the selected student."
            />
          </div>
        </>
      ) : null}

      {/* ─── TEACHER DASHBOARD ──────────────────────────────── */}
      {role === 'teacher' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Students" value={kpis.totalStudents} hint="In your course(s)" />
            <StatCard label="Records" value={kpis.totalRecords} hint="For selected student" />
            <StatCard label="Predictions" value={kpis.totalPreds} hint="For selected student" />
            <StatCard label="Latest predicted" value={kpis.latestPred ?? '—'} hint="Most recent prediction" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <AllStudentsTrendChart
                data={teacherTrendChart.data}
                seriesKeys={teacherTrendChart.seriesKeys}
                averageKey={teacherTrendChart.averageKey}
                title="Class prediction trends"
                note="One line per student in your course. Dashed line = class average."
              />
            </div>
            <RiskDistributionChart
              low={riskDist.low}
              medium={riskDist.medium}
              high={riskDist.high}
              title="Risk distribution (your class)"
              note="Based on each student's latest prediction."
            />
          </div>

          {atRiskList.length > 0 ? (
            <div className="card p-5 md:p-6">
              <div className="text-sm md:text-base font-semibold">At-risk ranking</div>
              <div className="mt-1 text-[0.8125rem] text-[var(--muted)]">Students sorted by predicted value (lowest first).</div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-left">
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Student</th>
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Predicted value</th>
                      <th className="py-3 pr-4 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Risk</th>
                      <th className="py-3 text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRiskList.map((s) => (
                      <tr key={s.student_id} className="border-b border-[var(--line)]">
                        <td className="py-3 pr-4 font-medium">{s.student_code} — {s.student_name}</td>
                        <td className="py-3 pr-4">{s.predicted_value}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center capitalize px-3 py-1 rounded-xl border text-[0.8125rem] font-medium ${
                              s.risk_level === 'high'
                                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'
                                : s.risk_level === 'medium'
                                ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                            }`}
                          >
                            {s.risk_level}
                          </span>
                        </td>
                        <td className="py-3 text-[var(--muted)]">
                          {new Date(s.prediction_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FeatureBarChart record={latestRecord} />
            <PredictionTrendChart
              data={selectedTrendData}
              title="Selected student prediction trend"
              note="Select a student above to see their individual trend."
            />
          </div>
        </>
      ) : null}

      {/* ─── STUDENT DASHBOARD ──────────────────────────────── */}
      {role === 'student' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Predictions" value={myTrend.length} hint="Total recorded" />
            <StatCard
              label="Latest predicted"
              value={typeof myRisk?.predicted_value === 'number' ? Math.round(myRisk.predicted_value * 10) / 10 : '—'}
              hint="Most recent prediction"
            />
            <StatCard
              label="Risk level"
              value={myRisk?.risk_level ?? '—'}
              hint="Current classification"
            />
            <StatCard label="Records" value={records.length} hint="Your learning indicators" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <PredictionTrendChart
                data={studentTrendData}
                title="Your prediction trend"
                note="Your predicted performance over time."
              />
            </div>
            <FeatureBarChart record={latestRecord} />
          </div>

          <div className="card p-5 md:p-6">
            <div className="text-sm md:text-base font-semibold">Guidance</div>
            <ul className="mt-3 space-y-2 text-[0.8125rem] text-[var(--muted)] leading-relaxed">
              <li>Your score and risk level are updated each time a prediction is run.</li>
              <li>Focus on improving attendance and study hours for the best impact.</li>
              <li>Talk to your teacher if you need extra tutoring sessions.</li>
            </ul>
            <div className="mt-4 p-4 rounded-2xl bg-[var(--accentSoft)] border border-[var(--line)] text-[0.8125rem] text-[var(--muted)]">
              Predictions are estimates based on current performance indicators and machine learning analysis.
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
