import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Routes>
            <Route
              path="/login"
              element={(
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              )}
            />
            <Route
              path="/register"
              element={(
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              )}
            />
            <Route
              path="/forgot-password"
              element={(
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              )}
            />
            <Route
              path="/reset-password"
              element={(
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              )}
            />
            <Route
              path="/verify-email"
              element={(
                <GuestRoute>
                  <VerifyEmailPage />
                </GuestRoute>
              )}
            />
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/matches/:id"
              element={(
                <ProtectedRoute>
                  <MatchPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="bg-dark text-light text-center py-3 mt-auto">
          <small> {new Date().getFullYear()} Cricket Platform</small>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
