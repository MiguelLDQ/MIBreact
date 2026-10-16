import { useState } from 'react';
import { Async, Card, Icon, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list } from '../utils/format';

function InterestsPanel({ items }) {
  const { toast } = useApp();
  const [sel, setSel] = useState(() => new Set(items.filter((i) => i.selectedByMe).map((i) => i.id)));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const save = async () => {
    try { await api('/interests/me', { method: 'PUT', body: { interestIds: Array.from(sel) } }); toast('Interesses atualizados!', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
        {items.map((i) => {
          const on = sel.has(i.id);
          return (
            <button key={i.id} className="tab" onClick={() => toggle(i.id)}
              style={{ border: `1.5px solid ${on ? 'var(--mint-700)' : 'var(--border)'}`, background: on ? 'var(--mint-soft)' : '#fff' }}>
              {i.name || i.label}{i.themeRoomId && <Icon name="tag" style={{ fontSize: 13, verticalAlign: 'middle', marginLeft: 4 }} />}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={save}>Salvar interesses</button>
    </>
  );
}
export default function Interests() {
  const res = useAsync(() => api('/interests'), []);
  return (
    <>
      <ViewHeader icon="interests" title="Interesses">Escolha o que você curte — isso melhora recomendações de amigos e libera salas temáticas.</ViewHeader>
      <Card><Async res={res}>{(d) => <InterestsPanel items={list(d)} />}</Async></Card>
    </>
  );
}
