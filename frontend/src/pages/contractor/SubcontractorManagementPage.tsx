import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import './ContractorPages.css';

interface SubcontractorInvite {
  id: string;
  email: string;
  trade: string;
  scope?: string;
  status: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    complexity: string;
  };
  createdAt: string;
}

const SubcontractorManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<SubcontractorInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrade, setInviteTrade] = useState('');
  const [inviteScope, setInviteScope] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  useEffect(() => {
    // Only load if user is PRIME_CONTRACTOR
    if (user?.role === 'PRIME_CONTRACTOR') {
      loadInvites();
      loadAvailableProjects();
    }
  }, [user]);

  const loadAvailableProjects = async () => {
    try {
      const response = await contractorApi.getProjects();
      const data = (response as any)?.data || response;
      // Filter only MAJOR complexity projects
      const majorProjects = (Array.isArray(data) ? data : []).filter(
        (p: any) => p.complexity === 'MAJOR'
      );
      setAvailableProjects(majorProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadInvites = async () => {
    try {
      setIsLoading(true);
      // Load invites for all MAJOR projects
      // TODO: Implement getInvites endpoint that filters by project complexity
      setInvites([]);
    } catch (error) {
      console.error('Failed to load invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId || !inviteEmail || !inviteTrade) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await contractorApi.inviteSubcontractor(selectedProjectId, {
        email: inviteEmail,
        trade: inviteTrade,
        scope: inviteScope || undefined,
      });
      
      setShowInviteForm(false);
      setInviteEmail('');
      setInviteTrade('');
      setInviteScope('');
      setSelectedProjectId('');
      loadInvites();
      loadInvites();
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error?.response?.data?.message || 'Failed to send invite');
    }
  };

  // CRITICAL: Only show if user is PRIME_CONTRACTOR
  if (user?.role !== 'PRIME_CONTRACTOR') {
    return (
      <div className="subcontractor-management-page">
        <div className="subcontractor-management-page__restricted">
          <h3>Access Restricted</h3>
          <p>Subcontractor management is only available for Prime Contractors.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="subcontractor-management-page">
        <div className="subcontractor-management-page__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="subcontractor-management-page">
      <div className="subcontractor-management-page__header">
        <h2>Subcontractor Management</h2>
        <button
          className="subcontractor-management-page__invite-button"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          + Invite Subcontractor
        </button>
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="subcontractor-management-page__invite-form">
          <h3>Invite Subcontractor</h3>
          <div className="subcontractor-management-page__form-note">
            Note: Subcontractor invitations are only available for MAJOR complexity projects.
          </div>
          <div className="subcontractor-management-page__form-field">
            <label>
              Project <span className="required">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
            >
              <option value="">Select a MAJOR project...</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {availableProjects.length === 0 && (
              <div className="subcontractor-management-page__form-hint">
                No MAJOR complexity projects available
              </div>
            )}
          </div>
          <div className="subcontractor-management-page__form-field">
            <label>
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="subcontractor@example.com"
            />
          </div>
          <div className="subcontractor-management-page__form-field">
            <label>
              Trade <span className="required">*</span>
            </label>
            <input
              type="text"
              value={inviteTrade}
              onChange={(e) => setInviteTrade(e.target.value)}
              required
              placeholder="e.g., Electrical, Plumbing, HVAC"
            />
          </div>
          <div className="subcontractor-management-page__form-field">
            <label>Scope (Optional)</label>
            <textarea
              value={inviteScope}
              onChange={(e) => setInviteScope(e.target.value)}
              rows={3}
              placeholder="Describe the scope of work..."
            />
          </div>
          <div className="subcontractor-management-page__form-actions">
            <button
              type="button"
              className="subcontractor-management-page__cancel-button"
              onClick={() => setShowInviteForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="subcontractor-management-page__submit-button">
              Send Invite
            </button>
          </div>
        </form>
      )}

      <div className="subcontractor-management-page__invites-section">
        <h3>Subcontractor Invites</h3>
        {invites.length === 0 ? (
          <div className="subcontractor-management-page__empty">
            <p>No subcontractor invitations sent yet.</p>
            <p className="subcontractor-management-page__hint">
              Invite subcontractors to work on your MAJOR complexity projects.
            </p>
          </div>
        ) : (
          <div className="subcontractor-management-page__invites-list">
            {invites.map((invite) => (
              <div key={invite.id} className="subcontractor-management-page__invite-card">
                <div className="subcontractor-management-page__invite-header">
                  <div>
                    <h4>{invite.email}</h4>
                    <div className="subcontractor-management-page__invite-meta">
                      Trade: {invite.trade} • Project: {invite.project.name}
                    </div>
                  </div>
                  <span
                    className={`subcontractor-management-page__invite-status subcontractor-management-page__invite-status--${invite.status.toLowerCase()}`}
                  >
                    {invite.status}
                  </span>
                </div>
                {invite.scope && (
                  <div className="subcontractor-management-page__invite-scope">
                    Scope: {invite.scope}
                  </div>
                )}
                {invite.acceptedBy && (
                  <div className="subcontractor-management-page__invite-accepted">
                    Accepted by {invite.acceptedBy.firstName} {invite.acceptedBy.lastName}
                  </div>
                )}
                <div className="subcontractor-management-page__invite-dates">
                  Sent: {new Date(invite.createdAt).toLocaleDateString()} • Expires:{' '}
                  {new Date(invite.expiresAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcontractorManagementPage;

