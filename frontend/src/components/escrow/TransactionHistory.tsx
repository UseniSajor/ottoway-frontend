import React, { useState } from 'react';
import type { EscrowTransaction } from '../../types';
import './EscrowComponents.css';

interface TransactionHistoryProps {
  transactions: EscrowTransaction[];
  onUpdate: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = !filterType || t.transactionType === filterType;
    const matchesStatus = !filterStatus || t.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DEPOSIT: '#4caf50',
      RELEASE: '#0066cc',
      REFUND: '#ff9800',
      FEE: '#999',
      ADJUSTMENT: '#9c27b0',
    };
    return colors[type] || '#999';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#999',
      PROCESSING: '#0066cc',
      VERIFICATION_REQUIRED: '#ff9800',
      PENDING_APPROVAL: '#ff9800',
      APPROVED: '#4caf50',
      COMPLETED: '#4caf50',
      FAILED: '#f44336',
      REJECTED: '#f44336',
      REFUNDED: '#ff9800',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="transaction-history">
      <div className="transaction-history__header">
        <h3>Transaction History</h3>
        <div className="transaction-history__filters">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="transaction-history__filter"
          >
            <option value="">All Types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="RELEASE">Releases</option>
            <option value="REFUND">Refunds</option>
            <option value="FEE">Fees</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="transaction-history__filter"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="VERIFICATION_REQUIRED">Verification Required</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="transaction-history__empty">
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="transaction-history__table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
                <th>Milestone</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span
                      className="transaction-history__type-badge"
                      style={{ backgroundColor: getTypeColor(transaction.transactionType) }}
                    >
                      {formatLabel(transaction.transactionType)}
                    </span>
                  </td>
                  <td className="transaction-history__amount">
                    ${Number(transaction.amount).toLocaleString()} {transaction.currency}
                  </td>
                  <td>
                    <span
                      className="transaction-history__status-badge"
                      style={{ backgroundColor: getStatusColor(transaction.status) }}
                    >
                      {formatLabel(transaction.status)}
                    </span>
                  </td>
                  <td>{transaction.description || '-'}</td>
                  <td>{transaction.milestone?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;

