export const list = (d) => (Array.isArray(d) ? d : d?.content || []);
export const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const fmtDate = (d) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('pt-BR'); };
export const fmtTime = (d) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? '' : dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
export const fmtDateTime = (d) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
export function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'agora'; if (s < 3600) return Math.floor(s / 60) + 'min';
  if (s < 86400) return Math.floor(s / 3600) + 'h'; if (s < 604800) return Math.floor(s / 86400) + 'd';
  return fmtDate(d);
}
export const levelXpNeeded = (level) => 100 * level * level;
export const userId = (u) => u?.id ?? u?.userId ?? u?.uuid ?? u?.userUuid ?? u?.publicId;
export const itemPrice = (i) => i?.price ?? i?.cost ?? i?.xpCost ?? i?.xpPrice ?? i?.value ?? '?';
export const normalizeUser = (u) => {
  if (!u) return u;
  return { ...u, displayName: u.displayName || u.name || u.username, roles: u.roles || u.authorities || [] };
};
export const hasAdminRole = (u) => (u?.roles || u?.authorities || []).some((r) => String(r).toUpperCase().includes('ADMIN'));
export const xpInfo = (u) => {
  const level = u?.level ?? u?.currentLevel ?? 1;
  const totalXp = u?.totalXp ?? u?.xp ?? 0;
  const floor = level > 1 ? levelXpNeeded(level - 1) : 0;
  const span = levelXpNeeded(level) - floor || 1;
  const pct = Math.max(3, Math.min(100, Math.round(((totalXp - floor) / span) * 100)));
  return { level, totalXp, pct };
};
