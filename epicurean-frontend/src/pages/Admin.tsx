import { useState } from 'react';
import Layout from '../components/Layout';
import type { NavItem } from '../components/Layout';
import {
  IconClipboard,
  IconDatabase,
  IconFire,
  IconPlus,
  IconSettings,
  IconStar,
  IconUsers,
} from '../components/icons';
import AccessSection from './admin/AccessSection';
import SettingsSection from './admin/SettingsSection';
import AuditSection from './admin/AuditSection';
import BackupSection from './admin/BackupSection';
import SatisfactionSection from './admin/SatisfactionSection';
import ClosingSection from './admin/ClosingSection';

const NAV: NavItem[] = [
  { key: 'acessos', label: 'Acessos', icon: <IconUsers /> },
  { key: 'config', label: 'Configurações', icon: <IconSettings /> },
  { key: 'fechamento', label: 'Fechamento do dia', icon: <IconFire /> },
  { key: 'auditoria', label: 'Auditoria e Excel', icon: <IconClipboard /> },
  { key: 'satisfacao', label: 'Satisfação', icon: <IconStar /> },
  { key: 'backup', label: 'Backup do Sistema', icon: <IconDatabase /> },
];

const META: Record<string, { title: string; subtitle: string }> = {
  acessos: { title: 'Gestão de Usuários', subtitle: 'Controle de acessos de funcionários da equipe' },
  config: { title: 'Configurações Globais', subtitle: 'Defina as regras, contatos e avisos do seu restaurante' },
  fechamento: { title: 'Fechamento do Dia', subtitle: 'Relatório de vendas do dia e status da cozinha' },
  auditoria: { title: 'Auditoria e Relatórios', subtitle: 'Registro de atividades e extração de dados' },
  satisfacao: { title: 'Pesquisa de Satisfação', subtitle: 'NPS e clientes insatisfeitos para acompanhamento' },
  backup: { title: 'Backup e Segurança', subtitle: 'Proteja ou restaure os dados do seu restaurante' },
};

export default function Admin() {
  const [section, setSection] = useState('acessos');
  const [newUserOpen, setNewUserOpen] = useState(false);

  const meta = META[section];
  const actions =
    section === 'acessos' ? (
      <button type="button" className="btn btn-primary" onClick={() => setNewUserOpen(true)}>
        <IconPlus /> Novo Usuário
      </button>
    ) : undefined;

  return (
    <Layout
      title={meta.title}
      subtitle={meta.subtitle}
      brand={{ title: 'Centro Comando', subtitle: 'Administração' }}
      nav={NAV}
      activeKey={section}
      onSelect={setSection}
      actions={actions}
    >
      {section === 'acessos' && (
        <AccessSection newUserOpen={newUserOpen} onCloseNewUser={() => setNewUserOpen(false)} />
      )}
      {section === 'config' && <SettingsSection />}
      {section === 'fechamento' && <ClosingSection />}
      {section === 'auditoria' && <AuditSection />}
      {section === 'satisfacao' && <SatisfactionSection />}
      {section === 'backup' && <BackupSection />}
    </Layout>
  );
}
