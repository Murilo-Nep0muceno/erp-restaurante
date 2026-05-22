import { useState } from 'react';
import type { FormEvent } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useNotif } from '../../store/notifContext';
import {
  createProduct,
  deleteProduct,
  getPendingPurchases,
  getProducts,
  updateProduct,
} from '../../services/product.service';
import { getApiErrorMessage } from '../../services/api';
import type {
  CreateProductInput,
  PendingPurchasedItem,
  Product,
  UnitMeasurement,
} from '../../types';
import Modal from '../../components/Modal';
import AsyncState from '../../components/AsyncState';
import { IconEdit, IconPlus, IconTrash, IconUsers } from '../../components/icons';
import { formatBRL } from '../../lib/format';

const UNITS: UnitMeasurement[] = ['kg', 'g', 'l', 'ml', 'un'];
const TYPES = ['INGREDIENTE', 'PRODUTO FINAL'];

interface ProductForm {
  unit_measurement: string;
  minimum_quantity: number | '';
  selling_price: number | '';
  type: string;
}

const emptyForm: ProductForm = {
  unit_measurement: 'un',
  minimum_quantity: '',
  selling_price: '',
  type: 'INGREDIENTE',
};

interface ProductsSectionProps {
  onManageSuppliers?: () => void;
}

export default function ProductsSection({ onManageSuppliers }: ProductsSectionProps) {
  const { data, loading, error, reload } = useFetch(getProducts);
  const pendingQ = useFetch(getPendingPurchases);
  const { notify } = useNotif();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selected, setSelected] = useState<PendingPurchasedItem | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const products = data ?? [];
  const pending = pendingQ.data ?? [];

  const costOf = (p: Product) => p.unit_price ?? 0;
  const qtyOf = (p: Product) => p.current_quantity ?? 0;
  const totalValue = products.reduce((s, p) => s + qtyOf(p) * costOf(p), 0);

  // Cost / quantity / supplier are owned by the purchase: from the selected
  // pending item when creating, or from the persisted product when editing.
  const cost = editing ? costOf(editing) : selected?.cost ?? 0;
  const quantity = editing ? qtyOf(editing) : selected?.quantity ?? 0;
  const supplierName = editing
    ? editing.supplier?.name ?? '—'
    : selected?.supplierName ?? '—';

  const sellingNum = form.selling_price === '' ? 0 : Number(form.selling_price);
  const profit = sellingNum - cost;
  const marginPct = cost > 0 ? (profit / cost) * 100 : null;

  function openCreate() {
    setEditing(null);
    setSelected(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  function selectPending(name: string) {
    const item = pending.find((p) => p.name === name) ?? null;
    setSelected(item);
    setForm((f) => ({
      ...f,
      unit_measurement: item?.unit_measurement ?? f.unit_measurement,
    }));
  }

  function openEdit(p: Product) {
    setEditing(p);
    setSelected(null);
    setForm({
      unit_measurement: p.unit_measurement,
      minimum_quantity: p.minimum_quantity ?? '',
      selling_price: p.selling_price ?? '',
      type: p.type ?? 'INGREDIENTE',
    });
    setFormError('');
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing && !selected) {
      setFormError('Escolha um item comprado.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: CreateProductInput = {
      name: editing ? editing.name : (selected as PendingPurchasedItem).name,
      unit_measurement: form.unit_measurement,
      minimum_quantity: Number(form.minimum_quantity) || 0,
      selling_price: form.selling_price === '' ? null : Number(form.selling_price),
      type: form.type,
    };
    try {
      if (editing) {
        await updateProduct(editing.id_product, payload);
        notify('Item atualizado.');
      } else {
        await createProduct(payload);
        notify('Item cadastrado a partir da compra.');
      }
      setOpen(false);
      await Promise.all([reload(), pendingQ.reload()]);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`Excluir o item "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id_product);
      notify('Item excluído.');
      await reload();
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
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
              className="btn btn-gold"
              onClick={openCreate}
              disabled={pending.length === 0}
            >
              <IconPlus /> Novo Item
            </button>
          </div>
        </div>

        {pending.length === 0 && (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginBottom: 12 }}>
            Para cadastrar um item, registre uma compra na aba Compras — o item nasce da compra.
          </p>
        )}

        <AsyncState
          loading={loading}
          error={error}
          empty={products.length === 0}
          emptyText="Nenhum item cadastrado. Comece registrando uma compra."
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
                <th>Preço venda</th>
                <th>Margem</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const q = qtyOf(p);
                const low = q <= (p.minimum_quantity ?? 0);
                const c = costOf(p);
                const sell = p.selling_price ?? null;
                const margin = sell != null && c > 0 ? ((sell - c) / c) * 100 : null;
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
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>
                      {sell != null ? formatBRL(sell) : '—'}
                    </td>
                    <td>{margin != null ? `${margin.toFixed(0)}%` : '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                        <IconEdit />
                      </button>{' '}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(p)}>
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

      <Modal open={open} title={editing ? 'Editar item' : 'Novo item'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          {!editing && (
            <div className="form-group">
              <label className="form-label">Item comprado</label>
              <select
                className="form-select"
                value={selected?.name ?? ''}
                onChange={(e) => selectPending(e.target.value)}
              >
                <option value="" disabled>
                  Selecione um item comprado…
                </option>
                {pending.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} — {p.supplierName ?? 'sem fornecedor'} ({p.quantity} {p.unit_measurement})
                  </option>
                ))}
              </select>
            </div>
          )}

          {editing && (
            <div className="form-group">
              <label className="form-label">Item</label>
              <input className="form-input" value={editing.name} disabled />
            </div>
          )}

          {/* Read-only data that comes from the purchase. */}
          {(editing || selected) && (
            <div className="info-grid">
              <div>
                <div className="info-label">Fornecedor</div>
                <div className="info-value">{supplierName}</div>
              </div>
              <div>
                <div className="info-label">Custo un. (compra)</div>
                <div className="info-value">{formatBRL(cost)}</div>
              </div>
              <div>
                <div className="info-label">
                  {editing ? 'Qtd. em estoque' : 'Qtd. comprada'}
                </div>
                <div className="info-value">
                  {quantity} {form.unit_measurement}
                </div>
              </div>
            </div>
          )}

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unidade de medida</label>
              <select
                className="form-select"
                value={form.unit_measurement}
                onChange={(e) => setForm({ ...form, unit_measurement: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Quantidade mínima (alerta)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                className="form-input"
                value={form.minimum_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimum_quantity: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preço de venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="form-input"
                value={form.selling_price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    selling_price: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
              {form.selling_price !== '' && marginPct != null && (
                <span
                  style={{
                    fontSize: 'var(--fs-sm)',
                    marginTop: 4,
                    display: 'block',
                    color: profit >= 0 ? 'var(--green, #2e7d32)' : 'var(--red)',
                  }}
                >
                  Margem {marginPct.toFixed(0)}% · lucro {formatBRL(profit)} por {form.unit_measurement}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
