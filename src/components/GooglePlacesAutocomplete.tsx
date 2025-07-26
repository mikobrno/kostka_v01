import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Interface for address components extracted from Google Places API
 */
interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  formattedAddress: string;
}

/**
 * Props interface for the GooglePlacesAutocomplete component
 */
interface GooglePlacesAutocompleteProps {
  /** Callback function called when an address is selected */
  onAddressSelect: (addressData: AddressComponents) => void;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Custom CSS classes for styling */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Initial value for the input */
  initialValue?: string;
  /** Callback for handling errors */
  onError?: (error: string) => void;
  /** Country restriction (ISO 3166-1 Alpha-2 country code) */
  countryRestriction?: string;
  /** Types of places to search for */
  types?: string[];
}

/**
 * Google Places Autocomplete Component with Postal Code Handling
 * 
 * This component provides a complete solution for handling postal codes
 * in Google Places Autocomplete by extracting detailed address components
 * after address selection and formatting them properly.
 * 
 * Key Features:
 * - Extracts postal codes from place details
 * - Handles missing address components gracefully
 * - Formats addresses in a user-friendly way
 * - Provides comprehensive error handling
 * - Supports country restrictions and place types
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Enter address",
  className = "",
  disabled = false,
  initialValue = "",
  onError,
  countryRestriction = "cz",
  types = ['address']
}) => {
  // Refs and state
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  /**
   * Extracts address components from Google Places API response
   * 
   * This function parses the address_components array returned by Google Places API
   * and extracts relevant information including postal codes, street addresses,
   * cities, and other location data.
   * 
   * @param place - Google Places API place result
   * @returns Parsed address components
   */
  const extractAddressComponents = useCallback((place: google.maps.places.PlaceResult): AddressComponents => {
    const components: AddressComponents = {
      formattedAddress: place.formatted_address || ''
    };

    // Return early if no address components are available
    if (!place.address_components || place.address_components.length === 0) {
      console.warn('No address components found in place result');
      return components;
    }

    // Parse each address component based on its type
    place.address_components.forEach((component) => {
      const types = component.types;

      // Extract street number
      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      }
      
      // Extract street name/route
      else if (types.includes('route')) {
        components.streetName = component.long_name;
      }
      
      // Extract city/locality
      else if (types.includes('locality')) {
        components.city = component.long_name;
      }
      
      // Extract postal code - this is the key component we're focusing on
      else if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
      
      // Extract country information
      else if (types.includes('country')) {
        components.country = component.long_name;
        components.countryCode = component.short_name;
      }
      
      // Extract administrative area (region/state)
      else if (types.includes('administrative_area_level_1')) {
        components.region = component.long_name;
      }
      
      // Fallback for city if locality is not available
      else if (types.includes('administrative_area_level_2') && !components.city) {
        components.city = component.long_name;
      }
    });

    return components;
  }, []);

  /**
   * Formats address components into a user-friendly address string
   * 
   * This function takes the extracted address components and combines them
   * into a properly formatted address string, ensuring postal codes are
   * included when available and handling missing components gracefully.
   * 
   * @param components - Extracted address components
   * @returns Formatted address string
   */
  const formatAddress = useCallback((components: AddressComponents): string => {
    const parts: string[] = [];

    // Build street address (number + name)
    if (components.streetNumber && components.streetName) {
      parts.push(`${components.streetName} ${components.streetNumber}`);
    } else if (components.streetName) {
      parts.push(components.streetName);
    }

    // Add city
    if (components.city) {
      parts.push(components.city);
    }

    // Add postal code - this is crucial for complete address formatting
    if (components.postalCode) {
      // Insert postal code before city if both exist
      if (components.city && parts.length >= 2) {
        const cityIndex = parts.length - 1;
        parts.splice(cityIndex, 0, components.postalCode);
      } else {
        parts.push(components.postalCode);
      }
    }

    // Join parts with commas and ensure proper capitalization
    let formattedAddress = parts.join(', ');
    
    // Capitalize first letter
    if (formattedAddress) {
      formattedAddress = formattedAddress.charAt(0).toUpperCase() + formattedAddress.slice(1);
    }

    // Fallback to Google's formatted address if our formatting fails
    return formattedAddress || components.formattedAddress;
  }, []);

  /**
   * Handles place selection from autocomplete dropdown
   * 
   * This is the core function that processes the selected place,
   * extracts postal codes and other components, and formats the final address.
   */
  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) {
      console.error('Autocomplete reference not available');
      return;
    }

    try {
      setIsLoading(true);

      // Get the selected place from Google Places API
      const place = autocompleteRef.current.getPlace();

      // Validate that we have a valid place result
      if (!place || !place.place_id) {
        const errorMessage = 'Invalid place selected. Please choose from the dropdown suggestions.';
        onError?.(errorMessage);
        console.warn('Invalid place result:', place);
        return;
      }

      // Extract address components including postal code
      const addressComponents = extractAddressComponents(place);

      // Log extracted components for debugging
      console.log('Extracted address components:', addressComponents);

      // Handle case where postal code is missing
      if (!addressComponents.postalCode) {
        console.warn('Postal code not found in address components. This may be normal for some locations.');
      }

      // Format the complete address
      const formattedAddress = formatAddress(addressComponents);

      // Update input field with formatted address
      setInputValue(formattedAddress);

      // Call the callback with complete address data
      onAddressSelect({
        ...addressComponents,
        formattedAddress
      });

      console.log('Address selection completed:', {
        original: place.formatted_address,
        formatted: formattedAddress,
        postalCode: addressComponents.postalCode || 'Not available'
      });

    } catch (error) {
      const errorMessage = 'Error processing selected address. Please try again.';
      console.error('Place selection error:', error);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [extractAddressComponents, formatAddress, onAddressSelect, onError]);

  /**
   * Initializes Google Places Autocomplete
   */
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      const errorMessage = 'Google Maps API not available';
      console.error(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      // Configure autocomplete options
      const options: google.maps.places.AutocompleteOptions = {
        types,
        componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
        // Request specific fields to ensure we get address components and postal codes
        fields: [
          'formatted_address',
          'address_components',
          'place_id',
          'geometry'
        ]
      };

      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

      setIsApiLoaded(true);
      console.log('Google Places Autocomplete initialized successfully');

    } catch (error) {
      const errorMessage = 'Failed to initialize address autocomplete';
      console.error('Autocomplete initialization error:', error);
      onError?.(errorMessage);
    }
  }, [types, countryRestriction, handlePlaceChanged, onError]);

  /**
   * Checks if Google Maps API is loaded and initializes autocomplete
   */
  const checkAndInitialize = useCallback(() => {
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Wait for API to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals

      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          initializeAutocomplete();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          const errorMessage = 'Google Maps API failed to load within timeout period';
          console.error(errorMessage);
          onError?.(errorMessage);
        }
      }, 100);
    }
  }, [initializeAutocomplete, onError]);

  /**
   * Handles manual input changes
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  // Initialize autocomplete on component mount
  useEffect(() => {
    checkAndInitialize();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        // Remove listeners to prevent memory leaks
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [checkAndInitialize]);

  return (
    <div className="google-places-autocomplete-container">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || !isApiLoaded}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
          aria-label="Address search with autocomplete"
          autoComplete="address-line1"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            aria-label="Processing address"
          >
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* API loading status */}
      {!isApiLoaded && (
        <div className="mt-1 text-sm text-gray-500">
          Loading address search...
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;

// Type declarations for Google Maps API
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

// Export types for external use
export type { GooglePlacesAutocompleteProps, AddressComponents };