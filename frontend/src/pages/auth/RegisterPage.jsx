import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const initialState = {
  email: '',
  password: '',
  confirmPassword: '',
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const response = await register({
        email: formData.email,
        password: formData.password,
      });
      setSuccess(response.message || 'Registration successful. Please verify your email.');
      setFormData(initialState);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to register. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '520px' }}>
      <h1 className="h3 mb-4 text-center">Create an account</h1>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
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
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
          <div className="form-text">Must include at least one letter and one number.</div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center mt-3">
        Already have an account?{' '}
        <Link to="/login" className="text-decoration-none">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
