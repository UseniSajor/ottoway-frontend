import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pmApi } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './PMPages.css';

interface ReadinessItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
}

const ReadinessQueuePage: React.FC = () => {
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Load cross-project readiness queue from API when endpoint is available
      // For now, set empty array
      setItems([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load readiness queue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadQueue} />;

  return (
    <div className="pm-page">
      <div className="pm-page__header">
        <h1 className="text-3xl font-bold mb-8">Readiness Queue</h1>
        <p className="text-gray-600 mb-8">Cross-project readiness items requiring attention</p>
      </div>

      {items.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Readiness Items in Queue"
            description="All readiness items are up to date across all projects"
          />
        </div>
      ) : (
        <div className="pm-page__queue">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/pm/projects/${item.projectId}/readiness`}
              className={`pm-page__queue-item pm-page__queue-item--${item.priority}`}
            >
              <div className="pm-page__queue-project">{item.projectName}</div>
              <div className="pm-page__queue-title">{item.title}</div>
              <div className={`pm-page__queue-status pm-page__queue-status--${item.status.toLowerCase()}`}>
                {item.status}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadinessQueuePage;



