import { useMemo } from 'react';
import { useOrders } from '../../store/orderContext';
import { useNotif } from '../../store/notifContext';
import { computeBestSellers } from '../../lib/reports';
import { downloadCSV } from '../../lib/csv';
import { recordLog } from '../../services/log.service';
import { formatBRL } from '../../lib/format';
import { IconDownload } from '../../components/icons';

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function ClosingSection() {
  const { orders, kitchenClosed, kitchenClosedAt } = useOrders();
  const { notify } = useNotif();

  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);

  const bestSellers = useMemo(() => computeBestSellers(todayOrders), [todayOrders]);
  const itemsSold = bestSellers.reduce((s, r) => s + r.qty, 0);
  const revenue = bestSellers.reduce((s, r) => s + r.revenue, 0);

  const closedTime = kitchenClosedAt
    ? new Date(kitchenClosedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const today = new Date().toLocaleDateString('pt-BR');

  function handleDownload() {
    if (bestSellers.length === 0) {
      notify('Ainda não há vendas registradas hoje.', '⚠');
      return;
    }
    const rows: Array<Array<string | number>> = bestSellers.map((r) => [
      r.name,
      r.qty,
      r.revenue.toFixed(2).replace('.', ','),
    ]);
    rows.push(['TOTAL', itemsSold, revenue.toFixed(2).replace('.', ',')]);
    downloadCSV(
      `fechamento-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Prato', 'Quantidade vendida', 'Receita (R$)'],
      rows,
    );
    recordLog('Baixou o relatório de fechamento do dia');
    notify('Relatório do dia baixado.');
  }

  return (
    <>
      <div
        className={`kitchen-closed-banner${kitchenClosed ? '' : ' open'}`}
        style={{ marginBottom: 20 }}
      >
        <span className="kitchen-closed-dot" />
        <div>
          {kitchenClosed ? (
            <>
              <strong>Cozinha fechada{closedTime ? ` desde ${closedTime}` : ''}.</strong> O
              relatório de vendas de hoje está consolidado abaixo e pode ser baixado.
            </>
          ) : (
            <>
              <strong>Cozinha aberta.</strong> O relatório abaixo é parcial e reflete as vendas
              de hoje até agora. Ele é fechado quando a cozinha encerra o dia.
            </>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Pedidos do dia</div>
          <div className="stat-value">{todayOrders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Itens vendidos</div>
          <div className="stat-value">{itemsSold}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Faturamento</div>
          <div className="stat-value">{formatBRL(revenue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Vendas de hoje ({today})</h2>
          <button type="button" className="btn btn-ghost" onClick={handleDownload}>
            <IconDownload /> Baixar relatório (CSV)
          </button>
        </div>

        {bestSellers.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-md)', color: 'var(--gray-400)', padding: '12px 0' }}>
            Nenhuma venda registrada hoje ainda.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Prato</th>
                <th style={{ textAlign: 'right' }}>Qtd. vendida</th>
                <th style={{ textAlign: 'right' }}>Receita</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td style={{ textAlign: 'right' }}>{r.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatBRL(r.revenue)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td>Total</td>
                <td style={{ textAlign: 'right' }}>{itemsSold}</td>
                <td style={{ textAlign: 'right' }}>{formatBRL(revenue)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
