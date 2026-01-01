import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { propertiesApi } from '../../lib/api';
import PropertyCard from '../../components/properties/PropertyCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import type { Property, PropertyType } from '../../types';
import './OwnerPages.css';
import './PropertiesPage.css';

const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<(Property & { _count?: { projects: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PropertyType | ''>('');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertiesApi.list();
      const data = (response as any)?.data || response;
      setProperties(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load properties:', err);
      setError(err?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = !searchTerm || 
      property.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.state.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || property.propertyType === filterType;
    const matchesCity = !filterCity || property.city.toLowerCase().includes(filterCity.toLowerCase());

    return matchesSearch && matchesType && matchesCity;
  });

  const uniqueCities = Array.from(new Set(properties.map(p => p.city))).sort();
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

  const totalSquareFootage = properties.reduce((sum, p) => sum + (p.squareFootage || 0), 0);
  const totalProjects = properties.reduce((sum, p) => sum + (p._count?.projects || p.projects?.length || 0), 0);

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <h2>Properties</h2>
        <button
          onClick={() => navigate('/owner/properties/new')}
          className="owner-page__button"
        >
          + Add Property
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadProperties} />}
      
      {!loading && !error && (
        <>
          {/* Stats Overview */}
          {properties.length > 0 && (
            <div className="properties-page__stats">
        <div className="properties-page__stat">
          <div className="properties-page__stat-value">{properties.length}</div>
          <div className="properties-page__stat-label">Total Properties</div>
        </div>
        <div className="properties-page__stat">
          <div className="properties-page__stat-value">{totalProjects}</div>
          <div className="properties-page__stat-label">Total Projects</div>
        </div>
        <div className="properties-page__stat">
          <div className="properties-page__stat-value">{totalSquareFootage.toLocaleString()}</div>
          <div className="properties-page__stat-label">Total Square Feet</div>
            </div>
          </div>
          )}

          {/* Search and Filters */}
          {properties.length > 0 && (
            <div className="properties-page__filters">
          <div className="properties-page__search">
            <input
              type="text"
              placeholder="Search by address, city, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="properties-page__search-input"
            />
          </div>
          <div className="properties-page__filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PropertyType | '')}
              className="properties-page__filter-select"
            >
              <option value="">All Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="properties-page__filter-select"
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <EmptyState
            title="No Properties Yet"
            description="Start by adding your first property"
            actionLabel="Add Property"
            onAction={() => navigate('/owner/properties/new')}
          />
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            title="No Properties Match Your Filters"
            description="Try adjusting your search or filter criteria"
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchTerm('');
              setFilterType('');
              setFilterCity('');
            }}
          />
        ) : (
          <div className="properties-page__grid">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default PropertiesPage;



