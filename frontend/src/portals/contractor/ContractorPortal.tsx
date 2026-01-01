import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import ContractorDashboard from '../../pages/contractor/ContractorDashboard';
import ContractorProjectsPage from '../../pages/contractor/ContractorProjectsPage';
import ContractorProjectDetailsPage from '../../pages/contractor/ContractorProjectDetailsPage';
import SubcontractorManagementPage from '../../pages/contractor/SubcontractorManagementPage';
import ContractorSchedulePage from '../../pages/contractor/ContractorSchedulePage';
import InvoicesPage from '../../pages/contractor/InvoicesPage';
import ContractorProfilePage from '../../pages/contractor/ContractorProfilePage';

const ContractorPortal: React.FC = () => {
  const navItems = [
    { path: '/contractor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/contractor/projects', label: 'Projects', icon: '🏗️' },
    { path: '/contractor/subcontractors', label: 'Subcontractors', icon: '👥' },
    { path: '/contractor/schedule', label: 'Schedule', icon: '📅' },
    { path: '/contractor/invoices', label: 'Invoices', icon: '💰' },
    { path: '/contractor/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <AppShell portalName="Contractor Portal" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/contractor/dashboard" replace />} />
        <Route path="dashboard" element={<ContractorDashboard />} />
        <Route path="projects" element={<ContractorProjectsPage />} />
        <Route path="projects/:id" element={<ContractorProjectDetailsPage />} />
        <Route path="subcontractors" element={<SubcontractorManagementPage />} />
        <Route path="schedule" element={<ContractorSchedulePage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="profile" element={<ContractorProfilePage />} />
      </Routes>
    </AppShell>
  );
};

export default ContractorPortal;

