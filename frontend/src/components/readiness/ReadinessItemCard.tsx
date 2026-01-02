import React, { useState } from 'react';
import { readinessApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ReadinessItem, ReadinessItemStatus } from '../../types';
import ReadinessItemDetails from './ReadinessItemDetails';
import './ReadinessComponents.css';

interface ReadinessItemCardProps {
  item: ReadinessItem;
  onUpdate: () => void;
}

const ReadinessItemCard: React.FC<ReadinessItemCardProps> = ({ item, onUpdate }) => {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: ReadinessItemStatus) => {
    const colors: Record<ReadinessItemStatus, string> = {
      NOT_STARTED: '#999',
      IN_PROGRESS: '#0066cc',
      PENDING_REVIEW: '#ff9800',
      COMPLETED: '#4caf50',
      NOT_APPLICABLE: '#ccc',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleStatusChange = async (newStatus: ReadinessItemStatus, completionNotes?: string) => {
    setIsUpdating(true);
    try {
      await readinessApi.updateItemStatus(item.id, newStatus, completionNotes);
      onUpdate();
      if (newStatus === 'COMPLETED' || newStatus === 'NOT_STARTED') {
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isCompleted = item.status === 'COMPLETED';
  const hasDocuments = (item._count?.documents || item.documents?.length || 0) > 0;
  const hasComments = (item._count?.comments || item.comments?.length || 0) > 0;

  return (
    <>
      <div
        className={`readiness-item-card ${isCompleted ? 'completed' : ''}`}
        onClick={() => setShowDetails(true)}
      >
        <div className="readiness-item-card__header">
          <div className="readiness-item-card__checkbox">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(e.target.checked ? 'COMPLETED' : 'NOT_STARTED');
              }}
              disabled={isUpdating}
            />
          </div>
          <div className="readiness-item-card__title-section">
            <h3 className="readiness-item-card__title">{item.title}</h3>
            {item.category && (
              <span className="readiness-item-card__category">{item.category}</span>
            )}
          </div>
          <span
            className="readiness-item-card__status"
            style={{ backgroundColor: getStatusColor(item.status) }}
          >
            {formatLabel(item.status)}
          </span>
        </div>

        {item.description && (
          <div className="readiness-item-card__description">{item.description}</div>
        )}

        <div className="readiness-item-card__footer">
          <div className="readiness-item-card__meta">
            {item.assignedTo && (
              <span className="readiness-item-card__assigned">
                Assigned to: {item.assignedTo.firstName} {item.assignedTo.lastName}
              </span>
            )}
            {item.completedBy && item.completedAt && (
              <span className="readiness-item-card__completed">
                Completed: {new Date(item.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="readiness-item-card__badges">
            {hasDocuments && (
              <span className="readiness-item-card__badge">
                📄 {item._count?.documents || item.documents?.length || 0} documents
              </span>
            )}
            {hasComments && (
              <span className="readiness-item-card__badge">
                💬 {item._count?.comments || item.comments?.length || 0} comments
              </span>
            )}
          </div>
        </div>
      </div>

      {showDetails && (
        <ReadinessItemDetails
          item={item}
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default ReadinessItemCard;


