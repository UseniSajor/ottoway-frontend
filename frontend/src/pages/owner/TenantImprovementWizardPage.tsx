import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectTypeDropdown } from '../../components/common/ProjectTypeDropdown';
import type { ProjectType } from '../../types';
import './OwnerPages.css';

const TenantImprovementWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyId: '',
    projectType: undefined as ProjectType | undefined,
    squareFootage: '',
    description: '',
  });

  const handleSubmit = () => {
    // TODO: Create project via API
    navigate('/owner/projects');
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <h2>Tenant Improvement Wizard</h2>
      </div>

      <div className="owner-page__wizard">
        <div className="owner-page__wizard-steps">
          <div className={`owner-page__wizard-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Property
          </div>
          <div className={`owner-page__wizard-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Project Type
          </div>
          <div className={`owner-page__wizard-step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span> Details
          </div>
        </div>

        <div className="owner-page__wizard-content">
          {step === 1 && (
            <div>
              <h3>Select Property</h3>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              >
                <option value="">Select property...</option>
                {/* TODO: Load properties */}
              </select>
              <button onClick={() => setStep(2)} disabled={!formData.propertyId}>
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Select Project Type</h3>
              <ProjectTypeDropdown
                value={formData.projectType}
                onChange={(type) => setFormData({ ...formData, projectType: type })}
                category="COMMERCIAL"
              />
              <div className="owner-page__wizard-actions">
                <button onClick={() => setStep(1)}>Back</button>
                <button onClick={() => setStep(3)} disabled={!formData.projectType}>
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Project Details</h3>
              <div className="owner-page__wizard-field">
                <label>Square Footage</label>
                <input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                />
              </div>
              <div className="owner-page__wizard-field">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="owner-page__wizard-actions">
                <button onClick={() => setStep(2)}>Back</button>
                <button onClick={handleSubmit}>Create Project</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantImprovementWizardPage;



