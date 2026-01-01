import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractorApi } from '../../lib/api';
import type { Project, ProjectStatus } from '../../types';
import './ContractorPages.css';

const ContractorProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await contractorApi.getProjects();
      const data = (response as any)?.data || response;
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = !searchTerm ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses: ProjectStatus[] = [
    'PLANNING', 'DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION',
    'PERMIT_SUBMISSION', 'PERMITTED', 'CONSTRUCTION', 'COMPLETED',
  ];

  if (isLoading) {
    return (
      <div className="contractor-projects-page">
        <div className="contractor-projects-page__loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="contractor-projects-page">
      <div className="contractor-projects-page__header">
        <h2>My Projects</h2>
        <div className="contractor-projects-page__search">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="contractor-projects-page__search-input"
          />
        </div>
      </div>

      <div className="contractor-projects-page__filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="contractor-projects-page__filter"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="contractor-projects-page__projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="contractor-projects-page__empty">
            <p>No projects found.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="contractor-projects-page__project-card"
              onClick={() => navigate(`/contractor/projects/${project.id}`)}
            >
              <div className="contractor-projects-page__project-header">
                <h3>{project.name}</h3>
                <span
                  className={`contractor-projects-page__project-status contractor-projects-page__project-status--${project.status.toLowerCase()}`}
                >
                  {project.status.replace(/_/g, ' ')}
                </span>
              </div>
              {project.description && (
                <p className="contractor-projects-page__project-description">
                  {project.description}
                </p>
              )}
              <div className="contractor-projects-page__project-meta">
                <div>
                  Owner: {project.owner?.firstName} {project.owner?.lastName}
                </div>
                {project.property && (
                  <div>
                    {project.property.streetAddress}, {project.property.city}, {project.property.state}
                  </div>
                )}
                <div>Category: {project.category.replace(/_/g, ' ')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContractorProjectsPage;

