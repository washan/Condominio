import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CondominoLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <header style={{
        background: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
          }}>🏘</div>
          <div>
            <div style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
              Condominio
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
              Portal del Condómino
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
            {user?.nombre}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Salir
          </button>
        </div>
      </header>
      <main style={{ padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default CondominoLayout;
