import { Async, Empty, Icon } from '../../components/ui';
import { ENUMS } from '../../config';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { itemPrice, list } from '../../utils/format';

function ShopItemModal({ existing, onSaved }) {
  const { toast, closeModal } = useApp();
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const body = { name: fd.get('name'), type: fd.get('type'), description: fd.get('description'), price: Number(fd.get('price')) };
    try {
      if (existing) await api('/admin/shop/items/' + existing.id, { method: 'PUT', body }); else await api('/admin/shop/items', { method: 'POST', body });
      toast('Salvo!', 'success'); closeModal(); onSaved();
    } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <>
      <h3 style={{ marginBottom: 16, paddingRight: 24 }}>{existing ? 'Editar item' : 'Novo item'}</h3>
      <form onSubmit={submit}>
        <div className="field"><label>Nome</label><input type="text" name="name" required defaultValue={existing?.name || ''} /></div>
        <div className="field"><label>Tipo</label>
          <select name="type" defaultValue={existing?.type}>{Object.entries(ENUMS.shopItemTypes).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="field"><label>Descrição</label><textarea name="description" defaultValue={existing?.description || ''} /></div>
        <div className="field"><label>Preço (XP)</label><input type="number" name="price" defaultValue={existing?.price ?? 50} /></div>
        <button className="btn btn-primary btn-block" type="submit">Salvar</button>
      </form>
    </>
  );
}
export default function AdminShop() {
  const { toast, confirm, openModal } = useApp();
  const res = useAsync(() => api('/admin/shop/items'), []);
  const form = (i) => openModal(<ShopItemModal existing={i} onSaved={res.reload} />);
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h4>Itens da loja</h4>
        <button className="btn btn-primary btn-sm" onClick={() => form(null)}><Icon name="add" />Novo</button>
      </div>
      <Async res={res}>{(d) => list(d).length ? (
        <div className="grid grid-3">
          {list(d).map((i) => (
            <div key={i.id} className="card">
              <span className="pill">{ENUMS.shopItemTypes[i.type] || i.type}</span>
              <div style={{ fontWeight: 700, margin: '8px 0 3px' }}>{i.name}</div>
              <div className="muted" style={{ marginBottom: 10 }}>{itemPrice(i)} XP{i.active === false ? ' · inativo' : ''}</div>
              <div className="row gap-8">
                <button className="btn btn-sm btn-ghost" onClick={() => form(i)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => confirm('Desativar item', 'O item deixa de aparecer na loja (quem já possui mantém).', async () => {
                  try { await api('/admin/shop/items/' + i.id, { method: 'DELETE' }); toast('Item desativado.', 'success'); res.reload(); } catch (e) { toast(e.message, 'error'); }
                }, 'Desativar')}>Desativar</button>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>Nenhum item cadastrado.</Empty>}</Async>
    </>
  );
}
