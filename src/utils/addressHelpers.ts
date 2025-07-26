/**
 * Utility functions for handling Google Places API address data
 * and postal code processing
 */

import { AddressComponents } from '../components/GooglePlacesAutocomplete';

/**
 * Address component type mapping for Google Places API
 */
export const ADDRESS_COMPONENT_TYPES = {
  STREET_NUMBER: 'street_number',
  ROUTE: 'route',
  LOCALITY: 'locality',
  POSTAL_CODE: 'postal_code',
  COUNTRY: 'country',
  ADMINISTRATIVE_AREA_LEVEL_1: 'administrative_area_level_1',
  ADMINISTRATIVE_AREA_LEVEL_2: 'administrative_area_level_2',
  SUBLOCALITY: 'sublocality',
  PREMISE: 'premise'
} as const;

/**
 * Validates if an address has a postal code
 * @param addressComponents - Address components to validate
 * @returns boolean indicating if postal code is present
 */
export const hasPostalCode = (addressComponents: AddressComponents): boolean => {
  return Boolean(addressComponents.postalCode && addressComponents.postalCode.trim().length > 0);
};

/**
 * Validates Czech postal code format (XXXXX or XXX XX)
 * @param postalCode - Postal code to validate
 * @returns boolean indicating if postal code format is valid
 */
export const isValidCzechPostalCode = (postalCode: string): boolean => {
  if (!postalCode) return false;
  
  // Remove spaces and check if it's 5 digits
  const cleanCode = postalCode.replace(/\s/g, '');
  return /^\d{5}$/.test(cleanCode);
};

/**
 * Formats Czech postal code to standard format (XXX XX)
 * @param postalCode - Raw postal code
 * @returns Formatted postal code or original if invalid
 */
export const formatCzechPostalCode = (postalCode: string): string => {
  if (!postalCode) return '';
  
  const cleanCode = postalCode.replace(/\s/g, '');
  
  if (isValidCzechPostalCode(cleanCode)) {
    return `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}`;
  }
  
  return postalCode; // Return original if not valid Czech format
};

/**
 * Extracts and validates address components with enhanced postal code handling
 * @param place - Google Places API place result
 * @returns Enhanced address components with validation
 */
export const extractAndValidateAddress = (place: google.maps.places.PlaceResult): AddressComponents & {
  isValid: boolean;
  validationErrors: string[];
} => {
  const validationErrors: string[] = [];
  const components: AddressComponents = {
    formattedAddress: place.formatted_address || ''
  };

  if (!place.address_components || place.address_components.length === 0) {
    validationErrors.push('No address components found');
    return {
      ...components,
      isValid: false,
      validationErrors
    };
  }

  // Extract components
  place.address_components.forEach((component) => {
    const types = component.types;

    if (types.includes(ADDRESS_COMPONENT_TYPES.STREET_NUMBER)) {
      components.streetNumber = component.long_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.ROUTE)) {
      components.streetName = component.long_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.LOCALITY)) {
      components.city = component.long_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.POSTAL_CODE)) {
      components.postalCode = component.long_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.COUNTRY)) {
      components.country = component.long_name;
      components.countryCode = component.short_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.ADMINISTRATIVE_AREA_LEVEL_1)) {
      components.region = component.long_name;
    } else if (types.includes(ADDRESS_COMPONENT_TYPES.ADMINISTRATIVE_AREA_LEVEL_2) && !components.city) {
      components.city = component.long_name;
    }
  });

  // Validation checks
  if (!components.streetName && !components.city) {
    validationErrors.push('Address must contain at least a street name or city');
  }

  if (components.postalCode && !isValidCzechPostalCode(components.postalCode)) {
    validationErrors.push('Invalid postal code format');
  }

  // Format postal code if valid
  if (components.postalCode) {
    components.postalCode = formatCzechPostalCode(components.postalCode);
  }

  return {
    ...components,
    isValid: validationErrors.length === 0,
    validationErrors
  };
};

/**
 * Creates a standardized address object for database storage
 * @param addressComponents - Address components from Google Places
 * @returns Standardized address object
 */
export const createStandardizedAddress = (addressComponents: AddressComponents) => {
  return {
    // Full formatted address
    fullAddress: addressComponents.formattedAddress,
    
    // Individual components
    streetAddress: [addressComponents.streetName, addressComponents.streetNumber]
      .filter(Boolean)
      .join(' '),
    city: addressComponents.city || '',
    postalCode: addressComponents.postalCode || '',
    region: addressComponents.region || '',
    country: addressComponents.country || '',
    countryCode: addressComponents.countryCode || '',
    
    // Metadata
    hasPostalCode: hasPostalCode(addressComponents),
    isComplete: Boolean(
      addressComponents.streetName && 
      addressComponents.city && 
      addressComponents.postalCode
    ),
    
    // Timestamp
    extractedAt: new Date().toISOString()
  };
};

/**
 * Searches for postal code in formatted address string as fallback
 * @param formattedAddress - Google's formatted address string
 * @returns Extracted postal code or null
 */
export const extractPostalCodeFromString = (formattedAddress: string): string | null => {
  if (!formattedAddress) return null;
  
  // Czech postal code pattern (5 digits, optionally with space)
  const postalCodeRegex = /\b(\d{3}\s?\d{2})\b/;
  const match = formattedAddress.match(postalCodeRegex);
  
  if (match) {
    return formatCzechPostalCode(match[1]);
  }
  
  return null;
};

/**
 * Combines multiple address resolution strategies
 * @param place - Google Places API place result
 * @returns Address components with fallback postal code extraction
 */
export const resolveAddressWithFallback = (place: google.maps.places.PlaceResult): AddressComponents => {
  // Primary extraction from address_components
  const primaryResult = extractAndValidateAddress(place);
  
  // If no postal code found, try extracting from formatted address
  if (!primaryResult.postalCode && place.formatted_address) {
    const fallbackPostalCode = extractPostalCodeFromString(place.formatted_address);
    if (fallbackPostalCode) {
      primaryResult.postalCode = fallbackPostalCode;
    }
  }
  
  return primaryResult;
};

/**
 * Type guard to check if address components are complete
 * @param components - Address components to check
 * @returns boolean indicating if address is complete
 */
export const isCompleteAddress = (components: AddressComponents): boolean => {
  return Boolean(
    components.streetName &&
    components.city &&
    components.postalCode &&
    components.country
  );
};

/**
 * Formats address for display purposes
 * @param components - Address components
 * @param options - Formatting options
 * @returns Formatted address string
 */
export const formatAddressForDisplay = (
  components: AddressComponents,
  options: {
    includeCountry?: boolean;
    includeRegion?: boolean;
    separator?: string;
  } = {}
): string => {
  const {
    includeCountry = false,
    includeRegion = false,
    separator = ', '
  } = options;

  const parts: string[] = [];

  // Street address
  if (components.streetName) {
    const streetPart = components.streetNumber 
      ? `${components.streetName} ${components.streetNumber}`
      : components.streetName;
    parts.push(streetPart);
  }

  // City with postal code
  if (components.city) {
    const cityPart = components.postalCode 
      ? `${components.postalCode} ${components.city}`
      : components.city;
    parts.push(cityPart);
  } else if (components.postalCode) {
    parts.push(components.postalCode);
  }

  // Region
  if (includeRegion && components.region) {
    parts.push(components.region);
  }

  // Country
  if (includeCountry && components.country) {
    parts.push(components.country);
  }

  return parts.join(separator);
};