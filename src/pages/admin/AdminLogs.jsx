import { Async, Card, Empty, Icon } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { fmtDateTime, list } from '../../utils/format';

export default function AdminLogs() {
  const res = useAsync(() => api('/admin/logs'), []);
  return (
    <Card>
      <Async res={res}>{(d) => list(d).length ? list(d).map((l, i) => (
        <div key={l.id ?? i} className="list-item">
          <Icon name="history" />
          <div className="meta"><div className="title">{l.action || l.type}</div><div className="sub">por {l.adminName || l.adminId || ''} · {fmtDateTime(l.createdAt)}</div></div>
        </div>
      )) : <Empty>Nenhum log ainda.</Empty>}</Async>
    </Card>
  );
}
