export function formatShort(d){
  const dt = typeof d === 'string' ? new Date(d) : d;
  if(!dt) return '';
  return dt.toLocaleDateString(undefined,{month:'short',day:'2-digit'});
}
export function parseDate(d){
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}
export function startOfISOWeek(date){
  const d=new Date(date);
  const day=(d.getDay()+6)%7;
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
}
export function keyDaily(date){ const d=new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function keyWeekly(date){ return keyDaily(startOfISOWeek(date)); }
export function keyMonthly(date){ const d=new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export function groupByPeriod(items, getDate, period='weekly'){
  const keyFn = period==='monthly'?keyMonthly:(period==='daily'?keyDaily:keyWeekly);
  const map=new Map();
  for(const it of items){
    const dt=getDate(it);
    if(!dt) continue;
    const k=keyFn(dt);
    if(!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  const keys=[...map.keys()].sort();
  return keys.map(k => ({ key:k, items: map.get(k) }));
}
