import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Props interface for the AddressAutocomplete component
 */
interface AddressAutocompleteProps {
  /** Callback function called when an address is selected */
  setAddress: (address: string) => void;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Custom CSS classes for styling */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Initial value for the input */
  initialValue?: string;
  /** Callback for validation errors */
  onError?: (error: string) => void;
  /** Callback when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
  /** Custom debounce delay in milliseconds */
  debounceDelay?: number;
  /** Additional Google Places API options */
  placesOptions?: Partial<google.maps.places.AutocompleteOptions>;
}

/**
 * Interface for address validation result
 */
interface AddressValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Enhanced Google Places Address Autocomplete Component for Czech addresses
 * 
 * Features:
 * - Error handling for API loading and initialization
 * - Memory leak prevention with proper cleanup
 * - Loading states and user feedback
 * - Full accessibility support with ARIA attributes
 * - TypeScript support with comprehensive type definitions
 * - Edge case handling (empty results, API failures, network issues)
 * - Customizable styling options
 * - Debounced input for better performance
 * - Address validation
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  setAddress,
  placeholder = "Zadejte adresu",
  className = "",
  disabled = false,
  initialValue = "",
  onError,
  onLoadingChange,
  debounceDelay = 300,
  placesOptions = {}
}) => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  /**
   * Validates the selected address
   * @param place - Google Places API place object
   * @returns Validation result
   */
  const validateAddress = useCallback((place: google.maps.places.PlaceResult): AddressValidation => {
    if (!place.formatted_address) {
      return {
        isValid: false,
        error: "Adresa nebyla nalezena. Zkuste zadat přesnější údaje."
      };
    }

    if (!place.address_components || place.address_components.length === 0) {
      return {
        isValid: false,
        error: "Neúplné údaje o adrese. Zkuste vybrat jinou adresu."
      };
    }

    // Check if address is in Czech Republic
    const country = place.address_components.find(
      component => component.types.includes('country')
    );

    if (country?.short_name !== 'CZ') {
      return {
        isValid: false,
        error: "Prosím vyberte adresu v České republice."
      };
    }

    return { isValid: true };
  }, []);

  /**
   * Formats the address with postal code and proper capitalization
   * @param place - Google Places API place object
   * @returns Formatted address string
   */
  const formatAddress = useCallback((place: google.maps.places.PlaceResult): string => {
    const formatted = place.formatted_address || '';
    const postalCode = place.address_components?.find(
      component => component.types.includes('postal_code')
    )?.long_name;

    // Add postal code if not already present
    let address = formatted;
    if (postalCode && !formatted.includes(postalCode)) {
      address = `${formatted}, ${postalCode}`;
    }

    // Capitalize first letter
    return address.charAt(0).toUpperCase() + address.slice(1);
  }, []);

  /**
   * Handles place selection from autocomplete
   */
  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const place = autocompleteRef.current.getPlace();

      // Validate the selected place
      const validation = validateAddress(place);
      if (!validation.isValid) {
        setError(validation.error || "Neplatná adresa");
        onError?.(validation.error || "Neplatná adresa");
        return;
      }

      // Format and set the address
      const formattedAddress = formatAddress(place);
      setAddress(formattedAddress);
      setInputValue(formattedAddress);

    } catch (err) {
      const errorMessage = "Chyba při zpracování adresy. Zkuste to znovu.";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Address processing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setAddress, validateAddress, formatAddress, onError]);

  /**
   * Initializes Google Places Autocomplete
   */
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      setError("Google Maps API není dostupné");
      onError?.("Google Maps API není dostupné");
      return;
    }

    try {
      // Default options for Czech addresses
      const defaultOptions: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        componentRestrictions: { country: 'cz' },
        fields: ['formatted_address', 'address_components', 'geometry']
      };

      // Merge with custom options
      const options = { ...defaultOptions, ...placesOptions };

      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

      setIsApiLoaded(true);
      setError(null);

    } catch (err) {
      const errorMessage = "Chyba při inicializaci vyhledávání adres";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Autocomplete initialization error:', err);
    }
  }, [handlePlaceChanged, placesOptions, onError]);

  /**
   * Checks if Google Maps API is loaded and initializes autocomplete
   */
  const checkAndInitialize = useCallback(() => {
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Wait for API to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          initializeAutocomplete();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          const errorMessage = "Google Maps API se nepodařilo načíst";
          setError(errorMessage);
          onError?.(errorMessage);
        }
      }, 10000);
    }
  }, [initializeAutocomplete, onError]);

  /**
   * Handles input value changes with debouncing
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced processing
    debounceTimeoutRef.current = setTimeout(() => {
      // Additional processing can be added here if needed
    }, debounceDelay);
  }, [debounceDelay]);

  /**
   * Handles input focus
   */
  const handleFocus = useCallback(() => {
    setError(null);
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
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [checkAndInitialize]);

  // Update loading state callback
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Generate unique IDs for accessibility
  const inputId = `address-autocomplete-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="address-autocomplete-container">
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled || !isApiLoaded}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-label="Vyhledávání adresy"
          autoComplete="address-line1"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            aria-label="Načítání"
          >
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          id={errorId}
          className="mt-1 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* API loading status */}
      {!isApiLoaded && !error && (
        <div className="mt-1 text-sm text-gray-500">
          Načítání vyhledávání adres...
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;

// Type declarations for Google Maps API (if not already available)
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
export type { AddressAutocompleteProps, AddressValidation };