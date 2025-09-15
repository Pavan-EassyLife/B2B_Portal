'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import AuthGuard from '@/components/AuthGuard'
import { FormGroup } from '@/components/FormComponents'
import QuotationsTable from '@/components/QuotationsTable'

const QuotationPage = () => {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-black">Create Quotation</h1>
            <button
              onClick={() => router.push('/quotations')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              View All Quotations
            </button>
          </div>

          {/* Quotation creation form would go here */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-600">Quotation creation form will be implemented here.</p>
            </div>
          </div>

          {/* Existing quotations table */}
          <QuotationsTable />
        </div>
      </div>
    </AuthGuard>
  )
}

export default QuotationPage
