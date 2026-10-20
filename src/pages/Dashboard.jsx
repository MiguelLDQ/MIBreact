import { MoodPicker } from '../components/mood';
import { Async, Card, Icon } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list } from '../utils/format';

export default function Dashboard() {
  const { user, navigate, toast } = useApp();
  const mood = useAsync(() => api('/mood/today').catch(() => null), []);
  const tasks = useAsync(() => api('/tasks'), []);
  const missions = useAsync(() => api('/missions/daily').catch(() => []), []);

  const pick = async (value) => {
    try { await api('/mood', { method: 'POST', body: { moodLevel: value } }); toast('Humor registrado!', 'success'); mood.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const mod = (icon, label, r) => (
    <a href="#" className="module-card" onClick={(e) => { e.preventDefault(); navigate(r); }}>
      <Icon name={icon} /><span className="lbl">{label}</span>
    </a>
  );

  return (
    <>
      <div className="greeting-banner">
        <Icon name="favorite" />
        <div>
          <h3 style={{ color: 'var(--ink)' }}>Olá de volta, {user.displayName}!</h3>
          <p style={{ fontSize: 13, opacity: 0.85 }}>
            Como você está se sentindo hoje?{user.currentLoginStreak ? ` · streak de ${user.currentLoginStreak} dias 🔥` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Card title="Humor de hoje" icon="mood">
          <Async res={mood}>{(m) => {
            const sel = m ? (m.moodLevel ?? m.level) : null;
            return (<>
              <MoodPicker selected={sel} onPick={pick} />
              {sel && <p className="hint" style={{ marginTop: 10 }}>Você já registrou seu humor hoje — clique para atualizar.</p>}
            </>);
          }}</Async>
        </Card>
        <Card title="Minhas Tarefas" icon="task_alt">
          <Async res={tasks}>{(d) => {
            const c = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
            list(d).forEach((t) => { if (c[t.status] !== undefined) c[t.status]++; });
            return (<>
              <div className="stat-trio">
                <div><div className="num">{c.PENDING}</div><div className="lbl">Pendentes</div></div>
                <div><div className="num">{c.IN_PROGRESS}</div><div className="lbl">Em progresso</div></div>
                <div><div className="num">{c.COMPLETED}</div><div className="lbl">Concluídas</div></div>
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => navigate('tasks')}>Ver todas →</button>
            </>);
          }}</Async>
        </Card>
      </div>

      <Card title="Nível & Missões diárias" icon="military_tech" style={{ marginTop: 16 }}>
        <Async res={missions}>{(d) => {
          const ms = list(d);
          const done = ms.filter((m) => m.completed || m.status === 'COMPLETED').length;
          return (<>
            <div className="row between" style={{ marginBottom: 10 }}><span className="muted">Missões de hoje</span><b>{done}/{ms.length}</b></div>
            <div className="xp-bar"><div style={{ width: (ms.length ? Math.round((done / ms.length) * 100) : 0) + '%' }} /></div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => navigate('tasks')}>Ver missões diárias →</button>
          </>);
        }}</Async>
      </Card>

      <div style={{ marginTop: 20 }}>
        <div className="card-title" style={{ marginBottom: 12 }}><Icon name="apps" />Módulos</div>
        <div className="module-grid">
          {mod('smart_toy', 'Stella IA', 'ai')}{mod('chat', 'Chat', 'chat')}{mod('stars', 'Estrelas Pontilhadas', 'anonymous')}
          {mod('air', 'Respiração', 'breathing')}{mod('group', 'Amigos', 'friends')}{mod('storefront', 'Loja', 'shop')}
        </div>
      </div>

      <div className="cvv-banner">
        <Icon name="support_agent" />
        <div><div style={{ fontSize: 12.5, opacity: 0.85 }}>Precisa de ajuda? Centro de Valorização da Vida</div><b>188</b></div>
      </div>
    </>
  );
}
