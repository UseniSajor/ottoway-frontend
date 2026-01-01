import React from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../../types';
import './PropertyCard.css';

interface PropertyCardProps {
  property: Property & { _count?: { projects: number } };
  onClick?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const projectCount = property._count?.projects || (property.projects?.length || 0);
  
  const getPropertyTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      SINGLE_FAMILY: '🏠',
      MULTI_FAMILY: '🏘️',
      CONDO: '🏢',
      TOWNHOUSE: '🏡',
      COMMERCIAL_OFFICE: '🏢',
      RETAIL: '🏪',
      INDUSTRIAL: '🏭',
      MIXED_USE: '🏗️',
      LAND: '🌳',
    };
    return icons[type] || '🏠';
  };

  const getPropertyTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const formatAddress = () => {
    return `${property.streetAddress}, ${property.city}, ${property.state} ${property.zipCode}`;
  };

  return (
    <Link
      to={`/owner/properties/${property.id}`}
      className="property-card"
      onClick={onClick}
    >
      <div className="property-card__header">
        <div className="property-card__icon">{getPropertyTypeIcon(property.propertyType)}</div>
        <div className="property-card__type-badge">
          {getPropertyTypeLabel(property.propertyType)}
        </div>
      </div>

      <div className="property-card__body">
        <div className="property-card__address">{formatAddress()}</div>
        
        {property.buildingClass && (
          <div className="property-card__meta">
            <span className="property-card__label">Building Class:</span>
            <span>{property.buildingClass.replace('CLASS_', 'Class ')}</span>
          </div>
        )}

        <div className="property-card__details">
          {property.squareFootage && (
            <div className="property-card__detail">
              <span className="property-card__detail-value">
                {property.squareFootage.toLocaleString()}
              </span>
              <span className="property-card__detail-label">sq ft</span>
            </div>
          )}
          {property.unitCount && (
            <div className="property-card__detail">
              <span className="property-card__detail-value">{property.unitCount}</span>
              <span className="property-card__detail-label">units</span>
            </div>
          )}
        </div>
      </div>

      <div className="property-card__footer">
        <div className="property-card__project-count">
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </div>
        <div className="property-card__view">View Details →</div>
      </div>
    </Link>
  );
};

export default PropertyCard;

