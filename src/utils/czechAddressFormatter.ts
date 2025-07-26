/**
 * Utility functions for Czech address formatting and validation
 */

import { CzechAddressComponents } from '../components/CzechAddressAutocomplete';

/**
 * Czech address formatting standards and utilities
 */
export class CzechAddressFormatter {
  
  /**
   * Formats address according to Czech postal standards
   * Format: "Street Number, Postal Code City, Country"
   * Example: "Zborovská 939/2, 602 00 Brno, Česká republika"
   * 
   * @param components - Address components to format
   * @param options - Formatting options
   * @returns Formatted Czech address string
   */
  static formatCzechAddress(
    components: CzechAddressComponents,
    options: {
      includeCountry?: boolean;
      domesticOnly?: boolean;
    } = {}
  ): string {
    const { includeCountry = false, domesticOnly = true } = options;
    const parts: string[] = [];

    // 1. Street address (Street Number format)
    if (components.streetName && components.streetNumber) {
      parts.push(`${components.streetName} ${components.streetNumber}`);
    } else if (components.streetName) {
      parts.push(components.streetName);
    }

    // 2. City with postal code (Postal Code City format)
    let cityPart = '';
    if (components.postalCode && components.city) {
      // Czech postal code format: "XXX XX City"
      const formattedPostalCode = this.formatCzechPostalCode(components.postalCode);
      cityPart = `${formattedPostalCode} ${components.city}`;
    } else if (components.city) {
      cityPart = components.city;
    } else if (components.postalCode) {
      cityPart = this.formatCzechPostalCode(components.postalCode);
    }

    if (cityPart) {
      parts.push(cityPart);
    }

    // 3. Country (usually omitted for domestic addresses)
    const shouldIncludeCountry = includeCountry || 
      (!domesticOnly && components.countryCode && components.countryCode !== 'CZ');
    
    if (shouldIncludeCountry && components.country) {
      parts.push(components.country);
    }

    // Join parts with commas and capitalize first letter
    let formattedAddress = parts.join(', ');
    
    if (formattedAddress) {
      formattedAddress = formattedAddress.charAt(0).toUpperCase() + formattedAddress.slice(1);
    }

    return formattedAddress;
  }

  /**
   * Formats Czech postal code to standard format (XXX XX)
   * 
   * @param postalCode - Raw postal code
   * @returns Formatted postal code
   */
  static formatCzechPostalCode(postalCode: string): string {
    if (!postalCode) return '';
    
    // Remove all spaces and non-digits
    const cleanCode = postalCode.replace(/\D/g, '');
    
    // Check if it's a valid 5-digit Czech postal code
    if (cleanCode.length === 5) {
      return `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}`;
    }
    
    // Return original if not valid format
    return postalCode;
  }

  /**
   * Validates Czech postal code format
   * 
   * @param postalCode - Postal code to validate
   * @returns Validation result
   */
  static validateCzechPostalCode(postalCode: string): {
    isValid: boolean;
    formatted?: string;
    error?: string;
  } {
    if (!postalCode) {
      return { isValid: false, error: 'Postal code is required' };
    }

    const cleanCode = postalCode.replace(/\D/g, '');
    
    if (cleanCode.length !== 5) {
      return { 
        isValid: false, 
        error: 'Czech postal code must be 5 digits' 
      };
    }

    // Check if it's within valid Czech postal code range (100 00 - 999 99)
    const numericCode = parseInt(cleanCode);
    if (numericCode < 10000 || numericCode > 99999) {
      return { 
        isValid: false, 
        error: 'Invalid Czech postal code range' 
      };
    }

    return {
      isValid: true,
      formatted: this.formatCzechPostalCode(cleanCode)
    };
  }

  /**
   * Extracts and validates address components specifically for Czech addresses
   * 
   * @param place - Google Places API result
   * @returns Validated Czech address components
   */
  static extractCzechAddressComponents(place: google.maps.places.PlaceResult): {
    components: CzechAddressComponents;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const components: CzechAddressComponents = {
      formattedAddress: place.formatted_address || '',
      czechFormattedAddress: ''
    };

    if (!place.address_components || place.address_components.length === 0) {
      errors.push('No address components found');
      return { components, isValid: false, errors };
    }

    // Extract components
    place.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        components.streetName = component.long_name;
      } else if (types.includes('locality')) {
        components.city = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
        components.countryCode = component.short_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.region = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !components.city) {
        components.city = component.long_name;
      }
    });

    // Validation
    if (!components.streetName && !components.city) {
      errors.push('Address must contain at least a street name or city');
    }

    if (components.countryCode && components.countryCode !== 'CZ') {
      errors.push('Address must be in Czech Republic');
    }

    if (components.postalCode) {
      const postalValidation = this.validateCzechPostalCode(components.postalCode);
      if (!postalValidation.isValid) {
        errors.push(`Invalid postal code: ${postalValidation.error}`);
      } else {
        components.postalCode = postalValidation.formatted;
      }
    }

    // Format the Czech address
    components.czechFormattedAddress = this.formatCzechAddress(components);

    return {
      components,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Creates a standardized address object for database storage
   * 
   * @param components - Czech address components
   * @returns Standardized address object
   */
  static createStandardizedCzechAddress(components: CzechAddressComponents) {
    return {
      // Formatted addresses
      czechFormat: components.czechFormattedAddress,
      googleFormat: components.formattedAddress,
      
      // Individual components
      street: components.streetName || '',
      streetNumber: components.streetNumber || '',
      city: components.city || '',
      postalCode: components.postalCode || '',
      region: components.region || '',
      country: components.country || 'Česká republika',
      countryCode: components.countryCode || 'CZ',
      
      // Full street address
      fullStreetAddress: [components.streetName, components.streetNumber]
        .filter(Boolean)
        .join(' '),
      
      // City with postal code
      cityWithPostalCode: components.postalCode && components.city
        ? `${this.formatCzechPostalCode(components.postalCode)} ${components.city}`
        : components.city || '',
      
      // Validation flags
      hasPostalCode: Boolean(components.postalCode),
      isComplete: Boolean(
        components.streetName && 
        components.city && 
        components.postalCode
      ),
      
      // Metadata
      extractedAt: new Date().toISOString(),
      source: 'google_places_api'
    };
  }

  /**
   * Parses a Czech address string and attempts to extract components
   * 
   * @param addressString - Address string to parse
   * @returns Parsed address components
   */
  static parseCzechAddressString(addressString: string): Partial<CzechAddressComponents> {
    if (!addressString) return {};

    const components: Partial<CzechAddressComponents> = {
      formattedAddress: addressString
    };

    // Extract postal code (5 digits, optionally with space)
    const postalCodeMatch = addressString.match(/\b(\d{3}\s?\d{2})\b/);
    if (postalCodeMatch) {
      components.postalCode = this.formatCzechPostalCode(postalCodeMatch[1]);
    }

    // Split by commas to get parts
    const parts = addressString.split(',').map(part => part.trim());
    
    if (parts.length >= 1) {
      // First part is usually street address
      const streetPart = parts[0];
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
      if (streetMatch) {
        components.streetName = streetMatch[1].trim();
        components.streetNumber = streetMatch[2].trim();
      } else {
        components.streetName = streetPart;
      }
    }

    if (parts.length >= 2) {
      // Second part usually contains postal code and city
      const cityPart = parts[1];
      if (components.postalCode) {
        // Remove postal code to get city name
        const cityName = cityPart.replace(/\b\d{3}\s?\d{2}\b/, '').trim();
        if (cityName) {
          components.city = cityName;
        }
      } else {
        components.city = cityPart;
      }
    }

    if (parts.length >= 3) {
      // Third part is usually country
      components.country = parts[2];
    }

    return components;
  }

  /**
   * Compares two Czech addresses for similarity
   * 
   * @param address1 - First address components
   * @param address2 - Second address components
   * @returns Similarity score (0-1)
   */
  static compareAddresses(
    address1: CzechAddressComponents, 
    address2: CzechAddressComponents
  ): number {
    let score = 0;
    let totalFields = 0;

    const fields: (keyof CzechAddressComponents)[] = [
      'streetName', 'streetNumber', 'city', 'postalCode'
    ];

    fields.forEach(field => {
      totalFields++;
      const val1 = address1[field]?.toLowerCase().trim();
      const val2 = address2[field]?.toLowerCase().trim();
      
      if (val1 && val2) {
        if (val1 === val2) {
          score += 1;
        } else if (val1.includes(val2) || val2.includes(val1)) {
          score += 0.5;
        }
      } else if (!val1 && !val2) {
        score += 1; // Both empty counts as match
      }
    });

    return totalFields > 0 ? score / totalFields : 0;
  }
}

/**
 * Type guard to check if address components are complete for Czech addresses
 */
export const isCompleteCzechAddress = (components: CzechAddressComponents): boolean => {
  return Boolean(
    components.streetName &&
    components.city &&
    components.postalCode &&
    components.countryCode === 'CZ'
  );
};

/**
 * Helper function to format address for different use cases
 */
export const formatAddressForUseCase = (
  components: CzechAddressComponents,
  useCase: 'display' | 'postal' | 'database' | 'search'
): string => {
  switch (useCase) {
    case 'display':
      return CzechAddressFormatter.formatCzechAddress(components, { includeCountry: false });
    
    case 'postal':
      return CzechAddressFormatter.formatCzechAddress(components, { includeCountry: true });
    
    case 'database':
      return components.czechFormattedAddress || components.formattedAddress;
    
    case 'search':
      // Simplified format for search queries
      return [
        components.streetName,
        components.streetNumber,
        components.city,
        components.postalCode
      ].filter(Boolean).join(' ');
    
    default:
      return components.czechFormattedAddress || components.formattedAddress;
  }
};