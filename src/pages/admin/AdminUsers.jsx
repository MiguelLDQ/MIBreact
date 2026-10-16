import { useState } from 'react';
import { Async, Card, Empty, Icon } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAsync, useDebounced } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { hasAdminRole, initials, list } from '../../utils/format';

export default function AdminUsers() {
  const { toast, confirm } = useApp();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 400);
  const res = useAsync(() => api('/admin/users' + (dq ? '?query=' + encodeURIComponent(dq) : '')), [dq]);
  const post = async (path, msg) => { try { await api(path, { method: 'POST' }); toast(msg, 'success'); res.reload(); } catch (e) { toast(e.message, 'error'); } };
  const ask = (title, text, path, msg, label) => confirm(title, text, () => post(path, msg), label);
  return (
    <>
      <div className="field"><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuário..." /></div>
      <Card>
        <Async res={res}>{(d) => list(d).length ? list(d).map((u) => {
          const base = '/admin/users/' + u.id;
          return (
            <div key={u.id} className="list-item">
              <div className="avatar">{initials(u.displayName || u.username)}</div>
              <div className="meta">
                <div className="title">{u.displayName || u.username} {u.banned ? <span className="pill pill-danger">Banido</span> : u.suspended ? <span className="pill pill-warning">Suspenso</span> : null}</div>
                <div className="sub">{u.email || ''}</div>
              </div>
              <div className="actions">
                {u.banned ? <button className="btn btn-sm btn-ghost" onClick={() => post(base + '/unban', 'Usuário desbanido.')}>Desbanir</button>
                  : <button className="btn btn-sm btn-danger" onClick={() => ask('Banir usuário', 'Tem certeza? O usuário perderá acesso à conta.', base + '/ban', 'Usuário banido.', 'Banir')}>Banir</button>}
                {u.suspended ? <button className="btn btn-sm btn-ghost" onClick={() => post(base + '/unsuspend', 'Suspensão removida.')}>Reativar</button>
                  : <button className="btn btn-sm btn-ghost" onClick={() => ask('Suspender usuário', 'Confirma a suspensão temporária?', base + '/suspend', 'Usuário suspenso.', 'Suspender')}>Suspender</button>}
                {hasAdminRole(u)
                  ? <button className="btn-icon" title="Revogar admin" onClick={() => ask('Revogar admin', 'Remover privilégios de administrador?', base + '/roles/admin/revoke', 'Privilégio revogado.', 'Revogar')}><Icon name="remove_moderator" /></button>
                  : <button className="btn-icon" title="Tornar admin" onClick={() => ask('Conceder admin', 'Conceder privilégios de administrador a este usuário?', base + '/roles/admin/grant', 'Privilégio concedido.', 'Conceder')}><Icon name="add_moderator" /></button>}
              </div>
            </div>
          );
        }) : <Empty>Nenhum usuário encontrado.</Empty>}</Async>
      </Card>
    </>
  );
}
