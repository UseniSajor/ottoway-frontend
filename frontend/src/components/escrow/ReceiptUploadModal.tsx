import React, { useState } from 'react';
import { escrowApi } from '../../lib/api';
import './EscrowComponents.css';

interface ReceiptUploadModalProps {
  transactionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({ transactionId, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [vendor, setVendor] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await escrowApi.uploadReceipt(transactionId, file, {
        vendor: vendor.trim() || undefined,
        receiptDate: receiptDate || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="escrow-modal-header">
          <h3>Upload Receipt</h3>
          <button className="escrow-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="escrow-modal-form">
          {error && <div className="escrow-modal-error">{error}</div>}

          <div className="escrow-modal-field">
            <label htmlFor="file">
              Receipt File <span className="required">*</span>
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className="escrow-modal-file-info">
                <span>{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
            <div className="escrow-modal-hint">
              Accepted formats: PDF, JPG, PNG (max 10MB)
            </div>
          </div>

          <div className="escrow-modal-field-row">
            <div className="escrow-modal-field">
              <label htmlFor="vendor">Vendor (Optional)</label>
              <input
                id="vendor"
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Vendor name"
              />
            </div>

            <div className="escrow-modal-field">
              <label htmlFor="receiptDate">Receipt Date (Optional)</label>
              <input
                id="receiptDate"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
          </div>

          <div className="escrow-modal-field-row">
            <div className="escrow-modal-field">
              <label htmlFor="amount">Amount (Optional)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="escrow-modal-field">
              <label htmlFor="category">Category (Optional)</label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Materials, Labor"
              />
            </div>
          </div>

          <div className="escrow-modal-field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this receipt..."
              rows={3}
              className="escrow-modal-textarea"
            />
          </div>

          <div className="escrow-modal-actions">
            <button
              type="button"
              className="escrow-modal-button escrow-modal-button--secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="escrow-modal-button"
              disabled={isUploading || !file}
            >
              {isUploading ? 'Uploading...' : 'Upload Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;

