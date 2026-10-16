import { ENUMS } from '../config';
import { fmtDate } from '../utils/format';

export function MoodPicker({ selected, onPick }) {
  return (
    <div className="mood-picker">
      {ENUMS.mood.map((m) => (
        <button key={m.value} className={'mood-opt' + (selected === m.value ? ' selected' : '')} onClick={() => onPick(m.value)}>
          {m.emoji}<small>{m.label}</small>
        </button>
      ))}
    </div>
  );
}

export function MoodChart({ hist }) {
  const order = ENUMS.mood.map((m) => m.value);
  const pts = hist.slice(-30).map((h) => ({ y: order.indexOf(h.moodLevel ?? h.level), date: h.date || h.createdAt }));
  const w = 320, h = 130, pad = 14;
  const xs = pts.length > 1 ? (w - 2 * pad) / (pts.length - 1) : 0;
  const coord = pts.map((p, i) => [pad + i * xs, h - pad - (p.y / (order.length - 1)) * (h - 2 * pad)]);
  const path = coord.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ');
  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <path d={path} fill="none" stroke="#7ECFC0" strokeWidth="2.5" />
        {coord.map((c, i) => <circle key={i} cx={c[0]} cy={c[1]} r="3" fill="#4FA694"><title>{fmtDate(pts[i].date)}</title></circle>)}
      </svg>
      <div className="row between muted" style={{ fontSize: 11, marginTop: 4 }}><span>🙁</span><span>😊</span><span>🤩</span></div>
    </>
  );
}
