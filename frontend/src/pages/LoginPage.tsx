import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingrese email y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user) {
        if (user.rol === 'ADMIN') navigate('/admin/dashboard');
        else if (user.rol === 'TECNICO') navigate('/admin/lecturas');
        else if (user.rol === 'CONDOMINO') navigate('/condomino/estado-cuenta');
        else if (user.rol === 'GUARDIA') navigate('/guardia');
      }
    } catch {
      setError('Credenciales incorrectas. Verifique su email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-card glass-card fade-in">
        {/* Logo */}
        <div className="login-logo">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6A11CB" />
                <stop offset="100%" stopColor="#2575FC" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="40" fill="url(#logoGrad)" opacity="0.2" />
            <circle cx="40" cy="40" r="30" fill="url(#logoGrad)" opacity="0.4" />
            {/* Building icon */}
            <rect x="22" y="28" width="36" height="30" rx="2" fill="url(#logoGrad)" />
            <rect x="28" y="35" width="8" height="8" rx="1" fill="white" opacity="0.8" />
            <rect x="44" y="35" width="8" height="8" rx="1" fill="white" opacity="0.8" />
            <rect x="34" y="44" width="12" height="14" rx="1" fill="white" opacity="0.9" />
            {/* Roof */}
            <polygon points="18,30 40,14 62,30" fill="url(#logoGrad)" />
            {/* Water drop */}
            <ellipse cx="40" cy="40" rx="5" ry="7" fill="white" opacity="0.6" />
            <path d="M40 33 Q45 38 40 47 Q35 38 40 33Z" fill="white" />
          </svg>
        </div>

        <h1 className="login-title">Condominio</h1>
        <p className="login-subtitle">Sistema de Administración</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Correo Electrónico</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">✉</span>
              <input
                type="email"
                className="form-input login-input"
                placeholder="admin@condominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                type="password"
                className="form-input login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <span>🔑</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          © 2026 Sistema de Administración de Condominios
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
