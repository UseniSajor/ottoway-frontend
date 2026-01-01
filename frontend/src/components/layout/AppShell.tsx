import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
  portalName: string;
  navItems: Array<{ path: string; label: string; icon?: string }>;
}

export const AppShell: React.FC<AppShellProps> = ({ children, portalName, navItems }) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-header">
          <h2 className="app-shell__logo">Kealee</h2>
          <span className="app-shell__portal-name">{portalName}</span>
        </div>
        <nav className="app-shell__nav">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="app-shell__nav-item">
              {item.icon && <span className="app-shell__nav-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-shell__main">
        <header className="app-shell__header">
          <div className="app-shell__header-left">
            <h1 className="app-shell__page-title">{portalName}</h1>
          </div>
          <div className="app-shell__header-right">
            <NotificationCenter />
            <div className="app-shell__user-menu">
              <span>{user?.firstName} {user?.lastName}</span>
              <button onClick={logout} className="app-shell__logout-btn">Logout</button>
            </div>
          </div>
        </header>
        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
};

