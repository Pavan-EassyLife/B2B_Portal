'use client'

import { useCallback, useState, useRef } from 'react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import toast from 'react-hot-toast'

interface LocationResult {
  lat: number
  lng: number
  address: string
  placeId?: string
  addressComponents?: {
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
}

interface LocationSearchBarProps {
  onLocationSelect: (location: LocationResult) => void
  placeholder?: string
  className?: string
  countryRestriction?: string
  types?: string[]
}

const libraries: ("places")[] = ["places"]

export default function LocationSearchBar({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = "",
  countryRestriction = "in", // Default to India
  types = ['establishment', 'geocode']
}: LocationSearchBarProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries
  })

  const [searchValue, setSearchValue] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle autocomplete load
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  // Handle place selection from search
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        
        setSearchValue(place.formatted_address || place.name || '')
        
        // Extract address components
        const addressComponents: LocationResult['addressComponents'] = {}
        
        if (place.address_components) {
          place.address_components.forEach((component) => {
            const types = component.types
            
            if (types.includes('street_number') || types.includes('route')) {
              if (!addressComponents.addressLine1) {
                addressComponents.addressLine1 = component.long_name
              } else {
                addressComponents.addressLine1 += ' ' + component.long_name
              }
            } else if (types.includes('sublocality') || types.includes('neighborhood')) {
              addressComponents.addressLine2 = component.long_name
            } else if (types.includes('locality')) {
              addressComponents.city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              addressComponents.state = component.long_name
            } else if (types.includes('postal_code')) {
              addressComponents.pincode = component.long_name
            } else if (types.includes('country')) {
              addressComponents.country = component.long_name
            }
          })
        }
        
        // If no street address found, use place name or formatted address
        if (!addressComponents.addressLine1 && (place.name || place.formatted_address)) {
          addressComponents.addressLine1 = place.name || place.formatted_address?.split(',')[0] || ''
        }
        
        const locationResult: LocationResult = {
          lat,
          lng,
          address: place.formatted_address || place.name || '',
          placeId: place.place_id,
          addressComponents
        }
        
        onLocationSelect(locationResult)
      } else {
        toast.error('Unable to get location details for the selected place')
      }
    }
  }, [autocomplete, onLocationSelect])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('')
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }, [])

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          placeholder="Loading search..."
          disabled
          className="w-full px-4 py-2 pr-10 border text-black border-gray-300 rounded-md bg-gray-50"
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          types,
          componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
        }}
      >
        <input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </Autocomplete>
      
      {/* Search/Clear Icon */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {searchValue ? (
          <button
            type="button"
            onClick={clearSearch}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
  )
}
