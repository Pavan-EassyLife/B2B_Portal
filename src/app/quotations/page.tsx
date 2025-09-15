'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import QuotationsTable from '@/components/QuotationsTable'

const QuotationsPage = () => {
  const router = useRouter()

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
          </div>
          
          <QuotationsTable />
        </div>
      </div>
    </AuthGuard>
  )
}

export default QuotationsPage
