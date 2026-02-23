import { fetchJson } from './client.js';
export const listPredictions = () => fetchJson('/api/predictions/');
