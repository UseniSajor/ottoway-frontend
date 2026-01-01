import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import MLDashboard from '../../pages/dashboard/MLDashboard';
import EventMonitorPage from '../../pages/ml/EventMonitorPage';
import AutomationRulesPage from '../../pages/ml/AutomationRulesPage';
import ModelScoresPage from '../../pages/ml/ModelScoresPage';
import RecommendationsPage from '../../pages/ml/RecommendationsPage';
import RiskDashboardPage from '../../pages/ml/RiskDashboardPage';
import FeedbackLabelingPage from '../../pages/ml/FeedbackLabelingPage';

const MLPortal: React.FC = () => {
  const navItems = [
    { path: '/ml/dashboard', label: 'Dashboard' },
    { path: '/ml/events', label: 'Events' },
    { path: '/ml/automation', label: 'Automation Rules' },
    { path: '/ml/scores', label: 'Scores' },
    { path: '/ml/recommendations', label: 'Recommendations' },
    { path: '/ml/risk', label: 'Risk Analysis' },
    { path: '/ml/feedback', label: 'Feedback Labeling' },
  ];

  return (
    <AppShell portalName="ML & Automation Portal" navItems={navItems}>
      <Routes>
        <Route path="dashboard" element={<MLDashboard />} />
        <Route path="events" element={<EventMonitorPage />} />
        <Route path="automation" element={<AutomationRulesPage />} />
        <Route path="scores" element={<ModelScoresPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="risk" element={<RiskDashboardPage />} />
        <Route path="feedback" element={<FeedbackLabelingPage />} />
      </Routes>
    </AppShell>
  );
};

export default MLPortal;

