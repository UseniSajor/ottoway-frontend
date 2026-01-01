import React, { useState } from 'react';
import type { DesignVersion, DesignDocument, DesignComment } from '../../types';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import DesignCommentThread from './DesignCommentThread';
import DesignStatusBadge from './DesignStatusBadge';
import { designVersionsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import './DesignComponents.css';

interface DesignVersionDetailsProps {
  version: DesignVersion;
  onStatusChange: () => void;
  onDocumentUpload: () => void;
  onDocumentDelete: () => void;
}

const DesignVersionDetails: React.FC<DesignVersionDetailsProps> = ({
  version,
  onStatusChange,
  onDocumentUpload,
  onDocumentDelete,
}) => {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DesignDocument | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const canApprove = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'HOMEOWNER';
  const canRequestReview = version.status === 'DRAFT' || version.status === 'IN_PROGRESS';
  const canRequestRevisions = canApprove && (version.status === 'REVIEW_REQUIRED' || version.status === 'IN_PROGRESS');

  const handleStatusChange = async (newStatus: string, approvalNotes?: string) => {
    setIsChangingStatus(true);
    try {
      await designVersionsApi.updateStatus(version.id, newStatus, approvalNotes);
      onStatusChange();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await designVersionsApi.deleteDocument(documentId);
      onDocumentDelete();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const isPDF = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="design-version-details">
      {/* Version Header */}
      <div className="design-version-details__header">
        <div>
          <div className="design-version-details__version-title">
            <h2>{version.versionName || `Version ${version.versionNumber}`}</h2>
            <DesignStatusBadge status={version.status} />
          </div>
          {version.description && (
            <p className="design-version-details__description">{version.description}</p>
          )}
          <div className="design-version-details__meta">
            <div>
              <strong>Uploaded:</strong>{' '}
              {new Date(version.createdAt).toLocaleString()} by{' '}
              {version.uploadedBy
                ? `${version.uploadedBy.firstName} ${version.uploadedBy.lastName}`
                : 'Unknown'}
            </div>
            {version.approvedBy && (
              <div>
                <strong>Approved:</strong>{' '}
                {version.approvedAt && new Date(version.approvedAt).toLocaleString()} by{' '}
                {version.approvedBy.firstName} {version.approvedBy.lastName}
              </div>
            )}
            {version.approvalNotes && (
              <div>
                <strong>Approval Notes:</strong> {version.approvalNotes}
              </div>
            )}
          </div>
        </div>
        <div className="design-version-details__actions">
          <button
            className="design-version-details__action-button"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload Documents
          </button>
        </div>
      </div>

      {/* Status Actions */}
      <div className="design-version-details__status-actions">
        {canRequestReview && (
          <button
            className="design-version-details__status-button"
            onClick={() => handleStatusChange('REVIEW_REQUIRED')}
            disabled={isChangingStatus}
          >
            Request Review
          </button>
        )}
        {canRequestRevisions && (
          <button
            className="design-version-details__status-button design-version-details__status-button--warning"
            onClick={() => handleStatusChange('REVISIONS_REQUESTED')}
            disabled={isChangingStatus}
          >
            Request Revisions
          </button>
        )}
        {canApprove && version.status === 'REVIEW_REQUIRED' && (
          <button
            className="design-version-details__status-button design-version-details__status-button--success"
            onClick={() => handleStatusChange('APPROVED_FOR_PERMIT')}
            disabled={isChangingStatus}
          >
            Approve for Permit
          </button>
        )}
        {version.status === 'DRAFT' && (
          <button
            className="design-version-details__status-button"
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={isChangingStatus}
          >
            Mark In Progress
          </button>
        )}
      </div>

      {/* Documents Section */}
      <div className="design-version-details__section">
        <h3>Documents ({(version.documents || []).length})</h3>
        {version.documents && version.documents.length > 0 ? (
          <div className="design-version-details__documents-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {version.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.fileName}</td>
                    <td>{formatLabel(doc.documentType)}</td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>
                      {doc.uploadedBy
                        ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                        : 'Unknown'}
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="design-version-details__document-actions">
                        {(isPDF(doc.fileName) || isImage(doc.fileType)) && (
                          <button
                            className="design-version-details__action-link"
                            onClick={() => setPreviewDocument(doc)}
                          >
                            Preview
                          </button>
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="design-version-details__action-link"
                        >
                          Download
                        </a>
                        {doc.uploadedById === user?.id && (
                          <button
                            className="design-version-details__action-link design-version-details__action-link--danger"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="design-version-details__empty">
            <p>No documents uploaded yet.</p>
            <button
              className="design-version-details__action-button"
              onClick={() => setShowUploadModal(true)}
            >
              Upload First Document
            </button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="design-version-details__section">
        <h3>Comments & Feedback ({(version.comments || []).length})</h3>
        <DesignCommentThread
          versionId={version.id}
          comments={version.comments || []}
          onCommentAdded={onStatusChange}
        />
      </div>

      {showUploadModal && (
        <DocumentUploadModal
          versionId={version.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onDocumentUpload();
          }}
        />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
};

export default DesignVersionDetails;

