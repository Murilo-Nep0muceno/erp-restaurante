import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useHighContrast } from '../hooks/useHighContrast';
import { ROLE_LABEL } from '../config/roles';
import { IconBars, IconLogout, IconSun } from './icons';
import styles from './Layout.module.css';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface LayoutProps {
  title: string;
  subtitle?: string;
  /** Sidebar brand (top-left). Defaults to the app brand. */
  brand?: { title: string; subtitle: string };
  /** Section nav for the current screen (internal navigation). */
  nav?: NavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  /** Topbar right-side actions. */
  actions?: ReactNode;
  children: ReactNode;
}

export default function Layout({
  title,
  subtitle,
  brand,
  nav,
  activeKey,
  onSelect,
  actions,
  children,
}: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [contrast, toggleContrast] = useHighContrast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initial = user?.userName?.charAt(0).toUpperCase() ?? '?';

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  function handleSelect(key: string) {
    onSelect?.(key);
    setDrawerOpen(false);
  }

  return (
    <div className="app">
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} aria-hidden />
      )}
      <aside className={`sidebar${drawerOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <h2>{brand?.title ?? 'The Epicurean'}</h2>
          <p>{brand?.subtitle ?? 'Gestão de Restaurante'}</p>
        </div>

        <nav className={styles.navSection}>
          {nav?.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item${activeKey === item.key ? ' active' : ''}`}
              onClick={() => handleSelect(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <div className={styles.divider} />
          <button
            type="button"
            className={`nav-item${contrast ? ' active' : ''}`}
            onClick={toggleContrast}
            aria-pressed={contrast}
          >
            <IconSun />
            <span>Alto Contraste</span>
          </button>
        </nav>

        <div className="sidebar-user">
          {user && (
            <div className="sidebar-user-info">
              <div className="user-avatar">{initial}</div>
              <div>
                <div className="user-name">{user.userName}</div>
                <div className="user-role">{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
          )}

          <button type="button" className="logout-btn" onClick={handleLogout}>
            <IconLogout />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <IconBars />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1>{title}</h1>
              {subtitle && <div className="topbar-sub">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
