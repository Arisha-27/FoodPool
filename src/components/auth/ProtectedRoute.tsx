import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('cook' | 'customer')[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  // 1. Check if user is logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. Check if user has the right role (Cook vs Customer)
  if (allowedRoles && user) {
    const userRole = user.is_cook ? 'cook' : 'customer';

    if (!allowedRoles.includes(userRole)) {
      // Redirect to their correct dashboard if they try to access the wrong one
      const redirectPath = userRole === 'cook' ? '/cook-dashboard' : '/customer-dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

// This is the line your App.tsx was looking for!
export default ProtectedRoute;