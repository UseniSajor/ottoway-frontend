// User and Auth Types
export type UserRole =
  | 'HOMEOWNER'
  | 'PROJECT_OWNER'
  | 'BUILDING_OWNER'
  | 'BUSINESS_OWNER'
  | 'ASSET_MANAGER'
  | 'PROPERTY_MANAGER'
  | 'REAL_ESTATE_INVESTOR'
  | 'CORPORATE_FACILITIES'
  | 'DEVELOPER'
  | 'PROJECT_MANAGER'
  | 'PRIME_CONTRACTOR'
  | 'SUBCONTRACTOR'
  | 'DESIGNER'
  | 'ARCHITECT'
  | 'INSPECTOR'
  | 'LENDER'
  | 'ADMIN'
  | 'PLATFORM_OPERATOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Project Types
export type ProjectCategory =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'INSTITUTIONAL'
  | 'MIXED_USE';

export type ProjectType =
  | 'NEW_CONSTRUCTION_RESIDENTIAL'
  | 'WHOLE_HOUSE_RENOVATION'
  | 'ADDITION_EXPANSION'
  | 'INTERIOR_RENOVATION_LIGHT'
  | 'INTERIOR_RENOVATION_MAJOR'
  | 'KITCHEN_BATH_REMODEL'
  | 'BASEMENT_FINISH'
  | 'ACCESSIBILITY_MODIFICATIONS'
  | 'NEW_CONSTRUCTION_COMMERCIAL'
  | 'TENANT_IMPROVEMENT_OFFICE'
  | 'TENANT_IMPROVEMENT_RETAIL'
  | 'TENANT_IMPROVEMENT_RESTAURANT'
  | 'COMMERCIAL_RENOVATION'
  | 'STOREFRONT_FACADE'
  | 'WAREHOUSE_BUILDOUT'
  | 'MANUFACTURING_FACILITY'
  | 'INDUSTRIAL_RENOVATION'
  | 'SCHOOL_FACILITY'
  | 'HEALTHCARE_FACILITY'
  | 'GOVERNMENT_BUILDING'
  | 'MIXED_USE_DEVELOPMENT';

export type ProjectComplexity = 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'MAJOR';

export type PropertyType =
  | 'SINGLE_FAMILY'
  | 'MULTI_FAMILY'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'COMMERCIAL_OFFICE'
  | 'RETAIL'
  | 'INDUSTRIAL'
  | 'MIXED_USE'
  | 'LAND';

export type BuildingClass = 'CLASS_A' | 'CLASS_B' | 'CLASS_C';

export type OccupancyType = 'OWNER_OCCUPIED' | 'TENANT_OCCUPIED' | 'VACANT' | 'MIXED';

export type LeaseType =
  | 'NET_LEASE'
  | 'GROSS_LEASE'
  | 'MODIFIED_GROSS'
  | 'PERCENTAGE_LEASE'
  | 'GROUND_LEASE';

export interface Property {
  id: string;
  ownerId: string;
  propertyType: PropertyType;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  squareFootage?: number;
  unitCount?: number;
  yearBuilt?: number;
  buildingClass?: BuildingClass;
  occupancy?: OccupancyType;
  leaseType?: LeaseType;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type ProjectStatus =
  | 'PLANNING'
  | 'DESIGN'
  | 'READINESS'
  | 'CONTRACT_NEGOTIATION'
  | 'PERMIT_SUBMISSION'
  | 'PERMITTED'
  | 'CONSTRUCTION'
  | 'CLOSEOUT'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type DesignStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'REVIEW_REQUIRED'
  | 'REVISIONS_REQUESTED'
  | 'APPROVED_FOR_PERMIT'
  | 'SUPERSEDED';

export interface DesignVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  version?: number; // Alias for versionNumber for backward compatibility
  versionName?: string;
  description?: string;
  status: DesignStatus;
  fileUrl?: string; // Main design file URL (from first document if documents exist)
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedById?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  approvalNotes?: string;
  documents?: DesignDocument[];
  comments?: DesignComment[];
  _count?: {
    documents: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DesignDocument {
  id: string;
  designVersionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string;
  description?: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface DesignComment {
  id: string;
  designVersionId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  comment: string;
  commentType?: string;
  createdAt: string;
}

export type ReadinessItemStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'NOT_APPLICABLE';

export interface ReadinessChecklist {
  id: string;
  projectId: string;
  generatedFromType: boolean;
  items: ReadinessItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessItem {
  id: string;
  checklistId: string;
  title: string;
  description?: string;
  category?: string;
  required: boolean;
  orderIndex: number;
  status: ReadinessItemStatus;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  completedById?: string;
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completedAt?: string;
  completionNotes?: string;
  documents?: ReadinessDocument[];
  comments?: ReadinessComment[];
  _count?: {
    documents: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessDocument {
  id: string;
  readinessItemId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface ReadinessComment {
  id: string;
  readinessItemId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  comment: string;
  createdAt: string;
}

export type EscrowStatus =
  | 'DRAFT'
  | 'PENDING_FUNDING'
  | 'FUNDED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type TransactionType = 'DEPOSIT' | 'RELEASE' | 'REFUND' | 'FEE' | 'ADJUSTMENT';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFICATION_REQUIRED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'REFUNDED';

export interface EscrowAgreement {
  id: string;
  projectId: string;
  stripeAccountId?: string;
  totalAmount: number;
  currency: string;
  payerId: string;
  payer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  payeeId: string;
  payee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    stripeConnectAccount?: StripeConnectAccount;
  };
  status: EscrowStatus;
  funded: boolean;
  fundedAt?: string;
  fundedAmount?: number;
  contractId?: string;
  contract?: {
    id: string;
    contractName?: string;
    milestones?: Milestone[];
  };
  transactions?: EscrowTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface StripeConnectAccount {
  id: string;
  userId: string;
  stripeAccountId: string;
  accountType?: string;
  country?: string;
  email?: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export interface EscrowTransaction {
  id: string;
  escrowAgreementId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  milestoneId?: string;
  milestone?: {
    id: string;
    name: string;
    amount?: number;
  };
  stripePaymentId?: string;
  stripeTransferId?: string;
  status: TransactionStatus;
  releaseRequested: boolean;
  releaseRequestedAt?: string;
  releaseRequestedById?: string;
  releaseRequestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  verificationComplete: boolean;
  receipts?: Receipt[];
  approvedById?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  approvalNotes?: string;
  rejectedById?: string;
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  transactionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  vendor?: string;
  receiptDate?: string;
  amount?: number;
  description?: string;
  category?: string;
  ocrProcessed: boolean;
  ocrResult?: OCRResult;
  verified: boolean;
  verifiedById?: string;
  verifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  verifiedAt?: string;
  verificationNotes?: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface OCRResult {
  id: string;
  receiptId: string;
  extractedVendor?: string;
  extractedDate?: string;
  extractedAmount?: number;
  extractedItems?: any;
  extractedText?: string;
  confidence?: number;
  processedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  contractId?: string;
  name: string;
  description?: string;
  amount?: number;
  status: string;
  completedAt?: string;
  releaseApproved: boolean;
  releasedAt?: string;
  escrowTransactions?: EscrowTransaction[];
}

export type CloseoutStatus = 'IN_PROGRESS' | 'PENDING_ITEMS' | 'READY_FOR_COMPLETION' | 'COMPLETED';

export interface ProjectCloseout {
  id: string;
  projectId: string;
  status: CloseoutStatus;
  punchListComplete: boolean;
  finalInspectionPassed: boolean;
  finalPaymentReleased: boolean;
  warrantyProvided: boolean;
  asBuiltDrawingsProvided: boolean;
  liensReleased: boolean;
  documents?: CloseoutDocument[];
  completedAt?: string;
  completedById?: string;
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloseoutDocument {
  id: string;
  closeoutId: string;
  documentType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export type PunchListPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PunchListStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'CLOSED';

export interface PunchListItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  location?: string;
  priority: PunchListPriority;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: PunchListStatus;
  images?: PunchListImage[];
  resolvedAt?: string;
  resolvedById?: string;
  resolvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  resolutionNotes?: string;
  reportedById: string;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PunchListImage {
  id: string;
  punchItemId: string;
  fileName: string;
  fileUrl: string;
  description?: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export type ReviewStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'FLAGGED' | 'REMOVED';

export interface ProjectReview {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewSubjectId: string;
  reviewSubject?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  subjectRole: string;
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  professionalismRating?: number;
  valueRating?: number;
  overallRating?: number;
  title?: string;
  reviewText?: string;
  pros?: string;
  cons?: string;
  wouldRecommend?: boolean;
  wouldHireAgain?: boolean;
  status: ReviewStatus;
  publishedAt?: string;
  visible: boolean;
  response?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  responseText: string;
  respondedById: string;
  respondedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  propertyId?: string;
  category: ProjectCategory;
  projectType: ProjectType;
  complexity: ProjectComplexity;
  status: ProjectStatus;
  name: string;
  description?: string;
  squareFootage?: number;
  unitCount?: number;
  jurisdiction?: string;
  permitAuthority?: string;
  // Relations (populated when include=owner,property is used)
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    name?: string; // Computed: firstName + lastName
  };
  property?: {
    id: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}


// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

