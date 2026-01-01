import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import UserManagementPage from '../../pages/admin/UserManagementPage';
import ContractorApprovalsPage from '../../pages/admin/ContractorApprovalsPage';
import AdminProjectsPage from '../../pages/admin/AdminProjectsPage';
import EscrowMonitoringPage from '../../pages/admin/EscrowMonitoringPage';
import DisputesPage from '../../pages/admin/DisputesPage';
import AuditLogPage from '../../pages/admin/AuditLogPage';
import PlatformSettingsPage from '../../pages/admin/PlatformSettingsPage';

const AdminPortal: React.FC = () => {
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/contractors', label: 'Contractors', icon: '🔨' },
    { path: '/admin/projects', label: 'Projects', icon: '🏗️' },
    { path: '/admin/escrow', label: 'Escrow', icon: '💰' },
    { path: '/admin/disputes', label: 'Disputes', icon: '⚖️' },
    { path: '/admin/audit', label: 'Audit Log', icon: '📋' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <AppShell portalName="Admin Portal" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="contractors" element={<ContractorApprovalsPage />} />
        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="escrow" element={<EscrowMonitoringPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="disputes/:id" element={<DisputesPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
      </Routes>
    </AppShell>
  );
};

export default AdminPortal;

