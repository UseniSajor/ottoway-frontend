import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';export default function LoginPage() {
const navigate = useNavigate();
const { login } = useAuth();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
setError('');
setLoading(true);try {
  await login(email, password);
  // AuthContext will handle the redirect based on role
  navigate('/owner/dashboard');
} catch (err: any) {
  setError(err?.message || 'Invalid email or password. Please try again.');
} finally {
  setLoading(false);
}
};return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
<div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
{/* Logo and Header */}
<div className="text-center mb-8">
<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
<svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
</svg>
</div>
<h1 className="text-3xl font-bold text-gray-900 mb-2">KEALEE</h1>
<p className="text-gray-600">Construction Management Platform</p>
</div>    {/* Login Form */}
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="your-email@example.com"
        />
      </div>      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="Enter your password"
        />
      </div>      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </div>
        ) : (
          'SIGN IN'
        )}
      </button>
    </form>    {/* Register Link */}
    <div className="mt-6 text-center">
      <p className="text-gray-600 text-sm">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/register')}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          type="button"
        >
          Register here
        </button>
      </p>
    </div>    {/* Forgot Password */}
    <div className="mt-4 text-center">
      <button
        onClick={() => navigate('/forgot-password')}
        className="text-sm text-gray-500 hover:text-gray-700 transition"
        type="button"
      >
        Forgot password?
      </button>
    </div>
  </div>
</div>
);
}
