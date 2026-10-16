import { useState } from 'react';
import { Async, Card, Empty, Icon, ViewHeader } from '../components/ui';
import { ENUMS } from '../config';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list, timeAgo } from '../utils/format';

function ReportModal({ targetType, targetId }) {
  const { toast, closeModal } = useApp();
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    try {
      await api('/reports', { method: 'POST', body: { targetType, targetId, reason: fd.get('reason'), details: fd.get('details') } });
      toast('Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.', 'success'); closeModal();
    } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <>
      <h3 style={{ marginBottom: 14, paddingRight: 24 }}>Denunciar</h3>
      <form onSubmit={submit}>
        <div className="field"><label>Motivo</label>
          <select name="reason">{ENUMS.reportReasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
        <div className="field"><label>Detalhes (opcional)</label><textarea name="details" placeholder="Conte mais, se quiser." /></div>
        <button className="btn btn-danger btn-block" type="submit">Enviar denúncia</button>
      </form>
    </>
  );
}

function AnonReplies({ id }) {
  const { toast } = useApp();
  const res = useAsync(() => api(`/anonymous/${id}/replies`), [id]);
  const [text, setText] = useState('');
  const send = async () => {
    const t = text.trim(); if (!t) return;
    try { await api('/anonymous', { method: 'POST', body: { content: t, parentId: id, replyToId: id } }); toast('Resposta enviada.', 'success'); setText(''); res.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <div className="divider" />
      <Async res={res}>{(d) => list(d).length ? list(d).map((r, i) => (
        <div key={r.id ?? i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          {r.content || r.message}<div className="muted" style={{ marginTop: 2 }}>{timeAgo(r.createdAt)}</div>
        </div>
      )) : <div className="muted" style={{ padding: '6px 0' }}>Sem respostas ainda.</div>}</Async>
      <div className="row gap-8" style={{ marginTop: 10 }}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Responder de forma anônima..." style={{ flex: 1 }} />
        <button className="btn btn-sm btn-primary" onClick={send}>Enviar</button>
      </div>
    </>
  );
}

function AnonCard({ m, onChange }) {
  const { toast, confirm, openModal } = useApp();
  const [open, setOpen] = useState(false);
  const iconStyle = { fontSize: 16, verticalAlign: 'middle' };
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span className="pill"><Icon name="stars" style={{ fontSize: 14 }} />Anônimo</span>
        <span className="muted">{timeAgo(m.createdAt)}</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{m.content || m.message}</p>
      <div className="row gap-16">
        <button className="link-btn" onClick={async () => { try { await api(`/anonymous/${m.id}/like`, { method: 'POST' }); onChange(); } catch (e) { toast(e.message, 'error'); } }}>
          <Icon name={m.likedByMe ? 'favorite' : 'favorite_border'} style={iconStyle} /> {m.likesCount ?? m.likes ?? 0}
        </button>
        <button className="link-btn" onClick={() => setOpen((o) => !o)}><Icon name="reply" style={iconStyle} /> Responder</button>
        <button className="link-btn" style={{ color: 'var(--muted)' }} onClick={() => openModal(<ReportModal targetType="ANONYMOUS_MESSAGE" targetId={m.id} />)}>
          <Icon name="flag" style={iconStyle} /> Denunciar</button>
        {m.mine && (
          <button className="link-btn" style={{ color: 'var(--danger)', marginLeft: 'auto' }} onClick={() => confirm('Remover mensagem', 'Deseja remover sua mensagem do mar?', async () => {
            try { await api('/anonymous/' + m.id, { method: 'DELETE' }); toast('Mensagem removida.', 'success'); onChange(); } catch (e) { toast(e.message, 'error'); }
          }, 'Remover')}><Icon name="delete" style={iconStyle} /></button>
        )}
      </div>
      {open && <AnonReplies id={m.id} />}
    </div>
  );
}

export default function Anonymous() {
  const { toast } = useApp();
  const feed = useAsync(() => api('/anonymous'), []);
  const [text, setText] = useState('');
  const send = async () => {
    const t = text.trim(); if (!t) return;
    try { await api('/anonymous', { method: 'POST', body: { content: t } }); setText(''); toast('Enviado ao mar. 🌊', 'success'); feed.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <ViewHeader icon="stars" title="Estrelas Pontilhadas">Envie mensagens anônimas ao mar e receba apoio de outras pessoas.</ViewHeader>
      <Card title="Enviar ao mar" icon="send" style={{ marginBottom: 16 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Escreva o que quiser — de forma completamente anônima..." />
        <div className="hint" style={{ margin: '8px 0 12px' }}>Sua mensagem será publicada sem nenhuma identificação sua.</div>
        <button className="btn btn-primary" onClick={send}>Enviar ao mar</button>
      </Card>
      <Async res={feed}>{(d) => list(d).length ? list(d).map((m) => <AnonCard key={m.id} m={m} onChange={feed.reload} />)
        : <Empty icon="mail">Nenhuma mensagem no mar ainda.</Empty>}</Async>
    </>
  );
}
