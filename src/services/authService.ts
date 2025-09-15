import axios from 'axios'
import Cookies from 'js-cookie'
import { LoginRequest, LoginResponse, B2BUser } from '@/types/auth'
import { getCurrentUserToken, CurrentUser } from '@/api/categories'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/'

// Helper function to convert CurrentUser to B2BUser
const convertCurrentUserToB2BUser = (currentUser: CurrentUser): B2BUser => {
  return {
    ...currentUser,
    name: currentUser.contact_person, // Map contact_person to name for compatibility
    mobile: currentUser.phone // Map phone to mobile for compatibility
  }
}

// Create axios instance for auth API
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This ensures cookies are sent with requests
})

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('b2b_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear cookies
      Cookies.remove('b2b_token')
      Cookies.remove('b2b_user')
      // Redirect to login if needed
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  // Login function
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post<LoginResponse>('b2b/login', credentials)

      if (response.data.status && response.data.data) {
        // Store token and user data in cookies
        const token = response.data.data.user.id // Using user ID as token as per original implementation
        Cookies.set('b2b_token', token, { expires: 7, secure: true, sameSite: 'strict' }) // Expires in 7 days
        Cookies.set('b2b_user', JSON.stringify(response.data.data.user), { expires: 7, secure: true, sameSite: 'strict' })
      }

      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  },

  // Logout function
  async logout(): Promise<void> {
    try {
      // Clear cookies
      Cookies.remove('b2b_token')
      Cookies.remove('b2b_user')
      const response = await authApi.post('b2b/logout')
      return response.data
    } catch (error) {
      // Even if API call fails, clear cookies
      Cookies.remove('b2b_token')
      Cookies.remove('b2b_user')
    }
  },

  // Get current user from API using token
  async getCurrentUser(): Promise<B2BUser | null> {
    try {
      const response = await getCurrentUserToken()
      if (response.status && response.data) {
        return convertCurrentUserToB2BUser(response.data)
      }
      return null
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  },

  // Get current user from cookies (fallback for immediate access)
  getCurrentUserFromCookie(): B2BUser | null {
    try {
      const userStr = Cookies.get('b2b_user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        // If it's already a B2BUser, return as is
        if (userData.roleId) {
          return userData as B2BUser
        }
        // If it's a legacy User, try to convert (though this might not work perfectly)
        return {
          id: userData.id,
          roleId: userData.id, // Fallback
          locationId: '1', // Default fallback
          manager_user_id: '', // Default fallback
          company_name: userData.company_name || '',
          contact_person: userData.name || userData.contact_person || '',
          email: userData.email,
          phone: userData.phone || userData.mobile || '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          gst_number: '',
          pan_number: null,
          credit_days: 30,
          payment_terms: 'Net 30',
          payment_method_preference: 'any',
          late_payment_fee_percentage: '0.00',
          credit_limit: '0.00',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: userData.name,
          mobile: userData.mobile
        }
      }
      return null
    } catch (error) {
      return null
    }
  },

  // Get current token from cookies
  getCurrentToken(): string | null {
    return Cookies.get('b2b_token') || null
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getCurrentToken()
    const user = this.getCurrentUserFromCookie()
    return !!(token && user)
  },

  // Refresh user profile using the new API endpoint
  async refreshProfile(): Promise<B2BUser> {
    try {
      const response = await getCurrentUserToken()
      if (response.status && response.data) {
        const b2bUser = convertCurrentUserToB2BUser(response.data)
        // Update cookie with fresh user data
        Cookies.set('b2b_user', JSON.stringify(b2bUser), { expires: 7, secure: true, sameSite: 'strict' })
        return b2bUser
      }
      throw new Error('Failed to refresh profile')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to refresh profile')
    }
  }
}
