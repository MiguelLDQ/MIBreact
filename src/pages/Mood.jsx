import { useState, useEffect } from 'react';
import { MoodChart, MoodPicker } from '../components/mood';
import { Async, Card, Empty, Spin, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list } from '../utils/format';

export default function Mood() {
  const { toast } = useApp();
  const today = useAsync(() => api('/mood/today').catch(() => null), []);
  const hist = useAsync(() => api('/mood/history?days=30').catch(() => []), []);
  const [note, setNote] = useState('');
  const [sel, setSel] = useState(null);
  useEffect(() => {
    if (today.data) { setSel(today.data.moodLevel ?? today.data.level ?? null); setNote(today.data.note || ''); }
  }, [today.data]);

  const save = async (body, msg) => {
    try { await api('/mood', { method: 'POST', body }); toast(msg, 'success'); today.reload(); hist.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <ViewHeader icon="mood" title="Humor">Diário de humor — puramente autorrelato, sem julgamento.</ViewHeader>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Card title="Como você está agora?" icon="edit_note">
          {today.loading ? <Spin /> : (<>
            <MoodPicker selected={sel} onPick={(v) => { setSel(v); save({ moodLevel: v }, 'Humor registrado.'); }} />
            <div className="field" style={{ marginTop: 16 }}>
              <label>Nota (opcional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Um espaço só seu, se quiser escrever." />
            </div>
            <button className="btn btn-primary" onClick={() => save({ moodLevel: sel, note }, 'Nota salva.')}>Salvar nota</button>
          </>)}
        </Card>
        <Card title="Histórico (30 dias)" icon="query_stats">
          <Async res={hist}>{(d) => list(d).length ? <MoodChart hist={list(d)} />
            : <Empty icon="show_chart">Registre seu humor para ver sua evolução aqui!</Empty>}</Async>
        </Card>
      </div>
    </>
  );
}
