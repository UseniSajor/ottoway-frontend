import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'HOMEOWNER',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      // Redirect will be handled by ProtectedRoute based on role
      navigate('/owner/dashboard');
    } catch (err: any) {
      // Display actual server error message
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <div className="auth-page__header">
          <h1>Create Account</h1>
          <p>Join Kealee Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-page__form">
          {error && <div className="auth-page__error">{error}</div>}
          <div className="auth-page__field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="auth-page__field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="auth-page__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-page__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="auth-page__field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="HOMEOWNER">Homeowner</option>
              <option value="PROJECT_OWNER">Project Owner</option>
              <option value="BUILDING_OWNER">Building Owner</option>
              <option value="BUSINESS_OWNER">Business Owner</option>
              <option value="ASSET_MANAGER">Asset Manager</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="REAL_ESTATE_INVESTOR">Real Estate Investor</option>
              <option value="CORPORATE_FACILITIES">Corporate Facilities</option>
              <option value="DEVELOPER">Developer</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="PRIME_CONTRACTOR">Prime Contractor</option>
            </select>
          </div>
          <button type="submit" disabled={isLoading} className="auth-page__submit">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-page__footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
