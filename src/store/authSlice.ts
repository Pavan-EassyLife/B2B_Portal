import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, LoginRequest, B2BUser, initialAuthState } from '@/types/auth'
import { authService } from '@/services/authService'
import Cookies from 'js-cookie'

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      if (response.status && response.data) {
        // After login, fetch the current user data from the API
        const currentUser = await authService.getCurrentUser()
        
        return {
          user: currentUser,
          token: response.data.user.id // Using user ID as token
        }
      }
      throw new Error(response.message || 'Login failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return true
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed')
    }
  }
)

// Async thunk for refreshing profile
export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.refreshProfile()
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh profile')
    }
  }
)

// Async thunk for initializing auth state from cookies
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const user = authService.getCurrentUserFromCookie()
    const token = authService.getCurrentToken()
    const isAuthenticated = authService.isAuthenticated()

    return {
      user,
      token,
      isAuthenticated
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    // Update user profile
    updateUser: (state, action: PayloadAction<Partial<B2BUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        Cookies.set('b2b_user', JSON.stringify(state.user), { expires: 7, secure: true, sameSite: 'strict' })
      }
    }
  },
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = action.payload as string
      })
      
    // Logout cases
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false
        // Even if logout fails, clear the state
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = action.payload as string
      })
      
    // Initialize auth cases
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = action.payload.isAuthenticated
        state.isLoading = false
      })
      
    // Refresh profile cases
    builder
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(refreshProfile.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const { clearError, setLoading, updateUser } = authSlice.actions
export default authSlice.reducer
