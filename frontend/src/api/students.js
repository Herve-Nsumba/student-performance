import { fetchJson } from './client.js';
export const listStudents = () => fetchJson('/api/students/');
export const createStudent = (payload) => fetchJson('/api/students/', { method:'POST', body: JSON.stringify(payload) });
export const getStudent = (id) => fetchJson(`/api/students/${id}/`);
export const updateStudent = (id, payload) => fetchJson(`/api/students/${id}/`, { method:'PUT', body: JSON.stringify(payload) });
export const deleteStudent = (id) => fetchJson(`/api/students/${id}/`, { method:'DELETE' });
export const predictStudent = (id) => fetchJson(`/api/students/${id}/predict/`, { method:'POST' });
