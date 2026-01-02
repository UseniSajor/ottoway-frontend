import React from 'react';
import type { OCRResult } from '../../types';
import './EscrowComponents.css';

interface OCRResultDisplayProps {
  ocrResult: OCRResult;
}

const OCRResultDisplay: React.FC<OCRResultDisplayProps> = ({ ocrResult }) => {
  return (
    <div className="ocr-result-display">
      <h5>OCR Extracted Data</h5>
      {ocrResult.confidence && (
        <div className="ocr-result-display__confidence">
          Confidence: {(ocrResult.confidence * 100).toFixed(1)}%
        </div>
      )}

      <div className="ocr-result-display__data">
        {ocrResult.extractedVendor && (
          <div className="ocr-result-display__field">
            <label>Vendor:</label>
            <div>{ocrResult.extractedVendor}</div>
          </div>
        )}

        {ocrResult.extractedDate && (
          <div className="ocr-result-display__field">
            <label>Date:</label>
            <div>{new Date(ocrResult.extractedDate).toLocaleDateString()}</div>
          </div>
        )}

        {ocrResult.extractedAmount && (
          <div className="ocr-result-display__field">
            <label>Amount:</label>
            <div>${Number(ocrResult.extractedAmount).toLocaleString()}</div>
          </div>
        )}

        {ocrResult.extractedItems && (
          <div className="ocr-result-display__field">
            <label>Items:</label>
            <div className="ocr-result-display__items">
              {Array.isArray(ocrResult.extractedItems) ? (
                <ul>
                  {ocrResult.extractedItems.map((item: any, idx: number) => (
                    <li key={idx}>{JSON.stringify(item)}</li>
                  ))}
                </ul>
              ) : (
                <pre>{JSON.stringify(ocrResult.extractedItems, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

        {ocrResult.extractedText && (
          <div className="ocr-result-display__field">
            <label>Extracted Text:</label>
            <div className="ocr-result-display__text">{ocrResult.extractedText}</div>
          </div>
        )}
      </div>

      <div className="ocr-result-display__note">
        <small>
          ⚠️ OCR results are automatically extracted and may require manual verification.
        </small>
      </div>
    </div>
  );
};

export default OCRResultDisplay;


