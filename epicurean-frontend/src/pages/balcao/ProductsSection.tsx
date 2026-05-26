import { useState } from 'react';
import axios from 'axios';
import { useFetch } from '../../hooks/useFetch';
import { useNotif } from '../../store/notifContext';
import { deleteProduct, getProducts } from '../../services/product.service';
import { getSuppliers } from '../../services/supplier.service';
import { getApiErrorMessage } from '../../services/api';
import type { Product } from '../../types';
import AsyncState from '../../components/AsyncState';
import Modal from '../../components/Modal';
import ProductModal from './ProductModal';
import PurchaseModal from './PurchaseModal';
import { IconClipboard, IconEdit, IconPlus, IconTrash, IconUsers } from '../../components/icons';
import { formatBRL } from '../../lib/format';

interface ProductsSectionProps {
  onManageSuppliers?: () => void;
}

export default function ProductsSection({ onManageSuppliers }: ProductsSectionProps) {
  const { data, loading, error, reload } = useFetch(getProducts);
  const suppliersQuery = useFetch(getSuppliers);
  const { notify } = useNotif();

  const [productModal, setProductModal] = useState<{ editing: Product | null } | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dishConflict, setDishConflict] = useState<{
    product: Product;
    dishes: { id_recipe_dish: string; name_dish: string }[];
  } | null>(null);

  const products = data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const costOf = (p: Product) => p.unit_price ?? 0;
  const qtyOf = (p: Product) => p.current_quantity ?? 0;
  const totalValue = products.reduce((s, p) => s + qtyOf(p) * costOf(p), 0);

  async function doDelete(p: Product, removeFromDishes: boolean) {
    setDeletingId(p.id_product);
    try {
      await deleteProduct(p.id_product, removeFromDishes);
      notify('Item excluído.');
      setConfirmDelete(null);
      setDishConflict(null);
      await reload();
    } catch (err) {
      // O item está em uso numa ficha técnica: abre o modal perguntando se
      // deve remover o ingrediente do(s) prato(s) antes de excluir.
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 409 &&
        (err.response.data as { code?: string })?.code === 'PRODUCT_IN_DISHES'
      ) {
        const dishes =
          (err.response.data as { dishes?: { id_recipe_dish: string; name_dish: string }[] })
            .dishes ?? [];
        setConfirmDelete(null);
        setDishConflict({ product: p, dishes });
        return;
      }
      notify(getApiErrorMessage(err), '⚠');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card" style={{ background: 'var(--brown)', borderLeft: 'none' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Total de Itens
          </div>
          <div className="stat-value" style={{ color: '#fff', fontSize: 'var(--fs-4xl)' }}>
            {products.length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: 'none', borderBottom: '3px solid var(--gold)' }}>
          <div className="stat-label">Valor Total Estoque (custo)</div>
          <div className="stat-value" style={{ fontSize: 'var(--fs-4xl)' }}>
            {formatBRL(totalValue)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Itens Cadastrados</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {onManageSuppliers && (
              <button type="button" className="btn btn-ghost" onClick={onManageSuppliers}>
                <IconUsers /> Fornecedores
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPurchaseOpen(true)}
            >
              <IconPlus /> Lançar compra
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setProductModal({ editing: null })}
            >
              <IconPlus /> Novo item
            </button>
          </div>
        </div>

        <AsyncState
          loading={loading}
          error={error}
          empty={products.length === 0}
          emptyText="Nenhum item cadastrado. Use “Novo item” ou “Lançar compra”."
          onRetry={reload}
        />

        {!loading && !error && products.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ingrediente / Produto</th>
                <th>Fornecedor</th>
                <th>Tipo</th>
                <th>Qtd.</th>
                <th>Custo un.</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const q = qtyOf(p);
                const low = q <= (p.minimum_quantity ?? 0);
                const c = costOf(p);
                return (
                  <tr key={p.id_product}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <span className="badge badge-gray">{p.supplier?.name ?? 'Nenhum'}</span>
                    </td>
                    <td>
                      <span className="badge badge-gold">{p.type ?? 'INGREDIENTE'}</span>
                    </td>
                    <td style={{ color: low ? 'var(--red)' : undefined, fontWeight: low ? 700 : 400 }}>
                      {q} {p.unit_measurement}
                    </td>
                    <td>{formatBRL(c)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setProductModal({ editing: p })}
                      >
                        <IconEdit />
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirmDelete(p)}
                        disabled={deletingId === p.id_product}
                        title="Excluir item"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {productModal && (
        <ProductModal
          editing={productModal.editing}
          products={products}
          suppliers={suppliers}
          onClose={() => setProductModal(null)}
          onSaved={reload}
          onSuppliersChanged={suppliersQuery.reload}
        />
      )}

      {purchaseOpen && (
        <PurchaseModal
          open={purchaseOpen}
          suppliers={suppliers}
          onClose={() => setPurchaseOpen(false)}
          onSaved={reload}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          title="Excluir item"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => void doDelete(confirmDelete, false)}
                disabled={deletingId === confirmDelete.id_product}
              >
                {deletingId === confirmDelete.id_product ? 'Excluindo…' : 'Excluir'}
              </button>
            </>
          }
        >
          <div className="confirm-body">
            <span className="confirm-icon">
              <IconTrash width={22} height={22} />
            </span>
            <div className="confirm-text">
              <p>
                Deseja excluir o item <strong>{confirmDelete.name}</strong>?
              </p>
              <p className="confirm-hint">Esta ação não pode ser desfeita.</p>
            </div>
          </div>
        </Modal>
      )}

      {dishConflict && (
        <Modal
          open
          title="Item em uso no cardápio"
          onClose={() => setDishConflict(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDishConflict(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => void doDelete(dishConflict.product, true)}
                disabled={deletingId === dishConflict.product.id_product}
              >
                {deletingId === dishConflict.product.id_product
                  ? 'Removendo…'
                  : 'Remover e excluir'}
              </button>
            </>
          }
        >
          <div className="confirm-body">
            <span className="confirm-icon confirm-icon--warn">
              <IconClipboard width={22} height={22} />
            </span>
            <div className="confirm-text">
              {dishConflict.dishes.length === 1 ? (
                <p>
                  O item <strong>{dishConflict.product.name}</strong> é ingrediente do prato{' '}
                  <strong>{dishConflict.dishes[0].name_dish}</strong>. Deseja remover o
                  ingrediente desse prato e excluir o item?
                </p>
              ) : (
                <>
                  <p>
                    O item <strong>{dishConflict.product.name}</strong> é ingrediente de{' '}
                    {dishConflict.dishes.length} pratos:
                  </p>
                  <ul className="confirm-list">
                    {dishConflict.dishes.map((d) => (
                      <li key={d.id_recipe_dish}>{d.name_dish}</li>
                    ))}
                  </ul>
                  <p>Deseja remover o ingrediente desses pratos e excluir o item?</p>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
