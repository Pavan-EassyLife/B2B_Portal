'use client'

import React, { useState, useEffect } from 'react'
import { getQuotations, QuotationData, B2BQuotationItem, approveQuotation, rejectQuotation } from '@/api/quotations'

interface QuotationsTableProps {
  className?: string
}

const QuotationsTable: React.FC<QuotationsTableProps> = ({ className = '' }) => {
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true)
        const response = await getQuotations()
        if (response.success) {
          setQuotations(response.data)
        } else {
          setError('Failed to fetch quotations')
        }
      } catch (err) {
        setError('Error loading quotations')
        console.error('Error fetching quotations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toFixed(2)}`
  }

  const handleApprove = async (quotationId: string, quotationNumber: string) => {
    if (window.confirm(`Are you sure you want to approve quotation ${quotationNumber}?`)) {
      try {
        setActionLoading(quotationId)
        const response = await approveQuotation(quotationId)

        if (response.success) {
          alert('Quotation approved successfully!')
          // Refresh quotations data
          const updatedQuotations = await getQuotations()
          if (updatedQuotations.success) {
            setQuotations(updatedQuotations.data)
          }
        } else {
          alert(`Failed to approve quotation: ${response.message}`)
        }
      } catch (error) {
        console.error('Error approving quotation:', error)
        alert('Failed to approve quotation. Please try again.')
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleReject = async (quotationId: string, quotationNumber: string) => {
    if (window.confirm(`Are you sure you want to reject quotation ${quotationNumber}?`)) {
      try {
        setActionLoading(quotationId)
        const response = await rejectQuotation(quotationId)

        if (response.success) {
          alert('Quotation rejected successfully!')
          // Refresh quotations data
          const updatedQuotations = await getQuotations()
          if (updatedQuotations.success) {
            setQuotations(updatedQuotations.data)
          }
        } else {
          alert(`Failed to reject quotation: ${response.message}`)
        }
      } catch (error) {
        console.error('Error rejecting quotation:', error)
        alert('Failed to reject quotation. Please try again.')
      } finally {
        setActionLoading(null)
      }
    }
  }

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Flatten quotations data for table display
  const flattenedQuotations = quotations.flatMap(quotationData => 
    quotationData.B2BQuotation.map(quotation => ({
      ...quotation,
      customerId: quotationData.id
    }))
  )

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Quotations ({flattenedQuotations.length})
        </h3>
        
        {flattenedQuotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No quotations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flattenedQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quotation.quotation_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(quotation.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(quotation.final_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(quotation.gst_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {quotation.status === 'sent' && (
                          <>
                            <button
                              onClick={() => handleApprove(quotation.id, quotation.quotation_number)}
                              disabled={actionLoading === quotation.id}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              {actionLoading === quotation.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(quotation.id, quotation.quotation_number)}
                              disabled={actionLoading === quotation.id}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              {actionLoading === quotation.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {quotation.status === 'approved' && (
                          <span className="text-green-600 text-xs font-medium">✓ Approved</span>
                        )}
                        {quotation.status === 'rejected' && (
                          <span className="text-red-600 text-xs font-medium">✗ Rejected</span>
                        )}
                        {quotation.status !== 'sent' && quotation.status !== 'approved' && quotation.status !== 'rejected' && (
                          <span className="text-gray-500 text-xs">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuotationsTable
