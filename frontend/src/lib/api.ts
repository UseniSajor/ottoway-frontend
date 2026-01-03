import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse, ApiError, ProjectCloseout, PunchListItem, ProjectReview } from '../types';

// Determine API base URL with proper fallback
const getApiBaseUrl = (): string => {
  // In development, default to localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  }
  
  // In production, require VITE_API_URL
  const productionUrl = import.meta.env.VITE_API_URL;
  
  if (!productionUrl) {
    const errorMsg = 'VITE_API_URL is not set in production. Please configure it in Vercel environment variables.';
    console.error('❌ API Configuration Error:', errorMsg);
    // Show error in console but don't crash - use /api as fallback
    // This allows the app to load but API calls will fail with clear errors
    return '/api';
  }
  
  // Ensure URL ends with /api if not already present
  return productionUrl.endsWith('/api') ? productionUrl : `${productionUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        // Network error (no response from server)
        if (!error.response) {
          console.error('Network error:', {
            message: error.message,
            code: error.code,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL,
            },
          });
          
          // Check if it's a connection error to localhost in production
          if (!import.meta.env.DEV && error.config?.baseURL?.includes('localhost')) {
            const networkError = new Error(
              'API not reachable—check VITE_API_URL. Cannot connect to localhost in production.'
            ) as any;
            networkError.isNetworkError = true;
            networkError.isConfigError = true;
            networkError.originalError = error;
            return Promise.reject(networkError);
          }
          
          // Return a more descriptive error
          const networkError = new Error(
            error.code === 'ECONNREFUSED' 
              ? 'API not reachable—check VITE_API_URL. Cannot connect to server.'
              : 'API not reachable—check VITE_API_URL. Network error occurred.'
          ) as any;
          networkError.isNetworkError = true;
          networkError.originalError = error;
          return Promise.reject(networkError);
        }

        // HTTP error response
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        // Log error details for debugging
        console.error('API error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
        });

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: { params?: Record<string, unknown> }): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  // Get the underlying axios client for special cases like file uploads
  getClient() {
    return this.client;
  }
}

export const api = new ApiClient();

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: unknown; token: string }>('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => api.post<{ user: unknown; token: string }>('/auth/register', data),
  me: () => api.get<unknown>('/auth/me'),
};

// Properties endpoints
export const propertiesApi = {
  list: () => api.get<unknown[]>('/properties'),
  get: (id: string) => api.get<unknown>(`/properties/${id}`),
  create: (data: unknown) => api.post<unknown>('/properties', data),
  update: (id: string, data: unknown) => api.put<unknown>(`/properties/${id}`, data),
  delete: (id: string) => api.delete<unknown>(`/properties/${id}`),
};

// Project Types endpoints
export const projectTypesApi = {
  list: (category?: string) => {
    const url = category ? `/project-types?category=${category}` : '/project-types';
    return api.get<unknown[]>(url);
  },
  get: (id: string) => api.get<unknown>(`/project-types/${id}`),
  getMetadata: (type: string) => api.get<unknown>(`/project-types/${type}/metadata`),
  getComplexityAssessment: (data: {
    projectType: string;
    category: string;
    squareFootage?: number;
    stories?: number;
    budget?: number;
    timeline?: string;
    specialRequirements?: string[];
  }) => api.post<unknown>('/project-types/complexity-assessment', data),
  // Alias for backward compatibility
  assessComplexity: (data: {
    projectType: string;
    category?: string;
    squareFootage?: number;
    unitCount?: number;
    stories?: number;
    budget?: number;
    timeline?: string;
    specialRequirements?: string[];
  }) => api.post<unknown>('/project-types/complexity-assessment', {
    projectType: data.projectType,
    category: data.category || 'RESIDENTIAL',
    squareFootage: data.squareFootage,
    stories: data.stories,
    budget: data.budget,
    timeline: data.timeline,
    specialRequirements: data.specialRequirements,
  }),
};

// Events endpoints
export const eventsApi = {
  list: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/events`),
  create: (projectId: string, data: unknown) => api.post<unknown>(`/projects/${projectId}/events`, data),
  // Alias for backward compatibility
  getEvents: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/events`),
};

// Projects endpoints
export const projectsApi = {
  list: () => api.get<unknown[]>('/projects'),
  get: (id: string) => api.get<unknown>(`/projects/${id}`),
  create: (data: unknown) => api.post<unknown>('/projects', data),
  update: (id: string, data: unknown) => api.patch<unknown>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<unknown>(`/projects/${id}`),
  // Aliases for backward compatibility
  getRecommendations: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/recommendations`),
  getScores: (projectId: string) => api.get<unknown[]>(`/ml/projects/${projectId}/scores`),
  getEvents: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/events`),
};

// Recommendations endpoints
export const recommendationsApi = {
  get: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/recommendations`),
  apply: (projectId: string, recommendationId: string) =>
    api.post<unknown>(`/projects/${projectId}/recommendations/${recommendationId}/apply`),
  // Label endpoint for feedback labeling
  label: (recommendationId: string, data: { label: string; notes?: string }) =>
    api.post<unknown>(`/recommendations/${recommendationId}/label`, { label: data.label, ...(data.notes && { notes: data.notes }) }),
};

// Design Versions endpoints
export const designVersionsApi = {
  list: (projectId: string) => api.get<unknown[]>(`/projects/${projectId}/design-versions`),
  get: (versionId: string) => api.get<unknown>(`/design-versions/${versionId}`),
  create: (projectId: string, data: { name: string; description?: string; documents?: File[] }) =>
    api.post<unknown>(`/projects/${projectId}/design-versions`, data),
  updateStatus: (versionId: string, status: string, notes?: string) =>
    api.patch<unknown>(`/design-versions/${versionId}/status`, { status, notes }),
  approve: (versionId: string, notes?: string) =>
    api.post<unknown>(`/design-versions/${versionId}/approve`, { notes }),
  reject: (versionId: string, reason: string) =>
    api.post<unknown>(`/design-versions/${versionId}/reject`, { reason }),
  uploadDocument: async (versionId: string, file: File, documentType?: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) formData.append('documentType', documentType);
    if (description) formData.append('description', description);
    
    const client = api.getClient();
    const response = await client.post<ApiResponse<unknown>>(
      `/design-versions/${versionId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
  addComment: (versionId: string, comment: string, commentType?: string) =>
    api.post<unknown>(`/design-versions/${versionId}/comments`, { comment, commentType }),
  deleteDocument: (documentId: string) => api.delete<unknown>(`/design-documents/${documentId}`),
};

// Readiness endpoints
export const readinessApi = {
  getChecklist: (projectId: string) => api.get<unknown>(`/projects/${projectId}/readiness`),
  updateItemStatus: (itemId: string, status: string, completionNotes?: string) =>
    api.patch<unknown>(`/readiness-items/${itemId}/status`, { status, completionNotes }),
  assignItem: (itemId: string, assignedToId?: string) =>
    api.patch<unknown>(`/readiness-items/${itemId}/assign`, { assignedToId }),
  uploadDocument: async (itemId: string, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    
    const client = api.getClient();
    const response = await client.post<ApiResponse<unknown>>(
      `/readiness-items/${itemId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
  addComment: (itemId: string, comment: string) =>
    api.post<unknown>(`/readiness-items/${itemId}/comments`, { comment }),
  deleteDocument: (documentId: string) => api.delete<unknown>(`/readiness-documents/${documentId}`),
};

// Escrow endpoints
export const escrowApi = {
  createConnectAccount: () => api.post<unknown>('/stripe/connect-account'),
  getAccountLink: () => api.post<unknown>('/stripe/account-link'),
  createAgreement: (projectId: string, data: { totalAmount: number; payeeId: string; contractId?: string }) =>
    api.post<unknown>(`/projects/${projectId}/escrow`, data),
  getAgreement: (projectId: string) => api.get<unknown>(`/projects/${projectId}/escrow`),
  fundEscrow: (escrowId: string, paymentMethodId: string) =>
    api.post<unknown>(`/escrow/${escrowId}/fund`, { paymentMethodId }),
  requestRelease: (milestoneId: string, notes?: string) =>
    api.post<unknown>(`/milestones/${milestoneId}/request-release`, { notes }),
  uploadReceipt: async (transactionId: string, file: File, data: { vendor?: string; receiptDate?: string; amount?: number; description?: string; category?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.vendor) formData.append('vendor', data.vendor);
    if (data.receiptDate) formData.append('receiptDate', data.receiptDate);
    if (data.amount) formData.append('amount', data.amount.toString());
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    
    const client = api.getClient();
    const response = await client.post<ApiResponse<unknown>>(
      `/transactions/${transactionId}/receipts`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
  verifyReceipt: (receiptId: string, verified: boolean, notes?: string) =>
    api.post<unknown>(`/receipts/${receiptId}/verify`, { verified, notes }),
  approveRelease: (transactionId: string, notes?: string) =>
    api.post<unknown>(`/transactions/${transactionId}/approve`, { notes }),
  rejectRelease: (transactionId: string, reason: string) =>
    api.post<unknown>(`/transactions/${transactionId}/reject`, { reason }),
};

// Closeout endpoints
export const closeoutApi = {
  getCloseout: (projectId: string) => api.get<unknown>(`/projects/${projectId}/closeout`),
  updateCloseout: (closeoutId: string, data: Partial<ProjectCloseout>) =>
    api.patch<unknown>(`/closeout/${closeoutId}`, data),
  completeCloseout: (closeoutId: string) =>
    api.post<unknown>(`/closeout/${closeoutId}/complete`),
  uploadDocument: async (closeoutId: string, file: File, documentType: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) formData.append('description', description);
    
    const client = api.getClient();
    const response = await client.post<ApiResponse<unknown>>(
      `/closeout/${closeoutId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
  addPunchItem: (closeoutId: string, data: Partial<PunchListItem>) =>
    api.post<unknown>(`/closeout/${closeoutId}/punch-items`, data),
  // Alias for backward compatibility
  createPunchItem: (closeoutId: string, data: Partial<PunchListItem>) =>
    api.post<unknown>(`/closeout/${closeoutId}/punch-items`, data),
  updatePunchItem: (itemId: string, data: Partial<PunchListItem>) =>
    api.patch<unknown>(`/punch-items/${itemId}`, data),
  deletePunchItem: (itemId: string) => api.delete<unknown>(`/punch-items/${itemId}`),
  completePunchItem: (itemId: string) =>
    api.post<unknown>(`/punch-items/${itemId}/complete`),
};

// Reviews endpoints
export const reviewsApi = {
  list: (projectId: string) => api.get<ProjectReview[]>(`/projects/${projectId}/reviews`),
  create: (projectId: string, data: Partial<ProjectReview>) =>
    api.post<ProjectReview>(`/projects/${projectId}/reviews`, data),
  get: (reviewId: string) => api.get<ProjectReview>(`/reviews/${reviewId}`),
  update: (reviewId: string, data: Partial<ProjectReview>) =>
    api.patch<ProjectReview>(`/reviews/${reviewId}`, data),
  respond: (reviewId: string, response: string) =>
    api.post<unknown>(`/reviews/${reviewId}/respond`, { response }),
  // Alias for backward compatibility
  submitReview: (projectId: string, data: Partial<ProjectReview>) =>
    api.post<ProjectReview>(`/projects/${projectId}/reviews`, data),
};

// Estimates endpoints
export const estimatesApi = {
  get: (projectId: string) => api.get<unknown>(`/projects/${projectId}/estimate`),
  generate: (projectId: string) => api.post<unknown>(`/projects/${projectId}/estimate/generate`),
  update: (projectId: string, data: unknown) =>
    api.patch<unknown>(`/projects/${projectId}/estimate`, data),
};

// PM endpoints
export const pmApi = {
  getMetrics: () => api.get<unknown>('/pm/dashboard/metrics'),
  getProjects: () => api.get<unknown[]>('/pm/projects'),
  getAlerts: () => api.get<unknown[]>('/pm/alerts'),
  getActivity: () => api.get<unknown[]>('/pm/activity'),
  getTeam: () => api.get<unknown[]>('/pm/team'),
  getSchedule: () => api.get<unknown[]>('/pm/schedule'),
  getReportTemplates: () => api.get<unknown[]>('/pm/reports/templates'),
  generateReport: (data: { templateId: string; projectIds?: string[]; dateRange?: any; metrics?: string[] }) =>
    api.post<unknown>('/pm/reports/generate', data),
};

// Contractor endpoints
export const contractorApi = {
  getMetrics: () => api.get<unknown>('/contractor/dashboard/metrics'),
  getProjects: () => api.get<unknown[]>('/contractor/projects'),
  getPayments: () => api.get<unknown[]>('/contractor/payments'),
  getInvoices: () => api.get<unknown[]>('/contractor/invoices'),
  inviteSubcontractor: (projectId: string, data: { email: string; trade: string; scope?: string }) =>
    api.post<unknown>(`/contractor/projects/${projectId}/invite-subcontractor`, data),
  getInvites: (projectId: string) => api.get<unknown[]>(`/contractor/projects/${projectId}/invites`),
};

// Admin endpoints
export const adminApi = {
  getMetrics: () => api.get<unknown>('/admin/dashboard/metrics'),
  getActivity: () => api.get<unknown[]>('/admin/activity'),
  getAlerts: () => api.get<unknown[]>('/admin/alerts'),
  getUsers: (filters?: { role?: string; status?: string; search?: string }) =>
    api.get<unknown[]>(`/admin/users`, { params: filters }),
  getUser: (userId: string) => api.get<unknown>(`/admin/users/${userId}`),
  updateUser: (userId: string, data: any) => api.patch<unknown>(`/admin/users/${userId}`, data),
  getPendingContractors: () => api.get<unknown[]>('/admin/contractors/pending'),
  getContractors: () => api.get<unknown[]>('/admin/contractors'),
  approveContractor: (contractorId: string, data: { notes?: string }) =>
    api.post<unknown>(`/admin/contractors/${contractorId}/approve`, data),
  rejectContractor: (contractorId: string, data: { reason: string }) =>
    api.post<unknown>(`/admin/contractors/${contractorId}/reject`, data),
  getProjects: () => api.get<unknown[]>('/admin/projects'),
  getEscrowOverview: () => api.get<unknown>('/admin/escrow/overview'),
  getDisputes: (filters?: { status?: string; priority?: string }) =>
    api.get<unknown[]>(`/admin/disputes`, { params: filters }),
  getDispute: (disputeId: string) => api.get<unknown>(`/admin/disputes/${disputeId}`),
  resolveDispute: (disputeId: string, data: { resolutionNotes?: string; resolutionAction?: any; status?: string }) =>
    api.post<unknown>(`/admin/disputes/${disputeId}/resolve`, data),
  getAuditLogs: (filters?: { userId?: string; entity?: string; entityId?: string; action?: string; limit?: number }) =>
    api.get<unknown[]>(`/admin/audit-log`, { params: filters }),
};

// ML endpoints
export const mlApi = {
  dashboard: () => api.get<unknown>('/ml/dashboard'),
  events: (projectId: string) => api.get<unknown[]>(`/ml/projects/${projectId}/events`),
  recommendations: (projectId: string) => api.get<unknown[]>(`/ml/projects/${projectId}/recommendations`),
  scores: (projectId: string) => api.get<unknown[]>(`/ml/projects/${projectId}/scores`),
};
