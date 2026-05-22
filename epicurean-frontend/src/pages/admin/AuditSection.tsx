import { useOrders } from '../../store/orderContext';
import { useNotif } from '../../store/notifContext';
import { useFetch } from '../../hooks/useFetch';
import { getLogs, recordLog } from '../../services/log.service';
import { computeBestSellers } from '../../lib/reports';
import { downloadCSV } from '../../lib/csv';
import { formatDateTime } from '../../lib/format';
import AsyncState from '../../components/AsyncState';
import { IconDownload } from '../../components/icons';

export default function AuditSection() {
  const { orders } = useOrders();
  const { notify } = useNotif();
  const { data, loading, error, reload } = useFetch(getLogs);

  const entries = data ?? [];

  async function handleExport() {
    const rows = computeBestSellers(orders);
    if (rows.length === 0) {
      notify('Ainda não há pedidos para exportar.', '⚠');
      return;
    }
    downloadCSV(
      `mais-vendidos-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Prato', 'Quantidade vendida', 'Receita (R$)'],
      rows.map((r) => [r.name, r.qty, r.revenue.toFixed(2).replace('.', ',')]),
    );
    recordLog('Exportou relatório de Pratos Mais Vendidos (Excel/CSV)');
    notify('Relatório exportado.');
    // dá tempo do POST /logs persistir antes de recarregar a lista
    setTimeout(() => void reload(), 400);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Histórico Recente de Ações</h2>
        <button type="button" className="btn btn-ghost" onClick={handleExport}>
          <IconDownload /> Exportar Mais Vendidos (Excel)
        </button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={entries.length === 0}
        emptyText="As ações administrativas aparecem aqui (criação de usuários, configurações, exportações)."
        onRetry={reload}
      />

      {!loading && !error && entries.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Usuário</th>
              <th>Ação realizada</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.createdAt)}</td>
                <td>
                  <span className="badge badge-gray">{e.user}</span>
                </td>
                <td>{e.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
