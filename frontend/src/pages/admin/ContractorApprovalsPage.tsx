import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  approvalStatus?: string;
  complianceDocuments?: any[];
  createdAt: string;
}

const ContractorApprovalsPage: React.FC = () => {
  const [pendingContractors, setPendingContractors] = useState<Contractor[]>([]);
  const [approvedContractors, setApprovedContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      setIsLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        adminApi.getPendingContractors(),
        adminApi.getContractors(),
      ]);

      const pending = (pendingRes as any)?.data || [];
      const all = (approvedRes as any)?.data || [];

      setPendingContractors(pending);
      setApprovedContractors(
        all.filter((c: Contractor) => c.approvalStatus === 'APPROVED')
      );
    } catch (error) {
      console.error('Failed to load contractors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (contractorId: string) => {
    try {
      await adminApi.approveContractor(contractorId, { notes: '' });
      loadContractors();
      setSelectedContractor(null);
    } catch (error) {
      console.error('Failed to approve contractor:', error);
      alert('Failed to approve contractor');
    }
  };

  const handleReject = async (contractorId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await adminApi.rejectContractor(contractorId, { reason: rejectionReason });
      loadContractors();
      setSelectedContractor(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject contractor:', error);
      alert('Failed to reject contractor');
    }
  };

  if (isLoading) {
    return (
      <div className="contractor-approvals-page">
        <div className="contractor-approvals-page__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="contractor-approvals-page">
      <div className="contractor-approvals-page__header">
        <h2>Contractor Approvals</h2>
      </div>

      {/* Pending Approvals */}
      <div className="contractor-approvals-page__section">
        <h3>Pending Approvals ({pendingContractors.length})</h3>
        {pendingContractors.length === 0 ? (
          <div className="contractor-approvals-page__empty">No pending approvals</div>
        ) : (
          <div className="contractor-approvals-page__contractor-list">
            {pendingContractors.map((contractor) => (
              <div key={contractor.id} className="contractor-approvals-page__contractor-card">
                <div className="contractor-approvals-page__contractor-info">
                  <h4>
                    {contractor.firstName} {contractor.lastName}
                  </h4>
                  <div>{contractor.email}</div>
                  <div>Role: {contractor.role.replace(/_/g, ' ')}</div>
                  <div>
                    Documents: {contractor.complianceDocuments?.length || 0} uploaded
                  </div>
                </div>
                <div className="contractor-approvals-page__contractor-actions">
                  <button
                    className="contractor-approvals-page__view-button"
                    onClick={() => setSelectedContractor(contractor)}
                  >
                    View Details
                  </button>
                  <button
                    className="contractor-approvals-page__approve-button"
                    onClick={() => handleApprove(contractor.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="contractor-approvals-page__reject-button"
                    onClick={() => {
                      setSelectedContractor(contractor);
                      setRejectionReason('');
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Contractors */}
      <div className="contractor-approvals-page__section">
        <h3>Approved Contractors ({approvedContractors.length})</h3>
        {approvedContractors.length === 0 ? (
          <div className="contractor-approvals-page__empty">No approved contractors</div>
        ) : (
          <div className="contractor-approvals-page__contractor-list">
            {approvedContractors.map((contractor) => (
              <div key={contractor.id} className="contractor-approvals-page__contractor-card">
                <div className="contractor-approvals-page__contractor-info">
                  <h4>
                    {contractor.firstName} {contractor.lastName}
                  </h4>
                  <div>{contractor.email}</div>
                  <div>Role: {contractor.role.replace(/_/g, ' ')}</div>
                  <div className="contractor-approvals-page__status-approved">✓ Approved</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedContractor && (
        <div className="contractor-approvals-page__modal-overlay">
          <div className="contractor-approvals-page__modal">
            <h3>Reject Contractor</h3>
            <p>
              Provide a reason for rejecting {selectedContractor.firstName}{' '}
              {selectedContractor.lastName}:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="contractor-approvals-page__rejection-textarea"
            />
            <div className="contractor-approvals-page__modal-actions">
              <button
                className="contractor-approvals-page__cancel-button"
                onClick={() => {
                  setSelectedContractor(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="contractor-approvals-page__confirm-reject-button"
                onClick={() => handleReject(selectedContractor.id)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorApprovalsPage;
