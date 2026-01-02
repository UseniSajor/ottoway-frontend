import React, { useState } from 'react';
import { closeoutApi } from '../../lib/api';
import type { PunchListItem } from '../../types';
import './CloseoutComponents.css';

interface PunchItemCardProps {
  item: PunchListItem;
  onUpdate: () => void;
}

const PunchItemCard: React.FC<PunchItemCardProps> = ({ item, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: '#4caf50',
      MEDIUM: '#ff9800',
      HIGH: '#f44336',
      CRITICAL: '#9c27b0',
    };
    return colors[priority] || '#999';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: '#f44336',
      IN_PROGRESS: '#ff9800',
      RESOLVED: '#0066cc',
      VERIFIED: '#4caf50',
      CLOSED: '#999',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await closeoutApi.updatePunchItem(item.id, { status: newStatus } as any);
      onUpdate();
    } catch (error) {
      console.error('Failed to update punch item:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="punch-item-card">
      <div className="punch-item-card__header">
        <div className="punch-item-card__title-section">
          <h4>{item.title}</h4>
          {item.location && (
            <div className="punch-item-card__location">📍 {item.location}</div>
          )}
        </div>
        <div className="punch-item-card__badges">
          <span
            className="punch-item-card__priority-badge"
            style={{ backgroundColor: getPriorityColor(item.priority) }}
          >
            {formatLabel(item.priority)}
          </span>
          <span
            className="punch-item-card__status-badge"
            style={{ backgroundColor: getStatusColor(item.status) }}
          >
            {formatLabel(item.status)}
          </span>
        </div>
      </div>

      <div className="punch-item-card__description">
        {item.description}
      </div>

      <div className="punch-item-card__meta">
        {item.assignedTo && (
          <div className="punch-item-card__assigned">
            Assigned to: {item.assignedTo.firstName} {item.assignedTo.lastName}
          </div>
        )}
        <div className="punch-item-card__reported">
          Reported by: {item.reportedBy?.firstName} {item.reportedBy?.lastName} on{' '}
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>

      {item.images && item.images.length > 0 && (
        <div className="punch-item-card__images">
          <div className="punch-item-card__images-label">
            Images ({item.images.length})
          </div>
          <div className="punch-item-card__images-grid">
            {item.images.map((image) => (
              <a
                key={image.id}
                href={image.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="punch-item-card__image-link"
              >
                <img src={image.fileUrl} alt={image.description || 'Punch item image'} />
              </a>
            ))}
          </div>
        </div>
      )}

      {item.resolvedAt && (
        <div className="punch-item-card__resolution">
          <div className="punch-item-card__resolution-header">
            ✓ Resolved on {new Date(item.resolvedAt).toLocaleDateString()}
            {item.resolvedBy && (
              <> by {item.resolvedBy.firstName} {item.resolvedBy.lastName}</>
            )}
          </div>
          {item.resolutionNotes && (
            <div className="punch-item-card__resolution-notes">
              {item.resolutionNotes}
            </div>
          )}
        </div>
      )}

      <div className="punch-item-card__actions">
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="punch-item-card__status-select"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
    </div>
  );
};

export default PunchItemCard;


