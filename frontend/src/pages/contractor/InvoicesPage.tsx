import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../lib/api';
import './ContractorPages.css';

interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  amount: number;
  status: string;
  releaseApproved: boolean;
  releasedAt?: string;
  createdAt: string;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await contractorApi.getInvoices();
      const data = (response as any)?.data || response;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
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

  const filteredInvoices = invoices.filter((invoice) => {
    if (!filterStatus) return true;
    if (filterStatus === 'paid') return invoice.releaseApproved;
    if (filterStatus === 'pending') return !invoice.releaseApproved;
    return invoice.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="invoices-page">
        <div className="invoices-page__loading">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="invoices-page">
      <div className="invoices-page__header">
        <h2>Invoices</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="invoices-page__filter"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="invoices-page__empty">
          <p>No invoices found.</p>
        </div>
      ) : (
        <div className="invoices-page__invoices-list">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="invoices-page__invoice-card">
              <div className="invoices-page__invoice-header">
                <div>
                  <h3>{invoice.projectName}</h3>
                  {invoice.milestoneName && (
                    <div className="invoices-page__invoice-milestone">
                      Milestone: {invoice.milestoneName}
                    </div>
                  )}
                </div>
                <div className="invoices-page__invoice-amount">
                  {formatCurrency(invoice.amount)}
                </div>
              </div>
              <div className="invoices-page__invoice-meta">
                <div>
                  Status: <span className={`invoices-page__invoice-status invoices-page__invoice-status--${invoice.status.toLowerCase()}`}>
                    {invoice.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  Payment: {invoice.releaseApproved ? (
                    <span className="invoices-page__invoice-paid">✓ Paid</span>
                  ) : (
                    <span className="invoices-page__invoice-pending">Pending</span>
                  )}
                </div>
                {invoice.releasedAt && (
                  <div>
                    Paid on: {new Date(invoice.releasedAt).toLocaleDateString()}
                  </div>
                )}
                <div>Created: {new Date(invoice.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="invoices-page__summary">
        <div className="invoices-page__summary-stat">
          <label>Total Invoiced</label>
          <div>
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
          </div>
        </div>
        <div className="invoices-page__summary-stat">
          <label>Paid</label>
          <div>
            {formatCurrency(
              invoices.filter((inv) => inv.releaseApproved).reduce((sum, inv) => sum + inv.amount, 0)
            )}
          </div>
        </div>
        <div className="invoices-page__summary-stat">
          <label>Pending</label>
          <div>
            {formatCurrency(
              invoices.filter((inv) => !inv.releaseApproved).reduce((sum, inv) => sum + inv.amount, 0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;

