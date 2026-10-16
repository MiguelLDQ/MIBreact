import { useState } from 'react';
import { Avatar, Card, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, fetchMe, toast, confirm, logout } = useApp();
  const [form, setForm] = useState({
    displayName: user.displayName || '', bio: user.bio || '',
    statusMessage: user.statusMessage || user.status || '',
    isPublic: (user.isPublic ?? user.public) !== false,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api('/profile/me', { method: 'PUT', body: form }); await fetchMe(); toast('Perfil atualizado!', 'success'); }
    catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };
  const upload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('A imagem deve ter até 2MB.', 'error'); return; }
    const fd = new FormData(); fd.append('file', file); fd.append('avatar', file);
    try { await api('/profile/me/avatar', { method: 'POST', body: fd }); await fetchMe(); toast('Foto atualizada!', 'success'); }
    catch (err) { toast(err.message, 'error'); }
  };

  return (
    <>
      <ViewHeader icon="person" title="Perfil" />
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="row gap-16" style={{ marginBottom: 18 }}>
            <Avatar large name={user.displayName} url={user.avatarUrl} />
            <div>
              <h3>{user.displayName}</h3><div className="muted">@{user.username}</div>
              <label className="link-btn" style={{ display: 'inline-block', marginTop: 6 }}>
                Alterar foto<input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={upload} />
              </label>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="field"><label>Nome de exibição</label><input type="text" value={form.displayName} onChange={set('displayName')} /></div>
            <div className="field"><label>Bio</label><textarea value={form.bio} onChange={set('bio')} placeholder="Conte um pouco sobre você..." /></div>
            <div className="field"><label>Status</label><input type="text" value={form.statusMessage} onChange={set('statusMessage')} placeholder="Ex: focado nos estudos" /></div>
            <div className="field"><label>Visibilidade do perfil</label>
              <select value={String(form.isPublic)} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.value === 'true' }))}>
                <option value="true">Público</option><option value="false">Privado (só amigos)</option>
              </select></div>
            <button className="btn btn-primary" type="submit" disabled={busy}>Salvar alterações</button>
          </form>
        </div>
        <div>
          <Card title="Resumo" icon="assessment" style={{ marginBottom: 16 }}>
            <div className="stat-trio">
              <div><div className="num">Nv {user.level ?? 1}</div><div className="lbl">Nível</div></div>
              <div><div className="num">{user.totalXp ?? 0}</div><div className="lbl">XP total</div></div>
              <div><div className="num">{user.currentLoginStreak ?? 0}</div><div className="lbl">Streak</div></div>
            </div>
          </Card>
          <Card title="Conta" icon="settings">
            <button className="btn btn-danger btn-block" onClick={() => confirm('Sair da conta', 'Tem certeza que deseja sair?', () => logout(), 'Sair')}>Sair da conta</button>
          </Card>
        </div>
      </div>
    </>
  );
}
