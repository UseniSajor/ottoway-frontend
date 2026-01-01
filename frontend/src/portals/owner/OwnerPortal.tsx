import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import AutoEstimate from '../../components/AutoEstimate';
import OwnerDashboard from '../../pages/dashboard/OwnerDashboard';
import ProjectsListPage from '../../pages/owner/ProjectsListPage';
import ProjectDetailsPage from '../../pages/owner/ProjectDetailsPage';
import PropertiesPage from '../../pages/owner/PropertiesPage';
import PropertyDetailsPage from '../../pages/owner/PropertyDetailsPage';
import PropertyCreatePage from '../../pages/owner/PropertyCreatePage';
import TenantImprovementWizardPage from '../../pages/owner/TenantImprovementWizardPage';
import ReadinessPage from '../../pages/owner/ReadinessPage';
import ContractPage from '../../pages/owner/ContractPage';
import PermitsPage from '../../pages/owner/PermitsPage';
import EscrowPage from '../../pages/owner/EscrowPage';
import CloseoutPage from '../../pages/owner/CloseoutPage';
import ReviewsPage from '../../pages/owner/ReviewsPage';
import DesignPage from '../../pages/owner/DesignPage';
import ReadinessListPage from '../../pages/owner/ReadinessListPage';
import ContractsListPage from '../../pages/owner/ContractsListPage';
import PermitsListPage from '../../pages/owner/PermitsListPage';
import EscrowListPage from '../../pages/owner/EscrowListPage';
import CloseoutListPage from '../../pages/owner/CloseoutListPage';

// Estimate route component
const EstimateRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <div className="p-6"><AutoEstimate projectId={id!} /></div>;
};

const OwnerPortal: React.FC = () => {
  const navItems = [
    { path: '/owner/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/owner/projects', label: 'Projects', icon: '🏗️' },
    { path: '/owner/properties', label: 'Properties', icon: '🏠' },
    { path: '/owner/readiness', label: 'Readiness', icon: '✅' },
    { path: '/owner/contracts', label: 'Contracts', icon: '📄' },
    { path: '/owner/permits', label: 'Permits', icon: '📋' },
    { path: '/owner/escrow', label: 'Escrow', icon: '💰' },
    { path: '/owner/closeout', label: 'Closeout', icon: '🏁' },
    { path: '/owner/reviews', label: 'Reviews', icon: '⭐' },
  ];

  return (
    <AppShell portalName="Owner Portal" navItems={navItems}>
      <Routes>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="projects" element={<ProjectsListPage />} />
        <Route path="projects/:id" element={<ProjectDetailsPage />}>
          <Route path="design" element={<DesignPage />} />
          <Route path="readiness" element={<ReadinessPage />} />
          <Route path="contract" element={<ContractPage />} />
          <Route path="permits" element={<PermitsPage />} />
          <Route path="escrow" element={<EscrowPage />} />
          <Route path="closeout" element={<CloseoutPage />} />
          <Route path="estimate" element={<EstimateRoute />} />
        </Route>
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/new" element={<PropertyCreatePage />} />
        <Route path="properties/:id" element={<PropertyDetailsPage />} />
        <Route path="tenant-improvement" element={<TenantImprovementWizardPage />} />
        <Route path="readiness" element={<ReadinessListPage />} />
        <Route path="contracts" element={<ContractsListPage />} />
        <Route path="permits" element={<PermitsListPage />} />
        <Route path="escrow" element={<EscrowListPage />} />
        <Route path="closeout" element={<CloseoutListPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
      </Routes>
    </AppShell>
  );
};

export default OwnerPortal;

