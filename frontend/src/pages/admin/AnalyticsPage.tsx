import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './AdminPages.css';

interface AnalyticsData {
  projectTypeDistribution: Record<string, number>;
  complexityDistribution: Record<string, number>;
  totalProjects: number;
  activeProjects: number;
}

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Load analytics from API when endpoint is available
      // For now, using default structure
      setAnalytics({
        projectTypeDistribution: {},
        complexityDistribution: {},
        totalProjects: 0,
        activeProjects: 0,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadAnalytics} />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      </div>

      {analytics && (
        <>
          <div className="admin-page__analytics">
            <div className="admin-page__analytics-card">
              <div className="admin-page__analytics-value">{analytics?.totalProjects || 0}</div>
              <div className="admin-page__analytics-label">Total Projects</div>
            </div>
            <div className="admin-page__analytics-card">
              <div className="admin-page__analytics-value">{analytics?.activeProjects || 0}</div>
              <div className="admin-page__analytics-label">Active Projects</div>
            </div>
          </div>

          <div className="admin-page__chart">
            <h3>Project Type Distribution</h3>
            <div>TODO: Implement project type analytics chart</div>
          </div>

          <div className="admin-page__chart">
            <h3>Complexity Distribution</h3>
            <div>TODO: Implement complexity distribution chart</div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;



