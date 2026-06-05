import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CondominoLayout from './layouts/CondominoLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import LecturasPage from './pages/admin/LecturasPage';
import CobrosPage from './pages/admin/CobrosPage';
import SaldosPage from './pages/admin/SaldosPage';
import RubrosPage from './pages/admin/RubrosPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import ConfiguracionPage from './pages/admin/ConfiguracionPage';
import EstadoCuentaPage from './pages/resident/EstadoCuentaPage';
import GuardiaPage from './pages/GuardiaPage';

import './styles/index.css';

const NavigateToAppropriatePage: React.FC = () => {
  const { user } = useAuth();
  if (user?.rol === 'TECNICO') {
    return <Navigate to="/admin/lecturas" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'TECNICO']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<NavigateToAppropriatePage />} />
            <Route path="dashboard" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="lecturas" element={
              <ProtectedRoute requiredRoles={['ADMIN', 'TECNICO']}>
                <LecturasPage />
              </ProtectedRoute>
            } />
            <Route path="cobros" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <CobrosPage />
              </ProtectedRoute>
            } />
            <Route path="saldos" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <SaldosPage />
              </ProtectedRoute>
            } />
            <Route path="rubros" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <RubrosPage />
              </ProtectedRoute>
            } />
            <Route path="usuarios" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <UsuariosPage />
              </ProtectedRoute>
            } />
            <Route path="configuracion" element={
              <ProtectedRoute requiredRoles="ADMIN">
                <ConfiguracionPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Condómino routes */}
          <Route
            path="/condomino"
            element={
              <ProtectedRoute requiredRole="CONDOMINO">
                <CondominoLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/condomino/estado-cuenta" replace />} />
            <Route path="estado-cuenta" element={<EstadoCuentaPage />} />
          </Route>

          {/* Guardia */}
          <Route
            path="/guardia"
            element={
              <ProtectedRoute requiredRole="GUARDIA">
                <GuardiaPage />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
