import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing or invalid. Please use the link from your email.');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const response = await resetPassword(token, { newPassword: formData.newPassword });
      setMessage(response.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const messageText = err.response?.data?.message || 'Unable to reset password. Please try again.';
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <h1 className="h3 mb-4 text-center">Set a new password</h1>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0">
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">New password</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="form-control"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={8}
          />
          <div className="form-text">Must include at least one letter and one number.</div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="text-center mt-3">
        <Link to="/login" className="text-decoration-none">
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
