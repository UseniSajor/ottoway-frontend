import React from 'react';
import type { DesignVersion } from '../../types';
import './DesignComponents.css';

interface DesignVersionListProps {
  versions: DesignVersion[];
  selectedVersionId?: string;
  onSelectVersion: (version: DesignVersion) => void;
}

const DesignVersionList: React.FC<DesignVersionListProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#999',
      IN_PROGRESS: '#0066cc',
      REVIEW_REQUIRED: '#ff9800',
      REVISIONS_REQUESTED: '#f44336',
      APPROVED_FOR_PERMIT: '#4caf50',
      SUPERSEDED: '#ccc',
    };
    return colors[status] || '#999';
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="design-version-list">
      <h3 className="design-version-list__title">Version History</h3>
      <div className="design-version-list__timeline">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`design-version-list__item ${
              selectedVersionId === version.id ? 'active' : ''
            }`}
            onClick={() => onSelectVersion(version)}
          >
            <div className="design-version-list__item-header">
              <div className="design-version-list__version-number">
                v{version.versionNumber}
              </div>
              <div
                className="design-version-list__status-badge"
                style={{ backgroundColor: getStatusColor(version.status) }}
              >
                {formatLabel(version.status)}
              </div>
            </div>
            <div className="design-version-list__item-body">
              <div className="design-version-list__version-name">
                {version.versionName || `Version ${version.versionNumber}`}
              </div>
              <div className="design-version-list__item-meta">
                <div>
                  {version._count?.documents || version.documents?.length || 0} documents
                </div>
                <div>
                  {version._count?.comments || version.comments?.length || 0} comments
                </div>
              </div>
              <div className="design-version-list__item-date">
                {new Date(version.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesignVersionList;

