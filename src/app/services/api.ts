// API Configuration and Service Layer for Voizmatic Backend Integration
// Backend API: https://api.voizmatic.com/docs

const API_BASE_URL = 'https://api.voizmatic.com';

// ============================================================================
// TYPE DEFINITIONS - Matching API Schema
// ============================================================================

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface UserSchema {
  id: string;
  email: string;
  full_name?: string;
  credits: number;
}

export interface ProfileResponse {
  user: UserSchema;
  credits: number;
}

// Campaign Types
export interface CampaignSchema {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  total_contacts: number;
  completed: number;
  in_progress: number;
}

export interface CampaignResponse {
  campaigns: CampaignSchema[];
  total: number;
  limit: number;
  offset: number;
}

export interface CampaignDetailResponse {
  campaign: CampaignSchema;
  contacts: ContactSchema[];
  contacts_total: number;
  limit: number;
  offset: number;
}

export interface StartCampaignResponse {
  campaign_id: string;
  message: string;
  queued_contacts: number;
  dialer_task_id?: string;
  dry_run: boolean;
}

export interface DialerControlResponse {
  campaign_id: string;
  paused: boolean;
}

// Contact Types
export interface ContactSchema {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  verification_status: string;
  category?: string;
  notes?: string;
  age?: number;
  lender_name?: string;
  date_of_disbursement?: string;
  loan_amount?: number;
  spouse_or_son_name?: string;
  language?: string;
  disbursed_by_agent?: string;
  branch?: string;
  village?: string;
  district?: string;
  state?: string;
}

export interface ContactListResponse {
  items: ContactSchema[];
  total: number;
  limit: number;
  offset: number;
}

export interface ContactUpdate {
  verification_status?: string;
  notes?: string;
  status?: string;
  phone?: string;
  email?: string;
  category?: string;
  age?: number;
  lender_name?: string;
  date_of_disbursement?: string;
  loan_amount?: number;
  spouse_or_son_name?: string;
  language?: string;
  disbursed_by_agent?: string;
  branch?: string;
  village?: string;
  district?: string;
  state?: string;
}

export interface BulkContactUpdateRequest {
  contact_ids: string[];
  update: ContactUpdate;
}

export interface BulkContactUpdateResponse {
  updated: number;
  not_found?: string[];
}

export interface BulkContactDeleteRequest {
  contact_ids: string[];
}

// Upload Types
export interface UploadResponse {
  campaign_id: string;
  processed_rows: number;
  duplicates: number;
  accepted: number;
  message: string;
}

// Recording Types
export interface RecordingSchema {
  id: string;
  contact_id: string;
  campaign_id: string;
  created_at: string;
  duration_seconds?: number;
  url: string;
  format: string;
}

export interface RecordingListResponse {
  items: RecordingSchema[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecordingURLResponse {
  recording_id: string;
  url: string;
}

// Transcript Types
export interface TranscriptSchema {
  id: string;
  call_session_id: string;
  text?: string;
  confidence?: number;
  redaction_applied: boolean;
  segments?: Record<string, unknown>;
  storage_url?: string;
  checksum?: string;
  created_at: string;
}

export interface TranscriptListResponse {
  items: TranscriptSchema[];
  total: number;
  limit: number;
  offset: number;
}

export interface BulkTranscriptDeleteRequest {
  contact_ids: string[];
}

// Report Types
export interface ReportSummary {
  total_calls: number;
  total_duration_seconds: number;
  credits_used: number;
  answered_calls: number;
  timeframe: string;
}

// Generic Types
export interface DeleteResponse {
  deleted: number;
  message: string;
}

export interface MessageResponse {
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp?: string;
}

// Error Types from OpenAPI Schema
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface ErrorResponse {
  detail: string | ValidationError[];
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  validationErrors?: ValidationError[];
  originalError?: unknown;
}

// Custom API Error class
export class VoizmaticApiError extends Error {
  status?: number;
  statusText?: string;
  validationErrors?: ValidationError[];
  
  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'VoizmaticApiError';
    this.status = apiError.status;
    this.statusText = apiError.statusText;
    this.validationErrors = apiError.validationErrors;
  }

  // Format validation errors into a readable string
  getValidationErrorMessage(): string {
    if (!this.validationErrors || this.validationErrors.length === 0) {
      return this.message;
    }
    
    return this.validationErrors
      .map(err => {
        const field = err.loc.slice(1).join('.') || 'field';
        return `${field}: ${err.msg}`;
      })
      .join('\n');
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const TOKEN_KEY = 'voizmatic_access_token';
const TOKEN_EXPIRY_KEY = 'voizmatic_token_expiry';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string, expiresAt: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  },

  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  isTokenValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return false;
    
    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  },
};

// ============================================================================
// API CALL HANDLER
// ============================================================================

// Helper function to parse API errors
function parseApiError(response: Response, errorData?: any): ApiError {
  const status = response.status;
  const statusText = response.statusText;
  
  // Default error message based on status code
  let message = `Request failed with status ${status}`;
  let validationErrors: ValidationError[] | undefined;
  
  // Handle different error responses
  if (errorData) {
    // HTTPValidationError (422) - has detail array
    if (Array.isArray(errorData.detail)) {
      validationErrors = errorData.detail as ValidationError[];
      message = validationErrors.map(err => {
        const field = err.loc.slice(1).join('.') || 'field';
        return `${field}: ${err.msg}`;
      }).join('; ');
    }
    // Simple error message
    else if (typeof errorData.detail === 'string') {
      message = errorData.detail;
    }
    // Generic message field
    else if (typeof errorData.message === 'string') {
      message = errorData.message;
    }
  }
  
  // Status-specific error messages
  switch (status) {
    case 400:
      message = message || 'Bad request. Please check your input.';
      break;
    case 401:
      message = 'Session expired or invalid. Please login again.';
      break;
    case 403:
      message = 'Access forbidden. You do not have permission to perform this action.';
      break;
    case 404:
      message = 'Resource not found.';
      break;
    case 422:
      // Validation error - message already set above
      if (!validationErrors) {
        message = 'Validation failed. Please check your input.';
      }
      break;
    case 429:
      message = 'Too many requests. Please try again later.';
      break;
    case 500:
      message = 'Internal server error. Please try again later.';
      break;
    case 502:
      message = 'Bad gateway. The server is temporarily unavailable.';
      break;
    case 503:
      message = 'Service unavailable. Please try again later.';
      break;
    case 504:
      message = 'Gateway timeout. The request took too long.';
      break;
  }
  
  return { message, status, statusText, validationErrors };
}

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add authorization header if required and token exists
  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      tokenManager.clearToken();
      // Use setTimeout to avoid immediate navigation during render
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw new VoizmaticApiError({
        message: 'Session expired. Please login again.',
        status: 401,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      let errorData: any;
      
      // Try to parse error response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        }
      } catch (parseError) {
        // JSON parsing failed, continue with default error
        console.warn('Failed to parse error response:', parseError);
      }
      
      const apiError = parseApiError(response, errorData);
      throw new VoizmaticApiError(apiError);
    }

    // Handle successful responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    // Network errors or fetch failures
    if (error instanceof VoizmaticApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      // Network error
      throw new VoizmaticApiError({
        message: 'Network error. Please check your internet connection.',
        originalError: error,
      });
    }
    
    if (error instanceof Error) {
      throw new VoizmaticApiError({
        message: error.message,
        originalError: error,
      });
    }
    
    throw new VoizmaticApiError({
      message: 'An unexpected error occurred',
      originalError: error,
    });
  }
}

// File upload helper (multipart/form-data)
async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {};

  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      tokenManager.clearToken();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw new VoizmaticApiError({
        message: 'Session expired. Please login again.',
        status: 401,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      let errorData: any;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        }
      } catch (parseError) {
        console.warn('Failed to parse upload error response:', parseError);
      }
      
      const apiError = parseApiError(response, errorData);
      throw new VoizmaticApiError(apiError);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof VoizmaticApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new VoizmaticApiError({
        message: 'Network error during upload. Please check your internet connection.',
        originalError: error,
      });
    }
    
    if (error instanceof Error) {
      throw new VoizmaticApiError({
        message: error.message,
        originalError: error,
      });
    }
    
    throw new VoizmaticApiError({
      message: 'Upload failed',
      originalError: error,
    });
  }
}

// File download helper
async function apiDownload(
  endpoint: string,
  filename: string,
  requiresAuth: boolean = true
): Promise<void> {
  const headers: Record<string, string> = {};

  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      tokenManager.clearToken();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw new VoizmaticApiError({
        message: 'Session expired. Please login again.',
        status: 401,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      let errorData: any;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        }
      } catch (parseError) {
        console.warn('Failed to parse download error response:', parseError);
      }
      
      const apiError = parseApiError(response, errorData);
      throw new VoizmaticApiError(apiError);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    if (error instanceof VoizmaticApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new VoizmaticApiError({
        message: 'Network error during download. Please check your internet connection.',
        originalError: error,
      });
    }
    
    if (error instanceof Error) {
      throw new VoizmaticApiError({
        message: error.message,
        originalError: error,
      });
    }
    
    throw new VoizmaticApiError({
      message: 'Download failed',
      originalError: error,
    });
  }
}

// File download helper that returns blob (for recording downloads)
async function apiDownloadBlob(
  endpoint: string,
  requiresAuth: boolean = true
): Promise<Blob> {
  const headers: Record<string, string> = {};

  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      tokenManager.clearToken();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw new VoizmaticApiError({
        message: 'Session expired. Please login again.',
        status: 401,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      let errorData: any;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        }
      } catch (parseError) {
        console.warn('Failed to parse download error response:', parseError);
      }
      
      const apiError = parseApiError(response, errorData);
      throw new VoizmaticApiError(apiError);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof VoizmaticApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new VoizmaticApiError({
        message: 'Network error during download. Please check your internet connection.',
        originalError: error,
      });
    }
    
    if (error instanceof Error) {
      throw new VoizmaticApiError({
        message: error.message,
        originalError: error,
      });
    }
    
    throw new VoizmaticApiError({
      message: 'Download failed',
      originalError: error,
    });
  }
}

// ============================================================================
// API SERVICE OBJECT
// ============================================================================

export const api = {
  // -------------------------------------------------------------------------
  // HEALTH CHECK
  // -------------------------------------------------------------------------
  health: {
    check: async (): Promise<HealthResponse> => {
      return apiCall<HealthResponse>('/api/health', { method: 'GET' }, false);
    },
    checkV2: async (): Promise<HealthResponse> => {
      return apiCall<HealthResponse>('/api/v2/health', { method: 'GET' }, false);
    },
  },

  // -------------------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------------------
  auth: {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await apiCall<AuthResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        },
        false
      );
      
      // Store the token
      tokenManager.setToken(response.access_token, response.expires_at);
      
      return response;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiCall<AuthResponse>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        false
      );
      
      // Store the token
      tokenManager.setToken(response.access_token, response.expires_at);
      
      return response;
    },

    logout: async (): Promise<MessageResponse> => {
      const response = await apiCall<MessageResponse>('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear the token
      tokenManager.clearToken();
      
      return response;
    },

    getProfile: async (): Promise<ProfileResponse> => {
      return apiCall<ProfileResponse>('/api/auth/profile', { method: 'GET' });
    },
  },

  // -------------------------------------------------------------------------
  // CAMPAIGNS
  // -------------------------------------------------------------------------
  campaigns: {
    list: async (limit: number = 50, offset: number = 0): Promise<CampaignResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      return apiCall<CampaignResponse>(`/api/campaigns?${params}`, { method: 'GET' });
    },

    get: async (campaignId: string, limit: number = 50, offset: number = 0): Promise<CampaignDetailResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      return apiCall<CampaignDetailResponse>(`/api/campaigns/${campaignId}?${params}`, { method: 'GET' });
    },

    delete: async (campaignId: string): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
    },

    start: async (campaignId: string, dryRun: boolean = false): Promise<StartCampaignResponse> => {
      const params = new URLSearchParams({ dry_run: dryRun.toString() });
      return apiCall<StartCampaignResponse>(`/api/campaigns/${campaignId}/start?${params}`, { method: 'POST' });
    },

    pause: async (campaignId: string): Promise<DialerControlResponse> => {
      return apiCall<DialerControlResponse>(`/api/campaigns/${campaignId}/pause`, { method: 'POST' });
    },

    resume: async (campaignId: string): Promise<DialerControlResponse> => {
      return apiCall<DialerControlResponse>(`/api/campaigns/${campaignId}/resume`, { method: 'POST' });
    },

    deleteContacts: async (campaignId: string): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>(`/api/campaigns/${campaignId}/contacts`, { method: 'DELETE' });
    },
  },

  // -------------------------------------------------------------------------
  // CONTACTS (Upload & Management)
  // -------------------------------------------------------------------------
  contacts: {
    upload: async (file: File, campaignName: string, category: string): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaign_name', campaignName);
      formData.append('category', category);
      
      return apiUpload<UploadResponse>('/api/contacts/upload', formData);
    },

    downloadTemplate: async (): Promise<void> => {
      return apiDownload('/api/contacts/template', 'contacts_template.csv');
    },

    list: async (params?: {
      status?: string;
      campaign_id?: string;
      category?: string;
      limit?: number;
      offset?: number;
      q?: string;
    }): Promise<ContactListResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      if (params?.q) searchParams.append('q', params.q);
      
      return apiCall<ContactListResponse>(`/api/contacts?${searchParams}`, { method: 'GET' });
    },

    get: async (contactId: string): Promise<ContactSchema> => {
      return apiCall<ContactSchema>(`/api/contacts/${contactId}`, { method: 'GET' });
    },

    update: async (contactId: string, data: ContactUpdate): Promise<ContactSchema> => {
      return apiCall<ContactSchema>(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (contactId: string): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>(`/api/contacts/${contactId}`, { method: 'DELETE' });
    },

    bulkUpdate: async (data: BulkContactUpdateRequest): Promise<BulkContactUpdateResponse> => {
      return apiCall<BulkContactUpdateResponse>('/api/contacts/bulk', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    bulkDelete: async (data: BulkContactDeleteRequest): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>('/api/contacts/bulk_delete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // -------------------------------------------------------------------------
  // TRANSCRIPTS
  // -------------------------------------------------------------------------
  transcripts: {
    listForContact: async (contactId: string, limit: number = 50, offset: number = 0): Promise<TranscriptListResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      return apiCall<TranscriptListResponse>(`/api/contacts/${contactId}/transcripts?${params}`, { method: 'GET' });
    },

    deleteForContact: async (contactId: string): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>(`/api/contacts/${contactId}/transcripts`, { method: 'DELETE' });
    },

    bulkDelete: async (data: BulkTranscriptDeleteRequest): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>('/api/transcripts/bulk_delete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // -------------------------------------------------------------------------
  // RECORDINGS
  // -------------------------------------------------------------------------
  recordings: {
    list: async (params?: {
      campaign_id?: string;
      contact_id?: string;
      limit?: number;
      offset?: number;
    }): Promise<RecordingListResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id);
      if (params?.contact_id) searchParams.append('contact_id', params.contact_id);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      
      return apiCall<RecordingListResponse>(`/api/recordings?${searchParams}`, { method: 'GET' });
    },

    getUrl: async (recordingId: string): Promise<RecordingURLResponse> => {
      return apiCall<RecordingURLResponse>(`/api/recordings/${recordingId}/url`, { method: 'GET' });
    },

    download: async (recordingId: string): Promise<Blob> => {
      return apiDownloadBlob(`/api/recordings/${recordingId}/download`);
    },

    delete: async (recordingId: string): Promise<DeleteResponse> => {
      return apiCall<DeleteResponse>(`/api/recordings/${recordingId}`, { method: 'DELETE' });
    },
  },

  // -------------------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------------------
  reports: {
    getSummary: async (): Promise<ReportSummary> => {
      return apiCall<ReportSummary>('/api/reports/summary', { method: 'GET' });
    },

    export: async (params?: {
      campaign_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }): Promise<Blob> => {
      const searchParams = new URLSearchParams();
      if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      
      return apiDownloadBlob(`/api/reports/export?${searchParams}`);
    },
  },
};

// Export utilities
export { API_BASE_URL, apiCall, apiUpload, apiDownload, apiDownloadBlob };
