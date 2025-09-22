'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api'
import toast from 'react-hot-toast'

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

  // Search functionality
  const [searchValue, setSearchValue] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
          toast.error('Unable to get your current location. Please select manually on the map.')
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser.')
    }
  }, [reverseGeocode, onLocationSelect])

  // Handle autocomplete load
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  // Handle place selection from search
  const onPlaceChanged = useCallback(async () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        setMarker({ lat, lng })
        setSearchValue(place.formatted_address || place.name || '')

        // Center map on selected location
        if (mapRef) {
          mapRef.panTo({ lat, lng })
          mapRef.setZoom(15)
        }

        // Get address details from place
        const addressDetails: AddressDetails = {}

        if (place.address_components) {
          place.address_components.forEach((component) => {
            const types = component.types

            if (types.includes('street_number') || types.includes('route')) {
              if (!addressDetails.addressLine1) {
                addressDetails.addressLine1 = component.long_name
              } else {
                addressDetails.addressLine1 += ' ' + component.long_name
              }
            } else if (types.includes('sublocality') || types.includes('neighborhood')) {
              addressDetails.addressLine2 = component.long_name
            } else if (types.includes('locality')) {
              addressDetails.city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              addressDetails.state = component.long_name
            } else if (types.includes('postal_code')) {
              addressDetails.pincode = component.long_name
            } else if (types.includes('country')) {
              addressDetails.country = component.long_name
            }
          })
        }

        // If no street address found, use place name or formatted address
        if (!addressDetails.addressLine1 && (place.name || place.formatted_address)) {
          addressDetails.addressLine1 = place.name || place.formatted_address?.split(',')[0] || ''
        }

        onLocationSelect(lat.toString(), lng.toString(), addressDetails)
      } else {
        toast.error('Unable to get location details for the selected place')
      }
    }
  }, [autocomplete, mapRef, onLocationSelect])

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map)
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('')
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }, [])

  if (!isLoaded) return <p>Loading Map...</p>

  return (
    <div className={`relative ${className}`}>
      {/* Search Bar */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Location
        </label>
        <div className="relative">
          {isLoaded && (
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ['establishment', 'geocode'],
                componentRestrictions: { country: 'in' }, // Restrict to India, change as needed
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full text-black px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </Autocomplete>
          )}

          {/* Search Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {searchValue ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Instructions and Current Location Button */}
      <div className="mb-2 flex justify-between items-center">
        <p className="text-sm text-gray-600">Search above or click on the map to select location</p>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          Use Current Location
        </button>
      </div>

      {/* Google Map */}
      <div style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={marker || { lat: 19.0760, lng: 72.8777 }} // Default Mumbai
          zoom={marker ? 14 : 5}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {marker && <Marker position={marker} draggable onDragEnd={handleMapClick} />}
        </GoogleMap>
      </div>

      {/* Selected Coordinates Display */}
      {marker && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}
