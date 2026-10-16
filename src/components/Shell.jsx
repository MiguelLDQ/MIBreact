import React from 'react';
import CurrentView from './CurrentView';
import { Icon } from './ui';
import { BOTTOM_NAV, ROUTES } from '../config';
import { useApp } from '../context/AppContext';
import { initials, xpInfo } from '../utils/format';

export default function Shell() {
  const { user, route, navigate, sidebarOpen, setSidebarOpen, notifUnread, isAdmin, confirm, logout } = useApp();
  const { level, totalXp, pct } = xpInfo(user);
  const badgeText = notifUnread > 99 ? '99+' : notifUnread;

  const groups = {};
  ROUTES.forEach((r) => { if (r.adminOnly && !isAdmin) return; (groups[r.group] = groups[r.group] || []).push(r); });

  const askLogout = (e) => {
    e?.preventDefault();
    confirm('Sair da conta', 'Tem certeza que deseja sair?', () => logout(), 'Sair');
  };

  return (
    <>
      <div id="topbar">
        <button className="btn-icon hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu"><Icon name="menu" /></button>
        <div className="topbar-logo"><Icon name="psychology" /> MIB</div>
        <div className="topbar-spacer" />
        <div className="xp-chip" title={`Nível ${level} — ${totalXp} XP`}>
          <span className="lvl-badge">Nv {level}</span>
          <div className="xp-bar-mini"><div style={{ width: pct + '%' }} /></div>
          <span className="xp-text muted" style={{ fontSize: 11 }}>{totalXp} XP</span>
        </div>
        <button className="btn-icon notif-btn" onClick={() => navigate('notifications')} aria-label="Notificações">
          <Icon name="notifications" />
          {notifUnread > 0 && <span className="notif-dot">{badgeText}</span>}
        </button>
        <div className="user-chip" onClick={() => navigate('profile')}>
          <div className="avatar">{initials(user.displayName)}</div><span>{user.displayName}</span>
        </div>
      </div>

      <div id="sidebar-overlay" className={sidebarOpen ? 'show' : ''} onClick={() => setSidebarOpen(false)} />
      <div id="shell">
        <aside id="sidebar" className={sidebarOpen ? 'open' : ''}>
          {Object.entries(groups).map(([g, items]) => (
            <React.Fragment key={g}>
              <div className="nav-group-label">{g}</div>
              {items.map((r) => (
                <a key={r.id} href="#" className={'nav-item' + (route === r.id ? ' active' : '')}
                  onClick={(e) => { e.preventDefault(); navigate(r.id); }}>
                  <Icon name={r.icon} />{r.label}
                  {r.badge && notifUnread > 0 && <span className="nav-badge">{badgeText}</span>}
                </a>
              ))}
            </React.Fragment>
          ))}
          <div className="nav-group-label">&nbsp;</div>
          <a href="#" className="nav-item" onClick={askLogout}><Icon name="logout" />Sair</a>
        </aside>
        <main id="content"><CurrentView route={route} /></main>
      </div>

      <nav className="bottom-nav">
        {BOTTOM_NAV.map((id) => {
          const r = ROUTES.find((x) => x.id === id);
          return (
            <a key={id} href="#" className={route === id ? 'active' : ''} onClick={(e) => { e.preventDefault(); navigate(id); }}>
              <Icon name={r.icon} />{r.label.split(' ')[0]}
            </a>
          );
        })}
      </nav>
    </>
  );
}
