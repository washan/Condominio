import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[] | UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requiredRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = requiredRoles
    ? (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles])
    : (requiredRole ? [requiredRole] : null);

  if (allowedRoles) {
    if (user && !allowedRoles.includes(user.rol)) {
      // Redirect to role-appropriate page
      if (user.rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      if (user.rol === 'TECNICO') return <Navigate to="/admin/lecturas" replace />;
      if (user.rol === 'CONDOMINO') return <Navigate to="/condomino/estado-cuenta" replace />;
      if (user.rol === 'GUARDIA') return <Navigate to="/guardia" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
