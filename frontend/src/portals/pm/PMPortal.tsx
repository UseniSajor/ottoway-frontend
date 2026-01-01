import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import PMDashboard from '../../pages/pm/PMDashboard';
import PMProjectsPage from '../../pages/pm/PMProjectsPage';
import PMProjectDetailsPage from '../../pages/pm/PMProjectDetailsPage';
import TeamManagementPage from '../../pages/pm/TeamManagementPage';
import MasterSchedulePage from '../../pages/pm/MasterSchedulePage';
import ReportsPage from '../../pages/pm/ReportsPage';

const PMPortal: React.FC = () => {
  const navItems = [
    { path: '/pm/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/pm/projects', label: 'Projects', icon: '🏗️' },
    { path: '/pm/team', label: 'Team', icon: '👥' },
    { path: '/pm/schedule', label: 'Schedule', icon: '📅' },
    { path: '/pm/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <AppShell portalName="PM Portal" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/pm/dashboard" replace />} />
        <Route path="dashboard" element={<PMDashboard />} />
        <Route path="projects" element={<PMProjectsPage />} />
        <Route path="projects/:id" element={<PMProjectDetailsPage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="schedule" element={<MasterSchedulePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Routes>
    </AppShell>
  );
};

export default PMPortal;

