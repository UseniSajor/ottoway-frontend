import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import './OwnerPages.css';

interface PermitBlockingReason {
  type: 'CONTRACT_NOT_SIGNED' | 'DESIGN_NOT_APPROVED' | 'READINESS_INCOMPLETE';
  message: string;
}

interface PermitData {
  id?: string;
  status?: string;
  blockingReasons?: PermitBlockingReason[];
  canSubmit?: boolean;
}

const PermitsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [permit, setPermit] = useState<PermitData | null>(null);
  const [blockingReasons, setBlockingReasons] = useState<PermitBlockingReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPermit();
    }
  }, [id]);

  const loadPermit = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<PermitData>(`/projects/${id}/permits`);
      setPermit(response);
      setBlockingReasons(response.blockingReasons || []);
    } catch (err: any) {
      console.error('Failed to load permit:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load permit information');
      // Set empty state if permit doesn't exist yet
      setPermit(null);
      setBlockingReasons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPermit = async () => {
    if (!id || !permit?.canSubmit) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post(`/projects/${id}/permits/submit`);
      // Reload permit data after submission
      await loadPermit();
      alert('Permit submitted successfully!');
    } catch (err: any) {
      console.error('Failed to submit permit:', err);
      if (err?.response?.data?.blockingReasons) {
        setBlockingReasons(err.response.data.blockingReasons);
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to submit permit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBlocked = blockingReasons.length > 0 || !permit?.canSubmit;

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <h2>Permits</h2>
      </div>

      {error && (
        <div className="owner-page__error">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="owner-page__loading">Loading permit information...</div>
      ) : (
        <div className="owner-page__content">
          {isBlocked && blockingReasons.length > 0 && (
            <div className="owner-page__blocked-banner">
              <h3>⚠️ Permit Submission Blocked</h3>
              <p>You cannot submit permits until the following requirements are met:</p>
              <ul className="owner-page__blocking-reasons">
                {blockingReasons.map((reason, idx) => (
                  <li key={idx}>
                    <strong>{reason.type.replace(/_/g, ' ')}:</strong> {reason.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isBlocked && blockingReasons.length === 0 && (
            <div className="owner-page__success-banner" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>✅ Ready to Submit</h3>
              <p>All requirements have been met. You can now submit your permit application.</p>
            </div>
          )}

          <div className="owner-page__section">
            <h3>Permit Status</h3>
            <div className={`owner-page__status owner-page__status--${permit?.status?.toLowerCase() || 'not_started'}`}>
              {permit?.status || 'NOT_STARTED'}
            </div>
          </div>

          {!isBlocked && (
            <div className="owner-page__section">
              <button 
                className="owner-page__button owner-page__button--primary" 
                onClick={handleSubmitPermit}
                disabled={isSubmitting || isBlocked}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Permit Application'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PermitsPage;



