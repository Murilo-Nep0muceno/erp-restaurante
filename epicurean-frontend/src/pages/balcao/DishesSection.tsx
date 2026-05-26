import { useState } from 'react';
import type { FormEvent } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useNotif } from '../../store/notifContext';
import { deleteDish, getDishes } from '../../services/dish.service';
import { getProducts } from '../../services/product.service';
import { getApiErrorMessage } from '../../services/api';
import { recordLog } from '../../services/log.service';
import { addCategory, allCategories } from '../../lib/categories';
import { formatBRL } from '../../lib/format';
import type { RecipeDish } from '../../types';
import AsyncState from '../../components/AsyncState';
import Modal from '../../components/Modal';
import DishModal from './DishModal';
import { IconClipboard, IconEdit, IconPlus, IconTrash } from '../../components/icons';
import styles from './DishesSection.module.css';

export default function DishesSection() {
  const dishesQ = useFetch(getDishes);
  const productsQ = useFetch(getProducts);
  const { notify } = useNotif();
  const [cat, setCat] = useState('Todas');
  const [, bumpCat] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecipeDish | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCat, setNewCat] = useState('');

  const dishes = dishesQ.data ?? [];
  const products = productsQ.data ?? [];
  const cats = allCategories(dishes.map((d) => d.category));
  const filtered = cat === 'Todas' ? dishes : dishes.filter((d) => (d.category ?? '') === cat);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(d: RecipeDish) {
    setEditing(d);
    setModalOpen(true);
  }
  function handleNewCategory() {
    setNewCat('');
    setCatModalOpen(true);
  }
  function confirmNewCategory(e: FormEvent) {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    addCategory(name);
    bumpCat((v) => v + 1);
    notify('Categoria adicionada.');
    setCatModalOpen(false);
  }
  async function handleDelete(d: RecipeDish) {
    if (!window.confirm(`Excluir o prato "${d.name_dish}"?`)) return;
    try {
      await deleteDish(d.id_recipe_dish);
      recordLog(`Excluiu o prato "${d.name_dish}"`);
      notify('Prato excluído.');
      await dishesQ.reload();
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    }
  }
  async function handleSaved() {
    recordLog(editing ? 'Editou um prato do cardápio' : 'Cadastrou um prato no cardápio');
    await Promise.all([dishesQ.reload(), productsQ.reload()]);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {['Todas', ...cats].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.tab}${cat === c ? ' ' + styles.active : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={handleNewCategory}>
            <IconPlus /> Nova Categoria
          </button>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <IconPlus /> Novo Prato
          </button>
        </div>
      </div>

      <AsyncState
        loading={dishesQ.loading}
        error={dishesQ.error}
        empty={dishes.length === 0}
        emptyText="Cadastre seu primeiro prato no cardápio."
        onRetry={dishesQ.reload}
      />

      {!dishesQ.loading && !dishesQ.error && dishes.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((d) => {
            const items = d.dish ?? [];
            return (
              <div className={styles.card} key={d.id_recipe_dish}>
                <div className={styles.imgWrap}>
                  {d.image ? <img src={d.image} alt={d.name_dish} /> : <div className={styles.imgPh}>🍽</div>}
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.iconBtn} onClick={() => openEdit(d)} aria-label="Editar">
                      <IconEdit width={17} height={17} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => handleDelete(d)}
                      aria-label="Excluir"
                    >
                      <IconTrash width={17} height={17} />
                    </button>
                  </div>
                  <div className={styles.ficha}>
                    <div className={styles.fichaTitle}>Ficha Técnica</div>
                    {items.length === 0 ? (
                      <div className={styles.fichaItem}>Sem ficha técnica (produto pronto).</div>
                    ) : (
                      items.map((it) => (
                        <div className={styles.fichaItem} key={it.id_dish}>
                          • {it.quantity} {it.unit_measurement} — {it.product?.name ?? 'Ingrediente'}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className={styles.body}>
                  <div className={styles.row}>
                    <span className={styles.name}>{d.name_dish}</span>
                    <span className={styles.price}>{formatBRL(d.selling_price_dish)}</span>
                  </div>
                  <p className={styles.desc}>{d.description_dish}</p>
                  <div className={styles.badges}>
                    {d.category && <span className="badge badge-gray">{d.category}</span>}
                    <span className={styles.countBadge}>
                      <IconClipboard /> {items.length} ing.
                    </span>
                    {!d.available_dish && <span className="badge badge-red">Indisponível</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <DishModal
          key={editing?.id_recipe_dish ?? 'new'}
          editing={editing}
          products={products}
          categories={cats}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {catModalOpen && (
        <Modal
          open
          title="Nova categoria"
          onClose={() => setCatModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCatModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="new-cat-form"
                className="btn btn-primary"
                disabled={!newCat.trim()}
              >
                Adicionar
              </button>
            </>
          }
        >
          <form id="new-cat-form" onSubmit={confirmNewCategory}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-cat-input">
                Nome da categoria
              </label>
              <input
                id="new-cat-input"
                className="form-input"
                placeholder="Ex.: Sobremesas"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
