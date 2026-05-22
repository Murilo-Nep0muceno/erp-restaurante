import { useEffect, useMemo, useState } from 'react';
import { useOrders } from '../../store/orderContext';
import { useNotif } from '../../store/notifContext';
import { useFetch } from '../../hooks/useFetch';
import { getDishes } from '../../services/dish.service';
import { MOCK_MENU } from '../../lib/mockMenu';
import { formatBRL } from '../../lib/format';
import type { OrderStatus } from '../../types';
import { IconPlus, IconTrash } from '../../components/icons';

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Enviado',
  cooking: 'Na cozinha',
  ready: 'Pronto',
  delivered: 'Entregue',
};

interface ComandaViewProps {
  tableNum: number;
}

export default function ComandaView({ tableNum }: ComandaViewProps) {
  const {
    orders,
    cart,
    selectTable,
    addToCart,
    changeQty,
    setNotes,
    removeFromCart,
    submitOrder,
    kitchenClosed,
  } = useOrders();
  const { notify } = useNotif();
  const { data, error } = useFetch(getDishes);

  const menu = (error ? MOCK_MENU : (data ?? [])).filter((d) => d.available_dish);

  // Garante que o pedido enviado seja atribuído a esta mesa (e zera o carrinho).
  useEffect(() => {
    selectTable(tableNum);
  }, [tableNum, selectTable]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ['Todas', ...set];
  }, [menu]);
  const [cat, setCat] = useState('Todas');
  const filtered = cat === 'Todas' ? menu : menu.filter((d) => d.category === cat);

  const tableOrders = orders
    .filter((o) => o.tableNum === tableNum)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const orderItemTotal = (items: { price: number; qty: number }[]) =>
    items.reduce((s, it) => s + it.price * it.qty, 0);
  const ordersTotal = tableOrders.reduce((s, o) => s + orderItemTotal(o.items), 0);
  const cartTotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const total = ordersTotal + cartTotal;

  async function handleSubmit() {
    if (kitchenClosed) {
      notify('A cozinha está fechada — não é possível enviar pedidos.', '⚠');
      return;
    }
    try {
      const ok = await submitOrder();
      if (ok) notify('Pedido enviado para a cozinha!', '🍳');
    } catch {
      notify('A cozinha está fechada ou houve um erro ao enviar o pedido.', '⚠');
    }
  }

  return (
    <>
      {kitchenClosed && (
        <div className="kitchen-closed-banner" style={{ marginBottom: 14 }}>
          <span className="kitchen-closed-dot" />
          <div>
            <strong>A cozinha está fechada.</strong> Você pode visualizar a comanda, mas não é
            possível adicionar itens nem enviar pedidos até a cozinha reabrir.
          </div>
        </div>
      )}
      <div className="order-panel">
      <div className="order-menu">
        <div className="cat-tabs">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`cat-tab${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filtered.map((d) => (
            <div className="menu-dish" key={d.id_recipe_dish}>
              <div className="menu-dish-img">
                {d.image ? (
                  <img src={d.image} alt={d.name_dish} />
                ) : (
                  <div className="menu-dish-img-ph">
                    <span style={{ color: 'var(--gold)', fontSize: 'var(--fs-4xl)' }}>🍽</span>
                  </div>
                )}
              </div>
              <div className="menu-dish-body">
                <div className="menu-dish-name">{d.name_dish}</div>
                <div className="menu-dish-price">{formatBRL(d.selling_price_dish)}</div>
                <div className="menu-dish-desc">{d.description_dish}</div>
              </div>
              <button
                type="button"
                className="add-btn"
                aria-label={`Adicionar ${d.name_dish}`}
                disabled={kitchenClosed}
                onClick={() =>
                  addToCart({
                    dishId: d.id_recipe_dish,
                    name: d.name_dish,
                    price: d.selling_price_dish,
                  })
                }
              >
                +
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--gray-400)', fontSize: 'var(--fs-base)' }}>Nenhum prato nesta categoria.</p>
          )}
        </div>
      </div>

      <aside className="order-cart">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <h3 className="card-title">Total da Mesa</h3>
          <span className="cart-subtotal-val">{formatBRL(total)}</span>
        </div>

        {/* Comandas já enviadas para esta mesa */}
        <div className="table-status" style={{ marginBottom: 8 }}>
          Já pedido (mesa / cozinha)
        </div>
        {tableOrders.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-400)', marginBottom: 12 }}>
            Nenhuma comanda enviada ainda.
          </p>
        ) : (
          tableOrders.map((o) => (
            <div className="comanda-row" key={o.id}>
              <div className="comanda-row-head">
                <strong>Comanda #{o.code ?? o.id.slice(0, 4)}</strong>
                <span className="badge badge-gray">{STATUS_LABEL[o.status]}</span>
              </div>
              {o.items.map((it) => (
                <div key={it.dishId} className="comanda-item">
                  <span>
                    {it.qty}x {it.name}
                  </span>
                  <span>{formatBRL(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Novos itens (carrinho desta visita) */}
        <div className="table-status" style={{ margin: '14px 0 8px' }}>
          Novos itens
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span style={{ fontSize: 'var(--fs-2xl)' }}>🛒</span>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-400)', margin: 0 }}>
              Nenhum item novo adicionado
            </p>
          </div>
        ) : (
          cart.map((line) => (
            <div key={line.dishId} style={{ borderBottom: '1px solid var(--gray-100)', padding: '8px 0' }}>
              <div className="cart-item" style={{ border: 'none', padding: 0 }}>
                <span className="cart-item-name">{line.name}</span>
                <div className="qty-control">
                  <button type="button" className="qty-btn" onClick={() => changeQty(line.dishId, -1)}>
                    −
                  </button>
                  <span>{line.qty}</span>
                  <button type="button" className="qty-btn" onClick={() => changeQty(line.dishId, 1)}>
                    +
                  </button>
                </div>
                <span className="cart-item-price">{formatBRL(line.price * line.qty)}</span>
                <button
                  type="button"
                  className="qty-btn"
                  aria-label="Remover"
                  onClick={() => removeFromCart(line.dishId)}
                >
                  <IconTrash width={12} height={12} />
                </button>
              </div>
              <input
                className="form-input"
                style={{ marginTop: 6, fontSize: 'var(--fs-sm)', padding: '6px 8px' }}
                placeholder="Observações (ex: sem cebola)"
                value={line.notes ?? ''}
                onChange={(e) => setNotes(line.dishId, e.target.value)}
              />
            </div>
          ))
        )}

        <button
          type="button"
          className="btn btn-gold btn-block"
          style={{ marginTop: 14 }}
          disabled={cart.length === 0 || kitchenClosed}
          onClick={handleSubmit}
        >
          <IconPlus /> Enviar para a cozinha
        </button>
      </aside>
      </div>
    </>
  );
}
