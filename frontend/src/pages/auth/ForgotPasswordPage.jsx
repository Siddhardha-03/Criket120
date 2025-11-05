import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await forgotPassword({ email });
      setMessage(response.message || 'If an account exists we have sent a reset link.');
    } catch (err) {
      const messageText = err.response?.data?.message || 'Unable to process request. Please try again.';
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <h1 className="h3 mb-4 text-center">Forgot password</h1>
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
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-center mt-3">
        Remembered your password?{' '}
        <Link to="/login" className="text-decoration-none">
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
