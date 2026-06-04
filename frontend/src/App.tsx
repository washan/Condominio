import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="lecturas" element={<LecturasPage />} />
            <Route path="cobros" element={<CobrosPage />} />
            <Route path="saldos" element={<SaldosPage />} />
            <Route path="rubros" element={<RubrosPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
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
