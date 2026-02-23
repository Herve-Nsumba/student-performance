import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import RecordForm from '../components/RecordForm.jsx'
import PredictionTrendChart from '../components/charts/PredictionTrendChart.jsx'
import FeatureBarChart from '../components/charts/FeatureBarChart.jsx'
import { getStudent, predictStudent } from '../api/students.js'
import { listRecords, createRecord } from '../api/records.js'
import { listPredictions } from '../api/predictions.js'
import { filterPredictionsForStudent } from '../utils/predictions.js'

export default function StudentDetail() {
  const { id } = useParams()
  const studentId = Number(id)

  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [predictions, setPredictions] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyRecord, setBusyRecord] = useState(false)
  const [busyPredict, setBusyPredict] = useState(false)

  async function refreshAll() {
    setLoading(true); setErr('')
    try {
      const [s, r, p] = await Promise.all([getStudent(studentId), listRecords(studentId), listPredictions()])
      setStudent(s)
      setRecords(Array.isArray(r) ? r : [])
      setPredictions(Array.isArray(p) ? p : [])
    } catch (e) {
      setErr(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refreshAll() }, [studentId])

  const latestRecord = useMemo(() => records?.[0] || null, [records])

  const studentPreds = useMemo(() => {
    if (!student) return []
    return filterPredictionsForStudent(predictions, student)
  }, [predictions, student])

  const trendData = useMemo(() => studentPreds.slice().reverse().map(p => ({ x: p.created_at, y: p.predicted_value })), [studentPreds])

  async function handleAddRecord(payload) {
    setBusyRecord(true); setErr('')
    try {
      await createRecord(payload)
      const r = await listRecords(studentId)
      setRecords(Array.isArray(r) ? r : [])
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setBusyRecord(false)
    }
  }

  async function handlePredict() {
    setBusyPredict(true); setErr('')
    try {
      await predictStudent(studentId)
      const p = await listPredictions()
      setPredictions(Array.isArray(p) ? p : [])
    } catch (e) {
      setErr(e.message || 'Prediction failed')
    } finally {
      setBusyPredict(false)
    }
  }

  const recordCols = [
    { key:'recorded_at', label:'Date' },
    { key:'previous_scores', label:'Prev scores' },
    { key:'attendance', label:'Attendance' },
    { key:'hours_studied', label:'Hours studied' },
    { key:'tutoring_sessions', label:'Tutoring' },
  ]

  const predCols = [
    { key:'created_at', label:'Date' },
    { key:'predicted_value', label:'Predicted' },
    { key:'risk_level', label:'Risk', render: (r) => <RiskBadge level={r.risk_level} /> },
  ]

  if (loading) return <div className="card p-8 text-center text-[var(--muted)]">Loading student data...</div>

  return (
    <div className="space-y-5">
      <SectionHeader
        title={student ? student.full_name : `Student #${studentId}`}
        subtitle={student ? `${student.student_code} · ${student.class_name || '—'}` : ''}
        right={
          <div className="flex items-center gap-3">
            <Link className="text-sm text-[var(--muted)] hover:underline" to="/app/students">← Back</Link>
            <button
              onClick={handlePredict}
              disabled={busyPredict}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white disabled:opacity-50"
            >
              {busyPredict ? 'Running…' : 'Run prediction'}
            </button>
          </div>
        }
      />

      {err ? <div className="card p-4 border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">{err}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PredictionTrendChart data={trendData} />
        </div>
        <FeatureBarChart record={latestRecord} />
      </div>

      <RecordForm studentId={studentId} onSubmit={handleAddRecord} busy={busyRecord} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <SectionHeader title="Records" subtitle="Stored learning indicators." />
          <DataTable columns={recordCols} rows={records} empty="No records for this student yet." />
        </div>
        <div>
          <SectionHeader title="Predictions" subtitle="Saved predictions from the ML service." />
          <DataTable columns={predCols} rows={studentPreds} empty="No predictions yet. Run prediction to generate one." />
        </div>
      </div>
    </div>
  )
}
