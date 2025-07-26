import React, { useState } from 'react';
import GooglePlacesAutocomplete, { AddressComponents } from '../components/GooglePlacesAutocomplete';

/**
 * Example component demonstrating how to use GooglePlacesAutocomplete
 * with proper postal code handling
 */
const GooglePlacesUsageExample: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<AddressComponents | null>(null);
  const [error, setError] = useState<string>('');

  /**
   * Handle address selection with complete postal code data
   */
  const handleAddressSelect = (addressData: AddressComponents) => {
    console.log('Complete address data received:', addressData);
    setSelectedAddress(addressData);
    setError(''); // Clear any previous errors
  };

  /**
   * Handle errors from the autocomplete component
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Address autocomplete error:', errorMessage);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Google Places Autocomplete with Postal Code Handling
        </h2>
        <p className="text-gray-600 mb-6">
          This example demonstrates how to properly extract and handle postal codes
          from Google Places Autocomplete API responses.
        </p>
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for an address:
        </label>
        <GooglePlacesAutocomplete
          onAddressSelect={handleAddressSelect}
          placeholder="Start typing an address..."
          className="w-full"
          countryRestriction="cz" // Restrict to Czech Republic
          types={['address']} // Only search for addresses
          onError={handleError}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Address Selection Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="bg-green-50 border border-green-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-green-900 mb-4">
            Selected Address Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Formatted Address:</h4>
              <p className="text-green-700 bg-white p-3 rounded border">
                {selectedAddress.formattedAddress}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-green-800 mb-2">Address Components:</h4>
              <div className="bg-white p-3 rounded border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Street:</span>
                  <span>{selectedAddress.streetName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Number:</span>
                  <span>{selectedAddress.streetNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">City:</span>
                  <span>{selectedAddress.city || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Postal Code:</span>
                  <span className={`font-bold ${selectedAddress.postalCode ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAddress.postalCode || 'Not Available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Country:</span>
                  <span>{selectedAddress.country || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Region:</span>
                  <span>{selectedAddress.region || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Postal Code Handling Explanation */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Postal Code Handling:</h4>
            <p className="text-blue-700 text-sm">
              {selectedAddress.postalCode 
                ? `✅ Postal code "${selectedAddress.postalCode}" was successfully extracted from the address components.`
                : '⚠️ No postal code was found in the address components. This can happen for some locations or if the address is incomplete.'
              }
            </p>
          </div>

          {/* JSON Output for Developers */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-green-800 hover:text-green-600">
              View Raw JSON Data (for developers)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
              {JSON.stringify(selectedAddress, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Implementation Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Implementation Guide
        </h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-800">1. Postal Code Extraction:</h4>
            <p>The component automatically extracts postal codes from the `address_components` array after address selection.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">2. Address Formatting:</h4>
            <p>Addresses are formatted to include postal codes in the proper position, with fallback to Google's formatted address.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">3. Error Handling:</h4>
            <p>The component handles cases where postal codes or other components might be missing from the API response.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">4. Data Structure:</h4>
            <p>Returns a complete `AddressComponents` object with all available address parts for further processing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GooglePlacesUsageExample;