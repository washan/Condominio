import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AdminLayout.css';

const navItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/lecturas', icon: '💧', label: 'Lecturas' },
  { path: '/admin/cobros', icon: '💰', label: 'Cobros' },
  { path: '/admin/saldos', icon: '📋', label: 'Saldos Iniciales' },
  { path: '/admin/rubros', icon: '⚙️', label: 'Rubros y Tarifas' },
  { path: '/admin/usuarios', icon: '👥', label: 'Usuarios' },
  { path: '/admin/configuracion', icon: '🔧', label: 'Configuración' },
];

const breadcrumbMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/lecturas': 'Lecturas de Agua',
  '/admin/cobros': 'Gestión de Cobros',
  '/admin/saldos': 'Saldos Iniciales',
  '/admin/rubros': 'Rubros y Tarifas',
  '/admin/usuarios': 'Usuarios',
  '/admin/configuracion': 'Configuración',
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Admin';

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar-logo-icon">
              <defs>
                <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6A11CB" />
                  <stop offset="100%" stopColor="#2575FC" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="10" fill="url(#sidebarLogoGrad)" />
              <rect x="10" y="14" width="20" height="16" rx="1" fill="white" opacity="0.9" />
              <rect x="13" y="18" width="5" height="5" rx="0.5" fill="#6A11CB" />
              <rect x="22" y="18" width="5" height="5" rx="0.5" fill="#6A11CB" />
              <rect x="17" y="23" width="6" height="7" rx="0.5" fill="#6A11CB" />
              <polygon points="8,15 20,6 32,15" fill="url(#sidebarLogoGrad)" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="sidebar-title">
              <span className="sidebar-name">Condominio</span>
              <span className="sidebar-subtitle">Administración</span>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.nombre || 'Administrador'}</span>
                <span className="sidebar-user-role">ADMIN</span>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={handleLogout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div className="admin-breadcrumb">
              <span className="breadcrumb-home">Admin</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{currentPage}</span>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="header-time">
              {new Date().toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}
            </div>
            <div className="header-avatar">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
