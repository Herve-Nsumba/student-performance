import { parseDate } from './time.js';

export function normalizeStudentRef(pred){
  // pred.student may be number, string, or object
  if (pred == null) return { id: null, code: null, raw: null };
  const s = pred.student;
  if (typeof s === 'number') return { id: s, code: null, raw: s };
  if (typeof s === 'string') {
    // could be "ST001 - John" or "ST001" or "1"
    const trimmed = s.trim();
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && String(asNum) === trimmed) return { id: asNum, code: null, raw: s };
    // take first token as code
    const code = trimmed.split(/\s|-|—/)[0];
    return { id: null, code, raw: s };
  }
  if (typeof s === 'object' && s !== null) {
    const id = s.id ?? null;
    const code = s.student_code ?? s.code ?? null;
    return { id, code, raw: s };
  }
  return { id: null, code: null, raw: s };
}

export function sortByCreatedDesc(a,b){
  const da = parseDate(a.created_at) || new Date(0);
  const db = parseDate(b.created_at) || new Date(0);
  return db - da;
}

export function filterPredictionsForStudent(predictions, student){
  const id = student?.id;
  const code = student?.student_code ? String(student.student_code) : null;
  return predictions.filter(p => {
    const ref = normalizeStudentRef(p);
    if (id != null && ref.id != null) return Number(ref.id) === Number(id);
    if (code && ref.code) return String(ref.code) === code;
    if (code && typeof p.student === 'string') return p.student.includes(code);
    return false;
  }).sort(sortByCreatedDesc);
}
