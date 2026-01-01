import React, { useState } from 'react';
import { closeoutApi } from '../../lib/api';
import type { ProjectCloseout } from '../../types';
import './CloseoutComponents.css';

interface WarrantyInfoPanelProps {
  closeout: ProjectCloseout;
  onUpdate: () => void;
}

const WarrantyInfoPanel: React.FC<WarrantyInfoPanelProps> = ({ closeout, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [warrantyStartDate, setWarrantyStartDate] = useState(
    closeout.warrantyStartDate ? closeout.warrantyStartDate.split('T')[0] : ''
  );
  const [warrantyEndDate, setWarrantyEndDate] = useState(
    closeout.warrantyEndDate ? closeout.warrantyEndDate.split('T')[0] : ''
  );
  const [warrantyTerms, setWarrantyTerms] = useState(closeout.warrantyTerms || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await closeoutApi.updateCloseout(closeout.id, {
        warrantyStartDate: warrantyStartDate || undefined,
        warrantyEndDate: warrantyEndDate || undefined,
        warrantyTerms: warrantyTerms.trim() || undefined,
      } as any);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update warranty info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setWarrantyStartDate(closeout.warrantyStartDate ? closeout.warrantyStartDate.split('T')[0] : '');
    setWarrantyEndDate(closeout.warrantyEndDate ? closeout.warrantyEndDate.split('T')[0] : '');
    setWarrantyTerms(closeout.warrantyTerms || '');
    setIsEditing(false);
  };

  return (
    <div className="warranty-info-panel">
      <div className="warranty-info-panel__header">
        <h3>Warranty Information</h3>
        {!isEditing && (
          <button
            className="warranty-info-panel__edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="warranty-info-panel__form">
          <div className="warranty-info-panel__field">
            <label htmlFor="warrantyStartDate">Warranty Start Date</label>
            <input
              id="warrantyStartDate"
              type="date"
              value={warrantyStartDate}
              onChange={(e) => setWarrantyStartDate(e.target.value)}
            />
          </div>

          <div className="warranty-info-panel__field">
            <label htmlFor="warrantyEndDate">Warranty End Date</label>
            <input
              id="warrantyEndDate"
              type="date"
              value={warrantyEndDate}
              onChange={(e) => setWarrantyEndDate(e.target.value)}
            />
          </div>

          <div className="warranty-info-panel__field">
            <label htmlFor="warrantyTerms">Warranty Terms</label>
            <textarea
              id="warrantyTerms"
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              rows={6}
              placeholder="Enter warranty terms and coverage details..."
            />
          </div>

          <div className="warranty-info-panel__actions">
            <button
              className="warranty-info-panel__button warranty-info-panel__button--secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="warranty-info-panel__button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="warranty-info-panel__display">
          {closeout.warrantyStartDate && closeout.warrantyEndDate ? (
            <>
              <div className="warranty-info-panel__dates">
                <div>
                  <label>Start Date:</label>
                  <div>{new Date(closeout.warrantyStartDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <label>End Date:</label>
                  <div>{new Date(closeout.warrantyEndDate).toLocaleDateString()}</div>
                </div>
              </div>
              {closeout.warrantyTerms && (
                <div className="warranty-info-panel__terms">
                  <label>Terms:</label>
                  <div>{closeout.warrantyTerms}</div>
                </div>
              )}
            </>
          ) : (
            <div className="warranty-info-panel__empty">
              <p>No warranty information entered yet.</p>
              <p className="warranty-info-panel__hint">
                Click "Edit" to add warranty start/end dates and terms.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarrantyInfoPanel;

