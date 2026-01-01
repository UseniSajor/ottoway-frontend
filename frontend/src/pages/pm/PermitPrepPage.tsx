import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './PMPages.css';

interface BlockingReason {
  type: string;
  message: string;
}

const PermitPrepPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isBlocked, setIsBlocked] = useState(true);
  const [blockingReasons, setBlockingReasons] = useState<BlockingReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermitStatus();
  }, [id]);

  const loadPermitStatus = async () => {
    if (!id) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Load permit status from API when endpoint is available
      // Backend should return blockingReasons
      // For now, using mock structure
      setBlockingReasons([
        { type: 'CONTRACT_NOT_SIGNED', message: 'Contract must be fully signed before permit submission' },
      ]);
      setIsBlocked(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to load permit status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadPermitStatus} />;

  return (
    <div className="pm-page">
      <div className="pm-page__header">
        <h1 className="text-3xl font-bold mb-8">Permit Preparation</h1>
      </div>

      <div className="pm-page__content">
          {isBlocked && (
            <div className="pm-page__blocked-banner">
              <h3>⚠️ Permit Submission Blocked</h3>
              <p>Permit submission is blocked until the following requirements are met:</p>
              <ul className="pm-page__blocking-reasons">
                {blockingReasons.map((reason, idx) => (
                  <li key={idx}>
                    <strong>{reason.type.replace(/_/g, ' ')}:</strong> {reason.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pm-page__section">
            <h3>Permit Requirements Checklist</h3>
            <div className="pm-page__checklist">
              {/* TODO: Show permit requirements checklist */}
            </div>
          </div>

          {!isBlocked && (
            <div className="pm-page__section">
              <button className="pm-page__button">Submit Permit Application</button>
            </div>
          )}
      </div>
    </div>
  );
};

export default PermitPrepPage;



