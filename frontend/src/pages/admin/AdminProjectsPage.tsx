import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface Project {
  id: string;
  name: string;
  status: string;
  category: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const AdminProjectsPage: React.FC = () => {
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
      const response = await adminApi.getProjects();
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

  if (isLoading) {
    return (
      <div className="admin-projects-page">
        <div className="admin-projects-page__loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="admin-projects-page">
      <div className="admin-projects-page__header">
        <h2>All Projects</h2>
      </div>

      <div className="admin-projects-page__filters">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-projects-page__search"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-projects-page__filter"
        >
          <option value="">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="DESIGN">Design</option>
          <option value="CONSTRUCTION">Construction</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="admin-projects-page__table-container">
        <table className="admin-projects-page__table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Owner</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-projects-page__empty">
                  No projects found
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>
                    {project.owner?.firstName} {project.owner?.lastName}
                  </td>
                  <td>{project.category.replace(/_/g, ' ')}</td>
                  <td>
                    <span
                      className={`admin-projects-page__status admin-projects-page__status--${project.status.toLowerCase()}`}
                    >
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="admin-projects-page__action-button"
                      onClick={() => {
                        // TODO: Navigate to project details
                        console.log('View project:', project.id);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProjectsPage;


