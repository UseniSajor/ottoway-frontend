import React from 'react';
import type { DesignStatus } from '../../types';
import './DesignComponents.css';

interface DesignStatusBadgeProps {
  status: DesignStatus;
}

const DesignStatusBadge: React.FC<DesignStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: DesignStatus) => {
    const colors: Record<DesignStatus, string> = {
      DRAFT: '#999',
      IN_PROGRESS: '#0066cc',
      REVIEW_REQUIRED: '#ff9800',
      REVISIONS_REQUESTED: '#f44336',
      APPROVED_FOR_PERMIT: '#4caf50',
      SUPERSEDED: '#ccc',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className="design-status-badge"
      style={{ backgroundColor: getStatusColor(status) }}
    >
      {formatLabel(status)}
    </span>
  );
};

export default DesignStatusBadge;


