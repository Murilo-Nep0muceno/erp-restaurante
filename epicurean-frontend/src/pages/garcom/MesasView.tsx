import { useState } from 'react';
import { useOrders } from '../../store/orderContext';
import { useNotif } from '../../store/notifContext';
import Modal from '../../components/Modal';
import { formatBRL } from '../../lib/format';
import { IconTable, IconClipboard, IconTrash } from '../../components/icons';

interface MesasViewProps {
  onOpenComanda: (num: number) => void;
}

type Step = 'menu' | 'move' | 'merge' | 'pay';

export default function MesasView({ onOpenComanda }: MesasViewProps) {
  const { tables, orders, removeTable, moveTable, closeTable, kitchenClosed } = useOrders();
  const { notify } = useNotif();
  const [modalTable, setModalTable] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('menu');
  const [people, setPeople] = useState(1);

  // Ocupação é derivada dos pedidos (uma mesa pode ter várias comandas).
  const openOrders = (num: number) =>
    orders.filter((o) => o.tableNum === num && o.status !== 'delivered');
  const isOccupied = (num: number) => openOrders(num).length > 0;
  const tableTotal = (num: number) =>
    openOrders(num).reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + it.price * it.qty, 0),
      0,
    );

  function openModal(num: number) {
    setModalTable(num);
    setStep('menu');
    setPeople(1);
  }

  function closeModal() {
    setModalTable(null);
    setStep('menu');
  }

  function handleRemove(num: number) {
    if (isOccupied(num)) {
      notify('Mesa com comanda ativa não pode ser excluída.', '⚠');
      return;
    }
    if (!window.confirm(`Excluir a Mesa ${String(num).padStart(2, '0')}?`)) return;
    removeTable(num);
    closeModal();
  }

  async function handleMove(target: number) {
    if (modalTable == null) return;
    const res = await moveTable(modalTable, target);
    if (res.ok) {
      notify(
        `Comanda movida da Mesa ${String(modalTable).padStart(2, '0')} para a Mesa ${String(
          target,
        ).padStart(2, '0')}.`,
        '↔',
      );
      closeModal();
    } else {
      notify(res.message ?? 'Não foi possível mover a comanda.', '⚠');
    }
  }

  async function handleMerge(source: number) {
    if (modalTable == null) return;
    // Traz a comanda da mesa selecionada para a mesa atual.
    const res = await moveTable(source, modalTable);
    if (res.ok) {
      notify(
        `Mesas ${String(source).padStart(2, '0')} e ${String(modalTable).padStart(
          2,
          '0',
        )} juntadas na Mesa ${String(modalTable).padStart(2, '0')}.`,
        '🔗',
      );
      closeModal();
    } else {
      notify(res.message ?? 'Não foi possível juntar as mesas.', '⚠');
    }
  }

  async function handlePay() {
    if (modalTable == null) return;
    await closeTable(modalTable);
    notify(`Comanda da Mesa ${String(modalTable).padStart(2, '0')} fechada.`, '✅');
    closeModal();
  }

  const occupied = modalTable != null && isOccupied(modalTable);
  const total = modalTable != null ? tableTotal(modalTable) : 0;
  const freeTables = tables.filter((t) => t.num !== modalTable && !isOccupied(t.num));
  const otherOccupied = tables.filter((t) => t.num !== modalTable && isOccupied(t.num));

  const modalTitle =
    modalTable == null
      ? ''
      : step === 'move'
        ? `Mudar Mesa ${String(modalTable).padStart(2, '0')} de lugar`
        : step === 'merge'
          ? `Juntar mesas na Mesa ${String(modalTable).padStart(2, '0')}`
          : step === 'pay'
            ? `Fechar comanda — Mesa ${String(modalTable).padStart(2, '0')}`
            : `Mesa ${String(modalTable).padStart(2, '0')}`;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Salão</h2>
      </div>

      {kitchenClosed && (
        <div className="kitchen-closed-banner" style={{ marginBottom: 16 }}>
          <span className="kitchen-closed-dot" />
          <div>
            <strong>A cozinha está fechada.</strong> Não é possível abrir novas comandas nem
            enviar pedidos no momento. Aguarde a cozinha reabrir.
          </div>
        </div>
      )}

      <div className="tables-grid">
        {tables.map((t) => {
          const occ = isOccupied(t.num);
          return (
            <button
              key={t.num}
              type="button"
              className={`table-cell ${occ ? 'occupied' : 'free'}`}
              onClick={() => openModal(t.num)}
            >
              <span className="table-num">{String(t.num).padStart(2, '0')}</span>
              <span className="table-status">{occ ? 'Ocupada' : 'Livre'}</span>
              {occ && <span className="table-total">{formatBRL(tableTotal(t.num))}</span>}
            </button>
          );
        })}
      </div>

      <Modal open={modalTable != null} title={modalTitle} onClose={closeModal}>
        {modalTable != null && step === 'menu' && (
          <div>
            <div className="comanda-summary">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--gold-pale)',
                  color: 'var(--brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <IconTable />
              </div>
              <p className="table-status" style={{ marginBottom: occupied ? 4 : 18 }}>
                {occupied ? 'Mesa ocupada' : 'Mesa livre'}
              </p>
              {occupied && (
                <div className="comanda-total-line">
                  <span>Total da comanda</span>
                  <strong>{formatBRL(total)}</strong>
                </div>
              )}
            </div>

            {occupied ? (
              <div className="comanda-actions">
                <button
                  type="button"
                  className="btn btn-gold btn-block"
                  disabled={kitchenClosed}
                  onClick={() => {
                    const num = modalTable;
                    closeModal();
                    onOpenComanda(num);
                  }}
                >
                  <IconClipboard /> Adicionar pratos
                </button>
                {kitchenClosed && (
                  <p style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)', margin: '-2px 0 2px' }}>
                    Cozinha fechada — não é possível adicionar pratos.
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => setStep('move')}
                >
                  <IconTable /> Mudar de mesa
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => setStep('merge')}
                >
                  <IconTable /> Juntar com outra mesa
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => setStep('pay')}
                >
                  Pagar / Fechar comanda
                </button>
              </div>
            ) : (
              <div className="comanda-actions">
                {kitchenClosed ? (
                  <p style={{ color: 'var(--red)', fontSize: 'var(--fs-base)', textAlign: 'center' }}>
                    Cozinha fechada — não é possível abrir comandas agora.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn btn-gold btn-block"
                    onClick={() => {
                      const num = modalTable;
                      closeModal();
                      onOpenComanda(num);
                    }}
                  >
                    <IconClipboard /> Abrir Comanda
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                  onClick={() => handleRemove(modalTable)}
                >
                  <IconTrash /> Excluir Mesa
                </button>
              </div>
            )}
          </div>
        )}

        {modalTable != null && step === 'move' && (
          <div>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-600)', marginBottom: 14 }}>
              Selecione uma mesa livre para mover a comanda da Mesa{' '}
              {String(modalTable).padStart(2, '0')}.
            </p>
            {freeTables.length === 0 ? (
              <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-400)' }}>
                Não há mesas livres no momento.
              </p>
            ) : (
              <div className="table-pick-grid">
                {freeTables.map((t) => (
                  <button
                    key={t.num}
                    type="button"
                    className="table-pick"
                    onClick={() => handleMove(t.num)}
                  >
                    {String(t.num).padStart(2, '0')}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setStep('menu')}
            >
              ← Voltar
            </button>
          </div>
        )}

        {modalTable != null && step === 'merge' && (
          <div>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-600)', marginBottom: 14 }}>
              Selecione outra mesa ocupada para juntar a comanda dela com a Mesa{' '}
              {String(modalTable).padStart(2, '0')}. As duas passam a usar a mesma comanda.
            </p>
            {otherOccupied.length === 0 ? (
              <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-400)' }}>
                Não há outra mesa ocupada para juntar.
              </p>
            ) : (
              <div className="table-pick-grid">
                {otherOccupied.map((t) => (
                  <button
                    key={t.num}
                    type="button"
                    className="table-pick occupied"
                    onClick={() => handleMerge(t.num)}
                  >
                    {String(t.num).padStart(2, '0')}
                    <small>{formatBRL(tableTotal(t.num))}</small>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setStep('menu')}
            >
              ← Voltar
            </button>
          </div>
        )}

        {modalTable != null && step === 'pay' && (
          <div>
            <div className="comanda-total-line" style={{ marginBottom: 16 }}>
              <span>Total da comanda</span>
              <strong>{formatBRL(total)}</strong>
            </div>

            <label className="form-label" htmlFor="split-people">
              Dividir entre quantas pessoas?
            </label>
            <div className="split-control">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setPeople((p) => Math.max(1, p - 1))}
                aria-label="Menos pessoas"
              >
                −
              </button>
              <input
                id="split-people"
                className="form-input"
                type="number"
                min={1}
                value={people}
                onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
                style={{ textAlign: 'center', width: 70 }}
              />
              <button
                type="button"
                className="qty-btn"
                onClick={() => setPeople((p) => p + 1)}
                aria-label="Mais pessoas"
              >
                +
              </button>
            </div>

            {people > 1 && (
              <div className="split-result">
                <span>Cada pessoa paga</span>
                <strong>{formatBRL(total / people)}</strong>
              </div>
            )}

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-400)', margin: '14px 0 4px' }}>
              O pagamento é feito na maquininha ou Pix físico. Confirmar apenas fecha a comanda e
              libera a mesa.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 8 }}
              onClick={handlePay}
            >
              Confirmar pagamento e fechar
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              onClick={() => setStep('menu')}
            >
              ← Voltar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
