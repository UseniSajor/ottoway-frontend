import React, { useState, useEffect } from 'react';
import { projectsApi, recommendationsApi } from '../../lib/api';
import './MLPages.css';

interface Recommendation {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (selectedProject) {
        try {
          const data = await projectsApi.getRecommendations(selectedProject);
          setRecommendations(data as Recommendation[]);
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        }
      }
      setIsLoading(false);
    };
    loadRecommendations();
  }, [selectedProject]);

  const handleAccept = async (id: string) => {
    try {
      await recommendationsApi.accept(id);
      setRecommendations(recommendations.map((r) => (r.id === id ? { ...r, status: 'ACCEPTED' } : r)));
    } catch (error) {
      console.error('Failed to accept recommendation:', error);
    }
  };

  const handleLabel = async (id: string, label: string) => {
    try {
      await recommendationsApi.label(id, label);
    } catch (error) {
      console.error('Failed to label recommendation:', error);
    }
  };

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h2>Recommendations & Outcomes</h2>
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

        {isLoading ? (
          <div className="ml-page__loading">Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="ml-page__empty">No recommendations found. Enter a project ID to view recommendations.</div>
        ) : (
          <div className="ml-page__grid">
            {recommendations.map((rec) => (
              <div key={rec.id} className="ml-page__card">
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
                <div className="ml-page__confidence">
                  Confidence: {(rec.confidence * 100).toFixed(1)}%
                </div>
                <div className={`ml-page__status ml-page__status--${rec.status.toLowerCase()}`}>
                  {rec.status}
                </div>
                {rec.status === 'PENDING' && (
                  <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <button
                      className="ml-page__button ml-page__button--success"
                      onClick={() => handleAccept(rec.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="ml-page__button ml-page__button--danger"
                      onClick={() => handleLabel(rec.id, 'rejected')}
                    >
                      Reject
                    </button>
                    <button
                      className="ml-page__button"
                      onClick={() => handleLabel(rec.id, 'override')}
                    >
                      Override
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;



