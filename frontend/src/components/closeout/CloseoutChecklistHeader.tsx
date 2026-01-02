import React from 'react';
import type { ProjectCloseout } from '../../types';
import './CloseoutComponents.css';

interface CloseoutChecklistHeaderProps {
  closeout: ProjectCloseout;
  progress: number;
  onUpdate: (field: string, value: boolean) => void;
  onComplete?: () => void;
}

const CloseoutChecklistHeader: React.FC<CloseoutChecklistHeaderProps> = ({
  closeout,
  progress,
  onUpdate,
  onComplete,
}) => {
  const checklistItems = [
    {
      key: 'punchListComplete',
      label: 'Punch List Complete',
      checked: closeout.punchListComplete,
    },
    {
      key: 'finalInspectionPassed',
      label: 'Final Inspection Passed',
      checked: closeout.finalInspectionPassed,
    },
    {
      key: 'finalPaymentReleased',
      label: 'Final Payment Released',
      checked: closeout.finalPaymentReleased,
    },
    {
      key: 'warrantyProvided',
      label: 'Warranty Provided',
      checked: closeout.warrantyProvided,
    },
    {
      key: 'asBuiltDrawingsProvided',
      label: 'As-Built Drawings Provided',
      checked: closeout.asBuiltDrawingsProvided,
    },
    {
      key: 'liensReleased',
      label: 'Liens Released',
      checked: closeout.liensReleased,
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IN_PROGRESS: '#0066cc',
      PENDING_ITEMS: '#ff9800',
      READY_FOR_COMPLETION: '#4caf50',
      COMPLETED: '#4caf50',
    };
    return colors[status] || '#999';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="closeout-checklist-header">
      <div className="closeout-checklist-header__status">
        <span
          className="closeout-checklist-header__status-badge"
          style={{ backgroundColor: getStatusColor(closeout.status) }}
        >
          {formatStatus(closeout.status)}
        </span>
      </div>

      <div className="closeout-checklist-header__progress">
        <div className="closeout-checklist-header__progress-label">
          Completion Progress: {progress}%
        </div>
        <div className="closeout-checklist-header__progress-bar">
          <div
            className="closeout-checklist-header__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="closeout-checklist-header__checklist">
        <h3>Closeout Checklist</h3>
        <div className="closeout-checklist-header__items">
          {checklistItems.map((item) => (
            <label key={item.key} className="closeout-checklist-header__item">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => onUpdate(item.key, e.target.checked)}
                className="closeout-checklist-header__checkbox"
              />
              <span className={item.checked ? 'checked' : ''}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {onComplete && (
        <div className="closeout-checklist-header__actions">
          <button
            className="closeout-checklist-header__complete-button"
            onClick={onComplete}
          >
            Complete Closeout
          </button>
        </div>
      )}

      {closeout.completedAt && (
        <div className="closeout-checklist-header__completed">
          <p>
            ✓ Closeout completed on {new Date(closeout.completedAt).toLocaleDateString()}
            {closeout.completedBy && (
              <> by {closeout.completedBy.firstName} {closeout.completedBy.lastName}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CloseoutChecklistHeader;


