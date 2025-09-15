'use client'

import { useAppSelector } from '@/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return 

    if (isAuthenticated) {
      router.push('/dashboard') 
    } else {
      router.push('/login') // Not authenticated, go to login
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
