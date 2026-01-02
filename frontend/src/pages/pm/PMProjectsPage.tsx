import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmApi } from '../../lib/api';
import type { Project, ProjectStatus, ProjectCategory, ProjectComplexity } from '../../types';
import './PMPages.css';

const PMProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterComplexity, setFilterComplexity] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await pmApi.getProjects();
      const data = (response as any)?.data || response;
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedProjects = React.useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch = !searchTerm ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !filterCategory || project.category === filterCategory;
      const matchesStatus = !filterStatus || project.status === filterStatus;
      const matchesComplexity = !filterComplexity || project.complexity === filterComplexity;

      return matchesSearch && matchesCategory && matchesStatus && matchesComplexity;
    });

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
  }, [projects, searchTerm, filterCategory, filterStatus, filterComplexity, sortBy, sortOrder]);

  const categories: ProjectCategory[] = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'MIXED_USE'];
  const complexities: ProjectComplexity[] = ['SIMPLE', 'MODERATE', 'COMPLEX', 'MAJOR'];
  const statuses: ProjectStatus[] = [
    'PLANNING', 'DESIGN', 'READINESS', 'CONTRACT_NEGOTIATION',
    'PERMIT_SUBMISSION', 'PERMITTED', 'CONSTRUCTION', 'CLOSEOUT', 'COMPLETED',
  ];

  if (isLoading) {
    return (
      <div className="pm-projects-page">
        <div className="pm-projects-page__loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="pm-projects-page">
      <div className="pm-projects-page__header">
        <h2>Projects</h2>
        <div className="pm-projects-page__search">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pm-projects-page__search-input"
          />
        </div>
      </div>

      <div className="pm-projects-page__filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="pm-projects-page__filter"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="pm-projects-page__filter"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          value={filterComplexity}
          onChange={(e) => setFilterComplexity(e.target.value)}
          className="pm-projects-page__filter"
        >
          <option value="">All Complexities</option>
          {complexities.map((complexity) => (
            <option key={complexity} value={complexity}>
              {complexity}
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
          className="pm-projects-page__filter"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="status-asc">Status A-Z</option>
          <option value="status-desc">Status Z-A</option>
        </select>
      </div>

      <div className="pm-projects-page__projects-grid">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="pm-projects-page__empty">
            <p>No projects found.</p>
          </div>
        ) : (
          filteredAndSortedProjects.map((project) => (
            <div
              key={project.id}
              className="pm-projects-page__project-card"
              onClick={() => navigate(`/pm/projects/${project.id}`)}
            >
              <div className="pm-projects-page__project-header">
                <h3>{project.name}</h3>
                <span className={`pm-projects-page__project-status pm-projects-page__project-status--${project.status.toLowerCase()}`}>
                  {project.status.replace(/_/g, ' ')}
                </span>
              </div>
              {project.description && (
                <p className="pm-projects-page__project-description">{project.description}</p>
              )}
              <div className="pm-projects-page__project-meta">
                <div>Owner: {project.owner?.firstName} {project.owner?.lastName}</div>
                <div>Category: {project.category.replace(/_/g, ' ')}</div>
                <div>Type: {project.projectType.replace(/_/g, ' ')}</div>
                <div>Complexity: {project.complexity}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PMProjectsPage;


