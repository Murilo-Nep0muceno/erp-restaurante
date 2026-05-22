import { useState } from 'react';
import Layout from '../components/Layout';
import type { NavItem } from '../components/Layout';
import FaqSection from './balcao/FaqSection';
import type { QA } from './balcao/FaqSection';
import { useOrders } from '../store/orderContext';
import { useNotif } from '../store/notifContext';
import type { Order, OrderStatus } from '../types';
import { IconFire, IconHelp } from '../components/icons';

const COLUMNS: { status: OrderStatus; title: string; cardClass: string; countClass: string }[] = [
  { status: 'new', title: 'Novos', cardClass: 'new', countClass: '' },
  { status: 'cooking', title: 'Preparando', cardClass: 'cooking', countClass: 'active' },
  { status: 'ready', title: 'Prontos', cardClass: 'ready', countClass: 'ready' },
];

const NAV: NavItem[] = [
  { key: 'fila', label: 'Fila de pedidos', icon: <IconFire /> },
  { key: 'ajuda', label: 'Ajuda', icon: <IconHelp /> },
];

const COZINHA_FAQ: QA[] = [
  {
    q: 'Como funciona a fila (Kanban)?',
    a: [
      'A tela tem três colunas que representam o caminho do pedido: "Novos" são os que o garçom acabou de enviar, "Preparando" são os que estão sendo feitos e "Prontos" são os que já podem ser entregues.',
      'Cada cartão é um pedido de uma mesa e mostra os itens e as observações (ex.: "sem cebola").',
    ],
  },
  {
    q: 'Como avanço um pedido de uma etapa para a outra?',
    a: [
      'Basta arrastar o cartão e soltá-lo na coluna desejada. Em geral você arrasta da esquerda para a direita conforme o prato avança: de "Novos" para "Preparando" quando começa a cozinhar, e de "Preparando" para "Prontos" quando termina.',
      'Se precisar corrigir, também dá para arrastar de volta para uma coluna anterior.',
    ],
  },
  {
    q: 'De onde vêm os pedidos e por que aparecem sozinhos?',
    a: [
      'Quando o garçom envia o pedido pela tela dele, ele cai automaticamente na coluna "Novos". A tela se atualiza sozinha a cada poucos segundos, então não é preciso recarregar a página.',
    ],
  },
  {
    q: 'O que significam as cores na borda do cartão?',
    a: [
      'A faixa colorida no topo indica a etapa: azul para pedidos novos, laranja para os que estão em preparo e verde para os que estão prontos. O tempo no canto fica vermelho quando o pedido está esperando há 15 minutos ou mais.',
    ],
  },
  {
    q: 'O que acontece depois que marco um pedido como "Pronto"?',
    a: [
      'Ao mover o cartão para "Prontos", o garçom é avisado de que o prato pode ser retirado e entregue à mesa. Depois que o garçom registra a entrega, o pedido sai da cozinha automaticamente.',
    ],
  },
];

function elapsedLabel(iso: string): { text: string; late: boolean } {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const late = mins >= 15;
  if (mins < 1) return { text: 'agora', late: false };
  if (mins < 60) return { text: `há ${mins} min`, late };
  const h = Math.floor(mins / 60);
  return { text: `há ${h}h${String(mins % 60).padStart(2, '0')}`, late: true };
}

export default function Cozinha() {
  const { orders, moveOrder, kitchenClosed, kitchenClosedAt, closeKitchen, openKitchen } =
    useOrders();
  const { notify } = useNotif();
  const [view, setView] = useState<'fila' | 'ajuda'>('fila');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<OrderStatus | null>(null);

  function ordersFor(status: OrderStatus): Order[] {
    return orders
      .filter((o) => o.status === status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function handleDrop(status: OrderStatus) {
    if (draggingId) void moveOrder(draggingId, status);
    setDraggingId(null);
    setDragOver(null);
  }

  async function handleToggleKitchen() {
    if (kitchenClosed) {
      await openKitchen();
      notify('Cozinha reaberta. O garçom já pode enviar pedidos.', '🍳');
      return;
    }
    const res = await closeKitchen();
    if (res.ok) {
      notify('Cozinha fechada. O relatório do dia está disponível no Admin.', '🔒');
    } else {
      notify(res.message ?? 'Não foi possível fechar a cozinha.', '⚠');
    }
  }

  const isHelp = view === 'ajuda';

  const closedTime = kitchenClosedAt
    ? new Date(kitchenClosedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const actions = isHelp ? undefined : (
    <button
      type="button"
      className={`btn ${kitchenClosed ? 'btn-gold' : 'btn-outline'}`}
      style={kitchenClosed ? undefined : { color: 'var(--red)', borderColor: 'var(--red)' }}
      onClick={handleToggleKitchen}
    >
      {kitchenClosed ? 'Abrir cozinha' : 'Fechar cozinha'}
    </button>
  );

  return (
    <Layout
      title="Cozinha"
      subtitle={isHelp ? 'Central de ajuda' : 'Fila de pedidos (Kanban) — arraste os cartões entre as colunas'}
      brand={{ title: 'Cozinha', subtitle: 'Produção' }}
      nav={NAV}
      activeKey={view}
      onSelect={(k) => setView(k as 'fila' | 'ajuda')}
      actions={actions}
    >
      {isHelp ? (
        <FaqSection
          title="Ajuda — Cozinha"
          subtitle="Como usar a fila de pedidos da cozinha."
          items={COZINHA_FAQ}
        />
      ) : (
        <>
          {kitchenClosed && (
            <div className="kitchen-closed-banner">
              <span className="kitchen-closed-dot" />
              <div>
                <strong>Cozinha fechada{closedTime ? ` desde ${closedTime}` : ''}.</strong>{' '}
                O garçom não consegue abrir mesas nem enviar novos pedidos. Clique em{' '}
                <em>"Abrir cozinha"</em> para retomar o atendimento.
              </div>
            </div>
          )}
          <div className="kanban">
          {COLUMNS.map((col) => {
            const list = ordersFor(col.status);
            const isOver = dragOver === col.status;
            return (
              <div
                className={`kanban-col${isOver ? ' drag-over' : ''}`}
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={() => handleDrop(col.status)}
              >
                <div className="kanban-col-header">
                  <span className="kanban-col-title">
                    <span className={`kanban-col-dot ${col.cardClass}`} />
                    {col.title}
                  </span>
                  <span className={`kanban-count ${col.countClass}`}>{list.length}</span>
                </div>

                {list.length === 0 && <div className="kanban-empty">Solte um pedido aqui</div>}

                {list.map((order) => {
                  const elapsed = elapsedLabel(order.createdAt);
                  return (
                    <div
                      className={`kanban-card ${col.cardClass}${draggingId === order.id ? ' dragging' : ''}`}
                      key={order.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', order.id);
                        setDraggingId(order.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                    >
                      <div className="kanban-card-strip" />
                      {col.status === 'ready' && (
                        <button
                          type="button"
                          className="kanban-card-close"
                          aria-label="Remover pedido entregue"
                          title="Marcar como entregue e remover do quadro"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            void moveOrder(order.id, 'delivered');
                            notify('Pedido finalizado e removido do quadro.', '✅');
                          }}
                        >
                          ×
                        </button>
                      )}
                      <div className="kanban-card-head">
                        <div className="kanban-mesa-badge">
                          <small>Mesa</small>
                          <b>{order.tableNum}</b>
                        </div>
                        <div className="kanban-card-headinfo">
                          <span className="kanban-card-code">#{order.code ?? order.id.slice(0, 4)}</span>
                          <span className="kanban-card-count">{order.items.length} item(ns)</span>
                        </div>
                        <span className={`kanban-card-time${elapsed.late ? ' late' : ''}`}>
                          {elapsed.text}
                        </span>
                      </div>

                      <ul className="kanban-card-items">
                        {order.items.map((it, i) => (
                          <li key={it.dishId || i}>
                            <div className="kanban-item-row">
                              <span className="kanban-qty">{it.qty}×</span>
                              <span className="kanban-item-name">{it.name}</span>
                            </div>
                            {it.notes && <div className="kanban-item-note">obs: {it.notes}</div>}
                          </li>
                        ))}
                      </ul>

                      <div className="kanban-card-foot">⠿ arraste para mover</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          </div>
        </>
      )}
    </Layout>
  );
}
