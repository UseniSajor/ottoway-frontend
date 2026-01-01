import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntity]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAuditLogs({
        action: filterAction || undefined,
        entity: filterEntity || undefined,
      });
      const data = (response as any)?.data || response;
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="audit-log-page">
        <div className="audit-log-page__loading">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="audit-log-page">
      <div className="audit-log-page__header">
        <h2>Audit Log</h2>
      </div>

      <div className="audit-log-page__filters">
        <input
          type="text"
          placeholder="Filter by action..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="audit-log-page__filter-input"
        />
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="audit-log-page__filter"
        >
          <option value="">All Entities</option>
          <option value="USER">User</option>
          <option value="PROJECT">Project</option>
          <option value="PAYMENT">Payment</option>
          <option value="DISPUTE">Dispute</option>
        </select>
      </div>

      <div className="audit-log-page__table-container">
        <table className="audit-log-page__table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Resource ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="audit-log-page__empty">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    {log.user
                      ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                      : 'System'}
                  </td>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td>{log.resourceId || '-'}</td>
                  <td>{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;

