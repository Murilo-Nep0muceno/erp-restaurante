import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNotif } from '../../store/notifContext';
import { createProduct, updateProduct } from '../../services/product.service';
import { createSupplier } from '../../services/supplier.service';
import { getApiErrorMessage } from '../../services/api';
import type { CreateProductInput, Product, Supplier } from '../../types';
import Modal from '../../components/Modal';
import { formatBRL } from '../../lib/format';
import styles from './ProductModal.module.css';

const UNITS = ['kg', 'g', 'l', 'ml', 'un', 'cx', 'pct'];
const TYPES = [
  { value: 'INGREDIENTE', label: 'Ingrediente (entra na ficha técnica)' },
  { value: 'INSUMO', label: 'Insumo (descartáveis, limpeza, embalagem)' },
  { value: 'PRODUTO', label: 'Produto (item finalizado vendido)' },
];

interface ProductModalProps {
  editing: Product | null;
  products: Product[];
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
  onSuppliersChanged: () => void;
}

export default function ProductModal({
  editing,
  products,
  suppliers,
  onClose,
  onSaved,
  onSuppliersChanged,
}: ProductModalProps) {
  const { notify } = useNotif();

  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState(editing?.type ?? 'INGREDIENTE');
  const [unit, setUnit] = useState(editing?.unit_measurement ?? 'un');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [minQty, setMinQty] = useState<number | ''>(editing?.minimum_quantity ?? '');
  const [selling, setSelling] = useState<number | ''>(editing?.selling_price ?? '');
  const [expiry, setExpiry] = useState(editing?.expiry_date ?? '');
  const [supplierId, setSupplierId] = useState(editing?.id_supplier ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(Boolean(editing?.notes));
  const [newSupplier, setNewSupplier] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(editing);
  const isProduct = type === 'PRODUTO';

  const allSuppliers = useMemo(() => {
    const extra = localSuppliers.filter(
      (l) => !suppliers.some((s) => s.id_supplier === l.id_supplier),
    );
    return [...suppliers, ...extra];
  }, [suppliers, localSuppliers]);

  // Aviso de duplicata: no cadastro, nome igual a um item existente vira
  // top-up (a qtd inicial soma ao estoque do item já cadastrado).
  const duplicate = useMemo(() => {
    if (isEdit) return null;
    const v = name.trim().toLowerCase();
    if (v.length < 2) return null;
    return products.find((p) => p.name.toLowerCase() === v) ?? null;
  }, [name, products, isEdit]);

  const costNum = cost === '' ? 0 : Number(cost);
  const sellNum = selling === '' ? 0 : Number(selling);
  const profit = sellNum - costNum;
  const marginPct = costNum > 0 ? (profit / costNum) * 100 : null;

  async function handleCreateSupplier() {
    const nm = newSupplier.trim();
    if (nm.length < 2) {
      setError('Nome do fornecedor muito curto.');
      return;
    }
    setCreatingSupplier(true);
    setError('');
    try {
      const created = await createSupplier({ name: nm });
      setLocalSuppliers((prev) => [...prev, created]);
      setSupplierId(created.id_supplier);
      setNewSupplier('');
      onSuppliersChanged();
      notify('Fornecedor cadastrado.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingSupplier(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Informe um nome com ao menos 2 caracteres.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: CreateProductInput = {
      name: name.trim(),
      unit_measurement: unit,
      type,
      minimum_quantity: minQty === '' ? 0 : Number(minQty),
      selling_price: isProduct && selling !== '' ? Number(selling) : null,
      notes: notes.trim() || null,
      expiry_date: expiry || null,
    };

    if (!isEdit) {
      payload.current_quantity = quantity === '' ? 0 : Number(quantity);
      payload.unit_price = cost === '' ? null : Number(cost);
      payload.id_supplier = supplierId || null;
    }

    try {
      if (editing) {
        await updateProduct(editing.id_product, payload);
        notify('Item atualizado.');
      } else if (duplicate) {
        await createProduct(payload);
        notify('Quantidade somada ao item existente.');
      } else {
        await createProduct(payload);
        notify('Item cadastrado no catálogo.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={isEdit ? 'Editar item' : 'Cadastrar item no catálogo'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* IDENTIFICAÇÃO */}
        <div className="form-group">
          <label className="form-label">Nome do item *</label>
          <input
            className="form-input"
            placeholder="Ex.: Farinha de trigo tipo 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isEdit}
          />
          {duplicate && (
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--gold)', marginTop: 4, display: 'block' }}>
              Já existe “{duplicate.name}” no estoque — a quantidade inicial será somada a ele.
            </span>
          )}
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Tipo *</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unidade de medida *</label>
            <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ESTOQUE INICIAL */}
        {isEdit ? (
          <div className="info-grid">
            <div>
              <div className="info-label">Qtd. em estoque</div>
              <div className="info-value">
                {editing?.current_quantity} {editing?.unit_measurement}
              </div>
            </div>
            <div>
              <div className="info-label">Custo un. (CMP)</div>
              <div className="info-value">{formatBRL(editing?.unit_price ?? 0)}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Quantidade inicial</label>
                <div className={styles.qtyGroup}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <span className={styles.qtyUnit}>{unit}</span>
                </div>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  Deixe 0 se ainda não tem em estoque. Você pode lançar entrada depois.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Custo unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="form-input"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  Usado para calcular valor de estoque e margem.
                </span>
              </div>
            </div>
          </>
        )}

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Qtd. mínima (alerta)</label>
            <div className={styles.qtyGroup}>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                className="form-input"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className={styles.qtyUnit}>{unit}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Data de validade</label>
            <input
              type="date"
              className="form-input"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
              Opcional. Deixe em branco se não se aplica.
            </span>
          </div>
        </div>

        {isProduct && (
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Preço de venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="form-input"
                value={selling}
                onChange={(e) => setSelling(e.target.value === '' ? '' : Number(e.target.value))}
              />
              {selling !== '' && marginPct != null && (
                <span
                  style={{
                    fontSize: 'var(--fs-sm)',
                    marginTop: 4,
                    display: 'block',
                    color: profit >= 0 ? 'var(--green, #2e7d32)' : 'var(--red)',
                  }}
                >
                  Margem {marginPct.toFixed(0)}% · lucro {formatBRL(profit)} por {unit}
                </span>
              )}
            </div>
          </div>
        )}

        {/* FORNECEDOR PADRÃO (colapsável, só no cadastro) */}
        {!isEdit && (
          <div>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => setSupplierOpen((v) => !v)}
              aria-expanded={supplierOpen}
            >
              <span className={styles.chevron}>{supplierOpen ? '▾' : '▸'}</span>
              <span className={styles.label}>Fornecedor padrão</span>
              <span className={styles.optional}>opcional</span>
            </button>
            {supplierOpen && (
              <div className={styles.panel}>
                <select
                  className="form-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {allSuppliers.map((s) => (
                    <option key={s.id_supplier} value={s.id_supplier}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className={styles.newSupplierRow}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Cadastrar novo fornecedor (só o nome)"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCreateSupplier}
                    disabled={creatingSupplier || newSupplier.trim().length < 2}
                  >
                    {creatingSupplier ? '…' : 'Criar'}
                  </button>
                </div>
                <span className={styles.helper}>
                  Opcional. Você pode vincular um fornecedor agora ou deixar pra depois.
                </span>
              </div>
            )}
          </div>
        )}

        {/* OBSERVAÇÕES (colapsável) */}
        <div>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setNotesOpen((v) => !v)}
            aria-expanded={notesOpen}
          >
            <span className={styles.chevron}>{notesOpen ? '▾' : '▸'}</span>
            <span className={styles.label}>Observações</span>
            <span className={styles.optional}>opcional</span>
          </button>
          {notesOpen && (
            <div className={styles.panel}>
              <textarea
                className="form-textarea"
                placeholder="Anotações livres sobre o item…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
