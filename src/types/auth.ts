// User interface for the authenticated user (legacy)
export interface User {
  id: string
  email: string
  name: string
  mobile?: string
  phone?: string
  image?: string
  first_name?: string
  last_name?: string
  country_code?: string
  wallet?: string
  referral_code?: string
  is_es_gold?: number
  vip_subscription_status?: string
  // B2B specific fields
  company_name?: string
  contact_person?: string
  role?: string
}

// Extended user interface for B2B current user
export interface B2BUser {
  id: string
  roleId: string
  locationId: string
  manager_user_id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  gst_number: string
  pan_number: string | null
  credit_days: number
  payment_terms: string
  payment_method_preference: string
  late_payment_fee_percentage: string
  credit_limit: string
  status: string
  created_at: string
  updated_at: string
  createdAt: string
  updatedAt: string
  // Legacy fields for compatibility
  name?: string
  mobile?: string
}

// Authentication state interface
export interface AuthState {
  user: B2BUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Login request interface
export interface LoginRequest {
  email: string
  password: string
}

// Login response interface
export interface LoginResponse {
  status: boolean
  message: string
  data: {
    user: User
    token?: string
  }
}

// API response wrapper
export interface ApiResponse<T = any> {
  status: boolean
  message: string
  data?: T
}

// Initial auth state
export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}
