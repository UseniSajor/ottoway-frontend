import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { escrowApi } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './ContractorPages.css';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'PAID';
  completedAt?: string;
}

const MilestonesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [id]);

  const loadMilestones = async () => {
    if (!id) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Load milestones from API when endpoint is available
      // For now, set empty array
      setMilestones([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadMilestones} />;

  return (
    <div className="contractor-page">
      <div className="contractor-page__header">
        <h1 className="text-3xl font-bold mb-8">Milestones & Evidence Upload</h1>
      </div>

      {milestones.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Milestones Yet"
            description="Milestones will appear here once they are created for this project"
          />
        </div>
      ) : (
        <div className="contractor-page__milestones">
          {milestones.map((milestone) => (
            <div key={milestone.id} className={`contractor-page__milestone contractor-page__milestone--${milestone.status.toLowerCase()}`}>
              <div className="contractor-page__milestone-header">
                <h3>{milestone.name}</h3>
                <span className={`contractor-page__milestone-status contractor-page__milestone-status--${milestone.status.toLowerCase()}`}>
                  {milestone.status}
                </span>
              </div>
              {milestone.description && <p>{milestone.description}</p>}
              {milestone.amount && (
                <div className="contractor-page__milestone-amount">
                  ${milestone.amount.toLocaleString()}
                </div>
              )}
              {milestone.status === 'IN_PROGRESS' && (
                <div className="contractor-page__milestone-actions">
                  <button className="contractor-page__button">Upload Evidence</button>
                  <button className="contractor-page__button">Mark Complete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestonesPage;



