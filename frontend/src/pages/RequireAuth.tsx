import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/lib/auth';

type Props = {
  role?: UserRole;
};

/**
 * Route guard: redirects to /login when unauthenticated, or to the user's
 * home when their role doesn't match.
 */
export function RequireAuth({ role }: Props) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user!.role !== role) {
    const home = user!.role === 'EMPLOYER' ? '/manager' : '/staff';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
