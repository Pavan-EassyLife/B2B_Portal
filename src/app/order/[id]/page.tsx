'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getOrderDetails, OrderAttachment } from '@/api/categories'
import AuthGuard from '@/components/AuthGuard'
import toast from 'react-hot-toast'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [attachments, setAttachments] = useState<OrderAttachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<OrderAttachment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!orderId) {
      toast.error('Order ID is required')
      router.push('/orders')
      return
    }

    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      const response = await getOrderDetails(orderId!)
      
      if (response.success) {
        setAttachments(response.data)
      } else {
        toast.error('Failed to fetch order details')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Error fetching order details')
    } finally {
      setIsLoading(false)
    }
  }

  const openMediaModal = (attachment: OrderAttachment) => {
    setSelectedMedia(attachment)
    setIsModalOpen(true)
  }

  const closeMediaModal = () => {
    setSelectedMedia(null)
    setIsModalOpen(false)
  }

  const beforeImages = attachments.filter(att => att.attachment_type === 'before_image')
  const afterImages = attachments.filter(att => att.attachment_type === 'after_image')

  const isVideo = (mimeType: string) => mimeType.startsWith('video/')
  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading order details...</div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600 mt-2">Service Media & Documentation</p>
              </div>
              <button
                onClick={() => router.push('/orders')}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Orders</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                <div className="text-2xl font-bold text-primary">{attachments.length}</div>
                <div className="text-sm text-gray-700">Total Files</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-600">{beforeImages.length}</div>
                <div className="text-sm text-gray-700">Before Images</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <div className="text-2xl font-bold text-purple-600">{afterImages.length}</div>
                <div className="text-sm text-gray-700">After Images</div>
              </div>
            </div>
          </div>

          {/* Before Images Section */}
          {beforeImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                Before Service ({beforeImages.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {beforeImages.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-gray-200"
                    onClick={() => openMediaModal(attachment)}
                  >
                    {isImage(attachment.mime_type) ? (
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : isVideo(attachment.mime_type) ? (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center relative">
                        <video
                          src={attachment.file_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">File</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      <p className="text-xs text-gray-400">{formatDate(attachment.uploaded_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* After Images Section */}
          {afterImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                After Service ({afterImages.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {afterImages.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-gray-200"
                    onClick={() => openMediaModal(attachment)}
                  >
                    {isImage(attachment.mime_type) ? (
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : isVideo(attachment.mime_type) ? (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center relative">
                        <video
                          src={attachment.file_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">File</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      <p className="text-xs text-gray-400">{formatDate(attachment.uploaded_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Media Message */}
          {attachments.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Found</h3>
              <p className="text-gray-500">No photos or videos have been uploaded for this order yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Media Modal */}
      {isModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedMedia.file_name}</h3>
              <button
                onClick={closeMediaModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {isImage(selectedMedia.mime_type) ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.file_name}
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                />
              ) : isVideo(selectedMedia.mime_type) ? (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="max-w-full max-h-[60vh] mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Preview not available for this file type</p>
                  <a
                    href={selectedMedia.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{selectedMedia.attachment_type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="ml-2 text-gray-600">{formatFileSize(selectedMedia.file_size)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Uploaded:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedMedia.uploaded_at)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Expires:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedMedia.expires_at)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <a
                  href={selectedMedia.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Open in New Tab
                </a>
                <a
                  href={selectedMedia.file_url}
                  download={selectedMedia.file_name}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
