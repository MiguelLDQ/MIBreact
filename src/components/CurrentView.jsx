import React from 'react';
import { Empty } from './ui';
import { useApp } from '../context/AppContext';
import AIChat from '../pages/AIChat';
import Achievements from '../pages/Achievements';
import Admin from '../pages/Admin';
import Anonymous from '../pages/Anonymous';
import Breathing from '../pages/Breathing';
import Chat from '../pages/Chat';
import Dashboard from '../pages/Dashboard';
import Friends from '../pages/Friends';
import Interests from '../pages/Interests';
import Mood from '../pages/Mood';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import Reports from '../pages/Reports';
import Shop from '../pages/Shop';
import Tasks from '../pages/Tasks';

class ViewBoundary extends React.Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e) { console.error(e); }
  render() {
    return this.state.err
      ? <Empty icon="error">Algo deu errado ao carregar esta tela.</Empty>
      : this.props.children;
  }
}

export default function CurrentView({ route }) {
  const { isAdmin } = useApp();
  const views = {
    dashboard: Dashboard, ai: AIChat, chat: Chat, friends: Friends, mood: Mood,
    breathing: Breathing, tasks: Tasks, anonymous: Anonymous, interests: Interests,
    notifications: Notifications, achievements: Achievements, shop: Shop,
    reports: Reports, profile: Profile,
    admin: isAdmin ? Admin : () => <Empty>Acesso restrito.</Empty>,
  };
  const View = views[route] || Dashboard;
  return <ViewBoundary key={route}><View /></ViewBoundary>;
}
