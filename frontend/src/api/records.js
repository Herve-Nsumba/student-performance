import { fetchJson } from './client.js';
export const listRecords = (studentId) => fetchJson(`/api/records/?student_id=${encodeURIComponent(studentId)}`);
export const createRecord = (payload) => fetchJson('/api/records/', { method:'POST', body: JSON.stringify(payload) });
