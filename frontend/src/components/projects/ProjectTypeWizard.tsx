import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectTypesApi, propertiesApi, projectsApi } from '../../lib/api';
import type { ProjectCategory, ProjectType, Property } from '../../types';
import './ProjectTypeWizard.css';

interface ProjectTypeMetadata {
  type: string;
  category: ProjectCategory;
  name: string;
  description: string;
  typicalComplexity: string;
  requiresArchitect: boolean;
  requiresStructuralEngineer: boolean;
  typicalDuration: string;
  readinessChecklist: string[];
}

interface ComplexityAssessment {
  complexity: string;
  confidence: number;
  reasoning?: string[];
  suggestedReadinessItems: string[];
  requiresArchitect: boolean;
  requiresStructuralEngineer: boolean;
  typicalDuration: string;
  metadata?: {
    requiresArchitect: boolean;
    requiresStructuralEngineer: boolean;
    requiresMEPEngineer: boolean;
    typicalDuration: string;
    permitComplexity: string;
  };
}

const ProjectTypeWizard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories] = useState<ProjectCategory[]>(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'MIXED_USE']);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeMetadata[]>([]);
  const [selectedType, setSelectedType] = useState<ProjectTypeMetadata | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [createNewProperty, setCreateNewProperty] = useState(false);
  const [complexityAssessment, setComplexityAssessment] = useState<ComplexityAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    squareFootage: '',
    unitCount: '',
    jurisdiction: '',
    permitAuthority: '',
  });

  // Load project types when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setIsLoading(true);
      projectTypesApi.list(selectedCategory)
        .then((response: any) => {
          const data = (response as any)?.data || response;
          setProjectTypes(data as ProjectTypeMetadata[]);
          setIsLoading(false);
        })
        .catch((err: any) => {
          console.error('Failed to load project types:', err);
          setError('Failed to load project types');
          setIsLoading(false);
        });
    }
  }, [selectedCategory]);

  // Load properties
  useEffect(() => {
    propertiesApi.list()
      .then((response) => {
        const data = (response as any)?.data || response;
        setProperties(data as Property[]);
      })
      .catch((err) => console.error('Failed to load properties:', err));
  }, []);

  // Assess complexity when type and details are available
  useEffect(() => {
    if (selectedType && (projectData.squareFootage || projectData.unitCount)) {
      projectTypesApi.assessComplexity({
        projectType: selectedType.type,
        category: selectedCategory || 'RESIDENTIAL',
        squareFootage: projectData.squareFootage ? parseInt(projectData.squareFootage, 10) : undefined,
        unitCount: projectData.unitCount ? parseInt(projectData.unitCount, 10) : undefined,
      })
        .then((response: any) => {
          const assessment = (response as any)?.data || response;
          setComplexityAssessment(assessment);
        })
        .catch((err: any) => {
          console.error('Failed to assess complexity:', err);
        });
    }
  }, [selectedType, selectedCategory, projectData.squareFootage, projectData.unitCount]);

  const handleCategorySelect = (category: ProjectCategory) => {
    setSelectedCategory(category);
    setSelectedType(null);
    setStep(2);
  };

  const handleTypeSelect = (type: ProjectTypeMetadata) => {
    setSelectedType(type);
    setStep(3);
  };

  const handleNext = () => {
    if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !projectData.name) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Parse jurisdiction if provided (format: "City, State, County")
      let jurisdictionCity, jurisdictionState, jurisdictionCounty;
      if (projectData.jurisdiction) {
        const parts = projectData.jurisdiction.split(',').map(s => s.trim());
        jurisdictionCity = parts[0] || undefined;
        jurisdictionState = parts[1] || undefined;
        jurisdictionCounty = parts[2] || undefined;
      }

      const projectPayload: any = {
        name: projectData.name,
        category: selectedType.category,
        projectType: selectedType.type,
        complexity: complexityAssessment?.complexity || selectedType.typicalComplexity,
        description: projectData.description || undefined,
        squareFootage: projectData.squareFootage ? parseInt(projectData.squareFootage, 10) : undefined,
        unitCount: projectData.unitCount ? parseInt(projectData.unitCount, 10) : undefined,
        jurisdictionCity,
        jurisdictionState,
        jurisdictionCounty,
        permitAuthority: projectData.permitAuthority || undefined,
      };

      if (selectedPropertyId) {
        projectPayload.propertyId = selectedPropertyId;
      }

      const response = await projectsApi.create(projectPayload);
      const project = (response as any)?.data || response;
      
      if (onClose) onClose();
      navigate(`/owner/projects/${(project as any).id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create project');
      setIsLoading(false);
    }
  };

  const categoryIcons: Record<ProjectCategory, string> = {
    RESIDENTIAL: '🏠',
    COMMERCIAL: '🏢',
    INDUSTRIAL: '🏭',
    INSTITUTIONAL: '🏛️',
    MIXED_USE: '🏘️',
  };

  const categoryNames: Record<ProjectCategory, string> = {
    RESIDENTIAL: 'Residential',
    COMMERCIAL: 'Commercial',
    INDUSTRIAL: 'Industrial',
    INSTITUTIONAL: 'Institutional',
    MIXED_USE: 'Mixed-Use',
  };

  return (
    <div className="project-type-wizard">
      <div className="project-type-wizard__header">
        <h2>Create New Project</h2>
        {onClose && (
          <button className="project-type-wizard__close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="project-type-wizard__steps">
        <div className={`project-type-wizard__step ${step >= 1 ? 'active' : ''}`}>1. Category</div>
        <div className={`project-type-wizard__step ${step >= 2 ? 'active' : ''}`}>2. Type</div>
        <div className={`project-type-wizard__step ${step >= 3 ? 'active' : ''}`}>3. Details</div>
        <div className={`project-type-wizard__step ${step >= 4 ? 'active' : ''}`}>4. Property</div>
        <div className={`project-type-wizard__step ${step >= 5 ? 'active' : ''}`}>5. Review</div>
      </div>

      {error && <div className="project-type-wizard__error">{error}</div>}

      <div className="project-type-wizard__content">
        {/* Step 1: Select Category */}
        {step === 1 && (
          <div className="project-type-wizard__step-content">
            <h3>Select Project Category</h3>
            <div className="project-type-wizard__category-grid">
              {categories.map((category) => (
                <button
                  key={category}
                  className="project-type-wizard__category-card"
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="project-type-wizard__category-icon">{categoryIcons[category]}</div>
                  <div className="project-type-wizard__category-name">{categoryNames[category]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Type */}
        {step === 2 && (
          <div className="project-type-wizard__step-content">
            <h3>Select Project Type</h3>
            {isLoading ? (
              <div className="project-type-wizard__loading">Loading project types...</div>
            ) : (
              <div className="project-type-wizard__type-grid">
                {projectTypes.map((type) => (
                  <button
                    key={type.type}
                    className={`project-type-wizard__type-card ${selectedType?.type === type.type ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(type)}
                  >
                    <div className="project-type-wizard__type-name">{type.name}</div>
                    <div className="project-type-wizard__type-description">{type.description}</div>
                    <div className="project-type-wizard__type-meta">
                      <span>Complexity: {type.typicalComplexity}</span>
                      <span>Duration: {type.typicalDuration}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button className="project-type-wizard__back" onClick={handleBack}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Project Details */}
        {step === 3 && selectedType && (
          <div className="project-type-wizard__step-content">
            <h3>Project Details</h3>
            <div className="project-type-wizard__form">
              <div className="project-type-wizard__field">
                <label>
                  Project Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="e.g., Kitchen Remodel - Main House"
                  required
                />
              </div>

              <div className="project-type-wizard__field">
                <label>Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>

              <div className="project-type-wizard__field-row">
                <div className="project-type-wizard__field">
                  <label>Square Footage</label>
                  <input
                    type="number"
                    value={projectData.squareFootage}
                    onChange={(e) => setProjectData({ ...projectData, squareFootage: e.target.value })}
                    placeholder="sq ft"
                  />
                </div>

                <div className="project-type-wizard__field">
                  <label>Unit Count</label>
                  <input
                    type="number"
                    value={projectData.unitCount}
                    onChange={(e) => setProjectData({ ...projectData, unitCount: e.target.value })}
                    placeholder="units"
                  />
                </div>
              </div>

              <div className="project-type-wizard__field">
                <label>Jurisdiction</label>
                <input
                  type="text"
                  value={projectData.jurisdiction}
                  onChange={(e) => setProjectData({ ...projectData, jurisdiction: e.target.value })}
                  placeholder="City, State, County"
                />
              </div>

              <div className="project-type-wizard__field">
                <label>Permit Authority</label>
                <input
                  type="text"
                  value={projectData.permitAuthority}
                  onChange={(e) => setProjectData({ ...projectData, permitAuthority: e.target.value })}
                  placeholder="Building department name"
                />
              </div>

              <div className="project-type-wizard__field">
                <button
                  type="button"
                  className="project-type-wizard__assess-button"
                  onClick={async () => {
                    if (!selectedType) return;
                    setIsLoading(true);
                    try {
                      const response = await projectTypesApi.assessComplexity({
                        projectType: selectedType.type,
                        category: selectedCategory || 'RESIDENTIAL',
                        squareFootage: projectData.squareFootage ? parseInt(projectData.squareFootage, 10) : undefined,
                        unitCount: projectData.unitCount ? parseInt(projectData.unitCount, 10) : undefined,
                      });
                      const assessment = (response as any)?.data || response;
                      setComplexityAssessment(assessment);
                    } catch (err) {
                      console.error('Failed to assess complexity:', err);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  Assess Complexity
                </button>
              </div>

              {complexityAssessment && (
                <div className="project-type-wizard__complexity">
                  <h4>Assessed Complexity: {complexityAssessment.complexity}</h4>
                  <div className="project-type-wizard__complexity-details">
                    <div>Confidence: {(complexityAssessment.confidence * 100).toFixed(0)}%</div>
                    <div>Typical Duration: {complexityAssessment.typicalDuration}</div>
                    {complexityAssessment.requiresArchitect && (
                      <div className="project-type-wizard__requirement">✓ Requires Architect</div>
                    )}
                    {complexityAssessment.requiresStructuralEngineer && (
                      <div className="project-type-wizard__requirement">✓ Requires Structural Engineer</div>
                    )}
                    {complexityAssessment.reasoning && complexityAssessment.reasoning.length > 0 && (
                      <div className="project-type-wizard__reasoning">
                        <strong>Reasoning:</strong>
                        <ul>
                          {complexityAssessment.reasoning.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="project-type-wizard__actions">
              <button className="project-type-wizard__back" onClick={handleBack}>
                ← Back
              </button>
              <button
                className="project-type-wizard__next"
                onClick={handleNext}
                disabled={!projectData.name}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Select Property */}
        {step === 4 && (
          <div className="project-type-wizard__step-content">
            <h3>Select Property</h3>
            <div className="project-type-wizard__form">
              <div className="project-type-wizard__field">
                <label>Link to Property (Optional)</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setCreateNewProperty(false);
                  }}
                  disabled={createNewProperty}
                >
                  <option value="">No property (standalone project)</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.streetAddress}, {prop.city}, {prop.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="project-type-wizard__field">
                <label>
                  <input
                    type="checkbox"
                    checked={createNewProperty}
                    onChange={(e) => {
                      setCreateNewProperty(e.target.checked);
                      if (e.target.checked) setSelectedPropertyId('');
                    }}
                  />
                  Create New Property
                </label>
              </div>

              {createNewProperty && (
                <div className="project-type-wizard__info">
                  You'll be redirected to create a property first, then return to complete project creation.
                </div>
              )}
            </div>

            <div className="project-type-wizard__actions">
              <button className="project-type-wizard__back" onClick={handleBack}>
                ← Back
              </button>
              <button className="project-type-wizard__next" onClick={handleNext}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && selectedType && (
          <div className="project-type-wizard__step-content">
            <h3>Review & Create</h3>
            <div className="project-type-wizard__review">
              <div className="project-type-wizard__review-section">
                <h4>Project Type</h4>
                <div>{selectedType.name}</div>
                <div className="project-type-wizard__review-meta">{selectedType.description}</div>
              </div>

              <div className="project-type-wizard__review-section">
                <h4>Project Details</h4>
                <div><strong>Name:</strong> {projectData.name}</div>
                {projectData.description && (
                  <div><strong>Description:</strong> {projectData.description}</div>
                )}
                {projectData.squareFootage && (
                  <div><strong>Square Footage:</strong> {projectData.squareFootage} sq ft</div>
                )}
                {projectData.unitCount && (
                  <div><strong>Unit Count:</strong> {projectData.unitCount}</div>
                )}
                {complexityAssessment && (
                  <div><strong>Complexity:</strong> {complexityAssessment.complexity}</div>
                )}
              </div>

              {selectedPropertyId && (
                <div className="project-type-wizard__review-section">
                  <h4>Property</h4>
                  <div>
                    {properties.find((p) => p.id === selectedPropertyId)?.streetAddress}
                  </div>
                </div>
              )}

              {complexityAssessment && complexityAssessment.suggestedReadinessItems.length > 0 && (
                <div className="project-type-wizard__review-section">
                  <h4>Suggested Readiness Items</h4>
                  <ul>
                    {complexityAssessment.suggestedReadinessItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="project-type-wizard__actions">
              <button className="project-type-wizard__back" onClick={handleBack}>
                ← Back
              </button>
              <button
                className="project-type-wizard__submit"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTypeWizard;

