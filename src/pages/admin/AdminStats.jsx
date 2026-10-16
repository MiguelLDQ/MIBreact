import { Async, Icon } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';

const StatBox = ({ icon, label, val }) => (
  <div className="card" style={{ textAlign: 'center' }}>
    <Icon name={icon} style={{ color: 'var(--mint-700)', fontSize: 26 }} />
    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', marginTop: 6 }}>{val}</div>
    <div className="muted">{label}</div>
  </div>
);

export default function AdminStats() {
  const res = useAsync(() => api('/admin/stats'), []);
  return (
    <Async res={res}>{(s) => (
      <div className="grid grid-3">
        <StatBox icon="group" label="Usuários totais" val={s.totalUsers ?? s.usersTotal ?? 0} />
        <StatBox icon="block" label="Banidos" val={s.bannedUsers ?? 0} />
        <StatBox icon="pause_circle" label="Suspensos" val={s.suspendedUsers ?? 0} />
        <StatBox icon="person_add" label="Novos (7d)" val={s.newUsers7d ?? s.newRegistrations7d ?? 0} />
        <StatBox icon="person_add" label="Novos (30d)" val={s.newUsers30d ?? s.newRegistrations30d ?? 0} />
        <StatBox icon="chat" label="Mensagens" val={s.totalMessages ?? 0} />
        <StatBox icon="task_alt" label="Tarefas concluídas" val={s.tasksCompleted ?? 0} />
        <StatBox icon="military_tech" label="Missões concluídas" val={s.missionsCompleted ?? 0} />
        <StatBox icon="air" label="Sessões respiração" val={s.breathingSessions ?? 0} />
        <StatBox icon="report" label="Denúncias pendentes" val={s.pendingReports ?? 0} />
      </div>
    )}</Async>
  );
}
