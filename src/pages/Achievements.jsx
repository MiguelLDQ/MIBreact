import { Async, Empty, Icon, ViewHeader } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { fmtDate, list } from '../utils/format';

export default function Achievements() {
  const res = useAsync(() => api('/achievements'), []);
  return (
    <>
      <ViewHeader icon="emoji_events" title="Conquistas">Marcos desbloqueados na sua jornada na Stella.</ViewHeader>
      <Async res={res}>{(d) => list(d).length ? (
        <div className="grid grid-3">
          {list(d).map((a) => (
            <div key={a.id ?? a.name} className="card" style={{ textAlign: 'center', opacity: a.unlocked ? 1 : 0.5 }}>
              <Icon name={a.unlocked ? 'emoji_events' : 'lock'} style={{ fontSize: 34, color: a.unlocked ? 'var(--gold)' : 'var(--muted)' }} />
              <div style={{ fontWeight: 700, marginTop: 8, fontSize: 13.5 }}>{a.name || a.title}</div>
              <div className="muted" style={{ marginTop: 4 }}>{a.description || ''}</div>
              {a.unlocked && a.unlockedAt && <div className="pill" style={{ marginTop: 8 }}>{fmtDate(a.unlockedAt)}</div>}
            </div>
          ))}
        </div>
      ) : <Empty icon="emoji_events">Nenhuma conquista cadastrada.</Empty>}</Async>
    </>
  );
}
