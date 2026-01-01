import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { escrowApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { EscrowAgreement, EscrowTransaction, Milestone } from '../../types';
import EscrowOverviewHeader from '../../components/escrow/EscrowOverviewHeader';
import StripeFundingForm from '../../components/escrow/StripeFundingForm';
import MilestoneReleaseList from '../../components/escrow/MilestoneReleaseList';
import TransactionHistory from '../../components/escrow/TransactionHistory';
import './OwnerPages.css';
import './EscrowPage.css';

const EscrowPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [escrow, setEscrow] = useState<EscrowAgreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'transactions'>('overview');

  useEffect(() => {
    if (projectId) {
      loadEscrow();
    }
  }, [projectId]);

  const loadEscrow = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError('');
      const response = await escrowApi.getAgreement(projectId);
      const data = (response as any)?.data || response;
      setEscrow(data as EscrowAgreement);
    } catch (err: any) {
      console.error('Failed to load escrow:', err);
      if (err?.response?.status === 404) {
        // Escrow doesn't exist yet - that's okay
        setEscrow(null);
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load escrow');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscrowUpdate = () => {
    loadEscrow();
  };

  const calculateStats = () => {
    if (!escrow) return null;

    const funded = escrow.fundedAmount || 0;
    const transactions = escrow.transactions || [];
    
    const deposits = transactions
      .filter(t => t.transactionType === 'DEPOSIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const released = transactions
      .filter(t => t.transactionType === 'RELEASE' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pending = transactions
      .filter(t => t.transactionType === 'RELEASE' && (t.status === 'VERIFICATION_REQUIRED' || t.status === 'PENDING_APPROVAL'))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const available = deposits - released - pending;

    return {
      total: Number(escrow.totalAmount),
      funded,
      available,
      released,
      pending,
    };
  };

  const stats = calculateStats();

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to={`/owner/projects/${projectId}`} className="owner-page__back">
          ← Back to Project
        </Link>
        <h2>Escrow & Payment Management</h2>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {isLoading ? (
        <div className="owner-page__loading">Loading escrow information...</div>
      ) : !escrow ? (
        <div className="owner-page__empty">
          <p>No escrow agreement found for this project.</p>
          <p className="escrow-page__hint">
            Escrow agreements are typically created when a contract is signed. Contact your project manager to set up escrow.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Header */}
          <EscrowOverviewHeader escrow={escrow} stats={stats} />

          {/* Funding Section (if not funded) */}
          {!escrow.funded && escrow.status === 'DRAFT' && (
            <div className="escrow-page__funding-section">
              <h3>Fund Escrow Account</h3>
              <StripeFundingForm
                escrow={escrow}
                onSuccess={handleEscrowUpdate}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="escrow-page__tabs">
            <button
              className={`escrow-page__tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`escrow-page__tab ${activeTab === 'milestones' ? 'active' : ''}`}
              onClick={() => setActiveTab('milestones')}
            >
              Milestones & Releases
            </button>
            <button
              className={`escrow-page__tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transaction History
            </button>
          </div>

          {/* Tab Content */}
          <div className="escrow-page__content">
            {activeTab === 'overview' && (
              <div className="escrow-page__overview">
                <div className="escrow-page__info-section">
                  <h3>Escrow Details</h3>
                  <div className="escrow-page__info-grid">
                    <div>
                      <label>Status</label>
                      <div className={`escrow-page__status escrow-page__status--${escrow.status.toLowerCase()}`}>
                        {escrow.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div>
                      <label>Total Amount</label>
                      <div className="escrow-page__amount">
                        ${Number(escrow.totalAmount).toLocaleString()} {escrow.currency}
                      </div>
                    </div>
                    {escrow.funded && (
                      <>
                        <div>
                          <label>Funded Amount</label>
                          <div>${stats?.funded.toLocaleString()}</div>
                        </div>
                        <div>
                          <label>Available Balance</label>
                          <div className="escrow-page__balance">
                            ${stats?.available.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <label>Payer</label>
                      <div>
                        {escrow.payer
                          ? `${escrow.payer.firstName} ${escrow.payer.lastName}`
                          : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label>Payee</label>
                      <div>
                        {escrow.payee
                          ? `${escrow.payee.firstName} ${escrow.payee.lastName}`
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                {escrow.contract && (
                  <div className="escrow-page__info-section">
                    <h3>Associated Contract</h3>
                    <p>{escrow.contract.contractName || 'Contract'}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'milestones' && (
              <MilestoneReleaseList
                escrow={escrow}
                onUpdate={handleEscrowUpdate}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionHistory
                transactions={escrow.transactions || []}
                onUpdate={handleEscrowUpdate}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EscrowPage;
