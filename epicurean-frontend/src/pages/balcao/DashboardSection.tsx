import { useFetch } from '../../hooks/useFetch';
import { useOrders } from '../../store/orderContext';
import { getDishes } from '../../services/dish.service';
import { computeBestSellers } from '../../lib/reports';
import { formatBRL } from '../../lib/format';
import styles from './DashboardSection.module.css';

export default function DashboardSection() {
  const { orders } = useOrders();
  const { data: dishes } = useFetch(getDishes);

  const completed = orders.filter((o) => o.status === 'delivered');
  const orderTotal = (items: { price: number; qty: number }[]) =>
    items.reduce((s, i) => s + i.price * i.qty, 0);

  const totalSales = completed.reduce((s, o) => s + orderTotal(o.items), 0);
  const recent = [...completed].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const bestSellers = computeBestSellers(completed).slice(0, 5);

  const imageByName = new Map((dishes ?? []).map((d) => [d.name_dish, d.image]));

  return (
    <div>
      <div className={styles.topGrid}>
        <div className="stat-card" style={{ borderLeft: 'none', borderBottom: '3px solid var(--gold)' }}>
          <div className="stat-label">Total de Vendas</div>
          <div className="stat-value" style={{ fontSize: 'var(--fs-4xl)' }}>
            {formatBRL(totalSales)}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: 'none', borderBottom: '3px solid var(--blue)' }}>
          <div className="stat-label">Pedidos Concluídos</div>
          <div className="stat-value" style={{ fontSize: 'var(--fs-4xl)' }}>
            {completed.length}
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pedidos Concluídos (Recentes)</h2>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <h3>Sem vendas ainda</h3>
              <p>Pedidos finalizados pela cozinha aparecem aqui.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID do Pedido</th>
                  <th>Mesa</th>
                  <th>Pratos</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>#{o.id.slice(0, 4).toUpperCase()}</td>
                    <td>Mesa {String(o.tableNum).padStart(2, '0')}</td>
                    <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td>
                      <span className="badge badge-green">Concluído</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(orderTotal(o.items))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pratos Mais Vendidos</h2>
          </div>
          {bestSellers.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum prato vendido ainda.</p>
            </div>
          ) : (
            <div className={styles.ranking}>
              {bestSellers.map((b, i) => {
                const img = imageByName.get(b.name);
                return (
                  <div className={styles.rankItem} key={b.name}>
                    <div className={styles.rankThumb}>
                      {img ? <img src={img} alt={b.name} /> : <span>🍽</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.rankName}>{b.name}</div>
                      <div className={styles.rankQty}>{b.qty} unidades vendidas</div>
                    </div>
                    <div className={styles.rankBadge} data-top={i === 0}>
                      {i === 0 ? '★' : `#${i + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
