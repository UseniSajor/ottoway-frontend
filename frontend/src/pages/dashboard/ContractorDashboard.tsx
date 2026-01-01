import React from 'react';
import './DashboardPages.css';

const ContractorDashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h2>Contractor Dashboard</h2>
        <p>Manage your construction projects</p>
      </div>
      <div className="dashboard-page__content">
        <div className="dashboard-page__card">
          <h3>Active Projects</h3>
          <p>TODO: Implement active projects list</p>
        </div>
        <div className="dashboard-page__card">
          <h3>Subcontractors</h3>
          <p>TODO: Implement subcontractor management (visible only for MAJOR complexity projects)</p>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;



