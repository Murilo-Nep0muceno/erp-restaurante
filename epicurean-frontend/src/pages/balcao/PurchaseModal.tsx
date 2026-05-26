import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNotif } from '../../store/notifContext';
import { createPurchase } from '../../services/purchase.service';
import { getApiErrorMessage } from '../../services/api';
import type { CreatePurchaseInput, PurchaseItemInput, Supplier } from '../../types';
import Modal from '../../components/Modal';
import { IconPlus, IconTrash } from '../../components/icons';
import { formatBRL } from '../../lib/format';

const UNITS = ['kg', 'g', 'l', 'ml', 'un', 'cx', 'pct'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PurchaseModalProps {
  open: boolean;
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}

export default function PurchaseModal({ open, suppliers, onClose, onSaved }: PurchaseModalProps) {
  const { notify } = useNotif();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [date, setDate] = useState(today);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id_supplier ?? '');
  const [items, setItems] = useState<PurchaseItemInput[]>([]);

  const total = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { name: '', unit_price: 0, quantity: 1, unit_measurement: 'un' },
    ]);
  }

  function updateItem(idx: number, patch: Partial<PurchaseItemInput>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      setFormError('Selecione um fornecedor.');
      return;
    }
    if (items.length === 0) {
      setFormError('Adicione ao menos um item.');
      return;
    }
    if (items.some((it) => !it.name.trim())) {
      setFormError('Dê um nome a todos os itens.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: CreatePurchaseInput = {
      id_supplier: supplierId,
      date,
      items: items.map((it) => ({
        name: it.name.trim(),
        unit_measurement: it.unit_measurement,
        unit_price: Number(it.unit_price),
        quantity: Number(it.quantity),
      })),
    };
    try {
      await createPurchase(payload);
      notify('Compra registrada.');
      setItems([]);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Registrar compra" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {formError && (
          <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
            {formError}
          </div>
        )}

        {suppliers.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)' }}>
            É preciso ter ao menos um fornecedor cadastrado para lançar uma compra.
          </p>
        ) : (
          <>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Fornecedor</label>
                <select
                  className="form-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id_supplier} value={s.id_supplier}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Itens da compra
                </label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                  <IconPlus /> Item
                </button>
              </div>

              {items.length === 0 && (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginTop: 8 }}>
                  Clique em “+ Item” para adicionar o que foi comprado.
                </p>
              )}

              <div className="purchase-items">
                {items.length > 0 && (
                  <div className="purchase-items-row purchase-items-head">
                    <span>Item</span>
                    <span>Qtd.</span>
                    <span>Preço un. (R$)</span>
                    <span>Un.</span>
                    <span />
                  </div>
                )}

                {items.map((item, idx) => (
                  <div key={idx} className="purchase-items-row">
                    <input
                      className="form-input"
                      placeholder="Ex.: Leite"
                      value={item.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                    />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="form-input"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                    />
                    <select
                      className="form-select"
                      value={item.unit_measurement}
                      onChange={(e) => updateItem(idx, { unit_measurement: e.target.value })}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(idx)}>
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-subtotal">
              <span>Total</span>
              <span className="cart-subtotal-val">{formatBRL(total)}</span>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || suppliers.length === 0}>
            {saving ? 'Registrando…' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
