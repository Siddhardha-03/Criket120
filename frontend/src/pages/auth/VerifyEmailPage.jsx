import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token missing. Please use the link sent to your email.');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Verification failed. The link may be expired or invalid.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="container py-5" style={{ maxWidth: '540px' }}>
      <div className="card shadow-sm border-0 p-4 text-center">
        <div className="mb-3">
          {status === 'pending' && (
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
          )}
          {status === 'success' && <span className="display-6 text-success">✓</span>}
          {status === 'error' && <span className="display-6 text-danger">!</span>}
        </div>
        <h1 className="h4 mb-3">
          {status === 'pending' && 'Verifying your email...'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>
        <p className="text-muted mb-0">{message || 'Please wait while we confirm your account.'}</p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
