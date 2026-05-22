import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../store/authContext';
import { landingForRole } from '../config/roles';
import type { Role } from '../types';

interface PrivateRouteProps {
  children: ReactNode;
  allow: Role[];
}

export function PrivateRoute({ children, allow }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(user.role)) {
    // Authenticated but lacks the role: send to their own landing page.
    return <Navigate to={landingForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
