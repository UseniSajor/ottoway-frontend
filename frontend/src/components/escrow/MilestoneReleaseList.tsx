import React, { useState } from 'react';
import { escrowApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { EscrowAgreement, Milestone, EscrowTransaction } from '../../types';
import MilestoneReleaseCard from './MilestoneReleaseCard';
import ReleaseApprovalModal from './ReleaseApprovalModal';
import './EscrowComponents.css';

interface MilestoneReleaseListProps {
  escrow: EscrowAgreement;
  onUpdate: () => void;
}

const MilestoneReleaseList: React.FC<MilestoneReleaseListProps> = ({ escrow, onUpdate }) => {
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);

  const milestones = escrow.contract?.milestones || [];
  const transactions = escrow.transactions || [];

  const getMilestoneTransaction = (milestoneId: string): EscrowTransaction | undefined => {
    return transactions.find(t => t.milestoneId === milestoneId);
  };

  const canRequestRelease = (milestone: Milestone) => {
    if (!escrow.funded) return false;
    if (milestone.status === 'PAID') return false;
    const existingTransaction = getMilestoneTransaction(milestone.id);
    if (existingTransaction && existingTransaction.status !== 'REJECTED') return false;
    return true;
  };

  const canApprove = (transaction: EscrowTransaction) => {
    if (transaction.status !== 'PENDING_APPROVAL') return false;
    if (!transaction.verificationComplete) return false;
    return escrow.payerId === user?.id || user?.role === 'ADMIN';
  };

  const handleRequestRelease = async (milestoneId: string, notes?: string) => {
    try {
      await escrowApi.requestRelease(milestoneId, notes);
      onUpdate();
    } catch (error) {
      console.error('Failed to request release:', error);
    }
  };

  if (milestones.length === 0) {
    return (
      <div className="escrow-milestones-empty">
        <p>No milestones found for this contract.</p>
        <p className="escrow-milestones-hint">
          Milestones are created when a contract is signed. Contact your project manager if you need to add milestones.
        </p>
      </div>
    );
  }

  return (
    <div className="escrow-milestones">
      <div className="escrow-milestones__header">
        <h3>Contract Milestones</h3>
        <div className="escrow-milestones__summary">
          {milestones.filter(m => m.status === 'PAID').length} of {milestones.length} milestones paid
        </div>
      </div>

      <div className="escrow-milestones__list">
        {milestones.map((milestone) => {
          const transaction = getMilestoneTransaction(milestone.id);
          return (
            <MilestoneReleaseCard
              key={milestone.id}
              milestone={milestone}
              transaction={transaction}
              canRequest={canRequestRelease(milestone)}
              canApprove={transaction ? canApprove(transaction) : false}
              onRequestRelease={() => handleRequestRelease(milestone.id)}
              onViewDetails={() => transaction && setSelectedTransaction(transaction)}
              onApprove={() => transaction && setSelectedTransaction(transaction)}
            />
          );
        })}
      </div>

      {selectedTransaction && (
        <ReleaseApprovalModal
          transaction={selectedTransaction}
          escrow={escrow}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default MilestoneReleaseList;

