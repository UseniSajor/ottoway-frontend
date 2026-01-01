import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ContractorPages.css';

const ContractorProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="contractor-profile-page">
      <div className="contractor-profile-page__header">
        <h2>Contractor Profile</h2>
      </div>

      <div className="contractor-profile-page__content">
        <div className="contractor-profile-page__section">
          <h3>Company Information</h3>
          <div className="contractor-profile-page__info-grid">
            <div>
              <label>Name</label>
              <div>
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            <div>
              <label>Email</label>
              <div>{user?.email}</div>
            </div>
            <div>
              <label>Role</label>
              <div>{user?.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>

        <div className="contractor-profile-page__section">
          <h3>Stripe Connect</h3>
          <div className="contractor-profile-page__stripe-section">
            <p>Set up Stripe Connect to receive payments directly to your account.</p>
            <button className="contractor-profile-page__stripe-button">
              Connect Stripe Account
            </button>
          </div>
        </div>

        <div className="contractor-profile-page__section">
          <h3>License & Insurance</h3>
          <div className="contractor-profile-page__empty">
            <p>License and insurance information coming soon...</p>
          </div>
        </div>

        <div className="contractor-profile-page__section">
          <h3>Certifications</h3>
          <div className="contractor-profile-page__empty">
            <p>Certifications coming soon...</p>
          </div>
        </div>

        <div className="contractor-profile-page__section">
          <h3>Reviews</h3>
          <div className="contractor-profile-page__empty">
            <p>Reviews received coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorProfilePage;

