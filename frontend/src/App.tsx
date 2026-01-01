import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OwnerPortal from './portals/owner/OwnerPortal';
import PMPortal from './portals/pm/PMPortal';
import ContractorPortal from './portals/contractor/ContractorPortal';
import AdminPortal from './portals/admin/AdminPortal';
import MLPortal from './portals/ml/MLPortal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected portal routes */}
            <Route
              path="/owner/*"
              element={
                <ProtectedRoute allowedRoles={['HOMEOWNER', 'PROJECT_OWNER', 'BUILDING_OWNER', 'BUSINESS_OWNER', 'ASSET_MANAGER', 'PROPERTY_MANAGER', 'REAL_ESTATE_INVESTOR', 'CORPORATE_FACILITIES', 'DEVELOPER']}>
                  <OwnerPortal />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/pm/*"
              element={
                <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                  <PMPortal />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/contractor/*"
              element={
                <ProtectedRoute allowedRoles={['PRIME_CONTRACTOR', 'SUBCONTRACTOR']}>
                  <ContractorPortal />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PLATFORM_OPERATOR']}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ml/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PLATFORM_OPERATOR']}>
                  <MLPortal />
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;



