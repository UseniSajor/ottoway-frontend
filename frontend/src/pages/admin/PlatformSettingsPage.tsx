import React from 'react';
import './AdminPages.css';

const PlatformSettingsPage: React.FC = () => {
  return (
    <div className="platform-settings-page">
      <div className="platform-settings-page__header">
        <h2>Platform Settings</h2>
      </div>

      <div className="platform-settings-page__content">
        <div className="platform-settings-page__section">
          <h3>General Settings</h3>
          <div className="platform-settings-page__empty">
            <p>Platform settings configuration coming soon...</p>
          </div>
        </div>

        <div className="platform-settings-page__section">
          <h3>Feature Flags</h3>
          <div className="platform-settings-page__empty">
            <p>Feature flag management coming soon...</p>
          </div>
        </div>

        <div className="platform-settings-page__section">
          <h3>Email Templates</h3>
          <div className="platform-settings-page__empty">
            <p>Email template management coming soon...</p>
          </div>
        </div>

        <div className="platform-settings-page__section">
          <h3>Payment Settings</h3>
          <div className="platform-settings-page__empty">
            <p>Stripe and payment configuration coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettingsPage;


