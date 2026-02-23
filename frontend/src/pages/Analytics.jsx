import React, { useEffect, useMemo, useState } from 'react'
import SectionHeader from '../components/SectionHeader.jsx'
import StudentSelect from '../components/StudentSelect.jsx'
import PredictionTrendChart from '../components/charts/PredictionTrendChart.jsx'
import RiskDistributionChart from '../components/charts/RiskDistributionChart.jsx'
import AllStudentsTrendChart from '../components/charts/AllStudentsTrendChart.jsx'
import { groupByPeriod, parseDate } from '../utils/time.js'
import { listStudents } from '../api/students.js'
import { listRecords } from '../api/records.js'
import { getSession } from '../auth/session.js'
import {
  adminAverageTrend,
  adminRiskDistribution,
  adminClassComparison,
  teacherClassTrend,
  teacherAtRisk,
  studentMyTrend,
  studentMyRisk,
} from '../api/analytics.js'

export default function Analytics() {
  const session = getSession()
  const role = session?.role || 'guest'
  const [period, setPeriod] = useState('weekly')

  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [records, setRecords] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  // Server-side analytics state
  const [riskDist, setRiskDist] = useState({ low: 0, medium: 0, high: 0 })
  const [avgTrend, setAvgTrend] = useState([])
  const [classComp, setClassComp] = useState([])
  const [classTrend, setClassTrend] = useState([])
  const [atRiskList, setAtRiskList] = useState([])
  const [myTrend, setMyTrend] = useState([])
  const [myRisk, setMyRisk] = useState(null)

  useEffect(() => {
    let mounted = true
    async function boot() {
      setLoading(true); setErr('')
      try {
        const s = await listStudents()
        if (!mounted) return
        setStudents(Array.isArray(s) ? s : [])
        const preset = role === 'student' ? session?.studentId : null
        setSelectedId(preset || (s[0]?.id ?? null))

        if (role === 'admin') {
          const [rd, at, cc] = await Promise.all([
            adminRiskDistribution(),
            adminAverageTrend(),
            adminClassComparison(),
          ])
          if (!mounted) return
          setRiskDist(rd)
          setAvgTrend(at)
          setClassComp(cc)
        } else if (role === 'teacher') {
          const [ct, ar] = await Promise.all([
            teacherClassTrend(),
            teacherAtRisk(),
          ])
          if (!mounted) return
          const teacherRisk = ar.reduce(
            (acc, s) => { acc[s.risk_level] = (acc[s.risk_level] || 0) + 1; return acc },
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
        if (mounted) setErr(e.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    boot()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!selectedId) { setRecords([]); return }
      try {
        const r = await listRecords(selectedId)
        if (!mounted) return
        setRecords(Array.isArray(r) ? r : [])
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load records')
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedId])

  // Record cadence chart (still client-side — it's per-student local data)
  const recordTrend = useMemo(() => {
    const buckets = groupByPeriod(records, (x) => parseDate(x.recorded_at), period)
    return buckets.map(b => ({ x: b.key, y: b.items.length }))
  }, [records, period])

  // Admin: system average trend
  const adminAvgTrendData = useMemo(
    () => avgTrend.map((p) => ({ x: p.period, y: p.avg_value })),
    [avgTrend]
  )

  // Teacher: multi-line chart from backend
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
    const data = sortedPeriods.map((p) => {
      const values = periodMap.get(p)
      const row = { x: p }
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

  // Student: own trend from backend
  const studentTrendData = useMemo(
    () => myTrend.map((p) => ({ x: p.date, y: p.predicted_value })),
    [myTrend]
  )

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Analytics"
        subtitle={
          role === 'admin'
            ? 'System-wide analytics: trends, risk distribution, and course comparison.'
            : role === 'teacher'
            ? 'Class analytics: student trends, risk distribution, and at-risk ranking.'
            : 'Your analytics: prediction trend, risk level, and record cadence.'
        }
        right={
          <div className="flex items-center gap-3">
            {role !== 'student' ? <StudentSelect students={students} value={selectedId} onChange={setSelectedId} /> : null}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        }
      />

      {err ? <div className="card p-4 border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">{err}</div> : null}
      {loading ? <div className="card p-8 text-center text-[var(--muted)]">Loading analytics...</div> : null}

      {/* ─── ADMIN ANALYTICS ────────────────────────────────── */}
      {!loading && role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <PredictionTrendChart
                data={adminAvgTrendData}
                title="System average trend"
                note="Average predicted value across all students by week."
              />
            </div>
            <RiskDistributionChart
              low={riskDist.low}
              medium={riskDist.medium}
              high={riskDist.high}
              title="Risk distribution (system-wide)"
            />
          </div>

          {classComp.length > 0 ? (
            <div className="card p-5 md:p-6">
              <div className="text-sm md:text-base font-semibold">Course comparison</div>
              <div className="mt-1 text-[0.8125rem] text-[var(--muted)]">Average predicted value per course.</div>
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

          <PredictionTrendChart
            data={recordTrend}
            title="Record cadence (selected student)"
            note="Number of records created per period."
          />
        </>
      ) : null}

      {/* ─── TEACHER ANALYTICS ──────────────────────────────── */}
      {!loading && role === 'teacher' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <AllStudentsTrendChart
                data={teacherTrendChart.data}
                seriesKeys={teacherTrendChart.seriesKeys}
                averageKey={teacherTrendChart.averageKey}
                title="Class prediction trends"
                note="Per-student trends by week. Dashed = class average."
              />
            </div>
            <RiskDistributionChart
              low={riskDist.low}
              medium={riskDist.medium}
              high={riskDist.high}
              title="Risk distribution (your class)"
            />
          </div>

          {atRiskList.length > 0 ? (
            <div className="card p-5 md:p-6">
              <div className="text-sm md:text-base font-semibold">At-risk ranking</div>
              <div className="mt-1 text-[0.8125rem] text-[var(--muted)]">Lowest predicted value first.</div>
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
                          <span className={`inline-flex items-center capitalize px-3 py-1 rounded-xl border text-[0.8125rem] font-medium ${
                            s.risk_level === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'
                              : s.risk_level === 'medium' ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                          }`}>{s.risk_level}</span>
                        </td>
                        <td className="py-3 text-[var(--muted)]">{new Date(s.prediction_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <PredictionTrendChart
            data={recordTrend}
            title="Record cadence (selected student)"
            note="Number of records created per period."
          />
        </>
      ) : null}

      {/* ─── STUDENT ANALYTICS ──────────────────────────────── */}
      {!loading && role === 'student' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <PredictionTrendChart
                data={studentTrendData}
                title="Your prediction trend"
                note="Your predicted performance over time."
              />
            </div>
            <div className="card p-5 md:p-6 flex flex-col justify-center">
              <div className="text-sm md:text-base font-semibold">Current status</div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Risk level</div>
                  <div className="mt-2">
                    {myRisk?.risk_level ? (
                      <span className={`inline-flex items-center capitalize px-4 py-1.5 rounded-xl border text-sm font-semibold ${
                        myRisk.risk_level === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'
                          : myRisk.risk_level === 'medium' ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                      }`}>{myRisk.risk_level}</span>
                    ) : <span className="text-[var(--muted)] text-base">—</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)]">Latest predicted value</div>
                  <div className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">{myRisk?.predicted_value != null ? Math.round(myRisk.predicted_value * 10) / 10 : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <PredictionTrendChart
            data={recordTrend}
            title="Your record cadence"
            note="Number of records created per period."
          />
        </>
      ) : null}
    </div>
  )
}
