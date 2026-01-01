import React, { useState } from 'react';
import type { DesignVersion } from '../../types';
import './DesignComponents.css';

interface DocumentViewerProps {
  designVersion: DesignVersion;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ designVersion, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif)$/i.test(url);
  };

  const isPDF = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  // Get fileUrl from first document if it exists, otherwise use direct fileUrl property
  const fileUrl = designVersion.fileUrl || designVersion.documents?.[0]?.fileUrl;
  const version = designVersion.version ?? designVersion.versionNumber;

  if (!fileUrl) {
    return (
      <div className="design-modal-overlay" onClick={onClose}>
        <div className="design-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="design-modal-header">
            <h3>Document Viewer</h3>
            <button className="design-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="design-viewer-empty">
            <p>No file available for this design version.</p>
            <button className="design-modal-button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="design-modal-overlay" onClick={onClose}>
      <div className="design-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="design-viewer-header">
          <div>
            <h3>Version {version}</h3>
            <div className="design-viewer-meta">
              Status: {designVersion.status.replace(/_/g, ' ')}
            </div>
          </div>
          <button className="design-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="design-viewer-body">
          {isLoading && (
            <div className="design-viewer-loading">Loading document...</div>
          )}

          {isPDF(fileUrl) ? (
            <iframe
              src={fileUrl}
              className="design-viewer-iframe"
              onLoad={() => setIsLoading(false)}
              title={`Design Version ${version}`}
            />
          ) : isImage(fileUrl) ? (
            <img
              src={fileUrl}
              alt={`Design Version ${version}`}
              className="design-viewer-image"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <div className="design-viewer-download">
              <p>This file type cannot be previewed in the browser.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="design-modal-button design-modal-button--primary"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

