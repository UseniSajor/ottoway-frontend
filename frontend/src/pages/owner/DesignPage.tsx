import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { designVersionsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { DesignVersion } from '../../types';
import DesignVersionList from '../../components/design/DesignVersionList';
import DesignVersionDetails from '../../components/design/DesignVersionDetails';
import DesignWorkflowStepper from '../../components/design/DesignWorkflowStepper';
import CreateVersionModal from '../../components/design/CreateVersionModal';
import './OwnerPages.css';
import './DesignPage.css';

const DesignPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DesignVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      loadDesignVersions();
    }
  }, [projectId]);

  useEffect(() => {
    // Auto-select first version if none selected
    if (designVersions.length > 0 && !selectedVersion) {
      setSelectedVersion(designVersions[0]);
    }
  }, [designVersions]);

  const loadDesignVersions = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError('');
      const response = await designVersionsApi.list(projectId);
      const data = (response as any)?.data || response;
      setDesignVersions(data as DesignVersion[]);
    } catch (err: any) {
      console.error('Failed to load design versions:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load design versions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async (data: { versionName?: string; description?: string }) => {
    if (!projectId) return;
    try {
      await designVersionsApi.create(projectId, data);
      setShowCreateModal(false);
      await loadDesignVersions();
    } catch (err: any) {
      console.error('Failed to create version:', err);
      throw err;
    }
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to={`/owner/projects/${projectId}`} className="owner-page__back">
          ← Back to Project
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h2>Design Management</h2>
          <button
            className="owner-page__button"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Version
          </button>
        </div>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {/* Workflow Stepper */}
      {selectedVersion && (
        <div className="design-page__workflow">
          <DesignWorkflowStepper currentStatus={selectedVersion.status} />
        </div>
      )}

      {isLoading ? (
        <div className="owner-page__loading">Loading design versions...</div>
      ) : designVersions.length === 0 ? (
        <div className="owner-page__empty">
          <p>No design versions yet.</p>
          <button
            className="owner-page__button"
            onClick={() => setShowCreateModal(true)}
          >
            Create First Version
          </button>
        </div>
      ) : (
        <div className="design-page__layout">
          {/* Version List Sidebar */}
          <div className="design-page__sidebar">
            <DesignVersionList
              versions={designVersions}
              selectedVersionId={selectedVersion?.id}
              onSelectVersion={setSelectedVersion}
            />
          </div>

          {/* Version Details Main Area */}
          <div className="design-page__main">
            {selectedVersion ? (
              <DesignVersionDetails
                version={selectedVersion}
                onStatusChange={loadDesignVersions}
                onDocumentUpload={loadDesignVersions}
                onDocumentDelete={loadDesignVersions}
              />
            ) : (
              <div className="design-page__empty-state">
                <p>Select a version from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateVersionModal
          projectId={projectId!}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateVersion}
        />
      )}
    </div>
  );
};

export default DesignPage;
