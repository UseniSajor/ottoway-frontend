export interface ProjectTypeMetadata {
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'INSTITUTIONAL' | 'MIXED_USE';
  name: string;
  description: string;
  typicalComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'MAJOR';
  requiresArchitect: boolean;
  requiresStructuralEngineer: boolean;
  requiresMEPEngineer: boolean;
  typicalDuration: string;
  permitComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  readinessChecklist: string[];
}

export const PROJECT_TYPE_METADATA: Record<string, ProjectTypeMetadata> = {
  // ========== RESIDENTIAL (8 types) ==========
  NEW_CONSTRUCTION_RESIDENTIAL: {
    category: 'RESIDENTIAL',
    name: 'New Construction - Residential',
    description: 'New single or multi-family residential construction from ground up',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-18 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Site survey and boundary verification',
      'Geotechnical/soil report',
      'Architectural plans (full set)',
      'Structural engineering drawings',
      'MEP engineering plans',
      'Energy calculations (Title 24/IECC)',
      'Zoning approval/variance',
      'HOA approval (if applicable)',
      'Utility connection approvals',
      'Environmental clearances'
    ]
  },
  
  WHOLE_HOUSE_RENOVATION: {
    category: 'RESIDENTIAL',
    name: 'Whole House Renovation',
    description: 'Comprehensive renovation affecting multiple systems and spaces',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '6-12 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Existing condition assessment',
      'Architectural plans',
      'Structural evaluation',
      'MEP plans',
      'Lead/asbestos testing (if pre-1978)',
      'Energy upgrade plans',
      'Material selections'
    ]
  },
  
  ADDITION_EXPANSION: {
    category: 'RESIDENTIAL',
    name: 'Addition/Expansion',
    description: 'Adding new square footage to existing structure',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: false,
    typicalDuration: '4-8 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Site plan showing addition',
      'Architectural drawings',
      'Structural plans for foundation/framing',
      'Zoning/setback verification',
      'HOA approval (if applicable)',
      'Utility capacity verification'
    ]
  },
  
  INTERIOR_RENOVATION_LIGHT: {
    category: 'RESIDENTIAL',
    name: 'Interior Renovation - Light',
    description: 'Cosmetic updates, finishes, non-structural changes',
    typicalComplexity: 'SIMPLE',
    requiresArchitect: false,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: false,
    typicalDuration: '1-3 months',
    permitComplexity: 'LOW',
    readinessChecklist: [
      'Design plans/drawings',
      'Material selections',
      'Color schemes',
      'Fixture selections'
    ]
  },
  
  INTERIOR_RENOVATION_MAJOR: {
    category: 'RESIDENTIAL',
    name: 'Interior Renovation - Major',
    description: 'Structural changes, layout modifications, system upgrades',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '3-6 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Architectural plans',
      'Structural drawings (if walls removed)',
      'Electrical/plumbing plans',
      'HVAC modifications',
      'Material selections'
    ]
  },
  
  KITCHEN_BATH_REMODEL: {
    category: 'RESIDENTIAL',
    name: 'Kitchen & Bath Remodel',
    description: 'Kitchen and/or bathroom renovation',
    typicalComplexity: 'MODERATE',
    requiresArchitect: false,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: false,
    typicalDuration: '2-4 months',
    permitComplexity: 'LOW',
    readinessChecklist: [
      'Design plans/layout',
      'Cabinet selections',
      'Fixture selections',
      'Appliance specifications',
      'Plumbing plans',
      'Electrical plans',
      'Tile/finish selections'
    ]
  },
  
  BASEMENT_FINISH: {
    category: 'RESIDENTIAL',
    name: 'Basement Finish',
    description: 'Converting unfinished basement to living space',
    typicalComplexity: 'MODERATE',
    requiresArchitect: false,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: false,
    typicalDuration: '2-4 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Floor plan/layout',
      'Egress window requirements',
      'Waterproofing assessment',
      'Electrical plan',
      'HVAC extension plan',
      'Plumbing plan (if adding bath)'
    ]
  },
  
  ACCESSIBILITY_MODIFICATIONS: {
    category: 'RESIDENTIAL',
    name: 'Accessibility Modifications',
    description: 'ADA/accessibility improvements (ramps, lifts, doorways)',
    typicalComplexity: 'MODERATE',
    requiresArchitect: false,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: false,
    typicalDuration: '1-3 months',
    permitComplexity: 'LOW',
    readinessChecklist: [
      'Accessibility assessment',
      'ADA compliance plans',
      'Equipment specifications',
      'Structural support (if needed)',
      'Electrical requirements'
    ]
  },
  
  // ========== COMMERCIAL (6 types) ==========
  NEW_CONSTRUCTION_COMMERCIAL: {
    category: 'COMMERCIAL',
    name: 'New Construction - Commercial',
    description: 'New commercial building from ground up',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-24 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Site development plan',
      'Architectural plans',
      'Structural engineering',
      'MEP engineering',
      'Civil engineering',
      'Fire protection plans',
      'ADA compliance documentation',
      'Energy code compliance',
      'Parking/traffic study',
      'Environmental review',
      'Zoning approval'
    ]
  },
  
  TENANT_IMPROVEMENT_OFFICE: {
    category: 'COMMERCIAL',
    name: 'Tenant Improvement - Office',
    description: 'Office space build-out or renovation for tenant',
    typicalComplexity: 'MODERATE',
    requiresArchitect: true,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: true,
    typicalDuration: '3-6 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Space plan/layout',
      'Furniture plan',
      'Lighting/electrical plan',
      'HVAC modifications',
      'IT/data infrastructure',
      'ADA compliance',
      'Finish selections'
    ]
  },
  
  TENANT_IMPROVEMENT_RETAIL: {
    category: 'COMMERCIAL',
    name: 'Tenant Improvement - Retail',
    description: 'Retail space build-out or renovation',
    typicalComplexity: 'MODERATE',
    requiresArchitect: true,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: true,
    typicalDuration: '2-4 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Store layout plan',
      'Storefront design',
      'Electrical/lighting plan',
      'HVAC plan',
      'Plumbing (if applicable)',
      'Signage plan',
      'ADA compliance',
      'Fire protection'
    ]
  },
  
  TENANT_IMPROVEMENT_RESTAURANT: {
    category: 'COMMERCIAL',
    name: 'Tenant Improvement - Restaurant',
    description: 'Restaurant/food service build-out',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: true,
    typicalDuration: '4-8 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Kitchen layout/equipment plan',
      'Dining area plan',
      'Ventilation/exhaust system',
      'Grease trap/plumbing',
      'Fire suppression (hood)',
      'Gas service',
      'Health department approval',
      'ADA compliance',
      'Liquor license (if applicable)'
    ]
  },
  
  COMMERCIAL_RENOVATION: {
    category: 'COMMERCIAL',
    name: 'Commercial Renovation',
    description: 'Major renovation of existing commercial space',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '6-12 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Existing condition survey',
      'Architectural plans',
      'Structural assessment',
      'MEP upgrades',
      'Code compliance review',
      'ADA upgrades',
      'Fire/life safety updates',
      'Hazmat assessment'
    ]
  },
  
  STOREFRONT_FACADE: {
    category: 'COMMERCIAL',
    name: 'Storefront/Facade',
    description: 'Exterior storefront or facade improvements',
    typicalComplexity: 'MODERATE',
    requiresArchitect: true,
    requiresStructuralEngineer: false,
    requiresMEPEngineer: false,
    typicalDuration: '1-3 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Facade design/renderings',
      'Structural attachment details',
      'Signage plan',
      'Historic review (if applicable)',
      'Color/material samples',
      'ADA compliance (entries)'
    ]
  },
  
  // ========== INDUSTRIAL (3 types) ==========
  WAREHOUSE_BUILDOUT: {
    category: 'INDUSTRIAL',
    name: 'Warehouse Build-out',
    description: 'Warehouse or distribution center improvements',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '6-12 months',
    permitComplexity: 'MEDIUM',
    readinessChecklist: [
      'Space layout/rack plan',
      'Loading dock modifications',
      'Electrical/power distribution',
      'HVAC/ventilation',
      'Fire protection/sprinklers',
      'Forklift charging stations',
      'Office area build-out',
      'Security systems'
    ]
  },
  
  MANUFACTURING_FACILITY: {
    category: 'INDUSTRIAL',
    name: 'Manufacturing Facility',
    description: 'Manufacturing or production facility setup',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-24 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Process flow layout',
      'Equipment plans',
      'Heavy power requirements',
      'Industrial ventilation',
      'Compressed air/utilities',
      'Waste management',
      'Environmental permits',
      'OSHA compliance',
      'Fire protection'
    ]
  },
  
  INDUSTRIAL_RENOVATION: {
    category: 'INDUSTRIAL',
    name: 'Industrial Renovation',
    description: 'Renovation of existing industrial facility',
    typicalComplexity: 'COMPLEX',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '6-15 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Existing condition assessment',
      'Structural evaluation',
      'Hazmat survey',
      'Equipment relocation plan',
      'Utility upgrades',
      'Code compliance review',
      'Environmental review'
    ]
  },
  
  // ========== INSTITUTIONAL (3 types) ==========
  SCHOOL_FACILITY: {
    category: 'INSTITUTIONAL',
    name: 'School Facility',
    description: 'Educational facility construction or renovation',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-24 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Educational specifications',
      'Classroom layouts',
      'ADA compliance',
      'Fire/life safety',
      'Security systems',
      'Playground/outdoor areas',
      'Parking/drop-off zones',
      'Technology infrastructure',
      'State education dept. approval'
    ]
  },
  
  HEALTHCARE_FACILITY: {
    category: 'INSTITUTIONAL',
    name: 'Healthcare Facility',
    description: 'Medical, dental, or healthcare facility',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-24 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Medical equipment plans',
      'Infection control measures',
      'Medical gas systems',
      'Specialized HVAC',
      'Radiology shielding (if applicable)',
      'ADA compliance',
      'HIPAA compliance design',
      'Health dept. approval',
      'State licensing requirements'
    ]
  },
  
  GOVERNMENT_BUILDING: {
    category: 'INSTITUTIONAL',
    name: 'Government Building',
    description: 'Government or public facility construction/renovation',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '12-36 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Public bidding requirements',
      'Security requirements',
      'ADA compliance',
      'Public assembly codes',
      'Energy efficiency standards',
      'Prevailing wage documentation',
      'Environmental review',
      'Historic preservation (if applicable)'
    ]
  },
  
  // ========== MIXED-USE (1 type) ==========
  MIXED_USE_DEVELOPMENT: {
    category: 'MIXED_USE',
    name: 'Mixed-Use Development',
    description: 'Combined residential, commercial, and/or other uses',
    typicalComplexity: 'MAJOR',
    requiresArchitect: true,
    requiresStructuralEngineer: true,
    requiresMEPEngineer: true,
    typicalDuration: '18-36 months',
    permitComplexity: 'HIGH',
    readinessChecklist: [
      'Site development plan',
      'Zoning compliance (mixed-use)',
      'Separate unit plans',
      'Fire separation requirements',
      'Parking calculations',
      'Multiple code compliance',
      'Utility infrastructure',
      'Environmental review',
      'Traffic study'
    ]
  }
};

export function getProjectTypeMetadata(projectType: string): ProjectTypeMetadata | null {
  return PROJECT_TYPE_METADATA[projectType] || null;
}

export function getProjectTypesByCategory(category: string) {
  return Object.entries(PROJECT_TYPE_METADATA)
    .filter(([_, meta]) => meta.category === category)
    .map(([type, meta]) => ({ type, ...meta }));
}

export function getAllProjectTypes() {
  return Object.entries(PROJECT_TYPE_METADATA)
    .map(([type, meta]) => ({ type, ...meta }));
}
