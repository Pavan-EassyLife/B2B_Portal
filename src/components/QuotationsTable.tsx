'use client'

import React, { useState, useEffect } from 'react'
import { getQuotations, B2BQuotationItem, quotationAction } from '@/api/quotations'
import Modal, { ModalBody, ModalFooter, ModalButton } from '@/components/Modal'
import { Textarea } from '@/components/FormComponents'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface QuotationsTableProps {
  className?: string
}

const QuotationsTable: React.FC<QuotationsTableProps> = ({ className = '' }) => {
  const [quotations, setQuotations] = useState<B2BQuotationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedQuotation, setExpandedQuotation] = useState<string | null>(null)
  const router = useRouter()

  // Modal states
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<{
    quotationId: string;
    quotationNumber: string;
    action: 'approve' | 'reject';
  } | null>(null)
  const [remarks, setRemarks] = useState('')

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
      } catch (err: any) {
        console.error('Error fetching quotations:', err)

        // Extract error message from API response
        let errorMessage = 'Error loading quotations'

        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        } else if (err?.response?.status === 500) {
          errorMessage = 'Internal server error. Please try again later.'
        } else if (err?.response?.status === 401) {
          errorMessage = 'You are not authorized to view quotations.'
        } else if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view quotations.'
        }

        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
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

  const openActionModal = (quotationId: string, quotationNumber: string, action: 'approve' | 'reject') => {
    setCurrentAction({ quotationId, quotationNumber, action })
    setRemarks('')
    setIsActionModalOpen(true)
  }

  const closeActionModal = () => {
    setIsActionModalOpen(false)
    setCurrentAction(null)
    setRemarks('')
  }

  const handleActionSubmit = async () => {
    if (!currentAction) return

    // Validation: remarks mandatory for reject, optional for approve
    if (currentAction.action === 'reject' && !remarks.trim()) {
      toast.error('Remarks are mandatory when rejecting a quotation')
      return
    }

    try {
      setActionLoading(currentAction.quotationId)
      toast.loading(`${currentAction.action === 'approve' ? 'Approving' : 'Rejecting'} quotation...`, {
        id: 'quotation-action'
      })

      const response = await quotationAction(currentAction.quotationId, {
        action: currentAction.action,
        remarks: remarks.trim() || undefined
      })

      if (response.success) {
        toast.success(
          `Quotation ${currentAction.action === 'approve' ? 'approved' : 'rejected'} successfully!`,
          { id: 'quotation-action' }
        )

        // Refresh quotations data
        const updatedQuotations = await getQuotations()
        if (updatedQuotations.success) {
          setQuotations(updatedQuotations.data)
        }

        closeActionModal()
      } else {
        toast.error(`Failed to ${currentAction.action} quotation: ${response.message}`, {
          id: 'quotation-action'
        })
      }
    } catch (error: any) {
      console.error(`Error ${currentAction.action}ing quotation:`, error)

      // Extract error message from API response
      let errorMessage = `Failed to ${currentAction.action} quotation. Please try again.`

      if (error?.response?.data?.message) {
        // API returned a specific error message
        errorMessage = error.response.data.message
      } else if (error?.message) {
        // Network or other error with message
        errorMessage = error.message
      } else if (error?.response?.status === 500) {
        // Internal server error
        errorMessage = 'Internal server error. Please try again later.'
      } else if (error?.response?.status === 400) {
        // Bad request
        errorMessage = 'Invalid request. Please check your input and try again.'
      } else if (error?.response?.status === 401) {
        // Unauthorized
        errorMessage = 'You are not authorized to perform this action.'
      } else if (error?.response?.status === 403) {
        // Forbidden
        errorMessage = 'You do not have permission to perform this action.'
      } else if (error?.response?.status === 404) {
        // Not found
        errorMessage = 'Quotation not found.'
      }

      toast.error(errorMessage, {
        id: 'quotation-action'
      })
    } finally {
      setActionLoading(null)
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

  const toggleExpanded = (quotationId: string) => {
    setExpandedQuotation(expandedQuotation === quotationId ? null : quotationId)
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className='flex justify-between items-center mb-4'>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Quotations ({quotations.length})
        </h3>
           <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
</div>
        {quotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No quotations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quotation) => (
              <div key={quotation.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Main Quotation Card */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {quotation.quotation_number}
                      </h4>
                      {getStatusBadge(quotation.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleExpanded(quotation.id)}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <svg
                          className={`w-5 h-5 transform transition-transform ${expandedQuotation === quotation.id ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Booking Info */}
                    {quotation.booking && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Order Number:</p>
                        <p className="text-sm text-gray-900">{quotation.booking.order_number}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700">Service Name:</p>
                      <p className="text-sm text-gray-900">
                        {quotation.booking?.service_name || quotation.service_name || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Amount:</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(quotation.total_amount)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Final Amount:</p>
                      <p className="text-sm text-gray-900">{formatCurrency(quotation.final_amount)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">GST Amount:</p>
                      <p className="text-sm text-gray-900">{formatCurrency(quotation.gst_amount)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Valid Until:</p>
                      <p className="text-sm text-gray-900">{formatDate(quotation.valid_until)}</p>
                    </div>
                  </div>

                  {/* Service Description */}
                  {(quotation.service_description || quotation.booking?.service_description) && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Service Description:</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {quotation.service_description || quotation.booking?.service_description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {quotation.status === 'sent' && (
                        <>
                          <button
                            onClick={() => openActionModal(quotation.id, quotation.quotation_number, 'approve')}
                            disabled={actionLoading === quotation.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            {actionLoading === quotation.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openActionModal(quotation.id, quotation.quotation_number, 'reject')}
                            disabled={actionLoading === quotation.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            {actionLoading === quotation.id ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {quotation.status === 'draft' && (
                        <span className="text-yellow-600 text-sm font-medium px-3 py-1 bg-yellow-50 rounded-md">
                          📝 Pending
                        </span>
                      )}
                      {quotation.status === 'approved' && (
                        <span className="text-green-600 text-sm font-medium px-3 py-1 bg-green-50 rounded-md">
                          ✓ Approved
                        </span>
                      )}
                      {quotation.status === 'rejected' && (
                        <span className="text-red-600 text-sm font-medium px-3 py-1 bg-red-50 rounded-md">
                          ✗ Rejected
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Created: {formatDate(quotation.created_at)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedQuotation === quotation.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="space-y-6">
                      {/* Quotation Items */}
                      {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Quotation Items</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {quotation.quotation_items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.service}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.description || 'N/A'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.rate.toString())}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.amount.toString())}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Terms and Conditions */}
                      {quotation.terms_and_conditions && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Terms & Conditions</h5>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {quotation.terms_and_conditions}
                          </p>
                        </div>
                      )}

                      {/* Additional Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Initial Amount:</span>
                              <span className="text-gray-900">{formatCurrency(quotation.initial_amount)}</span>
                            </div>
                            {quotation.negotiated_amount && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Negotiated Amount:</span>
                                <span className="text-gray-900">{formatCurrency(quotation.negotiated_amount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Validity Days:</span>
                              <span className="text-gray-900">{quotation.validity_days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Version:</span>
                              <span className="text-gray-900">v{quotation.version}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Status Information</h5>
                          <div className="space-y-2 text-sm">
                            {quotation.sent_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Sent At:</span>
                                <span className="text-gray-900">{formatDate(quotation.sent_at)}</span>
                              </div>
                            )}
                            {quotation.sent_via && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Sent Via:</span>
                                <span className="text-gray-900 capitalize">{quotation.sent_via}</span>
                              </div>
                            )}
                            {quotation.approved_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Approved At:</span>
                                <span className="text-gray-900">{formatDate(quotation.approved_at)}</span>
                              </div>
                            )}
                            {quotation.responded_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Responded At:</span>
                                <span className="text-gray-900">{formatDate(quotation.responded_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {(quotation.sp_notes || quotation.admin_notes || quotation.client_notes || quotation.rejection_reason) && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                          <div className="space-y-2">
                            {quotation.sp_notes && (
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs font-medium text-gray-600 mb-1">Service Provider Notes:</p>
                                <p className="text-sm text-gray-900">{quotation.sp_notes}</p>
                              </div>
                            )}
                            {quotation.admin_notes && (
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs font-medium text-gray-600 mb-1">Admin Notes:</p>
                                <p className="text-sm text-gray-900">{quotation.admin_notes}</p>
                              </div>
                            )}
                            {quotation.client_notes && (
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs font-medium text-gray-600 mb-1">Client Notes:</p>
                                <p className="text-sm text-gray-900">{quotation.client_notes}</p>
                              </div>
                            )}
                            {quotation.rejection_reason && (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason:</p>
                                <p className="text-sm text-red-900">{quotation.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title={`${currentAction?.action === 'approve' ? 'Approve' : 'Reject'} Quotation`}
        size="md"
      >
        <ModalBody>
          {currentAction && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Quotation Details</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Quotation Number:</span> {currentAction.quotationNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Action:</span>
                  <span className={`ml-1 capitalize ${
                    currentAction.action === 'approve' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentAction.action}
                  </span>
                </p>
              </div>

              <div>
                <Textarea
                  label={`Remarks ${currentAction.action === 'reject' ? '(Required)' : '(Optional)'}`}
                  value={remarks}
                  onChange={(value) => setRemarks(value)}
                  placeholder={
                    currentAction.action === 'approve'
                      ? 'Add any approval notes (optional)...'
                      : 'Please provide reason for rejection (required)...'
                  }
                  rows={4}
                  required={currentAction.action === 'reject'}
                  className="w-full"
                />

                {currentAction.action === 'reject' && (
                  <p className="text-xs text-red-600 mt-1">
                    * Remarks are mandatory when rejecting a quotation
                  </p>
                )}
              </div>

              {currentAction.action === 'approve' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ This quotation will be approved and the customer will be notified.
                  </p>
                </div>
              )}

              {currentAction.action === 'reject' && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    ✗ This quotation will be rejected and the customer will be notified with your remarks.
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <ModalButton
            variant="secondary"
            onClick={closeActionModal}
            disabled={actionLoading !== null}
          >
            Cancel
          </ModalButton>
          <ModalButton
            variant={currentAction?.action === 'approve' ? 'primary' : 'danger'}
            onClick={handleActionSubmit}
            disabled={
              actionLoading !== null ||
              (currentAction?.action === 'reject' && !remarks.trim())
            }
          >
            {actionLoading !== null ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              `${currentAction?.action === 'approve' ? 'Approve' : 'Reject'} Quotation`
            )}
          </ModalButton>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default QuotationsTable
