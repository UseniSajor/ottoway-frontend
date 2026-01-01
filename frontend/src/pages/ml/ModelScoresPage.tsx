import React, { useState, useEffect } from 'react';
import { projectsApi } from '../../lib/api';
import './MLPages.css';

interface ModelScore {
  id: string;
  projectId: string;
  modelType: string;
  score: number;
  createdAt: string;
}

const ModelScoresPage: React.FC = () => {
  const [scores, setScores] = useState<ModelScore[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      if (selectedProject) {
        try {
          const data = await projectsApi.getScores(selectedProject);
          setScores(data as ModelScore[]);
        } catch (error) {
          console.error('Failed to load scores:', error);
        }
      }
      setIsLoading(false);
    };
    loadScores();
  }, [selectedProject]);

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h2>Model Scores</h2>
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
          <div className="ml-page__loading">Loading scores...</div>
        ) : scores.length === 0 ? (
          <div className="ml-page__empty">No scores found. Enter a project ID to view scores.</div>
        ) : (
          <table className="ml-page__table">
            <thead>
              <tr>
                <th>Model Type</th>
                <th>Score</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td>{score.modelType}</td>
                  <td>
                    <span className="ml-page__score">{score.score.toFixed(3)}</span>
                  </td>
                  <td>{new Date(score.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ModelScoresPage;



