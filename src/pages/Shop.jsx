import { useState } from 'react';
import { Async, Empty, Tabs, ViewHeader } from '../components/ui';
import { ENUMS } from '../config';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { itemPrice, list } from '../utils/format';

function ShopTab() {
  const { toast, confirm, fetchMe } = useApp();
  const res = useAsync(() => api('/shop/items'), []);
  const buy = (id) => confirm('Confirmar compra', 'Deseja gastar XP da sua carteira neste item?', async () => {
    try { await api(`/shop/items/${id}/purchase`, { method: 'POST' }); toast('Item comprado!', 'success'); await fetchMe(); res.reload(); }
    catch (e) { toast(e.message, 'error'); }
  }, 'Comprar');
  return (
    <Async res={res}>{(d) => list(d).length ? (
      <div className="grid grid-3">
        {list(d).map((i) => (
          <div key={i.id} className="card">
            <div className="row between"><span className="pill">{ENUMS.shopItemTypes[i.type] || i.type}</span>{i.owned && <span className="pill">Possui</span>}</div>
            <div style={{ fontWeight: 700, margin: '10px 0 3px' }}>{i.name}</div>
            <div className="muted" style={{ marginBottom: 12 }}>{i.description || ''}</div>
            {i.owned ? <button className="btn btn-ghost btn-block" disabled>Já possui</button>
              : <button className="btn btn-primary btn-block" onClick={() => buy(i.id)}>Comprar · {itemPrice(i)} XP</button>}
          </div>
        ))}
      </div>
    ) : <Empty icon="storefront">Loja vazia no momento.</Empty>}</Async>
  );
}
function InventoryTab() {
  const { toast } = useApp();
  const res = useAsync(() => api('/inventory'), []);
  const toggle = async (i) => {
    const id = i.shopItemId || i.id;
    try {
      await api(`/inventory/${id}/${i.equipped ? 'unequip' : 'equip'}`, { method: 'POST' });
      toast(i.equipped ? 'Item desequipado.' : 'Item equipado!', i.equipped ? 'info' : 'success'); res.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Async res={res}>{(d) => list(d).length ? (
      <div className="grid grid-3">
        {list(d).map((i) => (
          <div key={i.shopItemId || i.id} className="card">
            <span className="pill">{ENUMS.shopItemTypes[i.type] || i.type}</span>
            <div style={{ fontWeight: 700, margin: '10px 0 12px' }}>{i.name}</div>
            <button className={'btn btn-block ' + (i.equipped ? 'btn-ghost' : 'btn-primary')} onClick={() => toggle(i)}>
              {i.equipped ? 'Desequipar' : 'Equipar'}</button>
          </div>
        ))}
      </div>
    ) : <Empty icon="backpack">Seu inventário está vazio. Visite a loja!</Empty>}</Async>
  );
}
export default function Shop() {
  const { user } = useApp();
  const [tab, setTab] = useState('shop');
  return (
    <>
      <ViewHeader icon="storefront" title="Loja & Inventário">
        Carteira de XP: <b>{user.xpWallet ?? '—'} XP</b> disponíveis para gastar.
      </ViewHeader>
      <Tabs value={tab} onChange={setTab} tabs={[['shop', 'Loja'], ['inv', 'Inventário']]} />
      {tab === 'shop' ? <ShopTab /> : <InventoryTab />}
    </>
  );
}
