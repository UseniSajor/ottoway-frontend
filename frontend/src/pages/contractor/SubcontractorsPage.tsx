import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectsApi } from '../../lib/api';
import type { Project } from '../../types';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './ContractorPages.css';

interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  contact: string;
}

const SubcontractorsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id, user]);

  const loadData = async () => {
    if (!id) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const projectData = await projectsApi.get(id) as Project;
      setProject(projectData);
      
      if (projectData.complexity === 'MAJOR' && user?.role === 'PRIME_CONTRACTOR') {
        // TODO: Load subcontractors from API when endpoint is available
        // For now, set empty array
        setSubcontractors([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  if (!project || project.complexity !== 'MAJOR' || user?.role !== 'PRIME_CONTRACTOR') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Subcontractors</h1>
        <EmptyState
          title="Subcontractor Management Not Available"
          description="Subcontractor management is only available for MAJOR complexity projects and Prime Contractors."
        />
      </div>
    );
  }

  return (
    <div className="contractor-page">
      <div className="contractor-page__header">
        <h1 className="text-3xl font-bold mb-8">Subcontractors</h1>
        <button className="contractor-page__button">Add Subcontractor</button>
      </div>

      {subcontractors.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Subcontractors Yet"
            description="Add subcontractors to manage your project team"
            actionLabel="Add Subcontractor"
            onAction={() => {
              // TODO: Open add subcontractor modal
            }}
          />
        </div>
      ) : (
        <div className="contractor-page__subcontractors">
          {subcontractors.map((sub) => (
            <div key={sub.id} className="contractor-page__subcontractor-card">
              <h3>{sub.name}</h3>
              <div className="contractor-page__subcontractor-meta">
                <span>Trade: {sub.trade}</span>
                <span>Contact: {sub.contact}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubcontractorsPage;



