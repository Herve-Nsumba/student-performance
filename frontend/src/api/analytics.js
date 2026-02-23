import { fetchJson } from './client.js';

// ─── Admin analytics ────────────────────────────────────────────
export const adminAverageTrend     = () => fetchJson('/api/analytics/admin/average-trend/');
export const adminStudentTrends    = () => fetchJson('/api/analytics/admin/student-trends/');
export const adminRiskDistribution = () => fetchJson('/api/analytics/admin/risk-distribution/');
export const adminClassComparison  = () => fetchJson('/api/analytics/admin/class-comparison/');

// ─── Teacher analytics ──────────────────────────────────────────
export const teacherClassTrend = () => fetchJson('/api/analytics/teacher/class-trend/');
export const teacherAtRisk     = () => fetchJson('/api/analytics/teacher/at-risk/');

// ─── Student analytics ──────────────────────────────────────────
export const studentMyTrend = () => fetchJson('/api/analytics/student/my-trend/');
export const studentMyRisk  = () => fetchJson('/api/analytics/student/my-risk/');
