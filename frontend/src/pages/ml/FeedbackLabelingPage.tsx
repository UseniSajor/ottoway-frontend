import React, { useState, useEffect } from 'react';
import { projectsApi, recommendationsApi } from '../../lib/api';
import './MLPages.css';

interface Recommendation {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
}

const FeedbackLabelingPage: React.FC = () => {
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

  const handleLabel = async (id: string, label: string, notes?: string) => {
    try {
      await recommendationsApi.label(id, { label, notes });
      // TODO: Refresh recommendations
    } catch (error) {
      console.error('Failed to label recommendation:', error);
    }
  };

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h2>Feedback Labeling</h2>
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
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <button
                    className="ml-page__button ml-page__button--success"
                    onClick={() => handleLabel(rec.id, 'positive')}
                  >
                    Positive
                  </button>
                  <button
                    className="ml-page__button ml-page__button--danger"
                    onClick={() => handleLabel(rec.id, 'negative')}
                  >
                    Negative
                  </button>
                  <button
                    className="ml-page__button"
                    onClick={() => handleLabel(rec.id, 'neutral')}
                  >
                    Neutral
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackLabelingPage;



