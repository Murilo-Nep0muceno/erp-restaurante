import { useState } from 'react';
import Layout from '../components/Layout';
import type { NavItem } from '../components/Layout';
import {
  IconBox,
  IconDashboard,
  IconHelp,
  IconMenu,
  IconStar,
  IconTruck,
  IconUsers,
} from '../components/icons';
import DashboardSection from './balcao/DashboardSection';
import ProductsSection from './balcao/ProductsSection';
import SuppliersSection from './balcao/SuppliersSection';
import DishesSection from './balcao/DishesSection';
import PurchasesSection from './balcao/PurchasesSection';
import FaqSection from './balcao/FaqSection';
import SatisfactionSection from './balcao/SatisfactionSection';

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { key: 'cardapio', label: 'Cardápio (Fichas)', icon: <IconMenu /> },
  { key: 'estoque', label: 'Estoque / Insumos', icon: <IconBox /> },
  { key: 'compras', label: 'Compras', icon: <IconTruck /> },
  { key: 'fornecedores', label: 'Fornecedores', icon: <IconUsers /> },
  { key: 'satisfacao', label: 'Pesquisa de Satisfação', icon: <IconStar /> },
  { key: 'faq', label: 'FAQ / Ajuda', icon: <IconHelp /> },
];

const META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Visão Geral Executiva', subtitle: 'Métricas e acompanhamentos de vendas diárias' },
  cardapio: { title: 'Montar Cardápio', subtitle: 'Organize suas ofertas gastronômicas e fichas técnicas' },
  estoque: { title: 'Gestão de Insumos', subtitle: 'Controle de inventário, medidas e fornecedores' },
  compras: { title: 'Compras', subtitle: 'Entrada de estoque' },
  fornecedores: { title: 'Fornecedores', subtitle: 'Cadastro de fornecedores' },
  satisfacao: { title: 'Pesquisa de Satisfação', subtitle: 'Avalie a experiência do cliente' },
  faq: { title: 'FAQ / Ajuda', subtitle: 'Como usar o painel de balcão' },
};

export default function Balcao() {
  const [section, setSection] = useState('dashboard');
  const meta = META[section];

  return (
    <Layout
      title={meta.title}
      subtitle={meta.subtitle}
      brand={{ title: 'Painel de Controle', subtitle: 'Gerenciamento' }}
      nav={NAV}
      activeKey={section}
      onSelect={setSection}
    >
      {section === 'dashboard' && <DashboardSection />}
      {section === 'cardapio' && <DishesSection />}
      {section === 'estoque' && <ProductsSection onManageSuppliers={() => setSection('fornecedores')} />}
      {section === 'compras' && <PurchasesSection />}
      {section === 'fornecedores' && <SuppliersSection />}
      {section === 'satisfacao' && <SatisfactionSection />}
      {section === 'faq' && <FaqSection />}
    </Layout>
  );
}
