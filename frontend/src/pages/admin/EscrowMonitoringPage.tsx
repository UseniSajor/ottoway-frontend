import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface EscrowOverview {
  totalFunds: number;
  pendingReleases: number;
  transactions: any[];
}

const EscrowMonitoringPage: React.FC = () => {
  const [overview, setOverview] = useState<EscrowOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getEscrowOverview();
      const data = (response as any)?.data || response;
      setOverview(data);
    } catch (error) {
      console.error('Failed to load escrow overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="escrow-monitoring-page">
        <div className="escrow-monitoring-page__loading">Loading escrow data...</div>
      </div>
    );
  }

  return (
    <div className="escrow-monitoring-page">
      <div className="escrow-monitoring-page__header">
        <h2>Escrow Monitoring</h2>
      </div>

      {overview && (
        <>
          {/* Overview Metrics */}
          <div className="escrow-monitoring-page__metrics">
            <div className="escrow-monitoring-page__metric-card">
              <div className="escrow-monitoring-page__metric-label">Total Funds Held</div>
              <div className="escrow-monitoring-page__metric-value">
                {formatCurrency(Number(overview.totalFunds))}
              </div>
            </div>
            <div className="escrow-monitoring-page__metric-card escrow-monitoring-page__metric-card--alert">
              <div className="escrow-monitoring-page__metric-label">Pending Releases</div>
              <div className="escrow-monitoring-page__metric-value">
                {overview.pendingReleases}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="escrow-monitoring-page__section">
            <h3>Recent Transactions</h3>
            <div className="escrow-monitoring-page__table-container">
              <table className="escrow-monitoring-page__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="escrow-monitoring-page__empty">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    overview.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {transaction.escrowAgreement?.project?.name || 'N/A'}
                        </td>
                        <td>{transaction.transactionType}</td>
                        <td>{formatCurrency(Number(transaction.amount))}</td>
                        <td>
                          <span
                            className={`escrow-monitoring-page__status escrow-monitoring-page__status--${transaction.status.toLowerCase()}`}
                          >
                            {transaction.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <button
                            className="escrow-monitoring-page__action-button"
                            onClick={() => {
                              // TODO: View transaction details
                              console.log('View transaction:', transaction.id);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EscrowMonitoringPage;

