import React from 'react';
import type { Milestone, EscrowTransaction } from '../../types';
import './EscrowComponents.css';

interface MilestoneReleaseCardProps {
  milestone: Milestone;
  transaction?: EscrowTransaction;
  canRequest: boolean;
  canApprove: boolean;
  onRequestRelease: () => void;
  onViewDetails: () => void;
  onApprove: () => void;
}

const MilestoneReleaseCard: React.FC<MilestoneReleaseCardProps> = ({
  milestone,
  transaction,
  canRequest,
  canApprove,
  onRequestRelease,
  onViewDetails,
  onApprove,
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#999',
      IN_PROGRESS: '#0066cc',
      COMPLETED: '#4caf50',
      VERIFIED: '#4caf50',
      PAID: '#4caf50',
    };
    return colors[status] || '#999';
  };

  const getTransactionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#999',
      PROCESSING: '#0066cc',
      VERIFICATION_REQUIRED: '#ff9800',
      PENDING_APPROVAL: '#ff9800',
      APPROVED: '#4caf50',
      COMPLETED: '#4caf50',
      FAILED: '#f44336',
      REJECTED: '#f44336',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="milestone-release-card">
      <div className="milestone-release-card__header">
        <div className="milestone-release-card__title-section">
          <h4>{milestone.name}</h4>
          {milestone.description && (
            <p className="milestone-release-card__description">{milestone.description}</p>
          )}
        </div>
        <div className="milestone-release-card__badges">
          <span
            className="milestone-release-card__status-badge"
            style={{ backgroundColor: getStatusColor(milestone.status) }}
          >
            {formatLabel(milestone.status)}
          </span>
          {milestone.amount && (
            <span className="milestone-release-card__amount">
              ${Number(milestone.amount).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {transaction && (
        <div className="milestone-release-card__transaction">
          <div className="milestone-release-card__transaction-header">
            <span className="milestone-release-card__transaction-label">Release Status:</span>
            <span
              className="milestone-release-card__transaction-status"
              style={{ backgroundColor: getTransactionStatusColor(transaction.status) }}
            >
              {formatLabel(transaction.status)}
            </span>
          </div>
          {transaction.releaseRequestedBy && (
            <div className="milestone-release-card__transaction-meta">
              Requested by {transaction.releaseRequestedBy.firstName}{' '}
              {transaction.releaseRequestedBy.lastName} on{' '}
              {transaction.releaseRequestedAt &&
                new Date(transaction.releaseRequestedAt).toLocaleDateString()}
            </div>
          )}
          {transaction.receipts && transaction.receipts.length > 0 && (
            <div className="milestone-release-card__receipts">
              {transaction.receipts.length} receipt(s) uploaded
              {transaction.receipts.filter(r => r.verified).length > 0 && (
                <span className="milestone-release-card__verified">
                  • {transaction.receipts.filter(r => r.verified).length} verified
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="milestone-release-card__actions">
        {canRequest && (
          <button
            className="milestone-release-card__action-button"
            onClick={onRequestRelease}
          >
            Request Release
          </button>
        )}
        {transaction && (
          <button
            className="milestone-release-card__action-button milestone-release-card__action-button--secondary"
            onClick={onViewDetails}
          >
            View Details
          </button>
        )}
        {canApprove && (
          <button
            className="milestone-release-card__action-button milestone-release-card__action-button--success"
            onClick={onApprove}
          >
            Approve Release
          </button>
        )}
      </div>
    </div>
  );
};

export default MilestoneReleaseCard;


