import React, { useState } from 'react';
import type { PunchListItem } from '../../types';
import PunchItemCard from './PunchItemCard';
import './CloseoutComponents.css';

interface PunchListTableProps {
  items: PunchListItem[];
  onUpdate: () => void;
}

const PunchListTable: React.FC<PunchListTableProps> = ({ items, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  const filteredItems = items.filter((item) => {
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const _getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: '#4caf50',
      MEDIUM: '#ff9800',
      HIGH: '#f44336',
      CRITICAL: '#9c27b0',
    };
    return colors[priority] || '#999';
  };

  const _getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: '#f44336',
      IN_PROGRESS: '#ff9800',
      RESOLVED: '#0066cc',
      VERIFIED: '#4caf50',
      CLOSED: '#999',
    };
    return colors[status] || '#999';
  };

  const _formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (items.length === 0) {
    return (
      <div className="punch-list-table__empty">
        <p>No punch list items yet.</p>
        <p className="punch-list-table__hint">
          Add items that need to be addressed before project completion.
        </p>
      </div>
    );
  }

  return (
    <div className="punch-list-table">
      <div className="punch-list-table__filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="punch-list-table__filter"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="punch-list-table__filter"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="punch-list-table__list">
        {filteredItems.map((item) => (
          <PunchItemCard
            key={item.id}
            item={item}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default PunchListTable;

