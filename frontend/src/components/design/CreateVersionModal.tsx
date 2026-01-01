import React, { useState } from 'react';
import './DesignComponents.css';

interface CreateVersionModalProps {
  projectId: string;
  onClose: () => void;
  onSubmit: (data: { versionName?: string; description?: string }) => Promise<void>;
}

const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        versionName: versionName.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (err: any) {
      console.error('Failed to create version:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create version');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="design-modal-overlay" onClick={onClose}>
      <div className="design-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="design-modal-header">
          <h3>Create New Design Version</h3>
          <button className="design-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="design-modal-form">
          {error && <div className="design-modal-error">{error}</div>}

          <div className="design-modal-field">
            <label htmlFor="versionName">Version Name (Optional)</label>
            <input
              id="versionName"
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Initial Design, Revised Plans"
            />
            <div className="design-modal-hint">
              If left blank, will be named "Version X" automatically
            </div>
          </div>

          <div className="design-modal-field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this version..."
              rows={4}
            />
          </div>

          <div className="design-modal-actions">
            <button
              type="button"
              className="design-modal-button design-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="design-modal-button design-modal-button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVersionModal;

