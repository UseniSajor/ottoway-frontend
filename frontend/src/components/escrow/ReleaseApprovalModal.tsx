import React, { useState } from 'react';
import { escrowApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { EscrowAgreement, EscrowTransaction } from '../../types';
import ReceiptVerificationPanel from './ReceiptVerificationPanel';
import './EscrowComponents.css';

interface ReleaseApprovalModalProps {
  transaction: EscrowTransaction;
  escrow: EscrowAgreement;
  onClose: () => void;
  onUpdate: () => void;
}

const ReleaseApprovalModal: React.FC<ReleaseApprovalModalProps> = ({ transaction, escrow, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const canApprove = transaction.status === 'PENDING_APPROVAL' && transaction.verificationComplete;
  const canReject = transaction.status === 'PENDING_APPROVAL' || transaction.status === 'VERIFICATION_REQUIRED';

  const handleApprove = async () => {
    setIsProcessing(true);
    setError('');

    try {
      await escrowApi.approveRelease(transaction.id, approvalNotes);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Failed to approve release:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to approve release');
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await escrowApi.rejectRelease(transaction.id, rejectionReason);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Failed to reject release:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to reject release');
      setIsProcessing(false);
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal-content escrow-modal-content--large" onClick={(e) => e.stopPropagation()}>
        <div className="escrow-modal-header">
          <div>
            <h3>Release Approval</h3>
            <div className="escrow-modal-subtitle">
              {transaction.milestone?.name || 'Milestone Release'}
            </div>
          </div>
          <button className="escrow-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="escrow-modal-body">
          {error && <div className="escrow-modal-error">{error}</div>}

          {/* Transaction Info */}
          <div className="escrow-modal-section">
            <h4>Transaction Details</h4>
            <div className="escrow-modal-info-grid">
              <div>
                <label>Amount</label>
                <div className="escrow-modal-amount">
                  ${Number(transaction.amount).toLocaleString()} {transaction.currency}
                </div>
              </div>
              <div>
                <label>Status</label>
                <div>{formatLabel(transaction.status)}</div>
              </div>
              {transaction.releaseRequestedBy && (
                <div>
                  <label>Requested By</label>
                  <div>
                    {transaction.releaseRequestedBy.firstName}{' '}
                    {transaction.releaseRequestedBy.lastName}
                  </div>
                </div>
              )}
              {transaction.releaseRequestedAt && (
                <div>
                  <label>Requested On</label>
                  <div>{new Date(transaction.releaseRequestedAt).toLocaleString()}</div>
                </div>
              )}
              {transaction.description && (
                <div>
                  <label>Description</label>
                  <div>{transaction.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Receipts Section */}
          <div className="escrow-modal-section">
            <h4>Receipts & Verification</h4>
            <ReceiptVerificationPanel
              transaction={transaction}
              onUpdate={onUpdate}
            />
          </div>

          {/* Verification Status */}
          {transaction.verificationComplete ? (
            <div className="escrow-modal-verification-complete">
              ✓ All receipts verified. Ready for approval.
            </div>
          ) : (
            <div className="escrow-modal-verification-pending">
              ⏳ Waiting for all receipts to be verified.
            </div>
          )}

          {/* Approval/Rejection Section */}
          {canApprove && (
            <div className="escrow-modal-section">
              <h4>Approve Release</h4>
              <div className="escrow-modal-field">
                <label htmlFor="approvalNotes">Approval Notes (Optional)</label>
                <textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                  className="escrow-modal-textarea"
                />
              </div>
              <button
                className="escrow-modal-button escrow-modal-button--success"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Approve & Transfer Funds'}
              </button>
            </div>
          )}

          {canReject && (
            <div className="escrow-modal-section">
              <h4>Reject Release</h4>
              <div className="escrow-modal-field">
                <label htmlFor="rejectionReason">
                  Reason for Rejection <span className="required">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this release..."
                  rows={3}
                  className="escrow-modal-textarea"
                  required
                />
              </div>
              <button
                className="escrow-modal-button escrow-modal-button--danger"
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? 'Processing...' : 'Reject Release'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseApprovalModal;

