import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './OwnerPages.css';

const ContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load contract from API
    setIsLoading(false);
  }, [id]);

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <h2>Contract Agreement</h2>
      </div>

      {isLoading ? (
        <div className="owner-page__loading">Loading contract...</div>
      ) : contract ? (
        <div className="owner-page__content">
          <div className="owner-page__section">
            <h3>Contract Status</h3>
            <div className={`owner-page__status owner-page__status--${contract.status?.toLowerCase()}`}>
              {contract.status}
            </div>
          </div>

          {contract.status === 'PENDING_SIGNATURES' && (
            <div className="owner-page__section">
              <h3>Signatures Required</h3>
              <div className="owner-page__signatures">
                {/* TODO: Show signature list */}
              </div>
            </div>
          )}

          {contract.contractUrl && (
            <div className="owner-page__section">
              <a href={contract.contractUrl} target="_blank" rel="noopener noreferrer" className="owner-page__button">
                View Contract Document
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="owner-page__empty">No contract yet.</div>
      )}
    </div>
  );
};

export default ContractPage;



