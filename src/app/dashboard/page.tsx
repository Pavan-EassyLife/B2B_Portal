
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { logoutUser } from '@/store/authSlice'
import AuthGuard from '@/components/AuthGuard'
import Modal, { ModalBody, ModalFooter, ModalButton } from '@/components/Modal'
import { Dropdown, Textarea, FormGroup, Input, Checkbox } from '@/components/FormComponents'
import { ApiResponse, getAddress, getCategories, slotTiming, addAddress, AddAddressRequest, getApprovalFlow, handleApprovalAction, ApprovalFlowItem } from '@/api/categories'
import GoogleMapPicker from '@/components/GoogleMapPicker'

// Import types from the API file to ensure consistency
import type { ServiceCategory, Subcategory, Attribute, Option, ServiceSegment, Address, SlotTimingData } from '@/api/categories'
import { providerCards, ProviderCard } from '@/api/provider'
import { createOrder, getLocationDetails, LocationDetailsResponse } from '@/api/booking'



export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const router = useRouter()

  // Modal state
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [slotTimingData, setSlotTimingData] = useState<SlotTimingData | null>(null)
  const [locationDetailsData, setLocationDetailsData] = useState<LocationDetailsResponse | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: string; lng: string } | null>(null)
  const [providerCardsData, setProviderCardsData] = useState<ProviderCard[]>([])
  const [approvalFlowData, setApprovalFlowData] = useState<ApprovalFlowItem[]>([])

  // Form state
  const [orderForm, setOrderForm] = useState({
    categoryId: '',
    subcategoryId: '',
    description: '',
    filterAttributeId: '',
    address: '',
    addressId: '',
    preferredDate: '',
    preferredTime: '',
    priority: 'normal',
    filterOption: '',
    segmentOption: '',
    service_address: '',
    locationZone: '',
    cityZone: ''
  })

  // Add Address form state
  const [addressForm, setAddressForm] = useState<AddAddressRequest>({
    addressType: 'store',
    storeName: '',
    storeCode: '',
    contactPerson: '',
    contactPhone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    isPrimary: false,
    isActive: true,
    b2b_customer_id: user?.id || ''
  })
  

  // Helper function to generate available dates
  const getAvailableDates = () => {
    if (!slotTimingData) return []

    const dates = []
    const startDate = new Date(slotTimingData.timeSlotStartYear, slotTimingData.timeSlotStartMonth - 1, slotTimingData.timeSlotStartDate)
    const endDate = new Date(slotTimingData.timeSlotEndDateString.split('-').reverse().join('-'))

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]
      const displayDate = currentDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })

      dates.push({
        value: dateString,
        label: displayDate
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Helper function to generate available time slots
  const getAvailableTimeSlots = () => {
    if (!slotTimingData) return []

    const slots = []
    const startHour = slotTimingData.nextslotstart
    const endHour = slotTimingData.nextslotend

    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      slots.push({
        value: timeString,
        label: displayTime
      })
    }

    return slots
  }

  useEffect(() => {
    if (isLoading) return // Still loading
    if (!isAuthenticated) router.push('/login') // Not authenticated

    // Load approval flow data when authenticated
    if (isAuthenticated) {
      loadApprovalFlow()
    }
  }, [isAuthenticated, isLoading, router])

  // Handle form submission
  const handleCreateOrder = async () => {
    console.log('Creating order:', orderForm)
    const response = await createOrder(orderForm)
    if(!response.success) {
      return alert('Failed to create order: ' + response.message)
    }

    setIsCreateOrderModalOpen(false)
    // Reset form
    setOrderForm({
      categoryId: '',
      subcategoryId: '',
      description: '',
      filterAttributeId: '',
      address: '',
      addressId: '',
      preferredDate: '',
      preferredTime: '',
      priority: '',
      filterOption: '',
      segmentOption: '',
      service_address: '',
      locationZone: '',
      cityZone: ''
    })
  }

  // Handle Add Address form submission
  const handleAddAddress = async () => {
    try {
      console.log('Adding address:', addressForm)
      const response = await addAddress(addressForm)

      if (response.status) {
        alert('Address added successfully!')
        setIsAddAddressModalOpen(false)

        // Reset form
        setAddressForm({
          addressType: 'store',
          storeName: '',
          storeCode: '',
          contactPerson: '',
          contactPhone: '',
          addressLine1: '',
          addressLine2: '',
          landmark: '',
          city: '',
          state: '',
          pincode: '',
          latitude: '',
          longitude: '',
          isPrimary: false,
          isActive: true,
          b2b_customer_id: user?.id || ''
        })

        // Refresh addresses list
        const addressResponse = await getAddress()
        console.log('Address Response:', addressResponse)
        if (addressResponse.status) {
          setAddresses(addressResponse.data)
        }
      } else {
        alert('Failed to add address: ' + response.message)
      }
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Error adding address. Please try again.')
    }
  }

  // Handle location selection from Google Maps
  const handleLocationSelect = (lat: string, lng: string, addressDetails?: any) => {
    setAddressForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      // Auto-fill address details if available
      ...(addressDetails?.addressLine1 && { addressLine1: addressDetails.addressLine1 }),
      ...(addressDetails?.addressLine2 && { addressLine2: addressDetails.addressLine2 }),
      ...(addressDetails?.landmark && { landmark: addressDetails.landmark }),
      ...(addressDetails?.city && { city: addressDetails.city }),
      ...(addressDetails?.state && { state: addressDetails.state }),
      ...(addressDetails?.pincode && { pincode: addressDetails.pincode })
    }))
  }

  // Handle approval actions
  const handleApprovalActionClick = async (approvalId: number, action: 'approve' | 'reject', remarks?: string) => {
    try {
      const response = await handleApprovalAction({
        approvalId,
        action,
        remarks
      })

      if (response.success) {
        alert(`Successfully ${action}d the request!`)
        // Refresh approval flow data
        loadApprovalFlow()
      } else {
        alert(`Failed to ${action} the request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Error ${action}ing request. Please try again.`)
    }
  }

  // Load approval flow data
  const loadApprovalFlow = async () => {
    try {
      const response = await getApprovalFlow()
      if (response.success) {
        setApprovalFlowData(response.data)
      }
    } catch (error) {
      console.error('Error loading approval flow:', error)
    }
  }

  // Test getCurrentUser API
  const testGetCurrentUser = async () => {
    try {
      const { getCurrentUserToken } = await import('@/api/categories')
      const response = await getCurrentUserToken()
      console.log('Current User Response:', response)
      alert('Check console for current user data')
    } catch (error) {
      console.error('Error fetching current user:', error)
      alert('Error fetching current user. Check console.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  const handleSelectTimeSlot = (value: string) => {
    setOrderForm(prev => ({ ...prev, preferredTime: value }))
    const fetchProviderCards = async () => {
      try {
        const response = await providerCards({
          categoryId: orderForm.categoryId,
          subcategoryId: orderForm.subcategoryId,
          filterAttributeId: [{attribute_id: orderForm.filterAttributeId,option_id: orderForm.filterOption}],
          segmentOption: orderForm.segmentOption,
        });
        console.log('Provider Cards Response:', response)
        setProviderCardsData(response.data)

      } catch (error) {
        console.error('Error fetching provider cards:', error);
      }
    }
    fetchProviderCards()
  }

  const handleCreateOrderModalOpen = async () => {
    setIsCreateOrderModalOpen(true)
    try {
      const response = await getCategories();
      const addressResponse = await getAddress();
      const slotTimingResponse = await slotTiming();
      const locationDetailsResponse = await getLocationDetails("");
      console.log('Address Response:', addressResponse)
      console.log('Slot Timing Response:', slotTimingResponse)

      if (response.success) {
        setCategories(response.data);
      }

      if (addressResponse.status) {
        setAddresses(addressResponse.data);
      }

      if (slotTimingResponse.status) {
        setSlotTimingData(slotTimingResponse.data);
      }

      if (locationDetailsResponse.success) {
        setLocationDetailsData(locationDetailsResponse);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }



  const handleChangeCityZone = async (value: string) => {
    setOrderForm(prev => ({ ...prev, locationZone: value }))
    try {
      const locationDetailsResponse = await getLocationDetails(value);
      if (locationDetailsResponse.success) {
        setLocationDetailsData(locationDetailsResponse);
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  }

 

  return (
    <AuthGuard>
      

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">₹</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Wallet Balance</dt>
                      <dd className="text-lg font-medium text-gray-900">₹{user?.wallet || '0.00'}</dd>
                    </dl>
                  </div>
                  
                </div>
              </div>
            </div> */}

            <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={
              () => {
                router.push('/quotations')
              }
            }
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">View Quotations</dt>
                      <dd className="text-lg font-medium text-gray-900">All Quotations</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${user?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold">★</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Account Status</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user?.status === 'active' ? 'Active' : 'Inactive'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

               <div
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleCreateOrderModalOpen}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">+</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Order Creation</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Create Order
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

               <div
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setIsAddAddressModalOpen(true)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">+</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Add Address</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Address
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push('/orders')}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">View Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Orders
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Pending Approvals Section */}
          {approvalFlowData.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Pending Approvals ({approvalFlowData.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={loadApprovalFlow}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={testGetCurrentUser}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Test User API
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {approvalFlowData.map((approval) => (
                    <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {approval.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Step {approval.step_number}
                            </span>
                          </div>

                          {approval.B2BBooking.map((booking) => (
                            <div key={booking.id} className="mb-3">
                              <h4 className="text-sm font-medium text-gray-900">
                                {booking.service_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Order: {booking.order_number}
                              </p>
                            </div>
                          ))}

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Due Date:</span>
                              <br />
                              {new Date(approval.due_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>
                              <br />
                              {new Date(approval.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleApprovalActionClick(approval.id, 'approve')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalActionClick(approval.id, 'reject')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <p className="mt-1 text-sm text-gray-900">+{user?.country_code} {user?.mobile}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VIP Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{user?.vip_subscription_status}</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </main>

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        title="Create New Order"
        size="lg"
      >
        <ModalBody>
          <FormGroup>
            <div className='flex flex-col gap-4 md:flex-row md:gap-6'>
              <div className='flex-1'>
                <Dropdown
                  label="Category"
                  value={orderForm.categoryId}
                  onChange={(value) => {
                    setOrderForm(prev => ({
                      ...prev,
                      categoryId: value,
                      subcategoryId: '', // Reset subcategory when category changes
                      segmentOption: '' // Reset segment when category changes
                    }))
                  }}
                  options={
                    categories.map(category => ({
                      value: category.id,
                      label: category.name
                    }))
                  }
                  required
                />
              </div>

              <div className='flex-1'>
                <Dropdown
                  label="Subcategory"
                  value={orderForm.subcategoryId}
                  onChange={(value) => setOrderForm(prev => ({ ...prev, subcategoryId: value, filterAttributeId: '', segmentOption: '' }))}
                  options={
                    orderForm.categoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.subcategories?.map(subcat => ({
                            value: subcat.id,
                            label: subcat.name
                          })) || []
                      : []
                  }
                  disabled={!orderForm.categoryId}
                  required
                />
              </div>
            </div>

                       <div className='flex flex-col gap-4 md:flex-row md:gap-6'>
              <div className='flex-1'>
                  <Dropdown
                  label="Filter Attribute"
                  value={orderForm.filterAttributeId}
                  onChange={(value) => {
                    setOrderForm(prev => ({
                      ...prev,
                      filterAttributeId: value,
                    }))
                  }}
                  options={
                   orderForm.categoryId && orderForm.subcategoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.attributes?.filter(attr =>
                            attr.subcategory_id === orderForm.subcategoryId || attr.subcategory_id === null
                          )?.map(attr => ({
                            value: attr.id,
                            label: attr.name
                          })) || []
                      : orderForm.categoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.attributes?.filter(attr => attr.subcategory_id === null)?.map(attr => ({
                            value: attr.id,
                            label: attr.name
                          })) || []
                      : []
                  }
                  disabled={!orderForm.categoryId}
                  required
                />
              </div>

              <div className='flex-1'>
                <Dropdown
                  label="Filter Option"
                  value={orderForm.filterOption}
                  onChange={(value) => setOrderForm(prev => ({ ...prev, filterOption: value, }))}
                  options={
                   orderForm.categoryId && orderForm.subcategoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.attributes?.filter(attr =>
                            attr.subcategory_id === orderForm.subcategoryId || attr.subcategory_id === null
                          )?.filter(attr => attr.id === orderForm.filterAttributeId)?.flatMap(attr => attr.options.map(option => ({
                            value: option.id?.toString() || option.value.toString(),
                            label: option.value.toString()
                          }))) || []
                      : orderForm.categoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.attributes?.filter(attr => attr.subcategory_id === null)?.map(attr => ({
                            value: attr.id.toString(),
                            label: attr.name
                          })) || []
                      : []
                  }
                  disabled={!orderForm.categoryId}
                  required
                />
              </div>
            </div>

            {
              orderForm.categoryId && orderForm.subcategoryId &&
              (categories
                .find(cat => cat.id === orderForm.categoryId)
                ?.serviceSegments?.filter(segment =>
                  segment.category_id === orderForm.categoryId &&
                  segment.subcategory_id === orderForm.subcategoryId
                )?.length ?? 0) > 0 && (
                   <div className='flex-1'>
                <Dropdown
                  label="Segment Option"
                  value={orderForm.segmentOption}
                  onChange={(value) => setOrderForm(prev => ({ ...prev, segmentOption: value, }))}
                  options={
                    categories
                      .find(cat => cat.id === orderForm.categoryId)
                      ?.serviceSegments?.filter(segment =>
                        segment.category_id === orderForm.categoryId &&
                        segment.subcategory_id === orderForm.subcategoryId
                      )?.map(segment => ({
                        value: segment.id,
                        label: segment.segment_name
                      })) || []
                  }
                  disabled={!orderForm.categoryId || !orderForm.subcategoryId}
                  required
                />
              </div>
              )
            }


            

            {/* Address Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Address <span className="text-red-500">*</span>
              </label>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  <Dropdown
                    label=""
                    options={addresses.map(addr => ({
                      value: addr.id,
                      label: `${addr.store_name} - ${addr.address_line_1}, ${addr.city}`
                    }))}
                    value={orderForm.addressId}
                    onChange={(value) => {
                      const selectedAddress = addresses.find(addr => addr.id === value);
                      setOrderForm(prev => ({
                        ...prev,
                        addressId: value,
                        address: selectedAddress ?
                          `${selectedAddress.store_name}, ${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? ', ' + selectedAddress.address_line_2 : ''}, ${selectedAddress.landmark ? selectedAddress.landmark + ', ' : ''}${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
                          : ''
                      }))
                    }}
                    placeholder="Select an address"
                    required
                  />

                  {/* Display selected address details */}
                  {orderForm.addressId && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      {(() => {
                        const selectedAddr = addresses.find(addr => addr.id === orderForm.addressId);
                        if (!selectedAddr) return null;

                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-900">{selectedAddr.store_name}</h4>
                                <p className="text-sm text-gray-600 capitalize">{selectedAddr.address_type}</p>
                              </div>
                              {selectedAddr.is_primary && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Address:</p>
                                <p className="text-gray-900">
                                  {selectedAddr.address_line_1}
                                  {selectedAddr.address_line_2 && <><br />{selectedAddr.address_line_2}</>}
                                  {selectedAddr.landmark && <><br />Near: {selectedAddr.landmark}</>}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-600">Location:</p>
                                <p className="text-gray-900">
                                  {selectedAddr.city}, {selectedAddr.state}<br />
                                  PIN: {selectedAddr.pincode}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-600">Contact Person:</p>
                                <p className="text-gray-900">{selectedAddr.contact_person}</p>
                              </div>

                              <div>
                                <p className="text-gray-600">Contact Phone:</p>
                                <p className="text-gray-900">{selectedAddr.contact_phone}</p>
                              </div>

                              {selectedAddr.store_code && (
                                <div>
                                  <p className="text-gray-600">Store Code:</p>
                                  <p className="text-gray-900">{selectedAddr.store_code}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No addresses found. Please add an address first.</p>
                </div>
              )}
            </div>

            {/* Date and Time Selection based on Slot Timing */}
            <div className="space-y-4">
              {slotTimingData ? (
                <>
                  {/* Slot Timing Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Service Availability</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">
                          <span className="font-medium">Current Day Available:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            slotTimingData.currentDayAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {slotTimingData.currentDayAvailable ? 'Yes' : 'No'}
                          </span>
                        </p>
                        <p className="text-blue-700">
                          <span className="font-medium">Service Hours:</span>
                          {slotTimingData.nextslotstart}:00 - {slotTimingData.nextslotend}:00
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">
                          <span className="font-medium">Available From:</span>
                          {slotTimingData.timeSlotStartDate}/{slotTimingData.timeSlotStartMonth}/{slotTimingData.timeSlotStartYear}
                        </p>
                        <p className="text-blue-700">
                          <span className="font-medium">Available Until:</span>
                          {slotTimingData.timeSlotEndDateString}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                      label="Preferred Date"
                      options={getAvailableDates()}
                      value={orderForm.preferredDate}
                      onChange={(value) => setOrderForm(prev => ({ ...prev, preferredDate: value }))}
                      placeholder="Select a date"
                      required
                    />

                    <Dropdown
                      label="Preferred Time"
                      options={getAvailableTimeSlots()}
                      value={orderForm.preferredTime}
                      onChange={handleSelectTimeSlot}
                      placeholder="Select a time slot"
                      required
                    />
                  </div>



                  {/* Selected Date/Time Display */}
                  {orderForm.preferredDate && orderForm.preferredTime && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-green-800">
                        <span className="font-medium">Selected Appointment:</span>
                        {new Date(orderForm.preferredDate).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })} at {new Date(`2000-01-01T${orderForm.preferredTime}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-600 text-center">Loading available time slots...</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dropdown
              label="Location Zone"
              value={orderForm.locationZone}
              onChange={(value) => handleChangeCityZone(value)}
              options={
                locationDetailsData?.data?.map((card) => ({
                  value: card.id,
                  label: card.name
                })) || []
              }
            />

            <Dropdown
              label="City Zone"
              value={orderForm.cityZone}
              onChange={(value) => setOrderForm(prev => ({ ...prev, cityZone: value }))}
              options={
                locationDetailsData?.data?.map((card) => ({
                  value: card.id,
                  label: card.name
                })) || []
              }
            />

                   

                  </div>

            <Dropdown
              label="Priority"
              value={orderForm.priority}
              onChange={(value) => setOrderForm(prev => ({ ...prev, priority: value }))}
              options={
                providerCardsData.map((card) => ({
                value: card.provider.id,
                label: card.provider.first_name
                }))
              }
            />
             
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <ModalButton
            variant="secondary"
            onClick={() => setIsCreateOrderModalOpen(false)}
          >
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleCreateOrder}
            disabled={!orderForm.categoryId || !orderForm.subcategoryId  || !orderForm.address}
          >
            Create Order
          </ModalButton>
        </ModalFooter>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        title="Add New Address"
        size="lg"
      >
        <ModalBody>
          <FormGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dropdown
                label="Address Type"
                options={[
                  { value: 'store', label: 'Store' },
                  { value: 'branch', label: 'Branch' },
                  { value: 'warehouse', label: 'Warehouse' },
                  { value: 'office', label: 'Office' },
                  { value: 'service_location', label: 'Service Location' }
                ]}
                value={addressForm.addressType}
                onChange={(value) => setAddressForm(prev => ({
                  ...prev,
                  addressType: value as AddAddressRequest['addressType']
                }))}
                placeholder="Select address type"
                required
              />

              <Input
                label="Store Name"
                value={addressForm.storeName}
                onChange={(value) => setAddressForm(prev => ({ ...prev, storeName: value }))}
                placeholder="Enter store name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Store Code"
                value={addressForm.storeCode}
                onChange={(value) => setAddressForm(prev => ({ ...prev, storeCode: value }))}
                placeholder="Enter store code"
                required
              />

              <Input
                label="Contact Person"
                value={addressForm.contactPerson}
                onChange={(value) => setAddressForm(prev => ({ ...prev, contactPerson: value }))}
                placeholder="Enter contact person name"
                required
              />
            </div>

            <Input
              label="Contact Phone"
              type="tel"
              value={addressForm.contactPhone}
              onChange={(value) => setAddressForm(prev => ({ ...prev, contactPhone: value }))}
              placeholder="Enter contact phone number"
              required
            />

            <Input
              label="Address Line 1"
              value={addressForm.addressLine1}
              onChange={(value) => setAddressForm(prev => ({ ...prev, addressLine1: value }))}
              placeholder="Enter address line 1"
              required
            />

            <Input
              label="Address Line 2"
              value={addressForm.addressLine2 || ''}
              onChange={(value) => setAddressForm(prev => ({ ...prev, addressLine2: value }))}
              placeholder="Enter address line 2 (optional)"
            />

            <Input
              label="Landmark"
              value={addressForm.landmark || ''}
              onChange={(value) => setAddressForm(prev => ({ ...prev, landmark: value }))}
              placeholder="Enter nearby landmark (optional)"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={addressForm.city}
                onChange={(value) => setAddressForm(prev => ({ ...prev, city: value }))}
                placeholder="Enter city"
                required
              />

              <Input
                label="State"
                value={addressForm.state}
                onChange={(value) => setAddressForm(prev => ({ ...prev, state: value }))}
                placeholder="Enter state"
                required
              />

              <Input
                label="Pincode"
                value={addressForm.pincode}
                onChange={(value) => setAddressForm(prev => ({ ...prev, pincode: value }))}
                placeholder="Enter pincode"
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location on Map
                </label>
                <GoogleMapPicker
                  latitude={addressForm.latitude}
                  longitude={addressForm.longitude}
                  onLocationSelect={handleLocationSelect}
                  height="350px"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  value={addressForm.latitude || ''}
                  onChange={(value) => setAddressForm(prev => ({ ...prev, latitude: value }))}
                  placeholder="Enter latitude (optional)"
                />

                <Input
                  label="Longitude"
                  value={addressForm.longitude || ''}
                  onChange={(value) => setAddressForm(prev => ({ ...prev, longitude: value }))}
                  placeholder="Enter longitude (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Checkbox
                label="Set as Primary Address"
                checked={addressForm.isPrimary || false}
                onChange={(checked) => setAddressForm(prev => ({ ...prev, isPrimary: checked }))}
              />

              <Checkbox
                label="Active Address"
                checked={addressForm.isActive !== false}
                onChange={(checked) => setAddressForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <ModalButton
            variant="secondary"
            onClick={() => setIsAddAddressModalOpen(false)}
          >
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleAddAddress}
            disabled={!addressForm.storeName || !addressForm.contactPerson || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode}
          >
            Add Address
          </ModalButton>
        </ModalFooter>
      </Modal>

    </AuthGuard>
  )
}

