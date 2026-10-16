import { useState, useEffect } from 'react';
import { Async, Avatar, Card, Empty, Icon, Spin, Tabs, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { api } from '../services/api';
import { initials, list, timeAgo, userId } from '../utils/format';

function UserProfileModal({ targetId }) {
  const res = useAsync(() => api('/profile/' + targetId), [targetId]);
  if (res.loading) return <div style={{ padding: '30px 0' }}><Spin /></div>;
  if (res.error) return <Empty icon="error">{res.error.message || 'Não foi possível carregar o perfil (o perfil pode ser privado).'}</Empty>;
  const p = res.data; const name = p.displayName || p.username || 'Usuário';
  return (
    <div style={{ textAlign: 'center', paddingTop: 6 }}>
      <Avatar large name={name} url={p.avatarUrl} style={{ margin: '0 auto 12px' }} />
      <h3>{name}</h3>
      {(p.statusMessage || p.status) && <div className="muted" style={{ marginTop: 2 }}>{p.statusMessage || p.status}</div>}
      <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.5 }}>
        {p.bio || <span className="muted">Este usuário não escreveu uma bio.</span>}
      </p>
      <div className="stat-trio" style={{ marginTop: 18 }}>
        <div><div className="num" style={{ fontSize: 18 }}>Nv {p.level ?? '—'}</div><div className="lbl">Nível</div></div>
        <div><div className="num" style={{ fontSize: 18 }}>{p.currentLoginStreak ?? '—'}</div><div className="lbl">Streak</div></div>
        <div><div className="num" style={{ fontSize: 18 }}>{p.totalXp ?? '—'}</div><div className="lbl">XP</div></div>
      </div>
    </div>
  );
}

function FriendRow({ f, children }) {
  const { openModal } = useApp();
  const name = f.displayName || f.name || f.username || f.friendDisplayName;
  const uid = f.friendUserId ?? userId(f);
  const open = uid ? () => openModal(<UserProfileModal targetId={uid} />, '400px') : undefined;
  const sub = f.online ? 'Online agora' : f.lastSeen ? 'Visto ' + timeAgo(f.lastSeen)
    : f.mutualInterests ? f.mutualInterests + ' interesses em comum' : '@' + (f.username || '');
  return (
    <div className="list-item">
      <div className="avatar" onClick={open} style={{ cursor: uid ? 'pointer' : undefined }}>{initials(name)}</div>
      <div className="meta" onClick={open} style={{ cursor: uid ? 'pointer' : undefined }}>
        <div className="title">{name} {f.online !== undefined && <span className={'badge-dot' + (f.online ? ' online' : '')} style={{ marginLeft: 4 }} />}</div>
        <div className="sub">{sub}</div>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}

function AddFriendButton({ id }) {
  const { toast } = useApp();
  const [sent, setSent] = useState(false);
  return (
    <button className="btn btn-primary btn-sm" disabled={sent} onClick={async () => {
      try { await api('/friends/requests/' + id, { method: 'POST' }); toast('Solicitação enviada!', 'success'); setSent(true); }
      catch (e) { toast(e.message, 'error'); }
    }}>{sent ? 'Enviado' : 'Adicionar'}</button>
  );
}

function FriendsPanel({ tab }) {
  const { toast, confirm } = useApp();
  const paths = { list: '/friends', incoming: '/friends/requests/incoming', outgoing: '/friends/requests/outgoing', reco: '/recommendations/friends' };
  const res = useAsync(() => api(paths[tab]), [tab]);
  const act = async (fn, okMsg, type = 'success') => {
    try { await fn(); toast(okMsg, type); res.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Card>
      <Async res={res}>{(d) => {
        const items = list(d);
        if (tab === 'list') return items.length ? items.map((f) => (
          <FriendRow key={f.friendUserId || f.id} f={f}>
            <button className="btn-icon" title="Remover" onClick={() => confirm('Remover amizade', 'Tem certeza?',
              () => act(() => api('/friends/' + (f.friendUserId || f.id), { method: 'DELETE' }), 'Amizade removida.'), 'Remover')}>
              <Icon name="person_remove" /></button>
          </FriendRow>
        )) : <Empty icon="group">Você ainda não tem amigos. Busque alguém acima!</Empty>;
        if (tab === 'incoming') return items.length ? items.map((f) => {
          const rid = f.requestId ?? f.id;
          return (
            <FriendRow key={rid} f={f}>
              <button className="btn btn-primary btn-sm" onClick={() => act(() => api(`/friends/requests/${rid}/accept`, { method: 'POST' }), 'Amizade aceita!')}>Aceitar</button>
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api(`/friends/requests/${rid}/decline`, { method: 'POST' }), 'Solicitação recusada.', 'info')}>Recusar</button>
            </FriendRow>
          );
        }) : <Empty>Nenhuma solicitação recebida.</Empty>;
        if (tab === 'outgoing') return items.length ? items.map((f) => {
          const rid = f.requestId ?? f.id;
          return (
            <FriendRow key={rid} f={f}>
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api('/friends/requests/' + rid, { method: 'DELETE' }), 'Solicitação cancelada.', 'info')}>Cancelar</button>
            </FriendRow>
          );
        }) : <Empty>Nenhuma solicitação enviada.</Empty>;
        return items.length ? items.map((f) => (
          <FriendRow key={userId(f)} f={f}><AddFriendButton id={userId(f)} /></FriendRow>
        )) : <Empty>Sem sugestões no momento — escolha alguns interesses.</Empty>;
      }}</Async>
    </Card>
  );
}

export default function Friends() {
  const [tab, setTab] = useState('list');
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 400);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!dq) { setResults(null); return undefined; }
    let alive = true;
    setResults({ loading: true });
    api('/users/search?query=' + encodeURIComponent(dq))
      .then((d) => alive && setResults({ data: list(d) }))
      .catch((e) => alive && setResults({ error: e }));
    return () => { alive = false; };
  }, [dq]);

  return (
    <>
      <ViewHeader icon="group" title="Amigos">Busque pessoas, gerencie solicitações e veja recomendações.</ViewHeader>
      <div className="field"><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por username ou nome..." /></div>
      {results && (
        <div className="card" style={{ marginTop: 10 }}>
          {results.loading ? <Spin /> : results.error ? <Empty>{results.error.message}</Empty>
            : results.data.length ? results.data.map((u) => <FriendRow key={userId(u)} f={u}><AddFriendButton id={userId(u)} /></FriendRow>)
              : <Empty>Nenhum usuário encontrado.</Empty>}
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <Tabs value={tab} onChange={setTab} tabs={[['list', 'Meus amigos'], ['incoming', 'Recebidas'], ['outgoing', 'Enviadas'], ['reco', 'Sugestões']]} />
      </div>
      <FriendsPanel tab={tab} />
    </>
  );
}
