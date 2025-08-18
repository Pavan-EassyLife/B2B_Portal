import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api/customer/v2.0.0/'

export interface ApiResponse<T = any> {
  status: boolean
  message: string
  data?: T
}

export class ApiClient {
  private static async getAuthHeaders() {
    const session = await getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (session?.user?.accessToken) {
      headers['Authorization'] = `Bearer ${session.user.accessToken}`
    }
    
    return headers
  }

  static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })
    
    return response.json()
  }

  static async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    
    return response.json()
  }

  static async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    
    return response.json()
  }

  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    
    return response.json()
  }
}

// Convenience functions for common API calls
export const api = {
  // Auth endpoints
  login: (mobile: string, country_code: string = '91') =>
    ApiClient.post('login', { mobile, country_code }),
  
  verifyOtp: (mobile: string, otp: string, country_code: string = '91') =>
    ApiClient.post('verify-otp', {
      mobile,
      otp,
      country_code,
      device_name: "Web Browser",
      device_type: "web",
      operating_system: "Web",
      ip_address: "auto",
      fcm_token: "",
    }),

  // Add more API endpoints here as needed
  // getUserProfile: () => ApiClient.get('profile'),
  // updateProfile: (data: any) => ApiClient.put('profile', data),
}
