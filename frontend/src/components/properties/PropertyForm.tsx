import React from 'react';
import type { Property, PropertyType, BuildingClass, OccupancyType, LeaseType } from '../../types';
import './PropertyForm.css';

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: Partial<Property>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = React.useState({
    propertyType: (property?.propertyType || '') as PropertyType | '',
    streetAddress: property?.streetAddress || '',
    city: property?.city || '',
    state: property?.state || '',
    zipCode: property?.zipCode || '',
    county: property?.county || '',
    squareFootage: property?.squareFootage?.toString() || '',
    unitCount: property?.unitCount?.toString() || '',
    yearBuilt: property?.yearBuilt?.toString() || '',
    buildingClass: (property?.buildingClass || '') as BuildingClass | '',
    occupancy: (property?.occupancy || '') as OccupancyType | '',
    leaseType: (property?.leaseType || '') as LeaseType | '',
  });

  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const propertyTypes: PropertyType[] = [
    'SINGLE_FAMILY',
    'MULTI_FAMILY',
    'CONDO',
    'TOWNHOUSE',
    'COMMERCIAL_OFFICE',
    'RETAIL',
    'INDUSTRIAL',
    'MIXED_USE',
    'LAND',
  ];

  const buildingClasses: BuildingClass[] = ['CLASS_A', 'CLASS_B', 'CLASS_C'];
  const occupancyTypes: OccupancyType[] = ['OWNER_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT', 'MIXED'];
  const leaseTypes: LeaseType[] = [
    'NET_LEASE',
    'GROSS_LEASE',
    'MODIFIED_GROSS',
    'PERCENTAGE_LEASE',
    'GROUND_LEASE',
  ];

  const isCommercial = ['COMMERCIAL_OFFICE', 'RETAIL', 'INDUSTRIAL', 'MIXED_USE'].includes(
    formData.propertyType
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.propertyType) {
      errors.propertyType = 'Property type is required';
    }
    if (!formData.streetAddress.trim()) {
      errors.streetAddress = 'Street address is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      errors.zipCode = 'Invalid ZIP code format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const propertyData: Partial<Property> = {
      propertyType: formData.propertyType as PropertyType,
      streetAddress: formData.streetAddress.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zipCode: formData.zipCode.trim(),
      county: formData.county.trim() || undefined,
      squareFootage: formData.squareFootage ? parseInt(formData.squareFootage, 10) : undefined,
      unitCount: formData.unitCount ? parseInt(formData.unitCount, 10) : undefined,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : undefined,
      buildingClass: formData.buildingClass || undefined,
      occupancy: formData.occupancy || undefined,
      leaseType: formData.leaseType || undefined,
    };

    await onSubmit(propertyData);
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="property-form">
      {error && <div className="property-form__error">{error}</div>}

      <div className="property-form__section">
        <h3 className="property-form__section-title">Property Type</h3>
        <div className="property-form__field">
          <label htmlFor="propertyType">
            Property Type <span className="property-form__required">*</span>
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            className={validationErrors.propertyType ? 'property-form__input--error' : ''}
          >
            <option value="">Select property type</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
          {validationErrors.propertyType && (
            <span className="property-form__field-error">{validationErrors.propertyType}</span>
          )}
        </div>
      </div>

      <div className="property-form__section">
        <h3 className="property-form__section-title">Address</h3>
        <div className="property-form__field">
          <label htmlFor="streetAddress">
            Street Address <span className="property-form__required">*</span>
          </label>
          <input
            id="streetAddress"
            name="streetAddress"
            type="text"
            value={formData.streetAddress}
            onChange={handleChange}
            className={validationErrors.streetAddress ? 'property-form__input--error' : ''}
            placeholder="123 Main Street"
          />
          {validationErrors.streetAddress && (
            <span className="property-form__field-error">{validationErrors.streetAddress}</span>
          )}
        </div>

        <div className="property-form__field-row">
          <div className="property-form__field">
            <label htmlFor="city">
              City <span className="property-form__required">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              className={validationErrors.city ? 'property-form__input--error' : ''}
            />
            {validationErrors.city && (
              <span className="property-form__field-error">{validationErrors.city}</span>
            )}
          </div>

          <div className="property-form__field">
            <label htmlFor="state">
              State <span className="property-form__required">*</span>
            </label>
            <input
              id="state"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              maxLength={2}
              placeholder="CA"
              className={validationErrors.state ? 'property-form__input--error' : ''}
              style={{ textTransform: 'uppercase' }}
            />
            {validationErrors.state && (
              <span className="property-form__field-error">{validationErrors.state}</span>
            )}
          </div>

          <div className="property-form__field">
            <label htmlFor="zipCode">
              ZIP Code <span className="property-form__required">*</span>
            </label>
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              value={formData.zipCode}
              onChange={handleChange}
              pattern="[0-9]{5}(-[0-9]{4})?"
              placeholder="12345"
              className={validationErrors.zipCode ? 'property-form__input--error' : ''}
            />
            {validationErrors.zipCode && (
              <span className="property-form__field-error">{validationErrors.zipCode}</span>
            )}
          </div>
        </div>

        <div className="property-form__field">
          <label htmlFor="county">County</label>
          <input
            id="county"
            name="county"
            type="text"
            value={formData.county}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="property-form__section">
        <h3 className="property-form__section-title">Property Details</h3>
        <div className="property-form__field-row">
          <div className="property-form__field">
            <label htmlFor="squareFootage">Square Footage</label>
            <input
              id="squareFootage"
              name="squareFootage"
              type="number"
              value={formData.squareFootage}
              onChange={handleChange}
              min="0"
              placeholder="Optional"
            />
          </div>

          <div className="property-form__field">
            <label htmlFor="unitCount">Unit Count</label>
            <input
              id="unitCount"
              name="unitCount"
              type="number"
              value={formData.unitCount}
              onChange={handleChange}
              min="0"
              placeholder="Optional"
            />
          </div>

          <div className="property-form__field">
            <label htmlFor="yearBuilt">Year Built</label>
            <input
              id="yearBuilt"
              name="yearBuilt"
              type="number"
              value={formData.yearBuilt}
              onChange={handleChange}
              min="1800"
              max={new Date().getFullYear()}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="property-form__field-row">
          {isCommercial && (
            <div className="property-form__field">
              <label htmlFor="buildingClass">Building Class</label>
              <select
                id="buildingClass"
                name="buildingClass"
                value={formData.buildingClass}
                onChange={handleChange}
              >
                <option value="">Select building class</option>
                {buildingClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {formatLabel(cls)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="property-form__field">
            <label htmlFor="occupancy">Occupancy Type</label>
            <select
              id="occupancy"
              name="occupancy"
              value={formData.occupancy}
              onChange={handleChange}
            >
              <option value="">Select occupancy type</option>
              {occupancyTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="property-form__field">
            <label htmlFor="leaseType">Lease Type</label>
            <select
              id="leaseType"
              name="leaseType"
              value={formData.leaseType}
              onChange={handleChange}
            >
              <option value="">Select lease type</option>
              {leaseTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="property-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="property-form__button property-form__button--secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="property-form__button property-form__button--primary"
        >
          {isLoading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;


