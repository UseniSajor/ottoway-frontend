import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProjectTypeWizard from '../../components/projects/ProjectTypeWizard';
import { propertiesApi, projectsApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import type { Property, Project, ProjectType, ProjectCategory, ProjectComplexity } from '../../types';
import './DashboardPages.css';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | ''>('');
  const [filterComplexity, setFilterComplexity] = useState<'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'MAJOR' | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [propsResponse, projsResponse] = await Promise.all([
          propertiesApi.list().catch(() => ({ data: [] })),
          projectsApi.list().catch(() => ({ data: [] })),
        ]);
        const propsData = (propsResponse as any)?.data || propsResponse;
        const projsData = (projsResponse as any)?.data || projsResponse;
        setProperties(propsData as Property[]);
        setProjects(projsData as Project[]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === 'active') {
      const activeStatuses = ['DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION', 'PERMIT_SUBMISSION', 'PERMITTED', 'CONSTRUCTION'];
      if (!p.status || !activeStatuses.includes(p.status)) return false;
    }
    if (activeFilter === 'draft') {
      if (p.status !== 'PLANNING' && p.status !== 'DESIGN') return false;
    }
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterComplexity && p.complexity !== filterComplexity) return false;
    return true;
  });

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getComplexityColor = (complexity: ProjectComplexity) => {
    const colors: Record<string, string> = {
      SIMPLE: '#4caf50',
      MODERATE: '#ff9800',
      COMPLEX: '#ff5722',
      MAJOR: '#f44336',
    };
    return colors[complexity] || '#999';
  };

  const portfolioSummary = {
    totalProperties: properties.length,
    totalProjects: projects.length,
    activeProjects: filteredProjects.length,
    totalValue: 0, // TODO: Calculate from projects
  };

  const nextSteps = [
    { id: '1', text: 'Complete property information', link: '/owner/properties', priority: 'high' },
    { id: '2', text: 'Start a new project', link: '/owner/projects/new', priority: 'medium' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h2>Owner Dashboard</h2>
        <p>Welcome back, {user?.firstName}</p>
      </div>

      {/* Next Steps Banner */}
      {nextSteps.length > 0 && (
        <div className="dashboard-page__next-steps">
          <h3>Next Steps</h3>
          <div className="dashboard-page__next-steps-list">
            {nextSteps.map((step) => (
              <Link key={step.id} to={step.link} className={`dashboard-page__next-step dashboard-page__next-step--${step.priority}`}>
                <span>{step.text}</span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showWizard && (
        <div className="dashboard-page__modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="dashboard-page__modal-content" onClick={(e) => e.stopPropagation()}>
            <ProjectTypeWizard onClose={() => setShowWizard(false)} />
          </div>
        </div>
      )}

      <div className="dashboard-page__content">
        {/* Start New Project Button */}
        <div className="dashboard-page__card dashboard-page__card--action">
          <div className="dashboard-page__action-content">
            <h3>Start New Project</h3>
            <p>Use our wizard to create a new project with the right type and complexity assessment</p>
            <button
              className="dashboard-page__action-button"
              onClick={() => setShowWizard(true)}
            >
              Launch Project Wizard
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="dashboard-page__card">
          <h3>Portfolio Summary</h3>
          <div className="dashboard-page__portfolio-stats">
            <div className="dashboard-page__stat">
              <div className="dashboard-page__stat-value">{portfolioSummary.totalProperties}</div>
              <div className="dashboard-page__stat-label">Properties</div>
            </div>
            <div className="dashboard-page__stat">
              <div className="dashboard-page__stat-value">{portfolioSummary.totalProjects}</div>
              <div className="dashboard-page__stat-label">Total Projects</div>
            </div>
            <div className="dashboard-page__stat">
              <div className="dashboard-page__stat-value">{portfolioSummary.activeProjects}</div>
              <div className="dashboard-page__stat-label">Active Projects</div>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="dashboard-page__card dashboard-page__card--full">
          <div className="dashboard-page__card-header">
            <h3>Active Projects</h3>
            <div className="dashboard-page__filters">
              <button
                className={activeFilter === 'all' ? 'active' : ''}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                className={activeFilter === 'active' ? 'active' : ''}
                onClick={() => setActiveFilter('active')}
              >
                Active
              </button>
              <button
                className={activeFilter === 'draft' ? 'active' : ''}
                onClick={() => setActiveFilter('draft')}
              >
                Draft
              </button>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ProjectCategory | '')}
                className="dashboard-page__filter-select"
              >
                <option value="">All Categories</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="INSTITUTIONAL">Institutional</option>
                <option value="MIXED_USE">Mixed-Use</option>
              </select>
              <select
                value={filterComplexity}
                onChange={(e) => setFilterComplexity(e.target.value as any)}
                className="dashboard-page__filter-select"
              >
                <option value="">All Complexities</option>
                <option value="SIMPLE">Simple</option>
                <option value="MODERATE">Moderate</option>
                <option value="COMPLEX">Complex</option>
                <option value="MAJOR">Major</option>
              </select>
            </div>
          </div>
          <div className="dashboard-page__projects-list">
            {isLoading ? (
              <div className="dashboard-page__loading">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="dashboard-page__empty">
                No projects yet. Create your first project above.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/owner/projects/${project.id}`}
                  className="dashboard-page__project-item"
                >
                  <div className="dashboard-page__project-name">{project.name}</div>
                  <div className="dashboard-page__project-meta">
                    <span className="dashboard-page__badge dashboard-page__badge--category">
                      {formatLabel(project.category)}
                    </span>
                    <span className="dashboard-page__badge dashboard-page__badge--type">
                      {formatLabel(project.projectType)}
                    </span>
                    <span
                      className="dashboard-page__badge dashboard-page__badge--complexity"
                      style={{
                        backgroundColor: getComplexityColor(project.complexity) + '20',
                        color: getComplexityColor(project.complexity)
                      }}
                    >
                      {formatLabel(project.complexity)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
