import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getPurchases } from '../../services/purchase.service';
import { getSuppliers } from '../../services/supplier.service';
import AsyncState from '../../components/AsyncState';
import PurchaseModal from './PurchaseModal';
import { IconPlus } from '../../components/icons';
import { formatBRL } from '../../lib/format';

export default function PurchasesSection() {
  const purchasesQuery = useFetch(getPurchases);
  const suppliersQuery = useFetch(getSuppliers);
  const [open, setOpen] = useState(false);

  const purchases = purchasesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  function supplierName(id: string): string {
    return suppliers.find((s) => s.id_supplier === id)?.name ?? '—';
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Compras — Entrada de Estoque</h2>
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => setOpen(true)}
          disabled={suppliers.length === 0}
        >
          <IconPlus /> Registrar compra
        </button>
      </div>

      {suppliers.length === 0 && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginBottom: 12 }}>
          É preciso ter ao menos um fornecedor cadastrado.
        </p>
      )}

      <AsyncState
        loading={purchasesQuery.loading}
        error={purchasesQuery.error}
        empty={purchases.length === 0}
        emptyText="Nenhuma compra registrada."
        onRetry={purchasesQuery.reload}
      />

      {!purchasesQuery.loading && !purchasesQuery.error && purchases.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Fornecedor</th>
              <th>Itens</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id_purchase}>
                <td>{p.date}</td>
                <td>{p.supplier?.name ?? supplierName(p.id_supplier)}</td>
                <td>{p.purchase_items?.length ?? '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(p.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <PurchaseModal
          open={open}
          suppliers={suppliers}
          onClose={() => setOpen(false)}
          onSaved={purchasesQuery.reload}
        />
      )}
    </div>
  );
}
