import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cambiarContrasenaPropia } from '../api/usuariosApi';
import './AdminLayout.css';

const navItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN'] },
  { path: '/admin/unidades', icon: '🏡', label: 'Casas y Medidores', roles: ['ADMIN'] },
  { path: '/admin/lecturas', icon: '💧', label: 'Lecturas', roles: ['ADMIN', 'TECNICO'] },
  { path: '/admin/cobros', icon: '💰', label: 'Cobros', roles: ['ADMIN'] },
  { path: '/admin/saldos', icon: '📋', label: 'Saldos Iniciales', roles: ['ADMIN'] },
  { path: '/admin/rubros', icon: '⚙️', label: 'Rubros y Tarifas', roles: ['ADMIN'] },
  { path: '/admin/reservas', icon: '📅', label: 'Reservaciones', roles: ['ADMIN'] },
  { path: '/admin/avisos', icon: '📢', label: 'Comunicados y Avisos', roles: ['ADMIN'] },
  { path: '/admin/usuarios', icon: '👥', label: 'Usuarios', roles: ['ADMIN'] },
  { path: '/admin/configuracion', icon: '🔧', label: 'Configuración', roles: ['ADMIN'] },
];

const breadcrumbMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/unidades': 'Casas y Medidores',
  '/admin/lecturas': 'Lecturas de Agua',
  '/admin/cobros': 'Gestión de Cobros',
  '/admin/saldos': 'Saldos Iniciales',
  '/admin/rubros': 'Rubros y Tarifas',
  '/admin/reservas': 'Reservaciones',
  '/admin/avisos': 'Comunicados y Avisos',
  '/admin/usuarios': 'Usuarios',
  '/admin/configuracion': 'Configuración',
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({ contrasenaActual: '', nuevaContrasena: '', confirmarNueva: '' });
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.nuevaContrasena !== passwordForm.confirmarNueva) {
      setPassError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    if (passwordForm.nuevaContrasena.length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    try {
      setPassLoading(true);
      setPassError(null);
      setPassSuccess(null);
      await cambiarContrasenaPropia(passwordForm.contrasenaActual, passwordForm.nuevaContrasena);
      setPassSuccess('Contraseña cambiada exitosamente.');
      setPasswordForm({ contrasenaActual: '', nuevaContrasena: '', confirmarNueva: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPassError(err.response?.data?.error || 'Error al cambiar la contraseña. Verifique que la contraseña actual sea correcta.');
    } finally {
      setPassLoading(false);
    }
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Admin';

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div 
          className="sidebar-header" 
          onClick={() => !sidebarOpen && setSidebarOpen(true)}
          style={{ cursor: !sidebarOpen ? 'pointer' : 'default' }}
        >
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
          {sidebarOpen ? (
            <>
              <div className="sidebar-title">
                <span className="sidebar-name">Condominio</span>
                <span className="sidebar-subtitle">Administración</span>
              </div>
              <button 
                className="sidebar-toggle" 
                onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}
                title="Colapsar menú"
              >
                ◀
              </button>
            </>
          ) : null}
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.rol || ''))
            .map((item) => (
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
          <div className="admin-header-right" style={{ position: 'relative' }}>
            <div className="header-time">
              {new Date().toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}
            </div>
            
            <div 
              className="header-user-badge" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div className="header-user-info-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: 'white' }}>{user?.nombre || 'Usuario'}</span>
                <span style={{ color: 'var(--color-accent-orange)', fontSize: '0.7rem', fontWeight: 700 }}>{user?.rol || 'ADMIN'}</span>
              </div>
              <div className="header-avatar">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>

            {showProfileMenu && (
              <>
                <div 
                  onClick={() => setShowProfileMenu(false)} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
                />
                <div className="profile-dropdown" style={{ zIndex: 100 }}>
                  <div className="profile-dropdown-header">
                    <div className="profile-large-avatar">
                      {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="profile-header-details">
                      <strong>{user?.nombre || 'Administrador'}</strong>
                      <span>{user?.email || 'admin@condominio.cr'}</span>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <div className="profile-dropdown-actions">
                    <button 
                      className="profile-dropdown-btn"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowPasswordModal(true);
                      }}
                    >
                      🔑 Cambiar Contraseña
                    </button>
                    <button 
                      className="profile-dropdown-btn logout-btn" 
                      onClick={handleLogout}
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              🔑 Cambiar Contraseña
            </h2>
            
            {passError && (
              <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', background: 'rgba(252,92,125,0.08)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-error)' }}>
                ⚠️ {passError}
              </div>
            )}
            
            {passSuccess && (
              <div style={{ color: 'var(--color-success)', fontSize: '0.8rem', background: 'rgba(72,187,120,0.08)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-success)' }}>
                ✅ {passSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordForm.contrasenaActual}
                  onChange={(e) => setPasswordForm({ ...passwordForm, contrasenaActual: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  disabled={passLoading}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.nuevaContrasena}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nuevaContrasena: e.target.value })}
                  className="form-input"
                  placeholder="Mínimo 4 caracteres"
                  required
                  disabled={passLoading}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirmarNueva}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmarNueva: e.target.value })}
                  className="form-input"
                  placeholder="Repita la nueva contraseña"
                  required
                  disabled={passLoading}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ contrasenaActual: '', nuevaContrasena: '', confirmarNueva: '' });
                    setPassError(null);
                    setPassSuccess(null);
                  }}
                  disabled={passLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={passLoading}>
                  {passLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
