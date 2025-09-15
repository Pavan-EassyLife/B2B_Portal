'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import AuthGuard from '@/components/AuthGuard'
import { getOrders, B2BOrder } from '@/api/categories'

const OrdersPage = () => {
  const router = useRouter()
  const [orders, setOrders] = useState<B2BOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await getOrders()
        if (response.success) {
          setOrders(response.data)
        } else {
          setError('Failed to fetch orders')
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Error fetching orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
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
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-black">Orders</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <p className="text-gray-500">No orders found.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {order.service_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Order: {order.order_number}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <>sada</>{order.b2b_approvals && getStatusBadge(order.b2b_approvals.status)}
                          {getStatusBadge(order.status)}
                          {getStatusBadge(order.b2b_status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Service Details</p>
                          <p className="text-sm text-gray-600">{order.service_description}</p>
                          <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                          <p className="text-sm text-gray-600">Total: ₹{order.total_amount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Schedule</p>
                          <p className="text-sm text-gray-600">{order.service_date}</p>
                          <p className="text-sm text-gray-600">{order.service_time}</p>
                          <p className="text-sm text-gray-600 mt-1">{order.service_address}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Payment & Invoice</p>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Payment:</span>
                              {getStatusBadge(order.payment_status)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Invoice:</span>
                              {getStatusBadge(order.invoice_status)}
                            </div>
                            <p className="text-sm text-gray-600">Method: {order.payment_method}</p>
                          </div>
                        </div>
                      </div>

                      {/* B2B Approval Section */}
                      {order.b2b_approvals && (
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Approval Status</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-gray-700">Status:</span>
                                  {getStatusBadge(order.b2b_approvals.status)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Step: {order.b2b_approvals.step_number}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Escalation Level: {order.b2b_approvals.escalation_level}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Due Date:</span><br />
                                  {formatDateTime(order.b2b_approvals.due_at)}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Created:</span><br />
                                  {formatDateTime(order.b2b_approvals.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Action Details */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Acted By:</span><br />
                                    {order.b2b_approvals.acted_by_user_id ? 
                                      `User ID: ${order.b2b_approvals.acted_by_user_id}` : 
                                      <span className="text-yellow-600">Pending Action</span>
                                    }
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Acted At:</span><br />
                                    {order.b2b_approvals.acted_at ? 
                                      formatDateTime(order.b2b_approvals.acted_at) : 
                                      <span className="text-yellow-600">Not yet acted</span>
                                    }
                                  </p>
                                </div>
                              </div>
                              
                              {/* Remarks */}
                              {order.b2b_approvals.remarks && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700">Remarks:</p>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border mt-1">
                                    {order.b2b_approvals.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600 mt-1">{order.notes}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Created: {formatDate(order.created_at)}</span>
                          <span>Updated: {formatDate(order.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

export default OrdersPage
