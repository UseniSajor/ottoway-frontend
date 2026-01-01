import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, Outlet } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';
import AutoEstimate from '../../components/AutoEstimate';
import './OwnerPages.css';
import './ProjectDetailsPage.css';

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError('');
      const response = await projectsApi.get(id);
      const data = (response as any)?.data || response;
      setProject(data as Project);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err?.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: '#999',
      DESIGN: '#0066cc',
      READINESS: '#ff9800',
      CONTRACT_NEGOTIATION: '#9c27b0',
      PERMIT_SUBMISSION: '#2196f3',
      PERMITTED: '#4caf50',
      CONSTRUCTION: '#ff5722',
      CLOSEOUT: '#607d8b',
      COMPLETED: '#4caf50',
      ON_HOLD: '#ff9800',
      CANCELLED: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      SIMPLE: '#4caf50',
      MODERATE: '#ff9800',
      COMPLEX: '#ff5722',
      MAJOR: '#f44336',
    };
    return colors[complexity] || '#999';
  };

  const isActiveTab = (path: string) => {
    if (path === '/overview') {
      return location.pathname === `/owner/projects/${id}`;
    }
    return location.pathname.includes(path);
  };

  if (isLoading) {
    return <div className="owner-page__loading">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="owner-page__empty">
        <p>Project not found</p>
        <Link to="/owner/projects" className="owner-page__button">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to="/owner/projects" className="owner-page__back">
          ← Back to Projects
        </Link>
        <div className="project-details__header-content">
          <div>
            <h2>{project.name}</h2>
            <div className="project-details__badges">
              <span
                className="project-details__badge project-details__badge--category"
                style={{ backgroundColor: '#f0f7ff', color: '#0066cc' }}
              >
                {formatLabel(project.category)}
              </span>
              <span
                className="project-details__badge project-details__badge--type"
                style={{ backgroundColor: '#f5f5f5', color: '#666' }}
              >
                {formatLabel(project.projectType)}
              </span>
              <span
                className="project-details__badge project-details__badge--complexity"
                style={{
                  backgroundColor: getComplexityColor(project.complexity) + '20',
                  color: getComplexityColor(project.complexity)
                }}
              >
                {formatLabel(project.complexity)}
              </span>
              <span
                className="project-details__badge project-details__badge--status"
                style={{ backgroundColor: getStatusColor(project.status || 'PLANNING') }}
              >
                {formatLabel(project.status || 'PLANNING')}
              </span>
            </div>
          </div>
          {project.propertyId && (
            <Link
              to={`/owner/properties/${project.propertyId}`}
              className="project-details__property-link"
            >
              View Property →
            </Link>
          )}
        </div>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {/* Tab Navigation */}
      <div className="project-details__tabs">
        <Link
          to={`/owner/projects/${id}`}
          className={`project-details__tab ${isActiveTab('/overview') ? 'active' : ''}`}
        >
          Overview
        </Link>
        <Link
          to={`/owner/projects/${id}/design`}
          className={`project-details__tab ${isActiveTab('/design') ? 'active' : ''}`}
        >
          Design
        </Link>
        <Link
          to={`/owner/projects/${id}/readiness`}
          className={`project-details__tab ${isActiveTab('/readiness') ? 'active' : ''}`}
        >
          Readiness
        </Link>
        <Link
          to={`/owner/projects/${id}/contract`}
          className={`project-details__tab ${isActiveTab('/contract') ? 'active' : ''}`}
        >
          Contract
        </Link>
        <Link
          to={`/owner/projects/${id}/permits`}
          className={`project-details__tab ${isActiveTab('/permits') ? 'active' : ''}`}
        >
          Permits
        </Link>
        <Link
          to={`/owner/projects/${id}/escrow`}
          className={`project-details__tab ${isActiveTab('/escrow') ? 'active' : ''}`}
        >
          Escrow
        </Link>
        <Link
          to={`/owner/projects/${id}/closeout`}
          className={`project-details__tab ${isActiveTab('/closeout') ? 'active' : ''}`}
        >
          Closeout
        </Link>
        <Link
          to={`/owner/projects/${id}/estimate`}
          className={`project-details__tab ${isActiveTab('/estimate') ? 'active' : ''}`}
        >
          Cost Estimate
        </Link>
      </div>

      {/* Tab Content */}
      <div className="project-details__content">
        {location.pathname.includes('/estimate') ? (
          <div className="project-details__overview p-6">
            <AutoEstimate 
              projectId={id!}
              onEstimateGenerated={(estimate) => {
                console.log('New estimate generated:', estimate);
                // Optionally reload project data
              }}
            />
          </div>
        ) : location.pathname === `/owner/projects/${id}` ? (
          <div className="project-details__overview">
            <div className="project-details__info-section">
              <div className="owner-page__section">
                <h3>Project Information</h3>
                <div className="owner-page__info-grid">
                  <div>
                    <label>Project Type</label>
                    <div>{formatLabel(project.projectType)}</div>
                  </div>
                  <div>
                    <label>Category</label>
                    <div>{formatLabel(project.category)}</div>
                  </div>
                  <div>
                    <label>Complexity</label>
                    <div>{formatLabel(project.complexity)}</div>
                  </div>
                  <div>
                    <label>Status</label>
                    <div>{formatLabel(project.status || 'PLANNING')}</div>
                  </div>
                  {project.squareFootage && (
                    <div>
                      <label>Square Footage</label>
                      <div>{project.squareFootage.toLocaleString()} sq ft</div>
                    </div>
                  )}
                  {project.unitCount && (
                    <div>
                      <label>Unit Count</label>
                      <div>{project.unitCount}</div>
                    </div>
                  )}
                  {project.jurisdiction && (
                    <div>
                      <label>Jurisdiction</label>
                      <div>{project.jurisdiction}</div>
                    </div>
                  )}
                  {project.permitAuthority && (
                    <div>
                      <label>Permit Authority</label>
                      <div>{project.permitAuthority}</div>
                    </div>
                  )}
                </div>
              </div>

              {project.description && (
                <div className="owner-page__section">
                  <h3>Description</h3>
                  <p>{project.description}</p>
                </div>
              )}
            </div>

            <div className="project-details__quick-actions">
              <h3>Quick Actions</h3>
              <div className="project-details__actions-list">
                {project.status === 'PLANNING' || project.status === 'DESIGN' ? (
                  <Link
                    to={`/owner/projects/${id}/design`}
                    className="project-details__action-button"
                  >
                    Upload Design
                  </Link>
                ) : null}
                {project.status === 'READINESS' ? (
                  <Link
                    to={`/owner/projects/${id}/readiness`}
                    className="project-details__action-button"
                  >
                    Complete Readiness
                  </Link>
                ) : null}
                {project.status === 'CONTRACT_NEGOTIATION' ? (
                  <Link
                    to={`/owner/projects/${id}/contract`}
                    className="project-details__action-button"
                  >
                    Review Contract
                  </Link>
                ) : null}
                {project.status === 'PERMIT_SUBMISSION' || project.status === 'PERMITTED' ? (
                  <Link
                    to={`/owner/projects/${id}/permits`}
                    className="project-details__action-button"
                  >
                    View Permits
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
