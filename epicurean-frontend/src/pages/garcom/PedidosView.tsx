import { useOrders } from '../../store/orderContext';
import type { Order, OrderStatus } from '../../types';
import { formatBRL } from '../../lib/format';

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Enviado à cozinha',
  cooking: 'Na cozinha',
  ready: 'Pronto',
  delivered: 'Entregue na mesa',
};

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function orderTotal(o: Order): number {
  return o.items.reduce((s, it) => s + it.price * it.qty, 0);
}

export default function PedidosView() {
  const { orders } = useOrders();
  const list = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (list.length === 0) {
    return (
      <div className="empty-state">
        <h3>Nenhum pedido ainda</h3>
        <p>Os pedidos enviados às mesas aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((o) => (
        <div className="card" key={o.id} style={{ padding: 16 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>
                Mesa {String(o.tableNum).padStart(2, '0')} — #{o.code ?? o.id.slice(0, 4)}
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', margin: '2px 0 8px' }}>
                Enviado às {time(o.createdAt)}
              </div>
              {o.items.map((it) => (
                <div key={it.dishId} style={{ fontSize: 'var(--fs-md)' }}>
                  <strong>{it.qty}x</strong> {it.name}
                  {it.notes ? (
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--orange)' }}>↳ Obs: {it.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <span className="badge badge-gold">{STATUS_LABEL[o.status]}</span>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{formatBRL(orderTotal(o))}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
