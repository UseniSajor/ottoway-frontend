import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import type { Project, ProjectType, ProjectComplexity } from '../../types';
import './PMPages.css';

const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterComplexity, setFilterComplexity] = useState<ProjectComplexity | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterType !== 'all' && p.projectType !== filterType) return false;
    if (filterComplexity !== 'all' && p.complexity !== filterComplexity) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadProjects} />;

  return (
    <div className="pm-page">
      <div className="pm-page__header">
        <h1 className="text-3xl font-bold mb-8">Project Pipeline</h1>
      </div>

      {projects.length > 0 && (
        <div className="pm-page__filters">
          <div className="pm-page__filter-group">
            <label>Project Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ProjectType | 'all')}
            >
              <option value="all">All Types</option>
              {Array.from(new Set(projects.map(p => p.projectType))).map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="pm-page__filter-group">
            <label>Complexity</label>
            <select
              value={filterComplexity}
              onChange={(e) => setFilterComplexity(e.target.value as ProjectComplexity | 'all')}
            >
              <option value="all">All Complexities</option>
              <option value="SIMPLE">Simple</option>
              <option value="MODERATE">Moderate</option>
              <option value="COMPLEX">Complex</option>
              <option value="MAJOR">Major</option>
            </select>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Projects Yet"
            description="Projects will appear here once they are created"
          />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Projects Match Your Filters"
            description="Try adjusting your filter criteria"
            actionLabel="Clear Filters"
            onAction={() => {
              setFilterType('all');
              setFilterComplexity('all');
            }}
          />
        </div>
      ) : (
        <div className="pm-page__pipeline">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/pm/projects/${project.id}`}
              className="pm-page__project-card"
            >
              <h3>{project.name}</h3>
              <div className="pm-page__project-meta">
                <span>{project.projectType}</span>
                <span className={`pm-page__complexity pm-page__complexity--${project.complexity.toLowerCase()}`}>
                  {project.complexity}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PipelinePage;



