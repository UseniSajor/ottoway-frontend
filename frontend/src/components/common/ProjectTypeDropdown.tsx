import React, { useState, useMemo } from 'react';
import type { ProjectType, ProjectCategory } from '../../types';
import './ProjectTypeDropdown.css';

interface ProjectTypeDropdownProps {
  value?: ProjectType;
  onChange: (type: ProjectType) => void;
  category?: ProjectCategory;
  placeholder?: string;
}

const PROJECT_TYPES_BY_CATEGORY: Record<ProjectCategory, ProjectType[]> = {
  RESIDENTIAL: [
    'NEW_CONSTRUCTION_RESIDENTIAL',
    'WHOLE_HOUSE_RENOVATION',
    'ADDITION_EXPANSION',
    'INTERIOR_RENOVATION_LIGHT',
    'INTERIOR_RENOVATION_MAJOR',
    'KITCHEN_BATH_REMODEL',
    'BASEMENT_FINISH',
    'ACCESSIBILITY_MODIFICATIONS',
  ],
  COMMERCIAL: [
    'NEW_CONSTRUCTION_COMMERCIAL',
    'TENANT_IMPROVEMENT_OFFICE',
    'TENANT_IMPROVEMENT_RETAIL',
    'TENANT_IMPROVEMENT_RESTAURANT',
    'COMMERCIAL_RENOVATION',
    'STOREFRONT_FACADE',
  ],
  INDUSTRIAL: [
    'WAREHOUSE_BUILDOUT',
    'MANUFACTURING_FACILITY',
    'INDUSTRIAL_RENOVATION',
  ],
  INSTITUTIONAL: [
    'SCHOOL_FACILITY',
    'HEALTHCARE_FACILITY',
    'GOVERNMENT_BUILDING',
  ],
  MIXED_USE: [
    'MIXED_USE_DEVELOPMENT',
  ],
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  NEW_CONSTRUCTION_RESIDENTIAL: 'New Construction (Residential)',
  WHOLE_HOUSE_RENOVATION: 'Whole House Renovation',
  ADDITION_EXPANSION: 'Addition & Expansion',
  INTERIOR_RENOVATION_LIGHT: 'Interior Renovation (Light)',
  INTERIOR_RENOVATION_MAJOR: 'Interior Renovation (Major)',
  KITCHEN_BATH_REMODEL: 'Kitchen & Bath Remodel',
  BASEMENT_FINISH: 'Basement Finish',
  ACCESSIBILITY_MODIFICATIONS: 'Accessibility Modifications',
  NEW_CONSTRUCTION_COMMERCIAL: 'New Construction (Commercial)',
  TENANT_IMPROVEMENT_OFFICE: 'Tenant Improvement (Office)',
  TENANT_IMPROVEMENT_RETAIL: 'Tenant Improvement (Retail)',
  TENANT_IMPROVEMENT_RESTAURANT: 'Tenant Improvement (Restaurant)',
  COMMERCIAL_RENOVATION: 'Commercial Renovation',
  STOREFRONT_FACADE: 'Storefront & Facade',
  WAREHOUSE_BUILDOUT: 'Warehouse Buildout',
  MANUFACTURING_FACILITY: 'Manufacturing Facility',
  INDUSTRIAL_RENOVATION: 'Industrial Renovation',
  SCHOOL_FACILITY: 'School Facility',
  HEALTHCARE_FACILITY: 'Healthcare Facility',
  GOVERNMENT_BUILDING: 'Government Building',
  MIXED_USE_DEVELOPMENT: 'Mixed-Use Development',
};

export const ProjectTypeDropdown: React.FC<ProjectTypeDropdownProps> = ({
  value,
  onChange,
  category,
  placeholder = 'Select project type...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableTypes = useMemo(() => {
    if (category) {
      return PROJECT_TYPES_BY_CATEGORY[category];
    }
    return Object.values(PROJECT_TYPES_BY_CATEGORY).flat();
  }, [category]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return availableTypes;
    const query = searchQuery.toLowerCase();
    return availableTypes.filter((type) =>
      PROJECT_TYPE_LABELS[type].toLowerCase().includes(query)
    );
  }, [availableTypes, searchQuery]);

  const selectedLabel = value ? PROJECT_TYPE_LABELS[value] : placeholder;

  return (
    <div className="project-type-dropdown">
      <button
        className="project-type-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedLabel}</span>
        <span className="project-type-dropdown__arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="project-type-dropdown__overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="project-type-dropdown__panel">
            <div className="project-type-dropdown__search">
              <input
                type="text"
                placeholder="Search project types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="project-type-dropdown__list">
              {Object.entries(PROJECT_TYPES_BY_CATEGORY).map(([cat, types]) => {
                const categoryTypes = category
                  ? types
                  : types.filter((type) => filteredTypes.includes(type));
                
                if (categoryTypes.length === 0) return null;

                return (
                  <div key={cat} className="project-type-dropdown__category">
                    <div className="project-type-dropdown__category-header">
                      {cat.replace('_', ' ')}
                    </div>
                    {categoryTypes.map((type) => (
                      <button
                        key={type}
                        className={`project-type-dropdown__item ${
                          value === type ? 'project-type-dropdown__item--selected' : ''
                        }`}
                        onClick={() => {
                          onChange(type);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        {PROJECT_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};



