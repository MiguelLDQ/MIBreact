import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Icon } from '../components/ui';
import { CONFIG } from '../config';
import { api, applyTokens, coldListeners, setSessionExpiredHandler, tokens } from '../services/api';
import { hasAdminRole, normalizeUser } from '../utils/format';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const [coldVisible, setColdVisible] = useState(false);

  useEffect(() => {
    const f = (n) => setColdVisible(n > 0);
    coldListeners.add(f);
    return () => coldListeners.delete(f);
  }, []);

  /* toast */
  const toast = useCallback((msg, type = 'info', ms = 4200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type, show: false }]);
    requestAnimationFrame(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: true } : x))));
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: false } : x))), ms);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms + 250);
  }, []);

  /* modal */
  const openModal = useCallback((content, width = '440px') => setModal({ content, width }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const confirm = useCallback((title, msg, onConfirm, label = 'Confirmar') => {
    setModal({
      width: '440px',
      content: (
        <>
          <h3 style={{ marginBottom: 8, paddingRight: 24 }}>{title}</h3>
          <p className="muted" style={{ marginBottom: 20, lineHeight: 1.5 }}>{msg}</p>
          <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={() => { setModal(null); onConfirm(); }}>{label}</button>
          </div>
        </>
      ),
    });
  }, []);
  useEffect(() => {
    if (!modal) return undefined;
    const h = (e) => e.key === 'Escape' && setModal(null);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [modal]);

  /* navegação */
  const navigate = useCallback((id) => {
    setRoute(id); setSidebarOpen(false); window.scrollTo(0, 0);
  }, []);

  /* usuário */
  const fetchMe = useCallback(async () => {
    try { const me = await api('/profile/me'); setUser((u) => normalizeUser({ ...u, ...me })); } catch { /* mantém o que veio do login */ }
  }, []);

  const refreshNotifCount = useCallback(async () => {
    try {
      const r = await api('/notifications/unread-count');
      setNotifUnread(r?.count ?? r?.unreadCount ?? (typeof r === 'number' ? r : 0));
    } catch { /* ignora */ }
  }, []);

  const logout = useCallback(async (silent) => {
    try { if (!silent) await api('/auth/logout', { method: 'POST', body: { refreshToken: tokens.refresh } }); } catch { /* ignora */ }
    tokens.access = null; tokens.refresh = null;
    setUser(null); setRoute('dashboard'); setNotifUnread(0);
    if (!silent) toast('Você saiu da sua conta.', 'info');
  }, [toast]);
  useEffect(() => { setSessionExpiredHandler(() => logout(true)); }, [logout]);

  const login = useCallback(async (identifier, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { emailOrUsername: identifier, password } });
    applyTokens(data);
    setUser(normalizeUser(data.user));
    await fetchMe();
    toast('Bem-vindo de volta!', 'success');
    setRoute('dashboard');
  }, [fetchMe, toast]);

  const register = useCallback(async (name, email, password) => {
    const data = await api('/auth/register', { method: 'POST', body: { name, displayName: name, username: name, email, password } });
    if (data && (data.accessToken || data.access_token)) {
      applyTokens(data);
      setUser(normalizeUser(data.user));
      await fetchMe();
      toast('Conta criada! Bem-vindo à Stella.', 'success');
      setRoute('dashboard');
      return true;
    }
    toast('Conta criada! Faça login para continuar.', 'success');
    return false;
  }, [fetchMe, toast]);

  /* websocket + polling de notificações enquanto logado */
  const loggedIn = !!user;
  useEffect(() => {
    if (!loggedIn) return undefined;
    refreshNotifCount();
    const poll = setInterval(refreshNotifCount, 45000);

    const client = new Client({
      webSocketFactory: () => new SockJS(CONFIG.WS_URL),
      connectHeaders: { Authorization: 'Bearer ' + tokens.access },
      beforeConnect: () => { client.connectHeaders = { Authorization: 'Bearer ' + tokens.access }; },
      reconnectDelay: 6000, heartbeatIncoming: 10000, heartbeatOutgoing: 10000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe('/user/queue/notifications', (frame) => {
          try {
            const n = JSON.parse(frame.body);
            refreshNotifCount();
            toast(n.title || n.message || 'Nova notificação', 'info');
          } catch { /* ignora */ }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
      onWebSocketError: () => setWsConnected(false),
    });
    client.activate();
    wsRef.current = client;
    return () => {
      clearInterval(poll);
      client.deactivate();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [loggedIn, refreshNotifCount, toast]);

  const value = useMemo(() => ({
    user, setUser, fetchMe, login, register, logout, route, navigate,
    sidebarOpen, setSidebarOpen, notifUnread, refreshNotifCount,
    toast, openModal, closeModal, confirm,
    wsClient: wsRef, wsConnected, isAdmin: hasAdminRole(user),
  }), [user, fetchMe, login, register, logout, route, navigate, sidebarOpen,
    notifUnread, refreshNotifCount, toast, openModal, closeModal, confirm, wsConnected]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}${t.show ? ' show' : ''}`}>
            <Icon name={t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : 'info'} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: modal.width }}>
            <button className="modal-close btn-icon" onClick={closeModal} aria-label="Fechar"><Icon name="close" /></button>
            {modal.content}
          </div>
        </div>
      )}
      {coldVisible && (
        <div className="cold-start-hint">
          <div className="spinner" /><span>Acordando o servidor (Render free tier pode levar até 1 min)…</span>
        </div>
      )}
    </AppCtx.Provider>
  );
}
