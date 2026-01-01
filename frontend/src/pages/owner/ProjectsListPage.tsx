import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import ProjectTypeWizard from '../../components/projects/ProjectTypeWizard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import type { Project, ProjectCategory, ProjectType, ProjectComplexity, ProjectStatus } from '../../types';
import './OwnerPages.css';
import './ProjectsListPage.css';

const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | ''>('');
  const [filterType, setFilterType] = useState<ProjectType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('');
  const [filterComplexity, setFilterComplexity] = useState<ProjectComplexity | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.list();
      const data = (response as any)?.data || response;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProjects = React.useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch = !searchTerm || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !filterCategory || project.category === filterCategory;
      const matchesType = !filterType || project.projectType === filterType;
      const matchesStatus = !filterStatus || project.status === filterStatus;
      const matchesComplexity = !filterComplexity || project.complexity === filterComplexity;

      return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesComplexity;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status || 'PLANNING';
          bValue = b.status || 'PLANNING';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, searchTerm, filterCategory, filterType, filterStatus, filterComplexity, sortBy, sortOrder]);

  const categories: ProjectCategory[] = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'MIXED_USE'];
  const complexities: ProjectComplexity[] = ['SIMPLE', 'MODERATE', 'COMPLEX', 'MAJOR'];
  const statuses: ProjectStatus[] = [
    'PLANNING', 'DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION',
    'PERMIT_SUBMISSION', 'PERMITTED', 'CONSTRUCTION', 'CLOSEOUT', 'COMPLETED', 'ON_HOLD', 'CANCELLED'
  ];

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: ProjectStatus) => {
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

  const getComplexityColor = (complexity: ProjectComplexity) => {
    const colors: Record<string, string> = {
      SIMPLE: '#4caf50',
      MODERATE: '#ff9800',
      COMPLEX: '#ff5722',
      MAJOR: '#f44336',
    };
    return colors[complexity] || '#999';
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <h2>Projects</h2>
        <button
          onClick={() => setShowWizard(true)}
          className="owner-page__button"
        >
          + New Project
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadProjects} />}
      
      {!loading && !error && (
        <>
          {/* Filters and Search */}
          <div className="projects-list__filters">
        <div className="projects-list__search">
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="projects-list__search-input"
          />
        </div>

        <div className="projects-list__filter-group">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ProjectCategory | '')}
            className="projects-list__filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {formatLabel(cat)}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | '')}
            className="projects-list__filter-select"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value as ProjectComplexity | '')}
            className="projects-list__filter-select"
          >
            <option value="">All Complexities</option>
            {complexities.map((comp) => (
              <option key={comp} value={comp}>
                {formatLabel(comp)}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as any);
              setSortOrder(order as any);
            }}
            className="projects-list__filter-select"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>
      </div>

          {/* Results Count */}
          {projects.length > 0 && (
            <div className="projects-list__results">
              Showing {filteredAndSortedProjects.length} of {projects.length} projects
            </div>
          )}

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <EmptyState
              title="No Projects Yet"
              description="Get started by creating your first project"
              actionLabel="Create Project"
              onAction={() => setShowWizard(true)}
            />
          ) : filteredAndSortedProjects.length === 0 ? (
            <EmptyState
              title="No Projects Match Your Filters"
              description="Try adjusting your search or filter criteria"
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterType('');
                setFilterStatus('');
                setFilterComplexity('');
              }}
            />
          ) : (
            <div className="projects-list__grid">
              {filteredAndSortedProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/owner/projects/${project.id}`}
                  className="projects-list__card"
                >
                  <div className="projects-list__card-header">
                    <h3>{project.name}</h3>
                    <div className="projects-list__badges">
                      <span
                        className="projects-list__badge projects-list__badge--category"
                        style={{ backgroundColor: '#f0f7ff', color: '#0066cc' }}
                      >
                        {formatLabel(project.category)}
                      </span>
                      <span
                        className="projects-list__badge projects-list__badge--complexity"
                        style={{ backgroundColor: getComplexityColor(project.complexity) + '20', color: getComplexityColor(project.complexity) }}
                      >
                        {formatLabel(project.complexity)}
                      </span>
                    </div>
                  </div>

                  <div className="projects-list__card-body">
                    <div className="projects-list__card-meta">
                      <span className="projects-list__meta-label">Type:</span>
                      <span>{formatLabel(project.projectType)}</span>
                    </div>
                    {project.description && (
                      <div className="projects-list__card-description">
                        {project.description.length > 100
                          ? `${project.description.substring(0, 100)}...`
                          : project.description}
                      </div>
                    )}
                  </div>

                  <div className="projects-list__card-footer">
                    <span
                      className="projects-list__status"
                      style={{ backgroundColor: getStatusColor(project.status || 'PLANNING') }}
                    >
                      {formatLabel(project.status || 'PLANNING')}
                    </span>
                    <span className="projects-list__date">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {showWizard && (
        <div className="dashboard-page__modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="dashboard-page__modal-content" onClick={(e) => e.stopPropagation()}>
            <ProjectTypeWizard onClose={() => setShowWizard(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsListPage;
