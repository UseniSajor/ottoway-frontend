import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertiesApi } from '../../lib/api';
import PropertyForm from '../../components/properties/PropertyForm';
import type { Property } from '../../types';
import './OwnerPages.css';

const PropertyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: Partial<Property>) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await propertiesApi.create(data);
      const property = (response as any)?.data || response;
      navigate(`/owner/properties/${(property as Property).id}`);
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setError(err?.message || 'Failed to create property. Please try again.');
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <button
          onClick={() => navigate('/owner/properties')}
          className="owner-page__back"
        >
          ← Back to Properties
        </button>
        <h2>Add New Property</h2>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <PropertyForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/owner/properties')}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default PropertyCreatePage;

