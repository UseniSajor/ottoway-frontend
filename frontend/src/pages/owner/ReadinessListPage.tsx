import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';
import './OwnerPages.css';

export default function ReadinessListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const response = await projectsApi.list();
        setProjects(Array.isArray(response) ? response as Project[] : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Readiness Checklists</h1>
        </div>
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Readiness Checklists</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Readiness Checklists</h1>
        <p>View and manage readiness checklists across all projects</p>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/owner/projects/${project.id}/readiness`}
            className="project-card"
          >
            <h3>{project.name}</h3>
            <p className="text-muted">{project.description || 'No description'}</p>
            <div className="project-meta">
              <span className="badge badge-primary">{project.status}</span>
              <span className="badge badge-secondary">{project.category}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <p>No projects found. Create a project to get started.</p>
          <Link to="/owner/projects" className="button button-primary">
            View Projects
          </Link>
        </div>
      )}
    </div>
  );
}

