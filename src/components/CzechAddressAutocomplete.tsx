import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Interface for Czech address components
 */
interface CzechAddressComponents {
  streetName?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  formattedAddress: string;
  czechFormattedAddress: string;
}

/**
 * Props interface for the CzechAddressAutocomplete component
 */
interface CzechAddressAutocompleteProps {
  /** Callback function called when an address is selected and formatted */
  onAddressSelect: (addressData: CzechAddressComponents) => void;
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
  /** Callback when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Czech Address Autocomplete Component with Auto-Population
 * 
 * This component implements Google Places Autocomplete specifically for Czech addresses
 * with automatic form field population using the proper Czech address format:
 * "Street Number, Postal Code City, Country"
 * 
 * Key Features:
 * - Fetches complete address details using place_id
 * - Formats addresses according to Czech standards
 * - Handles missing components gracefully
 * - Auto-populates input field with formatted address
 * - Provides comprehensive error handling
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
const CzechAddressAutocomplete: React.FC<CzechAddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Zadejte adresu",
  className = "",
  disabled = false,
  initialValue = "",
  onError,
  onLoadingChange
}) => {
  // Refs and state
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  /**
   * Updates loading state and notifies parent component
   */
  const updateLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);

  /**
   * Extracts address components from Google Places API response
   * 
   * This function parses the address_components array and extracts
   * all relevant information for Czech address formatting.
   * 
   * @param place - Google Places API place result
   * @returns Parsed address components
   */
  const extractAddressComponents = useCallback((place: google.maps.places.PlaceResult): CzechAddressComponents => {
    const components: CzechAddressComponents = {
      formattedAddress: place.formatted_address || '',
      czechFormattedAddress: ''
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
      
      // Extract postal code
      else if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
      
      // Extract country information
      else if (types.includes('country')) {
        components.country = component.long_name;
        components.countryCode = component.short_name;
      }
      
      // Extract administrative area (region)
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
   * Formats address components according to Czech address standards
   * 
   * Czech address format: "Street Number, Postal Code City, Country"
   * Example: "Zborovská 939/2, 602 00 Brno, Česká republika"
   * 
   * @param components - Extracted address components
   * @returns Formatted Czech address string
   */
  const formatCzechAddress = useCallback((components: CzechAddressComponents): string => {
    const parts: string[] = [];

    // 1. Build street address (Street Number format)
    if (components.streetName && components.streetNumber) {
      parts.push(`${components.streetName} ${components.streetNumber}`);
    } else if (components.streetName) {
      parts.push(components.streetName);
    }

    // 2. Build city with postal code (Postal Code City format)
    let cityPart = '';
    if (components.postalCode && components.city) {
      cityPart = `${components.postalCode} ${components.city}`;
    } else if (components.city) {
      cityPart = components.city;
    } else if (components.postalCode) {
      cityPart = components.postalCode;
    }

    if (cityPart) {
      parts.push(cityPart);
    }

    // 3. Add country (optional, usually omitted for domestic addresses)
    if (components.country && components.countryCode !== 'CZ') {
      parts.push(components.country);
    }

    // Join parts with commas
    let formattedAddress = parts.join(', ');
    
    // Capitalize first letter
    if (formattedAddress) {
      formattedAddress = formattedAddress.charAt(0).toUpperCase() + formattedAddress.slice(1);
    }

    // Fallback to Google's formatted address if our formatting fails
    return formattedAddress || components.formattedAddress;
  }, []);

  /**
   * Fetches detailed place information using place_id
   * 
   * This function uses Google Places Details API to get complete
   * address information including postal codes and proper formatting.
   * 
   * @param placeId - Google Places place_id
   * @returns Promise with detailed place information
   */
  const fetchPlaceDetails = useCallback((placeId: string): Promise<google.maps.places.PlaceResult> => {
    return new Promise((resolve, reject) => {
      if (!placesServiceRef.current) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          'formatted_address',
          'address_components',
          'place_id',
          'geometry'
        ]
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Places service failed with status: ${status}`));
        }
      });
    });
  }, []);

  /**
   * Handles place selection from autocomplete dropdown
   * 
   * This is the main function that:
   * 1. Gets place_id from autocomplete selection
   * 2. Fetches detailed address information
   * 3. Extracts and formats address components
   * 4. Updates input field with formatted address
   * 5. Calls callback with complete address data
   */
  const handlePlaceChanged = useCallback(async () => {
    if (!autocompleteRef.current) {
      console.error('Autocomplete reference not available');
      return;
    }

    try {
      updateLoadingState(true);

      // Step 1: Get basic place information from autocomplete
      const place = autocompleteRef.current.getPlace();

      // Validate that we have a valid place result with place_id
      if (!place || !place.place_id) {
        const errorMessage = 'Invalid place selected. Please choose from the dropdown suggestions.';
        onError?.(errorMessage);
        console.warn('Invalid place result:', place);
        return;
      }

      console.log('Selected place:', place.name || place.formatted_address);

      let detailedPlace: google.maps.places.PlaceResult;

      // Step 2: Check if we already have detailed information
      if (place.address_components && place.address_components.length > 0) {
        // We already have detailed information from getPlace()
        detailedPlace = place;
        console.log('Using detailed information from getPlace()');
      } else {
        // Step 3: Fetch detailed place information using place_id
        console.log('Fetching additional details for place_id:', place.place_id);
        detailedPlace = await fetchPlaceDetails(place.place_id);
        console.log('Fetched detailed place information');
      }

      // Step 4: Extract address components
      const addressComponents = extractAddressComponents(detailedPlace);
      console.log('Extracted address components:', addressComponents);

      // Step 5: Format address according to Czech standards
      const czechFormattedAddress = formatCzechAddress(addressComponents);
      console.log('Czech formatted address:', czechFormattedAddress);

      // Step 6: Update the complete address components object
      const completeAddressData: CzechAddressComponents = {
        ...addressComponents,
        czechFormattedAddress
      };

      // Step 7: Update input field with formatted address
      setInputValue(czechFormattedAddress);

      // Step 8: Call callback with complete address data
      onAddressSelect(completeAddressData);

      console.log('Address auto-population completed successfully');

    } catch (error) {
      const errorMessage = `Error processing selected address: ${error.message}`;
      console.error('Place selection error:', error);
      onError?.(errorMessage);
    } finally {
      updateLoadingState(false);
    }
  }, [extractAddressComponents, formatCzechAddress, fetchPlaceDetails, onAddressSelect, onError, updateLoadingState]);

  /**
   * Initializes Google Places Autocomplete and Places Service
   */
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      const errorMessage = 'Google Maps API not available';
      console.error(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      // Configure autocomplete options for Czech addresses
      const options: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        componentRestrictions: { country: 'cz' },
        // Request specific fields to get complete address information
        fields: [
          'formatted_address',
          'address_components',
          'place_id',
          'geometry',
          'name'
        ]
      };

      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Initialize Places Service for detailed requests
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

      setIsApiLoaded(true);
      console.log('Czech Address Autocomplete initialized successfully');

    } catch (error) {
      const errorMessage = 'Failed to initialize address autocomplete';
      console.error('Autocomplete initialization error:', error);
      onError?.(errorMessage);
    }
  }, [handlePlaceChanged, onError]);

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
      placesServiceRef.current = null;
    };
  }, [checkAndInitialize]);

  return (
    <div className="czech-address-autocomplete-container">
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
          aria-label="Czech address search with autocomplete"
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
          Načítání vyhledávání adres...
        </div>
      )}
    </div>
  );
};

export default CzechAddressAutocomplete;

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
          PlacesService: new (
            attrContainer: HTMLDivElement | google.maps.Map
          ) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
          };
        };
        Map: new (
          mapDiv: HTMLDivElement,
          opts?: google.maps.MapOptions
        ) => google.maps.Map;
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

// Export types for external use
export type { CzechAddressAutocompleteProps, CzechAddressComponents };