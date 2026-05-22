import { useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '../components/Layout';
import type { NavItem } from '../components/Layout';
import { useOrders } from '../store/orderContext';
import { IconTable, IconClipboard, IconPlus } from '../components/icons';
import MesasView from './garcom/MesasView';
import ComandaView from './garcom/ComandaView';
import PedidosView from './garcom/PedidosView';

type View = 'mesas' | 'pedidos';

const NAV: NavItem[] = [
  { key: 'mesas', label: 'Mesas', icon: <IconTable /> },
  { key: 'pedidos', label: 'Meus Pedidos', icon: <IconClipboard /> },
];

export default function Garcom() {
  const { addTable } = useOrders();
  const [view, setView] = useState<View>('mesas');
  const [openTable, setOpenTable] = useState<number | null>(null);

  let title = 'Salão Principal';
  let subtitle = 'Gestão do mapa de mesas';
  let actions: ReactNode;

  if (openTable != null) {
    title = `Mesa ${String(openTable).padStart(2, '0')}`;
    subtitle = 'Comanda';
    actions = (
      <button type="button" className="btn btn-ghost" onClick={() => setOpenTable(null)}>
        ← Voltar
      </button>
    );
  } else if (view === 'mesas') {
    actions = (
      <button type="button" className="btn btn-primary" onClick={addTable}>
        <IconPlus /> Nova Mesa
      </button>
    );
  } else {
    title = 'Meus Pedidos Ativos';
    subtitle = 'Pedidos enviados à cozinha';
  }

  function handleSelect(key: string) {
    setOpenTable(null);
    setView(key as View);
  }

  return (
    <Layout
      title={title}
      subtitle={subtitle}
      brand={{ title: 'Atendimento', subtitle: 'Gerenciamento' }}
      nav={NAV}
      activeKey={view}
      onSelect={handleSelect}
      actions={actions}
    >
      {openTable != null ? (
        <ComandaView tableNum={openTable} />
      ) : view === 'mesas' ? (
        <MesasView onOpenComanda={setOpenTable} />
      ) : (
        <PedidosView />
      )}
    </Layout>
  );
}
