import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertiesApi } from '../../lib/api';
import PropertyForm from '../../components/properties/PropertyForm';
import type { Property, Project } from '../../types';
import './OwnerPages.css';
import './PropertyDetailsPage.css';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property & { projects?: Project[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError('');
      const response = await propertiesApi.get(id);
      const data = (response as any)?.data || response;
      setProperty(data as Property);
    } catch (err: any) {
      console.error('Failed to load property:', err);
      setError(err?.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<Property>) => {
    if (!id) return;
    try {
      setError('');
      await propertiesApi.update(id, data);
      await loadProperty();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update property:', err);
      setError(err?.message || 'Failed to update property');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      setError('');
      await propertiesApi.delete(id);
      navigate('/owner/properties');
    } catch (err: any) {
      console.error('Failed to delete property:', err);
      setError(err?.message || 'Failed to delete property');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const projectCount = property?.projects?.length || 0;
  const canDelete = projectCount === 0;

  if (isLoading) {
    return <div className="owner-page__loading">Loading property...</div>;
  }

  if (!property) {
    return (
      <div className="owner-page__empty">
        <p>Property not found</p>
        <Link to="/owner/properties" className="owner-page__button">
          Back to Properties
        </Link>
      </div>
    );
  }

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to="/owner/properties" className="owner-page__back">
          ← Back to Properties
        </Link>
        <div className="property-details__header-actions">
          <h2>{formatLabel(property.propertyType)}</h2>
          {!isEditing && (
            <div className="property-details__actions">
              <button
                onClick={() => setIsEditing(true)}
                className="owner-page__button owner-page__button--secondary"
              >
                Edit
              </button>
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="owner-page__button owner-page__button--danger"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {isEditing ? (
        <div className="property-details__edit">
          <PropertyForm
            property={property}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditing(false);
              setError('');
            }}
            isLoading={isDeleting}
            error={error}
          />
        </div>
      ) : (
        <div className="owner-page__content property-details__content">
          {/* Property Information */}
          <div className="property-details__info-section">
            <div className="owner-page__section">
              <h3>Address</h3>
              <div className="owner-page__info-grid">
                <div>
                  <label>Street Address</label>
                  <div>{property.streetAddress}</div>
                </div>
                <div>
                  <label>City</label>
                  <div>{property.city}</div>
                </div>
                <div>
                  <label>State</label>
                  <div>{property.state}</div>
                </div>
                <div>
                  <label>ZIP Code</label>
                  <div>{property.zipCode}</div>
                </div>
                {property.county && (
                  <div>
                    <label>County</label>
                    <div>{property.county}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="owner-page__section">
              <h3>Property Details</h3>
              <div className="owner-page__info-grid">
                {property.squareFootage && (
                  <div>
                    <label>Square Footage</label>
                    <div>{property.squareFootage.toLocaleString()} sq ft</div>
                  </div>
                )}
                {property.unitCount && (
                  <div>
                    <label>Unit Count</label>
                    <div>{property.unitCount}</div>
                  </div>
                )}
                {property.yearBuilt && (
                  <div>
                    <label>Year Built</label>
                    <div>{property.yearBuilt}</div>
                  </div>
                )}
                {property.buildingClass && (
                  <div>
                    <label>Building Class</label>
                    <div>{formatLabel(property.buildingClass)}</div>
                  </div>
                )}
                {property.occupancy && (
                  <div>
                    <label>Occupancy</label>
                    <div>{formatLabel(property.occupancy)}</div>
                  </div>
                )}
                {property.leaseType && (
                  <div>
                    <label>Lease Type</label>
                    <div>{formatLabel(property.leaseType)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="property-details__projects-section">
            <div className="owner-page__section">
              <div className="owner-page__section-header">
                <h3>Projects ({projectCount})</h3>
                <button
                  onClick={() => navigate(`/owner/projects/new?propertyId=${id}`)}
                  className="owner-page__button"
                >
                  + Add Project
                </button>
              </div>
              {property.projects && property.projects.length > 0 ? (
                <div className="property-details__projects-list">
                  {property.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/owner/projects/${project.id}`}
                      className="property-details__project-card"
                    >
                      <div className="property-details__project-header">
                        <h4>{project.name}</h4>
                        <span className={`property-details__status property-details__status--${project.status?.toLowerCase()}`}>
                          {formatLabel(project.status || 'PLANNING')}
                        </span>
                      </div>
                      <div className="property-details__project-meta">
                        <span>{formatLabel(project.category)}</span>
                        <span>•</span>
                        <span>{formatLabel(project.projectType)}</span>
                        {project.complexity && (
                          <>
                            <span>•</span>
                            <span>{formatLabel(project.complexity)}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="owner-page__empty">
                  <p>No projects yet.</p>
                  <button
                    onClick={() => navigate(`/owner/projects/new?propertyId=${id}`)}
                    className="owner-page__button"
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="property-details__modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="property-details__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Property?</h3>
            <p>
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            {!canDelete && (
              <div className="property-details__modal-warning">
                This property has {projectCount} associated project{projectCount !== 1 ? 's' : ''} and cannot be deleted.
              </div>
            )}
            <div className="property-details__modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="owner-page__button owner-page__button--secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="owner-page__button owner-page__button--danger"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Property'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsPage;



