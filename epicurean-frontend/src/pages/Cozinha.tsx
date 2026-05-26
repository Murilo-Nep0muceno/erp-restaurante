import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useOrders } from '../store/orderContext';
import { useNotif } from '../store/notifContext';
import type { Order, OrderStatus } from '../types';
import { IconFire, IconHelp, IconLogout } from '../components/icons';
import styles from './Cozinha.module.css';

/* ------------------------------------------------------------------ */
/* Timing helpers                                                       */
/* ------------------------------------------------------------------ */

function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useClock() {
  const [text, setText] = useState('');
  useEffect(() => {
    const tick = () =>
      setText(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return text;
}

function elapsedSecs(iso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
}

function formatTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ageClass(secs: number) {
  const m = secs / 60;
  if (m < 5) return styles.agOk;
  if (m < 10) return styles.agWarn;
  if (m < 15) return styles.agUrgent;
  return styles.agCrit;
}

/* ------------------------------------------------------------------ */
/* Fullscreen                                                           */
/* ------------------------------------------------------------------ */

function useFullscreen() {
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const cb = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', cb);
    return () => document.removeEventListener('fullscreenchange', cb);
  }, []);
  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  }
  return { fs, toggle };
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

type FilterKey = 'all' | OrderStatus | 'history';

const FILTERS: { key: FilterKey; label: string; statusKey: OrderStatus | null }[] = [
  { key: 'all',     label: 'Todos',      statusKey: null },
  { key: 'new',     label: 'Novos',      statusKey: 'new' },
  { key: 'cooking', label: 'Preparando', statusKey: 'cooking' },
  { key: 'ready',   label: 'Prontos',    statusKey: 'ready' },
  { key: 'history', label: 'Histórico',  statusKey: null },
];

const STATUS_CLASS: Record<OrderStatus, string> = {
  new: styles.statusNew,
  cooking: styles.statusCooking,
  ready: styles.statusReady,
  delivered: '',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'NOVO',
  cooking: 'PREPARO',
  ready: 'PRONTO',
  delivered: '',
};

const ACTION_LABEL: Record<string, string> = {
  new: '▶ Iniciar preparo',
  cooking: '✓ Marcar como pronto',
  ready: '↗ Confirmar entrega',
};

const ACTION_CLASS: Record<string, string> = {
  new: styles.iniciar,
  cooking: styles.pronto,
  ready: styles.entregar,
};

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'cooking',
  cooking: 'ready',
  ready: 'delivered',
};

const FAQ = [
  {
    q: 'Como funciona o KDS?',
    a: 'O painel exibe todos os pedidos ativos em tempo real. Cada cartão mostra a mesa, os itens pedidos e o tempo decorrido desde o envio do pedido.',
  },
  {
    q: 'Como avanço um pedido?',
    a: 'Clique no botão de ação de cada cartão: "Iniciar preparo" começa o preparo, "Marcar como pronto" avisa o garçom, e "Confirmar entrega" remove o pedido do painel.',
  },
  {
    q: 'O que significam as cores do timer?',
    a: 'Verde (< 5 min): dentro do tempo. Amarelo (5–9 min): atenção. Laranja (10–14 min): urgente. Vermelho piscando (≥ 15 min): pedido crítico, atrase mínimo.',
  },
  {
    q: 'Como filtrar os pedidos?',
    a: 'Use as abas no topo (Todos / Novos / Preparando / Prontos) para focar em uma etapa específica.',
  },
  {
    q: 'O que é "Fechar cozinha"?',
    a: 'Impede novos pedidos de entrarem. Use ao encerrar o serviço. O botão "Abrir cozinha" retoma o atendimento.',
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function Cozinha() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { orders, moveOrder, kitchenClosed, kitchenClosedAt, closeKitchen, openKitchen } =
    useOrders();
  const { notify } = useNotif();

  const now = useNow();
  const clock = useClock();
  const { fs, toggle: toggleFs } = useFullscreen();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [showHelp, setShowHelp] = useState(false);

  /* ---------- Delivered-orders history ---------- */
  const [history, setHistory] = useState<Order[]>([]);
  const seenDelivered = useRef(new Set<string>());

  useEffect(() => {
    orders.forEach((o) => {
      if (o.status === 'delivered' && !seenDelivered.current.has(o.id)) {
        seenDelivered.current.add(o.id);
        setHistory((prev) => [o, ...prev]);
      }
    });
  }, [orders]);

  /* ---------- Auto-expire: 3 h when kitchen is closed ---------- */
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const expiredIds = useRef(new Set<string>());

  useEffect(() => {
    if (!kitchenClosed) return;
    orders.forEach((o) => {
      if (
        (o.status === 'new' || o.status === 'cooking') &&
        !expiredIds.current.has(o.id) &&
        now - new Date(o.createdAt).getTime() >= THREE_HOURS_MS
      ) {
        expiredIds.current.add(o.id);
        void moveOrder(o.id, 'delivered');
        notify(`Mesa ${o.tableNum} — pedido encerrado automaticamente após 3h.`, '⏰');
      }
    });
  }, [now, kitchenClosed, orders, moveOrder, notify, THREE_HOURS_MS]);

  /* ---------- Computed counts ---------- */
  const countOf = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  const visible: Order[] = orders
    .filter((o) => {
      if (o.status === 'delivered') return false;
      if (filter === 'all') return true;
      return o.status === filter;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  /* ---------- Actions ---------- */
  async function handleAdvance(order: Order) {
    const next = NEXT[order.status];
    if (!next) return;
    await moveOrder(order.id, next);
    if (next === 'delivered') {
      notify('Pedido finalizado — entregue à mesa.', '✅');
    }
  }

  async function handleToggleKitchen() {
    if (kitchenClosed) {
      await openKitchen();
      notify('Cozinha reaberta. Garçons já podem enviar pedidos.', '🍳');
      return;
    }
    const res = await closeKitchen();
    if (res.ok) {
      // Mark every currently-delivered order as seen so polling won't re-add
      // them to history after the clear.
      orders
        .filter((o) => o.status === 'delivered')
        .forEach((o) => seenDelivered.current.add(o.id));
      setHistory([]);
      notify('Cozinha fechada. Histórico apagado.', '🔒');
    } else {
      notify(res.message ?? 'Não foi possível fechar a cozinha.', '⚠');
    }
  }

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  const closedTime = kitchenClosedAt
    ? new Date(kitchenClosedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={styles.kds}>
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <IconFire />
          KDS
        </div>

        <span className={`${styles.statusDot} ${kitchenClosed ? styles.closed : styles.open}`} />
        <span className={`${styles.statusLabel} ${kitchenClosed ? styles.closed : styles.open}`}>
          {kitchenClosed ? 'Fechada' : 'Aberta'}
        </span>

        <div className={styles.spacer} />

        <span className={styles.clock}>{clock}</span>

        <div className={styles.counters}>
          <span className={`${styles.counterChip} ${styles.new}`}>
            {countOf('new')} novos
          </span>
          <span className={`${styles.counterChip} ${styles.cooking}`}>
            {countOf('cooking')} prep.
          </span>
          <span className={`${styles.counterChip} ${styles.ready}`}>
            {countOf('ready')} prontos
          </span>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.headerBtn} ${kitchenClosed ? styles.success : styles.danger}`}
            onClick={handleToggleKitchen}
          >
            {kitchenClosed ? '▶ Abrir cozinha' : '■ Fechar cozinha'}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleFs}
            title={fs ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-label={fs ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {fs ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowHelp(true)}
            title="Ajuda"
            aria-label="Ajuda"
          >
            <IconHelp />
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleLogout}
            title="Sair"
            aria-label="Sair"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      {/* ============================================================
          KITCHEN CLOSED BANNER
          ============================================================ */}
      {kitchenClosed && (
        <div className={styles.closedBanner}>
          <span className={styles.closedBannerDot} />
          <span>
            <strong>Cozinha fechada{closedTime ? ` desde ${closedTime}` : ''}.</strong>{' '}
            Garçons não conseguem abrir mesas nem enviar pedidos. Clique em{' '}
            <em>"Abrir cozinha"</em> para retomar o atendimento.
          </span>
        </div>
      )}

      {/* ============================================================
          FILTER TABS
          ============================================================ */}
      <nav className={styles.filterBar} aria-label="Filtrar pedidos">
        {FILTERS.map((f) => {
          const cnt =
            f.key === 'history'
              ? history.length
              : f.key === 'all'
              ? orders.filter((o) => o.status !== 'delivered').length
              : countOf(f.statusKey as OrderStatus);
          return (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterTab}${filter === f.key ? ' ' + styles.active : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className={`${styles.filterCount} ${styles[f.key as keyof typeof styles] ?? styles.all}`}>
                {cnt}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================
          ORDER GRID  (active) / HISTORY (when tab = history)
          ============================================================ */}
      {filter === 'history' ? (
        history.length === 0 ? (
          <div className={styles.emptyState}>
            <IconFire />
            <h3>Nenhum pedido entregue</h3>
            <p>Os pedidos confirmados aparecerão aqui.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {history.map((order) => (
              <article
                key={order.id}
                className={`${styles.card} ${styles.cardDelivered}`}
                aria-label={`Entregue — Mesa ${order.tableNum}`}
              >
                <div className={styles.cardHead}>
                  <div className={styles.cardMesaBlock}>
                    <span className={styles.cardMesaLabel}>Mesa</span>
                    <span className={styles.cardMesaNum}>{order.tableNum}</span>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.cardCode}>
                      #{order.code ?? order.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className={styles.deliveredBadge}>✓ Entregue</span>
                    <span className={styles.deliveredTime}>
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.cardDivider} aria-hidden />
                <p className={styles.cardItemCount}>
                  {order.items.length} item{order.items.length !== 1 ? 'ns' : ''}
                </p>
                <ul className={styles.cardItems}>
                  {order.items.map((it, i) => (
                    <li key={it.dishId || i}>
                      <div className={styles.cardItemRow}>
                        <span className={styles.itemQty}>{it.qty}×</span>
                        <span className={styles.itemName}>{it.name}</span>
                      </div>
                      {it.notes && (
                        <div className={styles.itemNote}>obs: {it.notes}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <IconFire />
          <h3>Nenhum pedido{filter !== 'all' ? ' nessa etapa' : ''}</h3>
          <p>
            {filter === 'all'
              ? 'Os pedidos enviados pelo garçom aparecem aqui automaticamente.'
              : 'Mude o filtro para ver outras etapas.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((order) => {
            const secs = elapsedSecs(order.createdAt, now);
            const timerCls = ageClass(secs);
            const timerTxt = formatTimer(secs);

            return (
              <article
                key={order.id}
                className={`${styles.card} ${STATUS_CLASS[order.status] ?? ''}`}
                aria-label={`Mesa ${order.tableNum}, pedido ${order.code ?? order.id.slice(0, 4)}`}
              >
                <div className={styles.cardHead}>
                  <div className={styles.cardMesaBlock}>
                    <span className={styles.cardMesaLabel}>Mesa</span>
                    <span className={styles.cardMesaNum}>{order.tableNum}</span>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.cardCode}>
                      #{order.code ?? order.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className={styles.cardStatusBadge}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <span className={`${styles.timerPill} ${timerCls}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {timerTxt}
                    </span>
                  </div>
                </div>

                <div className={styles.cardDivider} aria-hidden />
                <p className={styles.cardItemCount}>
                  {order.items.length} item{order.items.length !== 1 ? 'ns' : ''}
                </p>
                <ul className={styles.cardItems}>
                  {order.items.map((it, i) => (
                    <li key={it.dishId || i}>
                      <div className={styles.cardItemRow}>
                        <span className={styles.itemQty}>{it.qty}×</span>
                        <span className={styles.itemName}>{it.name}</span>
                      </div>
                      {it.notes && (
                        <div className={styles.itemNote}>obs: {it.notes}</div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className={styles.cardFoot}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${ACTION_CLASS[order.status] ?? ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleAdvance(order);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {ACTION_LABEL[order.status]}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ============================================================
          HELP MODAL
          ============================================================ */}
      {showHelp && (
        <div
          className={styles.helpOverlay}
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal
          aria-label="Ajuda — KDS"
        >
          <div className={styles.helpBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpHead}>
              <h2>Ajuda — KDS Cozinha</h2>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowHelp(false)}
                aria-label="Fechar ajuda"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {FAQ.map((item) => (
              <div key={item.q} className={styles.helpQA}>
                <p className={styles.helpQ}>{item.q}</p>
                <p className={styles.helpA}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
