import React, { useState, useEffect } from 'react';
import { projectsApi } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './MLPages.css';

interface RiskScore {
  type: 'PERMIT' | 'DISPUTE' | 'SCHEDULE' | 'COST';
  value: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

const RiskDashboardPage: React.FC = () => {
  const [risks, setRisks] = useState<RiskScore[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRisks = async () => {
    if (!selectedProject) {
      setRisks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Load risk scores from API when endpoint is available
      // For now, using mock data structure
      const scores = await projectsApi.getScores(selectedProject);
      // Transform API response to RiskScore format when available
      setRisks([
        { type: 'PERMIT', value: 0.75, level: 'HIGH' },
        { type: 'DISPUTE', value: 0.35, level: 'LOW' },
        { type: 'SCHEDULE', value: 0.55, level: 'MEDIUM' },
        { type: 'COST', value: 0.45, level: 'LOW' },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load risk scores');
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [selectedProject]);

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h1 className="text-3xl font-bold mb-8">Risk Dashboard</h1>
      </div>

      <div className="ml-page__card">
        <div className="ml-page__filters">
          <label>Project ID</label>
          <input
            type="text"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            placeholder="Enter project ID..."
          />
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={loadRisks} />}
        {!loading && !error && !selectedProject && (
          <div className="p-8">
            <EmptyState
              title="Select a Project"
              description="Enter a project ID to view risk scores"
            />
          </div>
        )}
        {!loading && !error && selectedProject && risks.length === 0 && (
          <div className="p-8">
            <EmptyState
              title="No Risk Scores Available"
              description="Risk scores are not available for this project yet"
            />
          </div>
        )}
        {!loading && !error && selectedProject && risks.length > 0 && (
          <div className="ml-page__grid">
            {risks.map((risk) => (
              <div key={risk.type} className={`ml-page__risk-card ml-page__risk-card--${risk.level.toLowerCase()}`}>
                <div className="ml-page__risk-value">{(risk.value * 100).toFixed(0)}%</div>
                <div className="ml-page__risk-label">{risk.type} Risk</div>
                <div className="ml-page__status ml-page__status--pending">{risk.level}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDashboardPage;



