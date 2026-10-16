import { MoodChart } from '../components/mood';
import { Async, Card, Empty, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list } from '../utils/format';

export default function Reports() {
  const { user } = useApp();
  const mood = useAsync(() => api('/mood/history?days=30').catch(() => []), []);
  const tasks = useAsync(() => api('/tasks').catch(() => []), []);
  const breathing = useAsync(() => api('/breathing/stats').catch(() => null), []);
  return (
    <>
      <ViewHeader icon="insights" title="Relatórios">Acompanhe sua evolução de bem-estar.</ViewHeader>
      <div className="grid grid-2">
        <Card title="Evolução do Humor (30 dias)" icon="trending_up">
          <Async res={mood}>{(d) => list(d).length ? <MoodChart hist={list(d)} /> : <Empty>Sem registros de humor ainda.</Empty>}</Async>
        </Card>
        <Card title="Produtividade" icon="bar_chart">
          <Async res={tasks}>{(d) => {
            const ts = list(d); const done = ts.filter((t) => t.status === 'COMPLETED').length;
            const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
            return (<>
              <div className="xp-progress-row"><span>Concluídas</span><span>{done}/{ts.length} ({pct}%)</span></div>
              <div className="xp-bar"><div style={{ width: pct + '%' }} /></div>
            </>);
          }}</Async>
        </Card>
      </div>
      <Card title="Respiração" icon="air" style={{ marginTop: 16 }}>
        <Async res={breathing}>{(s) => !s ? <Empty>Sem sessões de respiração ainda.</Empty> : (
          <div className="stat-trio">
            <div><div className="num">{s.totalSessions ?? 0}</div><div className="lbl">Sessões</div></div>
            <div><div className="num">{s.totalMinutes ?? 0}</div><div className="lbl">Minutos</div></div>
            <div><div className="num">{user?.currentLoginStreak ?? 0}</div><div className="lbl">Streak dias</div></div>
          </div>
        )}</Async>
      </Card>
    </>
  );
}
