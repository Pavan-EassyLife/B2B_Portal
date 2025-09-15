'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { logoutUser } from '@/store/authSlice'

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
        await dispatch(logoutUser())
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
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
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">B2B Portal Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user?.image && (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-gray-700">
                    <div className="font-medium">
                      Welcome, {user?.contact_person || user?.name}
                    </div>
                    {user?.company_name && (
                      <div className="text-sm text-gray-500">
                        {user.company_name}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
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
