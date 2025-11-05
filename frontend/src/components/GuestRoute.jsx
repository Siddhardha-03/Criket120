import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status" aria-hidden="true" />
        <span className="ms-2 text-muted">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || redirectTo} replace />;
  }

  return children;
};

export default GuestRoute;
