import React, { useState, useEffect } from 'react';
import { pmApi } from '../../lib/api';
import './PMPages.css';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
}

const ReportsPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await pmApi.getReportTemplates();
      const data = (response as any)?.data || response;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load report templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      await pmApi.generateReport({
        templateId,
        projectIds: [],
        dateRange: {},
        metrics: [],
      });
      alert('Report generation started. This feature is coming soon.');
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="pm-reports-page">
        <div className="pm-reports-page__loading">Loading report templates...</div>
      </div>
    );
  }

  return (
    <div className="pm-reports-page">
      <div className="pm-reports-page__header">
        <h2>Reports</h2>
      </div>

      {templates.length === 0 ? (
        <div className="pm-reports-page__empty">
          <p>No report templates available.</p>
        </div>
      ) : (
        <>
          <div className="pm-reports-page__templates">
            {templates.map((template) => (
              <div
                key={template.id}
                className="pm-reports-page__template-card"
                onClick={() => handleGenerateReport(template.id)}
              >
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;

