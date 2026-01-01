import React, { useState } from 'react';
import { escrowApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { EscrowTransaction } from '../../types';
import ReceiptUploadModal from './ReceiptUploadModal';
import OCRResultDisplay from './OCRResultDisplay';
import './EscrowComponents.css';

interface ReceiptVerificationPanelProps {
  transaction: EscrowTransaction;
  onUpdate: () => void;
}

const ReceiptVerificationPanel: React.FC<ReceiptVerificationPanelProps> = ({ transaction, onUpdate }) => {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const receipts = transaction.receipts || [];
  const canUpload = transaction.status === 'VERIFICATION_REQUIRED' || transaction.status === 'PENDING_APPROVAL';
  // Note: canVerify should check if user is the payer - this is simplified
  const canVerify = user?.role === 'ADMIN';

  const handleVerify = async (receiptId: string, verified: boolean, notes?: string) => {
    try {
      await escrowApi.verifyReceipt(receiptId, verified, notes);
      onUpdate();
    } catch (error) {
      console.error('Failed to verify receipt:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="receipt-verification-panel">
      <div className="receipt-verification-panel__header">
        <h4>Receipts ({receipts.length})</h4>
        {canUpload && (
          <button
            className="receipt-verification-panel__upload-button"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload Receipt
          </button>
        )}
      </div>

      {receipts.length === 0 ? (
        <div className="receipt-verification-panel__empty">
          <p>No receipts uploaded yet.</p>
          {canUpload && (
            <button
              className="receipt-verification-panel__upload-button"
              onClick={() => setShowUploadModal(true)}
            >
              Upload First Receipt
            </button>
          )}
        </div>
      ) : (
        <div className="receipt-verification-panel__list">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="receipt-verification-panel__item">
              <div className="receipt-verification-panel__item-header">
                <div className="receipt-verification-panel__item-info">
                  <div className="receipt-verification-panel__item-name">{receipt.fileName}</div>
                  <div className="receipt-verification-panel__item-meta">
                    {formatFileSize(receipt.fileSize)} •{' '}
                    {receipt.uploadedBy
                      ? `${receipt.uploadedBy.firstName} ${receipt.uploadedBy.lastName}`
                      : 'Unknown'}{' '}
                    • {new Date(receipt.createdAt).toLocaleDateString()}
                  </div>
                  {receipt.vendor && (
                    <div className="receipt-verification-panel__item-vendor">
                      Vendor: {receipt.vendor}
                    </div>
                  )}
                  {receipt.amount && (
                    <div className="receipt-verification-panel__item-amount">
                      Amount: ${Number(receipt.amount).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="receipt-verification-panel__item-status">
                  {receipt.verified ? (
                    <span className="receipt-verification-panel__status-badge receipt-verification-panel__status-badge--verified">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="receipt-verification-panel__status-badge receipt-verification-panel__status-badge--pending">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {receipt.ocrResult && (
                <div className="receipt-verification-panel__ocr">
                  <button
                    className="receipt-verification-panel__ocr-toggle"
                    onClick={() =>
                      setSelectedReceipt(selectedReceipt === receipt.id ? null : receipt.id)
                    }
                  >
                    {selectedReceipt === receipt.id ? 'Hide' : 'Show'} OCR Results
                  </button>
                  {selectedReceipt === receipt.id && (
                    <OCRResultDisplay ocrResult={receipt.ocrResult} />
                  )}
                </div>
              )}

              {receipt.verifiedBy && (
                <div className="receipt-verification-panel__verification-info">
                  Verified by {receipt.verifiedBy.firstName} {receipt.verifiedBy.lastName} on{' '}
                  {receipt.verifiedAt && new Date(receipt.verifiedAt).toLocaleDateString()}
                  {receipt.verificationNotes && (
                    <div className="receipt-verification-panel__verification-notes">
                      Notes: {receipt.verificationNotes}
                    </div>
                  )}
                </div>
              )}

              <div className="receipt-verification-panel__item-actions">
                <a
                  href={receipt.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="receipt-verification-panel__action-link"
                >
                  View/Download
                </a>
                {canVerify && !receipt.verified && (
                  <>
                    <button
                      className="receipt-verification-panel__action-link receipt-verification-panel__action-link--success"
                      onClick={() => handleVerify(receipt.id, true)}
                    >
                      Verify
                    </button>
                    <button
                      className="receipt-verification-panel__action-link receipt-verification-panel__action-link--danger"
                      onClick={() => handleVerify(receipt.id, false, 'Rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <ReceiptUploadModal
          transactionId={transaction.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default ReceiptVerificationPanel;

