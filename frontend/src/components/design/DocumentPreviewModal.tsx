import React, { useState } from 'react';
import type { DesignDocument } from '../../types';
import './DesignComponents.css';

interface DocumentPreviewModalProps {
  document: DesignDocument;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const isPDF = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="design-modal-overlay" onClick={onClose}>
      <div className="design-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="design-viewer-header">
          <div>
            <h3>{document.fileName}</h3>
            <div className="design-viewer-meta">
              {document.documentType} • {new Date(document.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button className="design-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="design-viewer-body">
          {isLoading && (
            <div className="design-viewer-loading">Loading document...</div>
          )}

          {isPDF(document.fileName) ? (
            <iframe
              src={document.fileUrl}
              className="design-viewer-iframe"
              onLoad={() => setIsLoading(false)}
              title={document.fileName}
            />
          ) : isImage(document.fileType) ? (
            <img
              src={document.fileUrl}
              alt={document.fileName}
              className="design-viewer-image"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <div className="design-viewer-download">
              <p>This file type cannot be previewed in the browser.</p>
              <a
                href={document.fileUrl}
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

export default DocumentPreviewModal;


