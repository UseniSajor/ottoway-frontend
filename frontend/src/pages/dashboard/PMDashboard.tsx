import React from 'react';
import './DashboardPages.css';

const PMDashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h2>Project Manager Dashboard</h2>
        <p>Manage your projects and teams</p>
      </div>
      <div className="dashboard-page__content">
        <div className="dashboard-page__card">
          <h3>Active Projects</h3>
          <p>TODO: Implement active projects list</p>
        </div>
        <div className="dashboard-page__card">
          <h3>Tasks & Milestones</h3>
          <p>TODO: Implement tasks and milestones widget</p>
        </div>
      </div>
    </div>
  );
};

export default PMDashboard;



