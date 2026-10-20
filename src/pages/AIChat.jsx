import { useState, useEffect, useRef, useCallback } from 'react';
import { Empty, Icon, Spin, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { fmtTime, list } from '../utils/format';

export default function AIChat() {
  const { toast, confirm } = useApp();
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    setMsgs(null);
    const d = await api('/ai/conversation').catch(() => ({ content: [] }));
    setMsgs(list(d));
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs]);

  const send = async () => {
    const t = text.trim(); if (!t) return;
    setText('');
    setMsgs((m) => [...(m || []), { role: 'USER', content: t, createdAt: new Date() }]);
    try {
      const reply = await api('/ai/conversation/messages', { method: 'POST', body: { content: t, message: t } });
      const rt = reply?.content || reply?.message || reply?.reply || '';
      setMsgs((m) => [...m, { role: 'AI', content: rt, createdAt: new Date() }]);
    } catch (e) {
      toast(e.status === 429 ? 'Limite de mensagens por hora atingido. Tente novamente mais tarde.' : e.message || 'Erro ao enviar mensagem.', 'error');
    }
  };
  const clear = () => confirm('Apagar conversa', 'Isso apaga todo o histórico de conversa com a IA. Deseja continuar?', async () => {
    try { await api('/ai/conversation', { method: 'DELETE' }); toast('Conversa apagada.', 'success'); load(); } catch (e) { toast(e.message, 'error'); }
  }, 'Apagar');

  return (
    <>
      <ViewHeader icon="smart_toy" title="Stella IA">Converse com a IA de apoio emocional da Stella. Ela não substitui acompanhamento profissional.</ViewHeader>
      <div className="chat-shell">
        <div className="chat-main" style={{ width: '100%' }}>
          <div className="chat-messages" ref={boxRef}>
            {msgs === null ? <Spin /> : msgs.length === 0
              ? <Empty icon="smart_toy">Olá! Sou a IA da Stella. Como você está se sentindo hoje?</Empty>
              : msgs.map((m, i) => {
                const mine = m.role === 'USER' || m.sender === 'USER' || m.fromUser === true;
                return (
                  <div key={i} className={'msg-row' + (mine ? ' mine' : '')}>
                    <div>
                      <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.content || m.message || m.text || ''}</div>
                      <div className="msg-meta">{mine ? 'Você' : 'Stella'} · {fmtTime(m.createdAt || m.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="chat-input-row">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Escreva como você está se sentindo..." maxLength={1000} />
            <button className="btn btn-primary" onClick={send}><Icon name="send" /></button>
            <button className="btn-icon" onClick={clear} title="Apagar conversa"><Icon name="delete" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
