import { useState } from 'react';
import { Tabs, ViewHeader } from '../components/ui';
import AdminLogs from './admin/AdminLogs';
import AdminMissions from './admin/AdminMissions';
import AdminModeration from './admin/AdminModeration';
import AdminReports from './admin/AdminReports';
import AdminShop from './admin/AdminShop';
import AdminStats from './admin/AdminStats';
import AdminUsers from './admin/AdminUsers';

export default function Admin() {
  const [tab, setTab] = useState('stats');
  const panels = {
    stats: AdminStats, users: AdminUsers, reports: AdminReports, moderation: AdminModeration,
    missions: AdminMissions, shopadmin: AdminShop, logs: AdminLogs,
  };
  const Panel = panels[tab];
  return (
    <>
      <ViewHeader icon="shield_person" title="Painel Admin">Gerencie usuários, conteúdo e configurações do MIB.</ViewHeader>
      <Tabs value={tab} onChange={setTab} tabs={[
        ['stats', 'Estatísticas'], ['users', 'Usuários'], ['reports', 'Denúncias'], ['moderation', 'Moderação'],
        ['missions', 'Missões'], ['shopadmin', 'Loja'], ['logs', 'Logs'],
      ]} />
      <Panel key={tab} />
    </>
  );
}
