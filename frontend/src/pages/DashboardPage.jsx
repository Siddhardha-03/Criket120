import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container py-5">
      <h1 className="mb-4">Dashboard</h1>
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="card-title">Welcome back!</h5>
          <p className="card-text text-muted">
            Signed in as <strong>{user?.email}</strong>
          </p>
          <p className="mb-0">
            Your account is verified and ready to access protected features. Future enhancements will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
