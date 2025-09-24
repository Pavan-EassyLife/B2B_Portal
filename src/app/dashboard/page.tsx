
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { logoutUser } from '@/store/authSlice'
import AuthGuard from '@/components/AuthGuard'
import Modal, { ModalBody, ModalFooter, ModalButton } from '@/components/Modal'
import { Dropdown, SearchableDropdown, Textarea, FormGroup, Input, Checkbox } from '@/components/FormComponents'
import { ApiResponse, getAddress, getCategories, slotTiming, addAddress, AddAddressRequest, getApprovalFlow, handleApprovalAction, ApprovalFlowItem } from '@/api/categories'
import GoogleMapPicker from '@/components/GoogleMapPicker'
import toast from 'react-hot-toast'

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
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [slotTimingData, setSlotTimingData] = useState<SlotTimingData | null>(null)
  const [locationDetailsData, setLocationDetailsData] = useState<LocationDetailsResponse | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: string; lng: string } | null>(null)
  const [providerCardsData, setProviderCardsData] = useState<ProviderCard[]>([])
  const [approvalFlowData, setApprovalFlowData] = useState<ApprovalFlowItem[]>([])
  const [currentApproval, setCurrentApproval] = useState<{id: string, action: 'approve' | 'reject'} | null>(null)
  const [approvalRemarks, setApprovalRemarks] = useState('')
  const [cities, setCities] = useState<LocationDetailsResponse | null>(null)

  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

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
    setIsCreatingOrder(true)

    try {
      console.log('Creating order:', orderForm)
      toast.loading('Creating order...', { id: 'creating-order' })

      const response = await createOrder(orderForm)

      if(!response.success) {
        toast.error('Failed to create order: ' + response.message, { id: 'creating-order' })
        return
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
      toast.success('Order created successfully!', { id: 'creating-order' })
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Error creating order', { id: 'creating-order' })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // Handle Add Address form submission
  const handleAddAddress = async () => {
    // Form validation
    if (!addressForm.addressLine1.trim()) {
      toast.error('Address Line 1 is required')
      return
    }
    if (!addressForm.city.trim()) {
      toast.error('City is required')
      return
    }
    if (!addressForm.state.trim()) {
      toast.error('State is required')
      return
    }
    if (!addressForm.pincode.trim()) {
      toast.error('Pincode is required')
      return
    }

    try {
      console.log('Adding address:', addressForm)
      toast.loading('Adding address...', { id: 'add-address' })
      const response = await addAddress(addressForm)

      if (response.status) {
        toast.success('Address added successfully!', { id: 'add-address' })
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
        toast.error('Failed to add address: ' + response.message, { id: 'add-address' })
      }
    } catch (error) {
      console.error('Error adding address:', error)
      toast.error('Error adding address. Please try again.', { id: 'add-address' })
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

  // Open approval modal with action
  const openApprovalModal = (approvalId: string, action: 'approve' | 'reject') => {
    setCurrentApproval({ id: approvalId, action })
    setApprovalRemarks('')
    setIsApprovalModalOpen(true)
  }

  // Handle approval actions with mandatory remarks
  const handleApprovalActionSubmit = async () => {
    if (!currentApproval) return

    // Validate remarks are provided
    if (!approvalRemarks.trim()) {
      toast.error('Remarks are mandatory for both approve and reject actions')
      return
    }

    try {
      toast.loading(`${currentApproval.action === 'approve' ? 'Approving' : 'Rejecting'} request...`, { id: `approval-${currentApproval.id}` })

      const response = await handleApprovalAction(currentApproval.id, {
        action: currentApproval.action,
        remarks: approvalRemarks.trim()
      })

      if (response.success) {
        toast.success(`Successfully ${currentApproval.action}d the request!`, { id: `approval-${currentApproval.id}` })
        setIsApprovalModalOpen(false)
        setCurrentApproval(null)
        setApprovalRemarks('')
        // Refresh approval flow data
        loadApprovalFlow()
      } else {
        toast.error(`Failed to ${currentApproval.action} the request`, { id: `approval-${currentApproval.id}` })
      }
    } catch (error) {
      console.error(`Error ${currentApproval.action}ing request:`, error)
      toast.error(`Error ${currentApproval.action}ing request. Please try again.`, { id: `approval-${currentApproval.id}` })
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
      console.log('Testing getCurrentUser API...')
      const { getCurrentUserToken } = await import('@/api/categories')
      const response = await getCurrentUserToken()
      console.log('Current User Response:', response)
      toast.success('✅ Success! Check console for current user data')
    } catch (error: any) {
      console.error('❌ Error fetching current user:', error)

      // Detailed error logging for CORS issues
      if (error.code === 'ERR_NETWORK') {
        console.error('🚨 Network Error - Likely CORS issue')
        toast.error('❌ CORS Error: Check console for details. Make sure backend CORS is configured properly.')
      } else if (error.message?.includes('CORS')) {
        console.error('🚨 CORS Error detected')
        toast.error('❌ CORS Error: Check console for details.')
      } else {
        toast.error(`❌ Error: ${error.message || 'Unknown error'}. Check console for details.`)
      }
    }
  }

  // Test basic API connectivity
  const testBasicAPI = async () => {
    try {
      console.log('Testing basic API connectivity...')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/'}health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('✅ Basic API connectivity successful')
        toast.success('✅ Basic API connectivity successful')
      } else {
        console.log('⚠️ API responded but with error status:', response.status)
        toast.error(`⚠️ API responded with status: ${response.status}`)
      }
    } catch (error: any) {
      console.error('❌ Basic API test failed:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('❌ CORS Error: Cannot connect to API. Check backend CORS configuration.')
      } else {
        toast.error(`❌ API Test Failed: ${error.message}`)
      }
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
    setIsLoadingCategories(true)

    try {
      toast.loading('Loading categories and data...', { id: 'loading-categories' })

      const response = await getCategories();
      const addressResponse = await getAddress();
      const slotTimingResponse = await slotTiming();
      const locationDetailsResponse = await getLocationDetails("");

      if (response.success) {
        setCategories(response.data);
        toast.success('Categories loaded successfully', { id: 'loading-categories' })
      } else {
        toast.error('Failed to load categories', { id: 'loading-categories' })
      }

      if (addressResponse.status) {
        setAddresses(addressResponse.data);
      }

      if (slotTimingResponse.status) {
        setSlotTimingData(slotTimingResponse.data);
      }

      if (locationDetailsResponse.success) {
        setLocationDetailsData(locationDetailsResponse);
        setCities(locationDetailsResponse);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data', { id: 'loading-categories' })
    } finally {
      setIsLoadingCategories(false)
    }
  }



  const handleChangeCityZone = async (value: string) => {
    setOrderForm(prev => ({ ...prev, locationZone: value }))
      const locationDetailsResponse = await getLocationDetails(value);
      if (locationDetailsResponse.success) {
        setCities(locationDetailsResponse);
      }
  }

 

  return (
    <AuthGuard>
      

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-primary rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome to EassyLife B2B Portal
                </h1>
                <p className="text-white/80 text-lg">
                  Manage your business operations with ease
                </p>
                {user?.company_name && (
                  <p className="text-white/70 text-sm mt-2">
                    Company: <span className="font-semibold">{user.company_name}</span>
                  </p>
                )}
              </div>
              <div className="hidden ">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

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

            <div className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-primary"
            onClick={
              () => {
                router.push('/quotations')
              }
            }
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">View Quotations</dt>
                      <dd className="text-lg font-semibold text-gray-900">All Quotations</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-green-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 ${user?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} rounded-full flex items-center justify-center shadow-md`}>
                      <span className="text-white font-semibold">★</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Account Status</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {user?.status === 'active' ? 'Active' : 'Inactive'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

               <div
                className={`bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-primary ${isLoadingCategories ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={isLoadingCategories ? undefined : handleCreateOrderModalOpen}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                        {isLoadingCategories ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <span className="text-white font-semibold">+</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">Order Creation</dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          Create Order
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

               <div
                className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-primary"
                onClick={() => setIsAddAddressModalOpen(true)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold">+</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">Add Address</dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          Address
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-primary"
                onClick={() => router.push('/orders')}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">View Orders</dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          Orders
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-l-4 border-primary"
                onClick={() => router.push('/roles')}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">Team Management</dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          Team Members
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
                    {/* <button
                      onClick={testGetCurrentUser}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Test User API
                    </button>
                    <button
                      onClick={testBasicAPI}
                      className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Test CORS
                    </button> */}
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

                          {/* {approval.B2BBooking.map((booking) => ( */}
                            <div  className="mb-3">
                              <h4 className="text-sm font-medium text-gray-900">
                                {approval.B2BBooking.service_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Order: {approval.B2BBooking.order_number}
                              </p>
                            </div>
                          {/* ))} */}

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
                            onClick={() => openApprovalModal(approval.id.toString(), 'approve')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-semibold rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md transition-all duration-200 transform hover:scale-105"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openApprovalModal(approval.id.toString(), 'reject')}
                            className="inline-flex items-center px-4 py-2 border border-primary text-sm leading-4 font-semibold rounded-lg text-primary bg-white hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md transition-all duration-200 transform hover:scale-105"
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
                <SearchableDropdown
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
                    isLoadingCategories ? [] : categories.map(category => ({
                      value: category.id,
                      label: category.name
                    }))
                  }
                  placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"}
                  searchPlaceholder="Search categories..."
                  disabled={isLoadingCategories}
                  required
                />
              </div>

              <div className='flex-1'>
                <SearchableDropdown
                  label="Subcategory"
                  value={orderForm.subcategoryId}
                  onChange={(value) => setOrderForm(prev => ({ ...prev, subcategoryId: value, filterAttributeId: '', segmentOption: '' }))}
                  options={
                    isLoadingCategories ? [] : orderForm.categoryId
                      ? categories
                          .find(cat => cat.id === orderForm.categoryId)
                          ?.subcategories?.map(subcat => ({
                            value: subcat.id,
                            label: subcat.name
                          })) || []
                      : []
                  }
                  placeholder={isLoadingCategories ? "Loading..." : !orderForm.categoryId ? "Select category first" : "Select a subcategory"}
                  searchPlaceholder="Search subcategories..."
                  disabled={!orderForm.categoryId || isLoadingCategories}
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
              disabled={!orderForm.locationZone}  
              options={
                cities?.data?.map((card) => ({
                  value: card.id,
                  label: card.name
                })) || []
              }
            />

                   

                  </div>

                  {/* // # Comment to select provider based on fetched provider cards */}
            {/* <Dropdown
              label="Priority"
              value={orderForm.priority}
              onChange={(value) => setOrderForm(prev => ({ ...prev, priority: value }))}
              options={
                providerCardsData.map((card) => ({
                value: card.provider.id,
                label: card.provider.first_name
                }))
              }
            /> */}
             
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
            disabled={!orderForm.categoryId || !orderForm.subcategoryId  || !orderForm.address || isCreatingOrder || isLoadingCategories}
          >
            {isCreatingOrder ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Order...
              </div>
            ) : (
              'Create Order'
            )}
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

      {/* Approval Action Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title={`${currentApproval?.action === 'approve' ? 'Approve' : 'Reject'} Request`}
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                You are about to <span className={`font-semibold ${currentApproval?.action === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentApproval?.action}
                </span> this request.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Remarks are mandatory for both approve and reject actions.
              </p>
            </div>

            <FormGroup>
              <Textarea
                label="Remarks "
                value={approvalRemarks}
                onChange={(value) => setApprovalRemarks(value)}
                placeholder={`Enter your remarks for ${currentApproval?.action === 'approve' ? 'approving' : 'rejecting'} this request...`}
                rows={4}
                required
              />
            </FormGroup>
          </div>
        </ModalBody>

        <ModalFooter>
          <ModalButton
            variant="secondary"
            onClick={() => {
              setIsApprovalModalOpen(false)
              setCurrentApproval(null)
              setApprovalRemarks('')
            }}
          >
            Cancel
          </ModalButton>
          <ModalButton
            variant={currentApproval?.action === 'approve' ? 'primary' : 'danger'}
            onClick={handleApprovalActionSubmit}
            disabled={!approvalRemarks.trim()}
          >
            {currentApproval?.action === 'approve' ? 'Approve' : 'Reject'}
          </ModalButton>
        </ModalFooter>
      </Modal>

    </AuthGuard>
  )
}

