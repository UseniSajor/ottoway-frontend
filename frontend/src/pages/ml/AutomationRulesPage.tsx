import React, { useState, useEffect } from 'react';
import './MLPages.css';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
}

const AutomationRulesPage: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load automation rules from API
    setIsLoading(false);
  }, []);

  const handleToggle = (id: string, enabled: boolean) => {
    // TODO: Toggle rule via API
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)));
  };

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h2>Automation Rules</h2>
        <button className="ml-page__button">Create Rule</button>
      </div>

      {isLoading ? (
        <div className="ml-page__loading">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="ml-page__empty">No automation rules yet.</div>
      ) : (
        <div className="ml-page__card">
          <table className="ml-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{rule.description || '-'}</td>
                  <td>
                    <span className={`ml-page__status ml-page__status--${rule.enabled ? 'enabled' : 'disabled'}`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>{new Date(rule.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`ml-page__button ${rule.enabled ? 'ml-page__button--warning' : 'ml-page__button--success'}`}
                      onClick={() => handleToggle(rule.id, rule.enabled)}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="ml-page__button">Edit</button>
                    <button className="ml-page__button ml-page__button--danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AutomationRulesPage;



