import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface Dispute {
  id: string;
  title: string;
  description: string;
  disputeType: string;
  status: string;
  priority: string;
  filedBy: {
    firstName: string;
    lastName: string;
  };
  against: {
    firstName: string;
    lastName: string;
  };
  project: {
    id: string;
    name: string;
  };
  evidence: any[];
  createdAt: string;
}

const DisputesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    loadDisputes();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    if (id) {
      loadDisputeDetails(id);
    }
  }, [id]);

  const loadDisputes = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDisputes({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
      });
      const data = (response as any)?.data || response;
      setDisputes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDisputeDetails = async (disputeId: string) => {
    try {
      const response = await adminApi.getDispute(disputeId);
      const data = (response as any)?.data || response;
      setSelectedDispute(data);
    } catch (error) {
      console.error('Failed to load dispute details:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="disputes-page">
        <div className="disputes-page__loading">Loading disputes...</div>
      </div>
    );
  }

  // If viewing a specific dispute
  if (selectedDispute) {
    return (
      <div className="disputes-page">
        <div className="disputes-page__header">
          <button
            className="disputes-page__back-button"
            onClick={() => setSelectedDispute(null)}
          >
            ← Back to Disputes
          </button>
          <h2>{selectedDispute.title}</h2>
        </div>

        <div className="disputes-page__detail">
          <div className="disputes-page__detail-section">
            <h3>Details</h3>
            <div className="disputes-page__detail-info">
              <div>
                <label>Type:</label>
                <div>{selectedDispute.disputeType.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <label>Status:</label>
                <div>
                  <span
                    className={`disputes-page__status disputes-page__status--${selectedDispute.status.toLowerCase()}`}
                  >
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label>Priority:</label>
                <div>
                  <span
                    className={`disputes-page__priority disputes-page__priority--${selectedDispute.priority.toLowerCase()}`}
                  >
                    {selectedDispute.priority}
                  </span>
                </div>
              </div>
              <div>
                <label>Project:</label>
                <div>{selectedDispute.project?.name}</div>
              </div>
              <div>
                <label>Filed By:</label>
                <div>
                  {selectedDispute.filedBy?.firstName} {selectedDispute.filedBy?.lastName}
                </div>
              </div>
              <div>
                <label>Against:</label>
                <div>
                  {selectedDispute.against?.firstName} {selectedDispute.against?.lastName}
                </div>
              </div>
            </div>
          </div>

          <div className="disputes-page__detail-section">
            <h3>Description</h3>
            <p>{selectedDispute.description}</p>
          </div>

          <div className="disputes-page__detail-section">
            <h3>Evidence ({selectedDispute.evidence?.length || 0})</h3>
            {selectedDispute.evidence && selectedDispute.evidence.length > 0 ? (
              <div className="disputes-page__evidence-list">
                {selectedDispute.evidence.map((evidence, index) => (
                  <div key={index} className="disputes-page__evidence-item">
                    <div>{evidence.evidenceType}</div>
                    <div>{evidence.description}</div>
                    {evidence.fileUrl && (
                      <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer">
                        View File
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="disputes-page__empty">No evidence submitted</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Disputes list view
  return (
    <div className="disputes-page">
      <div className="disputes-page__header">
        <h2>Disputes</h2>
      </div>

      <div className="disputes-page__filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="disputes-page__filter"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ESCALATED">Escalated</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="disputes-page__filter"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="disputes-page__disputes-list">
        {disputes.length === 0 ? (
          <div className="disputes-page__empty">No disputes found</div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="disputes-page__dispute-card"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="disputes-page__dispute-header">
                <h3>{dispute.title}</h3>
                <div className="disputes-page__dispute-badges">
                  <span
                    className={`disputes-page__status disputes-page__status--${dispute.status.toLowerCase()}`}
                  >
                    {dispute.status.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`disputes-page__priority disputes-page__priority--${dispute.priority.toLowerCase()}`}
                  >
                    {dispute.priority}
                  </span>
                </div>
              </div>
              <div className="disputes-page__dispute-info">
                <div>Project: {dispute.project?.name}</div>
                <div>
                  {dispute.filedBy?.firstName} {dispute.filedBy?.lastName} vs.{' '}
                  {dispute.against?.firstName} {dispute.against?.lastName}
                </div>
                <div>Type: {dispute.disputeType.replace(/_/g, ' ')}</div>
                <div>Evidence: {dispute.evidence?.length || 0} items</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DisputesPage;

