import { useState, useEffect, useRef } from 'react';
import { Async, Empty, Icon, Spin, Tabs } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { fmtTime, initials, list } from '../utils/format';

function ChatBubble({ m }) {
  const { user } = useApp();
  const mine = String(m.senderId || m.userId || m.authorId) === String(user?.id);
  return (
    <div className={'msg-row' + (mine ? ' mine' : '')}>
      <div>
        {!mine && <div className="msg-meta">{m.senderName || m.authorName || m.username || '—'}</div>}
        <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.content || m.message || ''}</div>
        <div className="msg-meta">{fmtTime(m.createdAt || m.timestamp)}</div>
      </div>
    </div>
  );
}

function DirectRoomList({ activeKey, onOpen }) {
  const { navigate } = useApp();
  const res = useAsync(async () => {
    const [convos, friends] = await Promise.all([api('/chat/direct').catch(() => []), api('/friends').catch(() => [])]);
    const byFriend = {};
    list(convos).forEach((c) => { const fid = c.friendUserId ?? c.userId ?? c.id; if (fid) byFriend[fid] = c; });
    return list(friends).map((f) => {
      const fid = f.friendUserId ?? f.userId ?? f.id;
      const c = byFriend[fid];
      return { friendId: fid, name: (c && (c.friendDisplayName || c.friendName)) || f.displayName || f.name || f.username || 'Amigo', online: f.online, hasConvo: !!c };
    }).filter((e) => e.friendId);
  }, []);
  return (
    <Async res={res}>{(entries) => entries.length ? entries.map((en) => (
      <div key={en.friendId} className={'chat-room-item' + (activeKey === en.friendId ? ' active' : '')} onClick={() => onOpen(en.friendId, 'direct')}>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(en.name)}</div>
        <div className="meta">
          <div className="title" style={{ fontSize: 13 }}>{en.name}{en.online && <span className="badge-dot online" style={{ marginLeft: 2 }} />}</div>
          <div className="sub">{en.hasConvo ? 'Conversa iniciada' : 'Iniciar conversa'}</div>
        </div>
      </div>
    )) : (
      <div className="empty" style={{ padding: '20px 10px' }}>Você ainda não tem amigos.<br />
        <button className="link-btn" onClick={() => navigate('friends')}>Buscar amigos</button></div>
    )}</Async>
  );
}

function ThemeRoomList({ activeKey, onOpen }) {
  const { navigate } = useApp();
  const res = useAsync(() => api('/interests'), []);
  return (
    <Async res={res}>{(d) => {
      const rooms = list(d).filter((i) => i.themeRoomId);
      return rooms.length ? rooms.map((i) => (
        <div key={i.themeRoomId} className={'chat-room-item' + (activeKey === i.themeRoomId ? ' active' : '')} onClick={() => onOpen(i.themeRoomId, 'theme')}>
          <Icon name="tag" style={{ fontSize: 18, color: 'var(--mint-700)' }} />
          <div className="meta"><div className="title" style={{ fontSize: 13 }}>{i.name || i.label}</div></div>
        </div>
      )) : (
        <div className="empty" style={{ padding: '20px 10px' }}>Nenhuma sala temática vinculada aos seus interesses ainda.<br />
          <button className="link-btn" onClick={() => navigate('interests')}>Escolher interesses</button></div>
      );
    }}</Async>
  );
}

export default function Chat() {
  const { user, toast, wsClient, wsConnected } = useApp();
  const [tab, setTab] = useState('general');
  const [roomId, setRoomId] = useState(null);
  const [listKey, setListKey] = useState(null);
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const boxRef = useRef(null);

  /* troca de aba */
  useEffect(() => {
    setRoomId(null); setListKey(null); setMessages(null);
    if (tab !== 'general') return;
    api('/chat/general/room')
      .then((room) => setRoomId(room?.id || room?.roomId || room))
      .catch((e) => { setMessages([]); toast(e.message, 'error'); });
  }, [tab, toast]);

  /* carrega histórico */
  useEffect(() => {
    if (!roomId) return;
    setMessages(null);
    api('/chat/rooms/' + roomId + '/messages').then((d) => setMessages(list(d))).catch((e) => { setMessages([]); toast(e.message, 'error'); });
  }, [roomId, toast]);

  /* tempo real */
  useEffect(() => {
    const client = wsClient.current;
    if (!roomId || !wsConnected || !client) return undefined;
    const sub = client.subscribe('/topic/chat.room.' + roomId, (frame) => {
      try { const m = JSON.parse(frame.body); setMessages((p) => [...(p || []), m]); } catch { /* ignora */ }
    });
    return () => sub.unsubscribe();
  }, [roomId, wsConnected, wsClient]);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [messages]);

  const openRoom = async (key, kind) => {
    setListKey(key);
    if (kind === 'theme') { setRoomId(key); return; }
    try { const room = await api('/chat/direct/' + key); setRoomId(room?.id || room?.roomId); }
    catch (e) { toast(e.message, 'error'); }
  };

  const send = async () => {
    const t = text.trim(); if (!t || !roomId) return;
    setText('');
    try {
      const client = wsClient.current;
      if (wsConnected && client) {
        client.publish({ destination: '/app/chat.room/' + roomId, body: JSON.stringify({ content: t }) });
      } else {
        const m = await api('/chat/rooms/' + roomId + '/messages', { method: 'POST', body: { content: t } });
        setMessages((p) => [...(p || []), m || { content: t, senderId: user.id, createdAt: new Date() }]);
      }
    } catch (e) { toast(e.message, 'error'); }
  };

  const disabled = tab !== 'general' && !roomId;
  return (
    <>
      <div className="view-header">
        <h2><Icon name="chat" />Chat <span className={'conn-dot' + (wsConnected ? ' on' : '')} title={wsConnected ? 'Conectado em tempo real' : 'Modo offline (REST)'} /></h2>
        <p>Sala geral, conversas privadas e salas temáticas.</p>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[['general', 'Geral'], ['direct', 'Privado'], ['theme', 'Salas temáticas']]} />
      <div className="chat-shell">
        {tab !== 'general' && (
          <div className="chat-rooms">
            {tab === 'direct' ? <DirectRoomList activeKey={listKey} onOpen={openRoom} /> : <ThemeRoomList activeKey={listKey} onOpen={openRoom} />}
          </div>
        )}
        <div className="chat-main" style={tab === 'general' ? { width: '100%' } : undefined}>
          <div className="chat-messages" ref={boxRef}>
            {disabled && !messages ? <Empty icon="forum">Selecione uma sala para começar</Empty>
              : messages === null ? <Spin />
                : messages.length === 0 ? <Empty icon="forum">Nenhuma mensagem ainda. Diga oi!</Empty>
                  : messages.map((m, i) => <ChatBubble key={m.id ?? i} m={m} />)}
          </div>
          <div className="chat-input-row">
            <input type="text" value={text} disabled={disabled} maxLength={1000} placeholder="Digite sua mensagem..."
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button className="btn btn-primary" disabled={disabled} onClick={send}><Icon name="send" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
