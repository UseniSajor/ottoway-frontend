import React, { useState } from 'react';
import { api } from '../../lib/api';
import type { DesignStatus, ApiResponse } from '../../types';
import './DesignComponents.css';

interface UploadDesignModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDesignModal: React.FC<UploadDesignModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<DesignStatus>('DRAFT');
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('status', status);
      
      const client = api.getClient();
      await client.post<ApiResponse<unknown>>(
        `/projects/${projectId}/design-versions`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      onSuccess();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to upload design file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="design-modal-overlay" onClick={onClose}>
      <div className="design-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="design-modal-header">
          <h3>Upload Design Version</h3>
          <button className="design-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="design-modal-form">
          {error && <div className="design-modal-error">{error}</div>}

          <div className="design-modal-field">
            <label htmlFor="file">
              Design File <span className="required">*</span>
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className="design-modal-file-info">
                <span>{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            <div className="design-modal-hint">
              Accepted formats: PDF, Images, Office documents, ZIP (max 50MB)
            </div>
          </div>

          <div className="design-modal-field">
            <label htmlFor="status">Initial Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DesignStatus)}
            >
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
            </select>
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

export default UploadDesignModal;

