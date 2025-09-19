'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { logoutUser } from '@/store/authSlice'
import toast from 'react-hot-toast'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const {user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

    const handleSignOut = async () => {
      try {
        toast.loading('Signing out...', { id: 'logout' })
        await dispatch(logoutUser())
        toast.success('Signed out successfully', { id: 'logout' })
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
        toast.error('Error signing out, but redirecting anyway', { id: 'logout' })
        // Force redirect even if logout fails
        router.push('/login')
      }
    }
    
    // const handleSignOut = async () => {
    //   try {
    //     await dispatch(logoutUser())
    //     localStorage.removeItem('b2b_token')
    //     localStorage.removeItem('b2b_user')
    //     router.push('/login')
    //   } catch (error) {
    //     console.error('Logout error:', error)
    //     // Force redirect even if logout fails
    //     router.push('/login')
    //   }
    // }

  // Render children if authenticated
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center space-x-4">
                {/* EassyLife Logo */}
                <div className="flex-shrink-0">
                  <img
                    className="h-12 w-auto"
                    src="/eassylife_logo.png"
                    alt="EassyLife Logo"
                  />
                </div>
                {/* Brand and Portal Name */}
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-gray-900">EassyLife</h1>
                  <p className="text-sm text-gray-600 font-medium">B2B Portal Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user?.contact_person?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-gray-700">
                    <div className="font-semibold text-sm">
                      Welcome, {user?.contact_person || user?.name}
                    </div>
                    {user?.company_name && (
                      <div className="text-xs text-gray-500 font-medium">
                        {user.company_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </div>
    </>
  )
}
