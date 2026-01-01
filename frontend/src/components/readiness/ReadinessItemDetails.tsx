import React, { useState } from 'react';
import { readinessApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ReadinessItem, ReadinessItemStatus } from '../../types';
import './ReadinessComponents.css';

interface ReadinessItemDetailsProps {
  item: ReadinessItem;
  onClose: () => void;
  onUpdate: () => void;
}

const ReadinessItemDetails: React.FC<ReadinessItemDetailsProps> = ({ item, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const statuses: ReadinessItemStatus[] = [
    'NOT_STARTED',
    'IN_PROGRESS',
    'PENDING_REVIEW',
    'COMPLETED',
    'NOT_APPLICABLE',
  ];

  const handleStatusChange = async (newStatus: ReadinessItemStatus) => {
    setIsSubmitting(true);
    try {
      await readinessApi.updateItemStatus(
        item.id,
        newStatus,
        newStatus === 'COMPLETED' ? completionNotes : undefined
      );
      onUpdate();
      if (newStatus === 'COMPLETED') {
        onClose();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await readinessApi.addComment(item.id, newComment.trim());
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await readinessApi.deleteDocument(documentId);
      onUpdate();
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

  return (
    <div className="readiness-modal-overlay" onClick={onClose}>
      <div className="readiness-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="readiness-modal-header">
          <div>
            <h3>{item.title}</h3>
            {item.category && (
              <span className="readiness-modal-category">{item.category}</span>
            )}
          </div>
          <button className="readiness-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="readiness-modal-body">
          {item.description && (
            <div className="readiness-modal-section">
              <h4>Description</h4>
              <p>{item.description}</p>
            </div>
          )}

          {/* Status Section */}
          <div className="readiness-modal-section">
            <h4>Status</h4>
            <div className="readiness-modal-status-actions">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`readiness-status-button ${
                    item.status === status ? 'active' : ''
                  }`}
                  onClick={() => handleStatusChange(status)}
                  disabled={isSubmitting}
                >
                  {formatLabel(status)}
                </button>
              ))}
            </div>
            {item.status === 'COMPLETED' && (
              <div className="readiness-modal-completion-info">
                {item.completedBy && (
                  <div>
                    <strong>Completed by:</strong>{' '}
                    {item.completedBy.firstName} {item.completedBy.lastName}
                  </div>
                )}
                {item.completedAt && (
                  <div>
                    <strong>Completed on:</strong>{' '}
                    {new Date(item.completedAt).toLocaleString()}
                  </div>
                )}
                {item.completionNotes && (
                  <div>
                    <strong>Notes:</strong> {item.completionNotes}
                  </div>
                )}
              </div>
            )}
            {item.status !== 'COMPLETED' && (
              <div className="readiness-modal-completion-notes">
                <label>Completion Notes (optional)</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add notes when completing this item..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="readiness-modal-section">
            <div className="readiness-modal-section-header">
              <h4>Documents ({(item.documents || []).length})</h4>
              <button
                className="readiness-modal-button"
                onClick={() => setShowUploadModal(true)}
              >
                + Upload Document
              </button>
            </div>
            {item.documents && item.documents.length > 0 ? (
              <div className="readiness-modal-documents">
                {item.documents.map((doc) => (
                  <div key={doc.id} className="readiness-modal-document">
                    <div className="readiness-modal-document-info">
                      <div className="readiness-modal-document-name">{doc.fileName}</div>
                      <div className="readiness-modal-document-meta">
                        {formatFileSize(doc.fileSize)} •{' '}
                        {doc.uploadedBy
                          ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                          : 'Unknown'}{' '}
                        • {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      {doc.description && (
                        <div className="readiness-modal-document-description">{doc.description}</div>
                      )}
                    </div>
                    <div className="readiness-modal-document-actions">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="readiness-modal-link"
                      >
                        Download
                      </a>
                      {doc.uploadedById === user?.id && (
                        <button
                          className="readiness-modal-link readiness-modal-link--danger"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="readiness-modal-empty">
                <p>No documents uploaded yet.</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="readiness-modal-section">
            <h4>Comments ({(item.comments || []).length})</h4>
            {item.comments && item.comments.length > 0 ? (
              <div className="readiness-modal-comments">
                {item.comments.map((comment) => (
                  <div key={comment.id} className="readiness-modal-comment">
                    <div className="readiness-modal-comment-header">
                      <strong>
                        {comment.user
                          ? `${comment.user.firstName} ${comment.user.lastName}`
                          : 'Unknown User'}
                      </strong>
                      <span className="readiness-modal-comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="readiness-modal-comment-body">{comment.comment}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="readiness-modal-empty">
                <p>No comments yet.</p>
              </div>
            )}

            <form onSubmit={handleAddComment} className="readiness-modal-comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="readiness-modal-textarea"
              />
              <button
                type="submit"
                className="readiness-modal-button"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <ReadinessDocumentUploadModal
          itemId={item.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

// Document Upload Modal Component
const ReadinessDocumentUploadModal: React.FC<{
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ itemId, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await readinessApi.uploadDocument(itemId, file, description);
      onSuccess();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="readiness-modal-overlay" onClick={onClose}>
      <div className="readiness-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="readiness-modal-header">
          <h3>Upload Document</h3>
          <button className="readiness-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="readiness-modal-form">
          {error && <div className="readiness-modal-error">{error}</div>}

          <div className="readiness-modal-field">
            <label htmlFor="file">
              Document File <span className="required">*</span>
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className="readiness-modal-file-info">
                <span>{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
          </div>

          <div className="readiness-modal-field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document..."
              rows={3}
            />
          </div>

          <div className="readiness-modal-actions">
            <button
              type="button"
              className="readiness-modal-button readiness-modal-button--secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="readiness-modal-button"
              disabled={isUploading || !file}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadinessItemDetails;

