import { Async, Card, Empty, Icon } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { list } from '../../utils/format';

function MissionTplModal({ existing, onSaved }) {
  const { toast, closeModal } = useApp();
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const body = { title: fd.get('title'), category: fd.get('category'), description: fd.get('description'), xpReward: Number(fd.get('xpReward')) };
    try {
      if (existing) await api('/admin/missions/templates/' + existing.id, { method: 'PUT', body }); else await api('/admin/missions/templates', { method: 'POST', body });
      toast('Salvo!', 'success'); closeModal(); onSaved();
    } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <>
      <h3 style={{ marginBottom: 16, paddingRight: 24 }}>{existing ? 'Editar template' : 'Novo template'}</h3>
      <form onSubmit={submit}>
        <div className="field"><label>Título</label><input type="text" name="title" required defaultValue={existing?.title || ''} /></div>
        <div className="field"><label>Categoria</label><input type="text" name="category" defaultValue={existing?.category || ''} /></div>
        <div className="field"><label>Descrição</label><textarea name="description" defaultValue={existing?.description || ''} /></div>
        <div className="field"><label>XP de recompensa</label><input type="number" name="xpReward" defaultValue={existing?.xpReward ?? 10} /></div>
        <button className="btn btn-primary btn-block" type="submit">Salvar</button>
      </form>
    </>
  );
}
export default function AdminMissions() {
  const { toast, confirm, openModal } = useApp();
  const res = useAsync(() => api('/admin/missions/templates'), []);
  const form = (t) => openModal(<MissionTplModal existing={t} onSaved={res.reload} />);
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h4>Templates de missão</h4>
        <button className="btn btn-primary btn-sm" onClick={() => form(null)}><Icon name="add" />Novo</button>
      </div>
      <Card>
        <Async res={res}>{(d) => list(d).length ? list(d).map((t) => (
          <div key={t.id} className="list-item">
            <Icon name="military_tech" style={{ color: t.active ? 'var(--mint-700)' : 'var(--muted)' }} />
            <div className="meta"><div className="title">{t.title}</div><div className="sub">{t.category || ''} · +{t.xpReward ?? 0} XP{t.active === false ? ' · inativo' : ''}</div></div>
            <div className="actions">
              <button className="btn-icon" onClick={() => form(t)}><Icon name="edit" /></button>
              <button className="btn-icon" onClick={() => confirm('Desativar template', 'O template será desativado (histórico é preservado).', async () => {
                try { await api('/admin/missions/templates/' + t.id, { method: 'DELETE' }); toast('Template desativado.', 'success'); res.reload(); } catch (e) { toast(e.message, 'error'); }
              }, 'Desativar')}><Icon name="delete" /></button>
            </div>
          </div>
        )) : <Empty>Nenhum template.</Empty>}</Async>
      </Card>
    </>
  );
}
