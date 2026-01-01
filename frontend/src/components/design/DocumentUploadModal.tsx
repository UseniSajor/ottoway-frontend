import React, { useState } from 'react';
import { designVersionsApi } from '../../lib/api';
import './DesignComponents.css';

interface DocumentUploadModalProps {
  versionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  versionId,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'ARCHITECTURAL', label: 'Architectural' },
    { value: 'STRUCTURAL', label: 'Structural' },
    { value: 'MEP', label: 'MEP (Mechanical/Electrical/Plumbing)' },
    { value: 'CIVIL', label: 'Civil' },
    { value: 'LANDSCAPE', label: 'Landscape' },
    { value: 'OTHER', label: 'Other' },
  ];

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
      await designVersionsApi.uploadDocument(versionId, file, documentType, description);
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
    <div className="design-modal-overlay" onClick={onClose}>
      <div className="design-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="design-modal-header">
          <h3>Upload Document</h3>
          <button className="design-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="design-modal-form">
          {error && <div className="design-modal-error">{error}</div>}

          <div className="design-modal-field">
            <label htmlFor="file">
              Document File <span className="required">*</span>
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.rvt"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className="design-modal-file-info">
                <span>{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
            <div className="design-modal-hint">
              Accepted formats: PDF, DWG, DXF, JPG, PNG, RVT (max 50MB)
            </div>
          </div>

          <div className="design-modal-field">
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

          <div className="design-modal-field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document..."
              rows={3}
            />
          </div>

          <div className="design-modal-actions">
            <button
              type="button"
              className="design-modal-button design-modal-button--secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="design-modal-button design-modal-button--primary"
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

export default DocumentUploadModal;

