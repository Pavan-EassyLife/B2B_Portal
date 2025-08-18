'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalButton } from '@/components/Modal'
import { Input, Dropdown, Textarea, FormGroup } from '@/components/FormComponents'
import { ApiResponse, getAddress, getCategories } from '@/api/categories'
import { deleteB2BCustomerToken } from '@/lib/cookies'

// Import types from the API file to ensure consistency
import type { ServiceCategory, Subcategory, Attribute, Option, ServiceSegment } from '@/api/categories'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Modal state
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [categories, setCategories] = useState<ServiceCategory[]>([])

  // Form state
  const [orderForm, setOrderForm] = useState({
    categoryId: '',
    subcategoryId: '',
    description: '',
    filterAttributeId: '',
    address: '',
    preferredDate: '',
    preferredTime: '',
    priority: 'normal',
    filterOption: '',
    segmentOption: '',
  })
  console.log('Order Form:', orderForm)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/login') // Not authenticated
  }, [session, status, router])

  // Handle form submission
  const handleCreateOrder = () => {
    console.log('Creating order:', orderForm)
    // Here you would typically call your API
    // api.createOrder(orderForm)
    setIsCreateOrderModalOpen(false)
    // Reset form
    setOrderForm({
      categoryId: '',
      subcategoryId: '',
      description: '',
      filterAttributeId: '',
      address: '',
      preferredDate: '',
      preferredTime: '',
      priority: 'normal',
      segmentOption: ''
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }


  const handleCreateOrderModalOpen = async () => {
    setIsCreateOrderModalOpen(true)
    const response = await getCategories();
    const addressResponse = await getAddress();
    console.log(addressResponse)
    if (response.success) {
      setCategories(response.data);

    }
  }

  const handleSignOut = async () => {
    // Clear the B2B customer token cookie
    deleteB2BCustomerToken()
    // Sign out from NextAuth
    await signOut({ callbackUrl: '/login' })
  }

 

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">B2B Portal Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-gray-700">
                  <div className="font-medium">
                    Welcome, {session.user?.contact_person || session.user?.name}
                  </div>
                  {session.user?.company_name && (
                    <div className="text-sm text-gray-500">
                      {session.user.company_name}
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
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
                      <dd className="text-lg font-medium text-gray-900">₹{session.user?.wallet || '0.00'}</dd>
                    </dl>
                  </div>
                  
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Referral Code</dt>
                      <dd className="text-lg font-medium text-gray-900">{session.user?.referral_code}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${session.user?.is_es_gold ? 'bg-yellow-500' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold">★</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Membership</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {session.user?.is_es_gold ? 'Gold Member' : 'Regular'}
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
                        <dt className="text-sm font-medium text-gray-500 truncate">Add Address</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Address
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{session.user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{session.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <p className="mt-1 text-sm text-gray-900">+{session.user?.country_code} {session.user?.mobile}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VIP Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{session.user?.vip_subscription_status}</p>
                </div>
              </div>
            </div>
          </div>
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
                            value: option.id,
                            label: option.value
                          }))) || []
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


            

            <Input
              label="Service Address"
              value={orderForm.address}
              onChange={(value) => setOrderForm(prev => ({ ...prev, address: value }))}
              placeholder="Enter the service address"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Preferred Date"
                type="date"
                value={orderForm.preferredDate}
                onChange={(value) => setOrderForm(prev => ({ ...prev, preferredDate: value }))}
                required
              />

              <Input
                label="Preferred Time"
                type="time"
                value={orderForm.preferredTime}
                onChange={(value) => setOrderForm(prev => ({ ...prev, preferredTime: value }))}
                required
              />
            </div>

            <Dropdown
              label="Priority"
              value={orderForm.priority}
              onChange={(value) => setOrderForm(prev => ({ ...prev, priority: value }))}
              options={[
                { value: 'low', label: 'Low Priority' },
                { value: 'normal', label: 'Normal Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent' }
              ]}
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
            disabled={!orderForm.categoryId || !orderForm.subcategoryId || !orderForm.description || !orderForm.address}
          >
            Create Order
          </ModalButton>
        </ModalFooter>
      </Modal>
    </div>
  )
}
