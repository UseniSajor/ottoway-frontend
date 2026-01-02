import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function usePortalNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const getPortalBase = () => {
    const rolePortalMap: Record<string, string> = {
      'HOMEOWNER': '/owner',
      'PROJECT_OWNER': '/owner',
      'BUILDING_OWNER': '/owner',
      'BUSINESS_OWNER': '/owner',
      'ASSET_MANAGER': '/owner',
      'PROPERTY_MANAGER': '/owner',
      'REAL_ESTATE_INVESTOR': '/owner',
      'CORPORATE_FACILITIES': '/owner',
      'DEVELOPER': '/owner',
      'PROJECT_MANAGER': '/pm',
      'PRIME_CONTRACTOR': '/contractor',
      'SUBCONTRACTOR': '/contractor',
      'DESIGNER': '/owner',
      'ARCHITECT': '/owner',
      'INSPECTOR': '/owner',
      'LENDER': '/owner',
      'ADMIN': '/admin',
      'PLATFORM_OPERATOR': '/admin'
    };
    
    return rolePortalMap[user?.role || 'HOMEOWNER'] || '/owner';
  };
  
  const navigateTo = (path: string) => {
    const base = getPortalBase();
    navigate(`${base}${path}`);
  };
  
  return { navigateTo, getPortalBase };
}


