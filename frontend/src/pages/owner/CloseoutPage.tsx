import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { closeoutApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ProjectCloseout, PunchListItem } from '../../types';
import CloseoutChecklistHeader from '../../components/closeout/CloseoutChecklistHeader';
import PunchListTable from '../../components/closeout/PunchListTable';
import CloseoutDocumentUpload from '../../components/closeout/CloseoutDocumentUpload';
import WarrantyInfoPanel from '../../components/closeout/WarrantyInfoPanel';
import AddPunchItemModal from '../../components/closeout/AddPunchItemModal';
import './OwnerPages.css';
import './CloseoutPage.css';

const CloseoutPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [closeout, setCloseout] = useState<ProjectCloseout | null>(null);
  const [punchList, setPunchList] = useState<PunchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPunchItem, setShowAddPunchItem] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'punch-list' | 'documents' | 'warranty'>('checklist');

  useEffect(() => {
    if (projectId) {
      loadCloseout();
      loadPunchList();
    }
  }, [projectId]);

  const loadCloseout = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError('');
      const response = await closeoutApi.getCloseout(projectId);
      const data = (response as any)?.data || response;
      setCloseout(data as ProjectCloseout);
    } catch (err: any) {
      console.error('Failed to load closeout:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load closeout');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPunchList = async () => {
    if (!projectId) return;
    
    try {
      const response = await closeoutApi.getPunchList(projectId);
      const data = (response as any)?.data || response;
      setPunchList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load punch list:', err);
    }
  };

  const handleChecklistUpdate = async (field: string, value: boolean) => {
    if (!closeout) return;
    
    try {
      const response = await closeoutApi.updateCloseout(closeout.id, {
        [field]: value,
      } as any);
      const data = (response as any)?.data || response;
      setCloseout(data as ProjectCloseout);
    } catch (err: any) {
      console.error('Failed to update checklist:', err);
      setError(err?.response?.data?.message || 'Failed to update checklist');
    }
  };

  const handleCompleteCloseout = async () => {
    if (!closeout) return;
    
    if (!window.confirm('Are you sure you want to complete the closeout? This will mark the project as completed.')) {
      return;
    }
    
    try {
      await closeoutApi.completeCloseout(closeout.id);
      loadCloseout();
    } catch (err: any) {
      console.error('Failed to complete closeout:', err);
      setError(err?.response?.data?.message || 'Failed to complete closeout');
    }
  };

  const handlePunchListUpdate = () => {
    loadPunchList();
  };

  const calculateProgress = () => {
    if (!closeout) return 0;
    
    const items = [
      closeout.punchListComplete,
      closeout.finalInspectionPassed,
      closeout.finalPaymentReleased,
      closeout.warrantyProvided,
      closeout.asBuiltDrawingsProvided,
      closeout.liensReleased,
    ];
    
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  const progress = calculateProgress();
  const canComplete = closeout?.status === 'READY_FOR_COMPLETION';

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to={`/owner/projects/${projectId}`} className="owner-page__back">
          ← Back to Project
        </Link>
        <h2>Project Closeout</h2>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {isLoading ? (
        <div className="owner-page__loading">Loading closeout information...</div>
      ) : !closeout ? (
        <div className="owner-page__empty">Closeout not found</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="closeout-page__tabs">
            <button
              className={`closeout-page__tab ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              Checklist
            </button>
            <button
              className={`closeout-page__tab ${activeTab === 'punch-list' ? 'active' : ''}`}
              onClick={() => setActiveTab('punch-list')}
            >
              Punch List
            </button>
            <button
              className={`closeout-page__tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`closeout-page__tab ${activeTab === 'warranty' ? 'active' : ''}`}
              onClick={() => setActiveTab('warranty')}
            >
              Warranty
            </button>
          </div>

          {/* Tab Content */}
          <div className="closeout-page__content">
            {activeTab === 'checklist' && (
              <div className="closeout-page__checklist-section">
                <CloseoutChecklistHeader
                  closeout={closeout}
                  progress={progress}
                  onUpdate={handleChecklistUpdate}
                  onComplete={canComplete ? handleCompleteCloseout : undefined}
                />
              </div>
            )}

            {activeTab === 'punch-list' && (
              <div className="closeout-page__punch-list-section">
                <div className="closeout-page__section-header">
                  <h3>Punch List Items</h3>
                  <button
                    className="closeout-page__add-button"
                    onClick={() => setShowAddPunchItem(true)}
                  >
                    + Add Punch Item
                  </button>
                </div>
                <PunchListTable
                  items={punchList}
                  onUpdate={handlePunchListUpdate}
                />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="closeout-page__documents-section">
                <h3>Closeout Documents</h3>
                <CloseoutDocumentUpload
                  closeout={closeout}
                  onUpdate={loadCloseout}
                />
              </div>
            )}

            {activeTab === 'warranty' && (
              <div className="closeout-page__warranty-section">
                <WarrantyInfoPanel
                  closeout={closeout}
                  onUpdate={loadCloseout}
                />
              </div>
            )}
          </div>

          {showAddPunchItem && (
            <AddPunchItemModal
              projectId={projectId!}
              onClose={() => setShowAddPunchItem(false)}
              onSuccess={() => {
                setShowAddPunchItem(false);
                handlePunchListUpdate();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CloseoutPage;
