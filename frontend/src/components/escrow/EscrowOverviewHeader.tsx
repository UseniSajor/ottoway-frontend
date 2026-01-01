import React from 'react';
import type { EscrowAgreement } from '../../types';
import './EscrowComponents.css';

interface EscrowOverviewHeaderProps {
  escrow: EscrowAgreement;
  stats: {
    total: number;
    funded: number;
    available: number;
    released: number;
    pending: number;
  } | null;
}

const EscrowOverviewHeader: React.FC<EscrowOverviewHeaderProps> = ({ escrow, stats }) => {
  if (!stats) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#999',
      PENDING_FUNDING: '#ff9800',
      FUNDED: '#4caf50',
      ACTIVE: '#0066cc',
      COMPLETED: '#4caf50',
      CANCELLED: '#f44336',
      DISPUTED: '#f44336',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="escrow-overview-header">
      <div className="escrow-overview-header__main">
        <div className="escrow-overview-header__status">
          <span
            className="escrow-overview-header__status-badge"
            style={{ backgroundColor: getStatusColor(escrow.status) }}
          >
            {formatLabel(escrow.status)}
          </span>
        </div>
        <div className="escrow-overview-header__amounts">
          <div className="escrow-overview-header__amount">
            <div className="escrow-overview-header__amount-label">Total Escrow</div>
            <div className="escrow-overview-header__amount-value">
              ${stats.total.toLocaleString()} {escrow.currency}
            </div>
          </div>
          {escrow.funded && (
            <>
              <div className="escrow-overview-header__amount">
                <div className="escrow-overview-header__amount-label">Available Balance</div>
                <div className="escrow-overview-header__amount-value escrow-overview-header__amount-value--available">
                  ${stats.available.toLocaleString()}
                </div>
              </div>
              <div className="escrow-overview-header__amount">
                <div className="escrow-overview-header__amount-label">Released to Date</div>
                <div className="escrow-overview-header__amount-value">
                  ${stats.released.toLocaleString()}
                </div>
              </div>
              {stats.pending > 0 && (
                <div className="escrow-overview-header__amount">
                  <div className="escrow-overview-header__amount-label">Pending Releases</div>
                  <div className="escrow-overview-header__amount-value escrow-overview-header__amount-value--pending">
                    ${stats.pending.toLocaleString()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscrowOverviewHeader;

