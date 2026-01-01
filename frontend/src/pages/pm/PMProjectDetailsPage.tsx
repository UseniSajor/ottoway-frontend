import React, { useState, useEffect } from 'react';
import { useParams, Link, Outlet, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';
import './PMPages.css';

const PMProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <div className="pm-project-details-page">
        <div className="pm-project-details-page__loading">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pm-project-details-page">
        <div className="pm-project-details-page__error">Project not found</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'design', label: 'Design' },
    { id: 'readiness', label: 'Readiness' },
    { id: 'contract', label: 'Contract' },
    { id: 'permits', label: 'Permits' },
    { id: 'escrow', label: 'Escrow' },
    { id: 'closeout', label: 'Closeout' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'team', label: 'Team' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="pm-project-details-page">
      <div className="pm-project-details-page__header">
        <Link to="/pm/projects" className="pm-project-details-page__back">
          ← Back to Projects
        </Link>
        <div className="pm-project-details-page__title-section">
          <h2>{project.name}</h2>
          <div className="pm-project-details-page__badges">
            <span className={`pm-project-details-page__status pm-project-details-page__status--${project.status.toLowerCase()}`}>
              {project.status.replace(/_/g, ' ')}
            </span>
            <span className="pm-project-details-page__category">{project.category.replace(/_/g, ' ')}</span>
            <span className="pm-project-details-page__complexity">{project.complexity}</span>
          </div>
        </div>
      </div>

      <div className="pm-project-details-page__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pm-project-details-page__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pm-project-details-page__content">
        {activeTab === 'overview' && (
          <div className="pm-project-details-page__overview">
            <div className="pm-project-details-page__info-section">
              <h3>Project Information</h3>
              <div className="pm-project-details-page__info-grid">
                <div>
                  <label>Owner</label>
                  <div>{project.owner?.firstName} {project.owner?.lastName}</div>
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
                {project.description && (
                  <div className="pm-project-details-page__description">
                    <label>Description</label>
                    <div>{project.description}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="pm-project-details-page__section">
            <p>Design management coming soon...</p>
            <Link to={`/owner/projects/${id}/design`}>View Design Page</Link>
          </div>
        )}

        {activeTab === 'readiness' && (
          <div className="pm-project-details-page__section">
            <p>Readiness checklist coming soon...</p>
            <Link to={`/owner/projects/${id}/readiness`}>View Readiness Page</Link>
          </div>
        )}

        {/* Other tabs would render similar placeholder content */}
      </div>
    </div>
  );
};

export default PMProjectDetailsPage;

