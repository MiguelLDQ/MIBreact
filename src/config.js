export const CONFIG = {
  API_BASE: 'https://mib-backend-7p5h.onrender.com/api',
  WS_URL: 'https://mib-backend-7p5h.onrender.com/ws',
};

export const ENUMS = {
  mood: [
    { value: 'VERY_SAD', emoji: '😢', label: 'Muito triste' },
    { value: 'SAD', emoji: '😕', label: 'Triste' },
    { value: 'NEUTRAL', emoji: '😊', label: 'Normal' },
    { value: 'GOOD', emoji: '😄', label: 'Bem' },
    { value: 'VERY_GOOD', emoji: '🤩', label: 'Muito bem' },
  ],
  taskStatus: { PENDING: 'Pendente', IN_PROGRESS: 'Em progresso', COMPLETED: 'Concluída' },
  reportReasons: [
    { value: 'BULLYING', label: 'Bullying' }, { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Assédio' }, { value: 'OFFENSIVE_CONTENT', label: 'Conteúdo ofensivo' },
    { value: 'FAKE_NEWS', label: 'Fake news' }, { value: 'OTHER', label: 'Outro' },
  ],
  shopItemTypes: {
    FRAME: 'Moldura', BACKGROUND: 'Fundo', ICON: 'Ícone', BADGE: 'Emblema',
    TITLE: 'Título', EFFECT: 'Efeito', THEME: 'Tema',
  },
};

export const ROUTES = [
  { id: 'dashboard', label: 'Início', icon: 'home', group: 'Principal' },
  { id: 'ai', label: 'Stella IA', icon: 'smart_toy', group: 'Principal' },
  { id: 'chat', label: 'Chat', icon: 'chat', group: 'Principal' },
  { id: 'friends', label: 'Amigos', icon: 'group', group: 'Principal' },
  { id: 'mood', label: 'Humor', icon: 'mood', group: 'Bem-estar' },
  { id: 'breathing', label: 'Respiração', icon: 'air', group: 'Bem-estar' },
  { id: 'tasks', label: 'Tarefas & Missões', icon: 'task_alt', group: 'Bem-estar' },
  { id: 'anonymous', label: 'Estrelas Pontilhadas', icon: 'stars', group: 'Comunidade' },
  { id: 'interests', label: 'Interesses & Salas', icon: 'interests', group: 'Comunidade' },
  { id: 'notifications', label: 'Notificações', icon: 'notifications', group: 'Comunidade', badge: true },
  { id: 'achievements', label: 'Conquistas', icon: 'emoji_events', group: 'Progresso' },
  { id: 'shop', label: 'Loja & Inventário', icon: 'storefront', group: 'Progresso' },
  { id: 'reports', label: 'Relatórios', icon: 'insights', group: 'Progresso' },
  { id: 'profile', label: 'Perfil', icon: 'person', group: 'Conta' },
  { id: 'admin', label: 'Painel Admin', icon: 'shield_person', group: 'Admin', adminOnly: true },
];
export const BOTTOM_NAV = ['dashboard', 'chat', 'ai', 'notifications', 'profile'];
