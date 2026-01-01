import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';
import './ContractorPages.css';

const ContractorProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await projectsApi.get(id);
      const data = (response as any)?.data || response;
      setProject(data as Project);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="contractor-project-details-page">
        <div className="contractor-project-details-page__loading">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="contractor-project-details-page">
        <div className="contractor-project-details-page__error">Project not found</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contract', label: 'Contract' },
    { id: 'work-progress', label: 'Work Progress' },
    { id: 'payments', label: 'Payments' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <div className="contractor-project-details-page">
      <div className="contractor-project-details-page__header">
        <Link to="/contractor/projects" className="contractor-project-details-page__back">
          ← Back to Projects
        </Link>
        <div className="contractor-project-details-page__title-section">
          <h2>{project.name}</h2>
          <div className="contractor-project-details-page__badges">
            <span
              className={`contractor-project-details-page__status contractor-project-details-page__status--${project.status.toLowerCase()}`}
            >
              {project.status.replace(/_/g, ' ')}
            </span>
            <span className="contractor-project-details-page__category">
              {project.category.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="contractor-project-details-page__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`contractor-project-details-page__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="contractor-project-details-page__content">
        {activeTab === 'overview' && (
          <div className="contractor-project-details-page__overview">
            <div className="contractor-project-details-page__info-section">
              <h3>Project Information</h3>
              <div className="contractor-project-details-page__info-grid">
                <div>
                  <label>Owner</label>
                  <div>
                    {project.owner?.firstName} {project.owner?.lastName}
                  </div>
                </div>
                <div>
                  <label>Property</label>
                  <div>
                    {project.property
                      ? `${project.property.streetAddress}, ${project.property.city}, ${project.property.state}`
                      : 'No property assigned'}
                  </div>
                </div>
                <div>
                  <label>Category</label>
                  <div>{project.category.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <label>Type</label>
                  <div>{project.projectType.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <label>Complexity</label>
                  <div>{project.complexity}</div>
                </div>
                <div>
                  <label>Status</label>
                  <div>{project.status.replace(/_/g, ' ')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="contractor-project-details-page__section">
            <p>Contract details coming soon...</p>
          </div>
        )}

        {activeTab === 'work-progress' && (
          <div className="contractor-project-details-page__section">
            <p>Work progress tracking coming soon...</p>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="contractor-project-details-page__section">
            <p>Payment management coming soon...</p>
            <Link to={`/owner/projects/${id}/escrow`}>View Escrow Page</Link>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="contractor-project-details-page__section">
            <p>Schedule view coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorProjectDetailsPage;

