import { useState } from 'react';
import { Async, Card, Empty, Icon, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list, timeAgo } from '../utils/format';

const NOTIF_ICONS = {
  FRIEND_REQUEST: 'person_add', FRIEND_ACCEPTED: 'group', MESSAGE: 'chat', MISSION_COMPLETED: 'military_tech',
  NEW_MISSIONS: 'auto_awesome', SHOP_PURCHASE: 'storefront', ACHIEVEMENT: 'emoji_events', LEVEL_UP: 'trending_up',
};
export default function Notifications() {
  const { toast, refreshNotifCount } = useApp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const res = useAsync(() => api('/notifications' + (onlyUnread ? '?unreadOnly=true' : '')), [onlyUnread]);
  const markAll = async () => {
    try { await api('/notifications/read-all', { method: 'PATCH' }); toast('Tudo marcado como lido.', 'success'); res.reload(); refreshNotifCount(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <ViewHeader icon="notifications" title="Notificações">Tudo que aconteceu por aqui.</ViewHeader>
      <div className="row between" style={{ marginBottom: 12 }}>
        <label className="row gap-8" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> Só não lidas
        </label>
        <button className="link-btn" onClick={markAll}>Marcar todas como lidas</button>
      </div>
      <Card>
        <Async res={res}>{(d) => list(d).length ? list(d).map((n) => (
          <div key={n.id} className="list-item" style={n.read ? undefined : { background: 'var(--mint-pale)' }}>
            <Icon name={NOTIF_ICONS[n.type] || 'notifications'} style={{ color: 'var(--mint-700)' }} />
            <div className="meta"><div className="title">{n.title || n.message}</div><div className="sub">{n.body || ''} · {timeAgo(n.createdAt)}</div></div>
            {!n.read && (
              <button className="btn-icon" title="Marcar como lida" onClick={async () => {
                try { await api(`/notifications/${n.id}/read`, { method: 'PATCH' }); refreshNotifCount(); res.reload(); } catch (e) { toast(e.message, 'error'); }
              }}><Icon name="mark_email_read" /></button>
            )}
          </div>
        )) : <Empty icon="notifications_off">Nenhuma notificação por aqui.</Empty>}</Async>
      </Card>
    </>
  );
}
