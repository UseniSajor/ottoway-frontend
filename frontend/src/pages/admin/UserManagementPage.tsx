import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import './AdminPages.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  approvalStatus?: string;
  createdAt: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterStatus, searchTerm]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers({
        role: filterRole || undefined,
        status: filterStatus || undefined,
        search: searchTerm || undefined,
      });
      const data = (response as any)?.data || response;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="user-management-page">
        <div className="user-management-page__loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="user-management-page__header">
        <h2>User Management</h2>
      </div>

      <div className="user-management-page__filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="user-management-page__search"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="user-management-page__filter"
        >
          <option value="">All Roles</option>
          <option value="HOMEOWNER">Homeowner</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="PRIME_CONTRACTOR">Prime Contractor</option>
          <option value="SUBCONTRACTOR">Subcontractor</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="user-management-page__filter"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="user-management-page__table-container">
        <table className="user-management-page__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="user-management-page__empty">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role.replace(/_/g, ' ')}</td>
                  <td>
                    {user.approvalStatus ? (
                      <span
                        className={`user-management-page__status user-management-page__status--${user.approvalStatus.toLowerCase()}`}
                      >
                        {user.approvalStatus}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="user-management-page__action-button"
                      onClick={() => {
                        // TODO: Implement view/edit
                        console.log('View user:', user.id);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;

