import { Async, Card, Empty, Icon } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { list, timeAgo } from '../../utils/format';

export default function AdminModeration() {
  const res = useAsync(() => api('/admin/moderation-logs'), []);
  return (
    <Card>
      <Async res={res}>{(d) => list(d).length ? list(d).map((m, i) => (
        <div key={m.id ?? i} className="list-item">
          <Icon name="gpp_maybe" style={{ color: 'var(--warning)' }} />
          <div className="meta"><div className="title">{m.violationType || m.type || 'Infração'}</div><div className="sub">Usuário {m.userId || m.username || ''} · {timeAgo(m.createdAt)}</div></div>
        </div>
      )) : <Empty>Nenhum registro de moderação.</Empty>}</Async>
    </Card>
  );
}
