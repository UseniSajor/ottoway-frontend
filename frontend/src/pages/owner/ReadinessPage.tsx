import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { readinessApi } from '../../lib/api';
import type { ReadinessChecklist, ReadinessItem } from '../../types';
import ReadinessItemCard from '../../components/readiness/ReadinessItemCard';
import './OwnerPages.css';
import './ReadinessPage.css';

const ReadinessPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<ReadinessChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      loadChecklist();
    }
  }, [projectId]);

  const loadChecklist = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError('');
      const response = await readinessApi.getChecklist(projectId);
      const data = (response as any)?.data || response;
      setChecklist(data as ReadinessChecklist);
    } catch (err: any) {
      console.error('Failed to load readiness checklist:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load readiness checklist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemUpdate = () => {
    loadChecklist();
  };

  const categories = ['DESIGN', 'PERMITS', 'SITE', 'UTILITIES', 'APPROVALS', 'OTHER'];
  const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'NOT_APPLICABLE'];

  const filteredItems = checklist?.items.filter((item) => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesCategory && matchesStatus;
  }) || [];

  const getProgressStats = () => {
    if (!checklist) return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
    
    const total = checklist.items.length;
    const completed = checklist.items.filter(i => i.status === 'COMPLETED').length;
    const inProgress = checklist.items.filter(i => i.status === 'IN_PROGRESS').length;
    const notStarted = checklist.items.filter(i => i.status === 'NOT_STARTED').length;
    
    return { total, completed, inProgress, notStarted };
  };

  const stats = getProgressStats();
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to={`/owner/projects/${projectId}`} className="owner-page__back">
          ← Back to Project
        </Link>
        <h2>Readiness Checklist</h2>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {isLoading ? (
        <div className="owner-page__loading">Loading readiness checklist...</div>
      ) : !checklist ? (
        <div className="owner-page__empty">
          <p>No readiness checklist found.</p>
          <p className="readiness-page__hint">
            The checklist will be automatically generated from your project type when you access this page.
          </p>
        </div>
      ) : (
        <>
          {/* Progress Summary */}
          <div className="readiness-page__summary">
            <div className="readiness-page__progress-card">
              <div className="readiness-page__progress-header">
                <h3>Overall Progress</h3>
                <div className="readiness-page__progress-percentage">{completionPercentage}%</div>
              </div>
              <div className="readiness-page__progress-bar">
                <div
                  className="readiness-page__progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="readiness-page__progress-stats">
                <div className="readiness-page__stat">
                  <span className="readiness-page__stat-value">{stats.completed}</span>
                  <span className="readiness-page__stat-label">Completed</span>
                </div>
                <div className="readiness-page__stat">
                  <span className="readiness-page__stat-value">{stats.inProgress}</span>
                  <span className="readiness-page__stat-label">In Progress</span>
                </div>
                <div className="readiness-page__stat">
                  <span className="readiness-page__stat-value">{stats.notStarted}</span>
                  <span className="readiness-page__stat-label">Not Started</span>
                </div>
                <div className="readiness-page__stat">
                  <span className="readiness-page__stat-value">{stats.total}</span>
                  <span className="readiness-page__stat-label">Total Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="readiness-page__filters">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="readiness-page__filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="readiness-page__filter-select"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {(filterCategory || filterStatus) && (
              <button
                className="readiness-page__clear-filters"
                onClick={() => {
                  setFilterCategory('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Checklist Items */}
          <div className="readiness-page__items">
            {filteredItems.length === 0 ? (
              <div className="owner-page__empty">
                <p>No items match your filters.</p>
                <button
                  className="owner-page__button owner-page__button--secondary"
                  onClick={() => {
                    setFilterCategory('');
                    setFilterStatus('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ReadinessItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReadinessPage;
