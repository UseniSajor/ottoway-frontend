import React from 'react';
import './ContractorPages.css';

const ContractorSchedulePage: React.FC = () => {
  return (
    <div className="contractor-schedule-page">
      <div className="contractor-schedule-page__header">
        <h2>Schedule</h2>
      </div>

      <div className="contractor-schedule-page__content">
        <div className="contractor-schedule-page__empty">
          <p>Schedule view coming soon...</p>
          <p className="contractor-schedule-page__hint">
            View project timelines, milestones, inspections, and crew scheduling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractorSchedulePage;


