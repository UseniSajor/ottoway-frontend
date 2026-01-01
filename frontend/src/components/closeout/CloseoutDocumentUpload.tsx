import React, { useState } from 'react';
import { closeoutApi } from '../../lib/api';
import type { ProjectCloseout } from '../../types';
import './CloseoutComponents.css';

interface CloseoutDocumentUploadProps {
  closeout: ProjectCloseout;
  onUpdate: () => void;
}

const CloseoutDocumentUpload: React.FC<CloseoutDocumentUploadProps> = ({ closeout, onUpdate }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [documentType, setDocumentType] = useState('OTHER');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'AS_BUILT', label: 'As-Built Drawings' },
    { value: 'WARRANTY', label: 'Warranty Document' },
    { value: 'LIEN_RELEASE', label: 'Lien Release' },
    { value: 'FINAL_INSPECTION', label: 'Final Inspection Certificate' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await closeoutApi.uploadDocument(closeout.id, file, documentType, description.trim() || undefined);
      setShowUpload(false);
      setFile(null);
      setDescription('');
      setDocumentType('OTHER');
      onUpdate();
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

  const documents = closeout.documents || [];

  return (
    <div className="closeout-document-upload">
      <div className="closeout-document-upload__header">
        <h4>Closeout Documents ({documents.length})</h4>
        <button
          className="closeout-document-upload__upload-button"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Cancel' : '+ Upload Document'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="closeout-document-upload__form">
          {error && <div className="closeout-document-upload__error">{error}</div>}

          <div className="closeout-document-upload__field">
            <label htmlFor="documentType">Document Type</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="closeout-document-upload__field">
            <label htmlFor="file">
              File <span className="required">*</span>
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className="closeout-document-upload__file-info">
                <span>{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
          </div>

          <div className="closeout-document-upload__field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description for this document..."
            />
          </div>

          <button
            type="submit"
            className="closeout-document-upload__submit"
            disabled={isUploading || !file}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      )}

      {documents.length > 0 ? (
        <div className="closeout-document-upload__list">
          {documents.map((doc) => (
            <div key={doc.id} className="closeout-document-upload__item">
              <div className="closeout-document-upload__item-info">
                <div className="closeout-document-upload__item-name">{doc.fileName}</div>
                <div className="closeout-document-upload__item-meta">
                  {doc.documentType.replace(/_/g, ' ')} • {formatFileSize(doc.fileSize)} •{' '}
                  {doc.uploadedBy
                    ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                    : 'Unknown'}{' '}
                  • {new Date(doc.createdAt).toLocaleDateString()}
                </div>
                {doc.description && (
                  <div className="closeout-document-upload__item-description">
                    {doc.description}
                  </div>
                )}
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="closeout-document-upload__download"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="closeout-document-upload__empty">
          <p>No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
};

export default CloseoutDocumentUpload;

