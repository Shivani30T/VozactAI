// Type definitions for the application
// Aligned with Voizmatic API Schema

export type UserRole = 'user' | 'admin';

// User from API
export interface User {
  id: string;
  email: string;
  full_name?: string;
  credits: number;
  username?: string; // For display purposes
  role?: UserRole;
  organizationId?: string;
  plan?: UserPlan;
  isActive?: boolean;
  createdAt?: string;
}

export type UserPlan = 'free' | 'basic' | 'premium' | 'enterprise';

// Campaign from API
export interface Campaign {
  id: string;
  name: string;
  category: string;
  status: string; // 'pending', 'active', 'paused', 'completed'
  created_at: string;
  total_contacts: number;
  completed: number;
  in_progress: number;
  // Legacy fields for compatibility
  createdAt?: string;
  userId?: string;
  organizationId?: string;
  totalContacts?: number;
  callsMade?: number;
}

// Contact from API
export interface Contact {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email?: string;
  status: string; // 'pending', 'queued', 'in_progress', 'completed', 'failed'
  verification_status: string; // 'unverified', 'verified', 'failed'
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
  // Legacy fields
  phoneNumber?: string;
  address?: string;
  userId?: string;
  organizationId?: string;
  campaignId?: string;
  campaignName?: string;
  createdAt?: string;
  productType?: string;
}

// Recording from API
export interface Recording {
  id: string;
  contact_id: string;
  campaign_id: string;
  created_at: string;
  duration_seconds?: number;
  url: string;
  format: string;
}

// Transcript from API
export interface Transcript {
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

// Report Summary from API
export interface ReportSummary {
  total_calls: number;
  total_duration_seconds: number;
  credits_used: number;
  answered_calls: number;
  timeframe: string;
}

// Legacy types for backward compatibility with existing components

export type CallStatus = 
  | 'RNR' // Ring No Response
  | 'Not Reachable'
  | 'Wrong Number'
  | 'Answered by Family'
  | 'Answered by Customer'
  | 'Answered by Others';

export type ResponseTag = 
  | 'Promised to Pay'
  | 'Requested Time'
  | 'Denied to Pay'
  | 'Asked to call back'
  | 'Others';

export type DisbursementResponse = 'Confirmed' | 'Denied';

export type IncomeSource = 
  | 'Salaried - IT Professional'
  | 'Salaried - Banking'
  | 'Salaried - Government'
  | 'Salaried - Private Sector'
  | 'Self-employed - Business Owner'
  | 'Self-employed - E-commerce Seller'
  | 'Self-employed - Professional'
  | 'Self-employed - Freelancer'
  | 'Agriculture'
  | 'Retail Business'
  | 'Daily Wage'
  | 'Pension'
  | 'Other';

export type LUCPurpose = 
  | 'Business Expansion'
  | 'Working Capital'
  | 'Home Renovation'
  | 'Home Construction'
  | 'Vehicle Purchase - Personal'
  | 'Vehicle Purchase - Business'
  | 'Medical Emergency'
  | 'Education'
  | 'Wedding'
  | 'Debt Consolidation'
  | 'Travel'
  | 'Investment'
  | 'Emergency'
  | 'Other';

export interface DisbursementVerificationData {
  response: DisbursementResponse;
  commission: boolean;
  loanSharing: boolean;
  lucPurpose?: LUCPurpose;
  incomeSource?: IncomeSource;
}

export type Category = 
  | 'Disbursement Verification'
  | 'Collection Calling'
  | 'Repayment Notices'
  | 'Legal Notices'
  | 'Consumer Durables'
  | 'Customer Feedback'
  | 'LUC Check'
  | 'Others';

export type PaymentMode = 
  | 'UPI Collect Request'
  | 'Agent'
  | 'Paid via App'
  | 'Paid via BBPS'
  | 'Others';

export type DPDBucket = 
  | '0-30 Days'
  | '31-60 Days'
  | '61-90 Days'
  | '91-180 Days'
  | '180+ Days';

// Legacy CallRecord - mapped from Contact + Recording data
export interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  callDate: string;
  duration: number; // in seconds
  status: CallStatus;
  responseTag?: ResponseTag;
  disbursementData?: DisbursementVerificationData;
  category: Category;
  recordingUrl?: string;
  notes?: string;
  userId: string;
  organizationId?: string;
  campaignId?: string;
  campaignName?: string;
  creditsUsed?: number;
  state?: string;
  productType?: string;
  // New fields from API
  contact_id?: string;
  recording_id?: string;
  transcript?: string;
}

export interface CallStats {
  totalCalls: number;
  rnr: number;
  notReachable: number;
  wrongNumber: number;
  answeredByFamily: number;
  answeredByCustomer: number;
  answeredByOthers: number;
  // Response tags stats
  promisedToPay?: number;
  requestedTime?: number;
  deniedToPay?: number;
  askedToCallBack?: number;
  othersTag?: number;
}

export interface PaymentCollection {
  id: string;
  customerName: string;
  phoneNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  dpdBucket: DPDBucket;
  userId: string;
  organizationId?: string;
  campaignId?: string;
  campaignName?: string;
  loanAccountNumber?: string;
  principalAmount?: number;
  interestAmount?: number;
  penaltyAmount?: number;
  transactionId?: string;
  agentName?: string;
  state?: string;
  productType?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}