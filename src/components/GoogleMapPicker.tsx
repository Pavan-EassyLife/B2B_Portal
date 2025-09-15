'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api'

interface AddressDetails {
  addressLine1?: string
  addressLine2?: string
  landmark?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
}

interface GoogleMapPickerProps {
  latitude?: string
  longitude?: string
  onLocationSelect: (lat: string, lng: string, addressDetails?: AddressDetails) => void
  height?: string
  className?: string
}

const libraries: ("places" | "geometry")[] = ["places"]

export default function GoogleMapPicker({
  latitude,
  longitude,
  onLocationSelect,
  height = '400px',
  className = ''
}: GoogleMapPickerProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries
  })

  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(
    latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : null
  )

  // Function to perform reverse geocoding
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<AddressDetails> => {
    if (!window.google || !window.google.maps) {
      return {}
    }

    const geocoder = new window.google.maps.Geocoder()

    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(new Error(`Geocoding failed: ${status}`))
            }
          }
        )
      })

      if (results && results.length > 0) {
        const result = results[0]
        const addressDetails: AddressDetails = {}

        // Extract address components
        result.address_components?.forEach((component) => {
          const types = component.types

          if (types.includes('street_number')) {
            addressDetails.addressLine1 = component.long_name
          } else if (types.includes('route')) {
            addressDetails.addressLine1 = addressDetails.addressLine1
              ? `${addressDetails.addressLine1} ${component.long_name}`
              : component.long_name
          } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
            addressDetails.addressLine2 = component.long_name
          } else if (types.includes('point_of_interest') || types.includes('establishment')) {
            addressDetails.landmark = component.long_name
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            addressDetails.city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            addressDetails.state = component.long_name
          } else if (types.includes('postal_code')) {
            addressDetails.pincode = component.long_name
          } else if (types.includes('country')) {
            addressDetails.country = component.long_name
          }
        })

        // If no street address found, use formatted address as addressLine1
        if (!addressDetails.addressLine1 && result.formatted_address) {
          const parts = result.formatted_address.split(',')
          addressDetails.addressLine1 = parts[0]?.trim()
        }

        return addressDetails
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }

    return {}
  }, [])

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setMarker({ lat, lng })

      // Perform reverse geocoding to get address details
      const addressDetails = await reverseGeocode(lat, lng)
      onLocationSelect(lat.toString(), lng.toString(), addressDetails)
    },
    [onLocationSelect, reverseGeocode]
  )

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setMarker({ lat, lng })

          // Perform reverse geocoding for current location
          const addressDetails = await reverseGeocode(lat, lng)
          onLocationSelect(lat.toString(), lng.toString(), addressDetails)
        },
        (error) => {
          console.error('Error getting current location:', error)
          alert('Unable to get your current location. Please select manually on the map.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }, [reverseGeocode, onLocationSelect])

  if (!isLoaded) return <p>Loading Map...</p>

  return (
    <div className={`relative ${className}`}>
      <div className="mb-2 flex justify-between items-center">
        <p className="text-sm text-gray-600">Click on the map or drag the marker to select location</p>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          Use Current Location
        </button>
      </div>

      <div style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={marker || { lat: 19.0760, lng: 72.8777 }} // Default Mumbai
          zoom={marker ? 14 : 5}
          onClick={handleMapClick}
        >
          {marker && <Marker position={marker} draggable onDragEnd={handleMapClick} />}
        </GoogleMap>
      </div>

      {marker && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}
