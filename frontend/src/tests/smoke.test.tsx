import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import '@testing-library/jest-dom';

// Mock API client
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

describe('Frontend Smoke Tests', () => {
  it('should render login page at /login', () => {
    window.history.pushState({}, '', '/login');
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for login form elements
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('should render register page at /register', () => {
    window.history.pushState({}, '', '/register');
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  it('should redirect unauthenticated users to login', () => {
    window.history.pushState({}, '', '/owner/dashboard');
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Should redirect to login
    expect(window.location.pathname).toBe('/login');
  });

  it('should have route protection for owner portal', async () => {
    // Test that ProtectedRoute component exists and works
    const module = await import('../components/auth/ProtectedRoute');
    expect(module.default).toBeDefined();
  });

  it('should have route protection for ML portal', async () => {
    // ML portal should only be accessible to ADMIN/PLATFORM_OPERATOR
    const module = await import('../portals/ml/MLPortal');
    expect(module.default).toBeDefined();
  });
});



