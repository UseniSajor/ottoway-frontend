import React, { useState } from 'react';
import { closeoutApi } from '../../lib/api';
import './CloseoutComponents.css';

interface AddPunchItemModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPunchItemModal: React.FC<AddPunchItemModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await closeoutApi.createPunchItem(projectId, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        priority,
      } as any);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create punch item:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create punch item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="closeout-modal-overlay" onClick={onClose}>
      <div className="closeout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="closeout-modal-header">
          <h3>Add Punch List Item</h3>
          <button className="closeout-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="closeout-modal-form">
          {error && <div className="closeout-modal-error">{error}</div>}

          <div className="closeout-modal-field">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Fix leaky faucet in kitchen"
            />
          </div>

          <div className="closeout-modal-field">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className="closeout-modal-field-row">
            <div className="closeout-modal-field">
              <label htmlFor="location">Location (Optional)</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kitchen, Master Bedroom"
              />
            </div>

            <div className="closeout-modal-field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="closeout-modal-actions">
            <button
              type="button"
              className="closeout-modal-button closeout-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="closeout-modal-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Punch Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPunchItemModal;

