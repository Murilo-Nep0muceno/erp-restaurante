import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createDish, updateDish } from '../../services/dish.service';
import { getApiErrorMessage } from '../../services/api';
import { useNotif } from '../../store/notifContext';
import type { CreateRecipeDishInput, Product, RecipeDish } from '../../types';
import { IconImage, IconPlus, IconTrash } from '../../components/icons';
import { formatBRL } from '../../lib/format';
import { ALL_UNITS, compatibleUnits, convertQty } from '../../lib/units';
import styles from './DishModal.module.css';

interface FichaItem {
  name: string;
  qty: number;
  unit: string; // unidade usada na receita (ex.: g)
  baseUnit: string; // unidade do item no estoque (ex.: kg)
  id_product?: string;
  unitPrice: number; // preço por baseUnit
}

interface DishModalProps {
  // Mount only while open (via key in the parent) — initial state comes from props.
  editing: RecipeDish | null;
  products: Product[];
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

const FICHA_RULE = 'Ficha Técnica';
const READY_RULE = 'Produto Pronto';

export default function DishModal({
  editing,
  products,
  categories,
  onClose,
  onSaved,
}: DishModalProps) {
  const { notify } = useNotif();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editing?.name_dish ?? '');
  const [price, setPrice] = useState<number | ''>(editing?.selling_price_dish ?? '');
  const [serves, setServes] = useState<number | ''>(editing?.serves ?? '');
  const [category, setCategory] = useState(editing?.category ?? categories[0] ?? '');
  const [controlRule, setControlRule] = useState(editing?.control_rule ?? FICHA_RULE);
  const [description, setDescription] = useState(editing?.description_dish ?? '');
  const [image, setImage] = useState<string | null>(editing?.image ?? null);
  const [ficha, setFicha] = useState<FichaItem[]>(() =>
    (editing?.dish ?? []).map((d) => ({
      name: d.product?.name ?? 'Ingrediente',
      qty: d.quantity,
      unit: d.unit_measurement,
      baseUnit: d.product?.unit_measurement ?? d.unit_measurement,
      id_product: d.id_product,
      unitPrice: d.product?.unit_price ?? 0,
    })),
  );
  const [ingSelect, setIngSelect] = useState('');
  const [ingName, setIngName] = useState('');
  const [ingUnit, setIngUnit] = useState('un');
  const [ingQty, setIngQty] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasStock = products.length > 0;
  const typingNew = !hasStock || ingSelect === '__new__';
  const selectedStock =
    hasStock && ingSelect && ingSelect !== '__new__'
      ? products.find((p) => p.name === ingSelect)
      : undefined;
  const unitOptions = selectedStock ? compatibleUnits(selectedStock.unit_measurement) : ALL_UNITS;

  // Custo só dos ingredientes (CMV): para cada item, converte a qtd da receita
  // para a unidade do estoque e multiplica pelo preço unitário.
  const itemCost = (i: FichaItem) => convertQty(i.qty, i.unit, i.baseUnit) * i.unitPrice;
  const ingredientCost = ficha.reduce((s, i) => s + itemCost(i), 0);
  const sellPrice = Number(price) || 0;
  const profit = sellPrice - ingredientCost;
  const cmvPct = sellPrice > 0 ? (ingredientCost / sellPrice) * 100 : 0;
  const hasUnpriced = ficha.some((i) => !i.unitPrice);

  const isFicha = controlRule === FICHA_RULE;

  function findStock(value: string): Product | undefined {
    const v = value.trim().toLowerCase();
    return products.find((p) => p.name.toLowerCase() === v);
  }

  function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function selectIngredient(value: string) {
    setIngSelect(value);
    if (value && value !== '__new__') {
      const p = products.find((pp) => pp.name === value);
      if (p) setIngUnit(p.unit_measurement);
    } else {
      setIngUnit('un');
    }
  }

  function addIngredient() {
    const qty = Number(ingQty);
    const chosen = (typingNew ? ingName : ingSelect).trim();
    if (!chosen || !qty || qty <= 0) return;
    const stock = findStock(chosen);
    // base = unidade do estoque (item existente) ou a unidade escolhida (item novo).
    const baseUnit = stock?.unit_measurement ?? ingUnit;
    setFicha((f) => [
      ...f,
      {
        name: stock?.name ?? chosen,
        qty,
        unit: ingUnit || baseUnit,
        baseUnit,
        id_product: stock?.id_product,
        unitPrice: stock?.unit_price ?? 0,
      },
    ]);
    setIngSelect('');
    setIngName('');
    setIngUnit('un');
    setIngQty('');
  }

  function removeIngredient(idx: number) {
    setFicha((f) => f.filter((_, i) => i !== idx));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Informe o nome do prato.');
    if (!price || Number(price) <= 0) return setError('Informe um valor de venda válido.');

    setSaving(true);
    try {
      let dishes: CreateRecipeDishInput['dishes'] = [];

      if (isFicha && ficha.length > 0) {
        const items = [...ficha];
        const novos = items.filter((i) => !i.id_product);

        // Ingredients now originate from purchases — they can't be invented
        // here. Block and point the user to the Compras flow.
        if (novos.length > 0) {
          setSaving(false);
          setError(
            'Estes ingredientes ainda não estão no estoque: ' +
              novos.map((n) => n.name).join(', ') +
              '. Registre-os via Compras antes de usá-los na ficha.',
          );
          return;
        }

        dishes = items.map((i) => ({
          id_product: i.id_product!,
          quantity: i.qty,
          unit_measurement: i.unit,
        }));
      }

      const payload: CreateRecipeDishInput = {
        name_dish: name.trim(),
        description_dish: description.trim() || '—',
        selling_price_dish: Number(price),
        available_dish: true,
        image,
        category: category || null,
        serves: Number(serves) || null,
        control_rule: controlRule,
        dishes,
      };

      if (editing) {
        await updateDish(editing.id_recipe_dish, payload);
        notify('Prato atualizado.');
      } else {
        await createDish(payload);
        notify('Prato salvo no cardápio.');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className="modal-title">{editing ? 'Editar Prato' : 'Adicionar Prato'}</h2>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-400)' }}>
              Informações para o cardápio e Ficha Técnica.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className={styles.grid}>
            {/* coluna esquerda — dados + ficha */}
            <div>
              <div className="form-group">
                <label className="form-label">Nome do prato / produto</label>
                <input
                  className="form-input"
                  placeholder="Ex: Pizza Margherita"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Valor venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rendimento (pessoas)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="form-input"
                    value={serves}
                    onChange={(e) => setServes(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Regra de estoque</label>
                  <select
                    className="form-select"
                    value={controlRule}
                    onChange={(e) => setControlRule(e.target.value)}
                  >
                    <option value={FICHA_RULE}>Ficha Técnica (usa ingredientes)</option>
                    <option value={READY_RULE}>Produto Pronto (sem baixa)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição para o cardápio</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ingredientes e detalhes que o cliente verá…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {isFicha && (
                <>
                  <div className={styles.fichaTitle}>
                    <IconImage width={18} height={18} /> Construir Ficha Técnica
                  </div>
                  <div className={styles.fichaRow}>
                    <div>
                      <label className="form-label">Ingrediente</label>
                      {hasStock ? (
                        <select
                          className="form-select"
                          value={ingSelect}
                          onChange={(e) => selectIngredient(e.target.value)}
                        >
                          <option value="">Escolha do estoque…</option>
                          {products.map((p) => (
                            <option key={p.id_product} value={p.name}>
                              {p.name} ({p.unit_measurement})
                            </option>
                          ))}
                          <option value="__new__">+ Outro (novo ingrediente)</option>
                        </select>
                      ) : (
                        <input
                          className="form-input"
                          placeholder="Digite o ingrediente…"
                          value={ingName}
                          onChange={(e) => setIngName(e.target.value)}
                        />
                      )}
                    </div>
                    <div>
                      <label className="form-label">Qtd.</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="Ex: 200"
                        value={ingQty}
                        onChange={(e) => setIngQty(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Un.</label>
                      <select
                        className="form-select"
                        value={ingUnit}
                        onChange={(e) => setIngUnit(e.target.value)}
                      >
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ height: 41, justifyContent: 'center' }}
                      onClick={addIngredient}
                      aria-label="Adicionar ingrediente"
                    >
                      <IconPlus />
                    </button>
                  </div>

                  {hasStock && typingNew && (
                    <input
                      className="form-input"
                      style={{ marginTop: 8 }}
                      placeholder="Nome do novo ingrediente (será criado no estoque)"
                      value={ingName}
                      onChange={(e) => setIngName(e.target.value)}
                    />
                  )}

                  <div className={styles.fichaList}>
                    {ficha.length === 0 ? (
                      <div className={styles.fichaEmpty}>Nenhum ingrediente adicionado à receita.</div>
                    ) : (
                      ficha.map((item, idx) => (
                        <div className={styles.fichaItem} key={idx}>
                          <span>
                            {item.name} — {item.qty} {item.unit}
                            {!item.id_product && (
                              <span className="badge badge-orange" style={{ marginLeft: 8 }}>
                                novo
                              </span>
                            )}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>
                              {formatBRL(itemCost(item))}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => removeIngredient(idx)}
                            >
                              <IconTrash />
                            </button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={styles.costBox}>
                    <div className={styles.costRow}>
                      <span>Custo de ingredientes (CMV)</span>
                      <strong>{formatBRL(ingredientCost)}</strong>
                    </div>
                    {sellPrice > 0 && (
                      <>
                        <div className={styles.costRow}>
                          <span>Preço de venda</span>
                          <span>{formatBRL(sellPrice)}</span>
                        </div>
                        <div className={styles.costRow}>
                          <span>Margem (lucro por unidade)</span>
                          <strong style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {formatBRL(profit)}
                          </strong>
                        </div>
                        <div className={styles.costRow}>
                          <span>CMV (custo sobre a venda)</span>
                          <span>{cmvPct.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                    {hasUnpriced && (
                      <p className={styles.costHint}>
                        Alguns ingredientes estão sem preço unitário no estoque — o custo deles conta
                        como R$ 0,00.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* coluna direita — imagem */}
            <div>
              <label className="form-label">Fotografia principal</label>
              <div
                className={styles.dropzone}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                {image ? (
                  <>
                    <img src={image} alt="Prévia do prato" />
                    <button
                      type="button"
                      className={`btn btn-red btn-sm ${styles.removeImg}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                      }}
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <>
                    <IconImage width={40} height={40} />
                    <span className={styles.dropTitle}>Carregar Imagem</span>
                    <span style={{ fontSize: 'var(--fs-sm)' }}>Clique para selecionar do computador</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImage}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar no Cardápio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
