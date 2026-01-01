import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login form submitted for:', email);
      await login(email, password);
      console.log('Login successful, redirecting...');
      // Redirect will be handled by ProtectedRoute based on role
      navigate('/owner/dashboard');
    } catch (err: any) {
      console.error('Login form error:', {
        message: err?.message,
        error: err,
      });
      // Display user-friendly error message
      const errorMessage = err?.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <div className="auth-page__header">
          <h1>Kealee Platform</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-page__form">
          {error && <div className="auth-page__error">{error}</div>}
          <div className="auth-page__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-page__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={isLoading} className="auth-page__submit">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-page__footer">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline bg-transparent border-none cursor-pointer"
              type="button"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

