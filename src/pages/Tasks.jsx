import { useState } from 'react';
import { Async, Card, Empty, Icon, Tabs, ViewHeader } from '../components/ui';
import { ENUMS } from '../config';
import { useApp } from '../context/AppContext';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { api } from '../services/api';
import { fmtDate, list } from '../utils/format';

function TaskFormModal({ existing, onSaved }) {
  const { toast, closeModal } = useApp();
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const body = { title: fd.get('title'), description: fd.get('description'), category: fd.get('category') || null, dueDate: fd.get('dueDate') || null };
    try {
      if (existing) await api('/tasks/' + existing.id, { method: 'PUT', body }); else await api('/tasks', { method: 'POST', body });
      toast(existing ? 'Tarefa atualizada.' : 'Tarefa criada.', 'success'); closeModal(); onSaved();
    } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <>
      <h3 style={{ marginBottom: 16, paddingRight: 24 }}>{existing ? 'Editar tarefa' : 'Nova tarefa'}</h3>
      <form onSubmit={submit}>
        <div className="field"><label>Título</label><input type="text" name="title" required defaultValue={existing?.title || ''} /></div>
        <div className="field"><label>Descrição</label><textarea name="description" defaultValue={existing?.description || ''} /></div>
        <div className="grid grid-2">
          <div className="field"><label>Categoria</label><input type="text" name="category" defaultValue={existing?.category || ''} placeholder="Ex: Estudos" /></div>
          <div className="field"><label>Vencimento</label><input type="date" name="dueDate" defaultValue={existing?.dueDate ? existing.dueDate.slice(0, 10) : ''} /></div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">{existing ? 'Salvar alterações' : 'Criar tarefa'}</button>
      </form>
    </>
  );
}

function TasksTab() {
  const { toast, confirm, openModal, fetchMe } = useApp();
  const [status, setStatus] = useState('');
  const [catInput, setCatInput] = useState('');
  const cat = useDebounced(catInput, 400);
  const res = useAsync(() => {
    let p = '/tasks?';
    if (status) p += 'status=' + status + '&';
    if (cat) p += 'category=' + encodeURIComponent(cat) + '&';
    return api(p);
  }, [status, cat]);
  const act = async (fn, msg, type = 'success', xp = false) => {
    try { await fn(); toast(msg, type); res.reload(); if (xp) fetchMe(); } catch (e) { toast(e.message, 'error'); }
  };
  const form = (t) => openModal(<TaskFormModal existing={t} onSaved={res.reload} />);

  return (
    <>
      <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos status</option><option value="PENDING">Pendente</option>
            <option value="IN_PROGRESS">Em progresso</option><option value="COMPLETED">Concluída</option>
          </select>
          <input type="text" value={catInput} onChange={(e) => setCatInput(e.target.value)} placeholder="Filtrar categoria..." style={{ width: 160 }} />
        </div>
        <button className="btn btn-primary" onClick={() => form(null)}><Icon name="add" />Adicionar</button>
      </div>
      <Card>
        <Async res={res}>{(d) => list(d).length ? list(d).map((t) => (
          <div key={t.id} className="list-item">
            <Icon name={t.status === 'COMPLETED' ? 'check_circle' : 'radio_button_unchecked'} style={{ color: 'var(--mint-700)' }} />
            <div className="meta">
              <div className="title">{t.title}</div>
              <div className="sub">{t.category || 'Sem categoria'}{t.dueDate ? ' · vence ' + fmtDate(t.dueDate) : ''}</div>
            </div>
            <span className={t.status === 'COMPLETED' ? 'pill' : t.status === 'IN_PROGRESS' ? 'pill pill-warning' : 'pill pill-muted'}>
              {ENUMS.taskStatus[t.status] || t.status}
            </span>
            <div className="actions">
              {t.status !== 'COMPLETED'
                ? <button className="btn-icon" title="Concluir" onClick={() => act(() => api(`/tasks/${t.id}/complete`, { method: 'PATCH' }), 'Tarefa concluída! +XP', 'success', true)}><Icon name="check" /></button>
                : <button className="btn-icon" title="Reabrir" onClick={() => act(() => api(`/tasks/${t.id}/reopen`, { method: 'PATCH' }), 'Tarefa reaberta.', 'info')}><Icon name="refresh" /></button>}
              <button className="btn-icon" title="Editar" onClick={() => form(t)}><Icon name="edit" /></button>
              <button className="btn-icon" title="Excluir" onClick={() => confirm('Excluir tarefa', 'Essa ação não pode ser desfeita.',
                () => act(() => api('/tasks/' + t.id, { method: 'DELETE' }), 'Tarefa removida.'), 'Excluir')}><Icon name="delete" /></button>
            </div>
          </div>
        )) : <Empty icon="task_alt">Nenhuma tarefa por aqui. Adicione a primeira!</Empty>}</Async>
      </Card>
    </>
  );
}

function MissionsTab() {
  const { toast, fetchMe } = useApp();
  const res = useAsync(() => api('/missions/daily'), []);
  const complete = async (id) => {
    try { await api(`/missions/daily/${id}/complete`, { method: 'POST' }); toast('Missão concluída! +XP', 'success'); res.reload(); fetchMe(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Card>
      <Async res={res}>{(d) => list(d).length ? list(d).map((m) => (
        <div key={m.missionId ?? m.id} className="list-item">
          <Icon name={m.completed ? 'check_circle' : 'radio_button_unchecked'} style={{ color: 'var(--mint-700)' }} />
          <div className="meta">
            <div className="title">{m.title || m.templateName}</div>
            <div className="sub">{m.description || ''} · +{m.xpReward || m.xp || 0} XP</div>
          </div>
          {m.completed ? <span className="pill">Concluída</span>
            : <button className="btn btn-primary btn-sm" onClick={() => complete(m.missionId)}>Concluir</button>}
        </div>
      )) : <Empty icon="military_tech">Nenhuma missão gerada para hoje ainda.</Empty>}</Async>
    </Card>
  );
}

export default function Tasks() {
  const [tab, setTab] = useState('tasks');
  return (
    <>
      <ViewHeader icon="task_alt" title="Tarefas & Missões">Tarefas pessoais livres e missões diárias geradas pelo sistema.</ViewHeader>
      <Tabs value={tab} onChange={setTab} tabs={[['tasks', 'Minhas tarefas'], ['missions', 'Missões diárias']]} />
      {tab === 'tasks' ? <TasksTab /> : <MissionsTab />}
    </>
  );
}
