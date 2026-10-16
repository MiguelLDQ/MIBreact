import { Async, Card, Empty, Icon } from '../../components/ui';
import { ENUMS } from '../../config';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { list, timeAgo } from '../../utils/format';

export default function AdminReports() {
  const { toast } = useApp();
  const res = useAsync(() => api('/admin/reports'), []);
  const review = async (id, status) => {
    try { await api(`/admin/reports/${id}/review`, { method: 'POST', body: { status } }); toast('Denúncia atualizada.', 'success'); res.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Card>
      <Async res={res}>{(d) => list(d).length ? list(d).map((r) => (
        <div key={r.id} className="list-item">
          <Icon name="flag" style={{ color: 'var(--danger)' }} />
          <div className="meta">
            <div className="title">{(ENUMS.reportReasons.find((x) => x.value === r.reason) || {}).label || r.reason}</div>
            <div className="sub">{r.targetType || ''} · {timeAgo(r.createdAt)} · status: {r.status || 'PENDING'}</div>
          </div>
          <div className="actions">
            <button className="btn btn-sm btn-primary" onClick={() => review(r.id, 'REVIEWED')}>Revisar</button>
            <button className="btn btn-sm btn-ghost" onClick={() => review(r.id, 'DISMISSED')}>Descartar</button>
          </div>
        </div>
      )) : <Empty>Nenhuma denúncia.</Empty>}</Async>
    </Card>
  );
}
