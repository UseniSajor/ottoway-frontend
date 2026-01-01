import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate portal based on role
    const rolePortalMap: Record<UserRole, string> = {
      HOMEOWNER: '/owner',
      PROJECT_OWNER: '/owner',
      BUILDING_OWNER: '/owner',
      BUSINESS_OWNER: '/owner',
      ASSET_MANAGER: '/owner',
      PROPERTY_MANAGER: '/owner',
      REAL_ESTATE_INVESTOR: '/owner',
      CORPORATE_FACILITIES: '/owner',
      DEVELOPER: '/owner',
      PROJECT_MANAGER: '/pm',
      PRIME_CONTRACTOR: '/contractor',
      SUBCONTRACTOR: '/contractor',
      DESIGNER: '/owner', // TODO: Determine correct portal
      ARCHITECT: '/owner', // TODO: Determine correct portal
      INSPECTOR: '/owner', // TODO: Determine correct portal
      LENDER: '/owner', // TODO: Determine correct portal
      ADMIN: '/admin',
      PLATFORM_OPERATOR: '/admin',
    };

    const redirectPath = rolePortalMap[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;

