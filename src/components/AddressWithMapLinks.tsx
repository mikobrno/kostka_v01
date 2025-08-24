import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ExternalLink, Copy } from 'lucide-react';
import { useGoogleMapsLoader } from '../utils/googleMapsLoader';

// Global type declarations for Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

interface AddressWithMapLinksProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  onCopy?: () => void;
}

export const AddressWithMapLinks: React.FC<AddressWithMapLinksProps> = ({
  value,
  onChange,
  placeholder = "Zadejte adresu",
  className = '',
  label,
  onCopy
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded: isApiLoaded, error: apiError, loadApi } = useGoogleMapsLoader();

  // Načtení Google Maps API při mount komponenty
  useEffect(() => {
    if (!isApiLoaded && !apiError) {
      loadApi().catch(console.error);
    }
  }, [isApiLoaded, apiError, loadApi]);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3 || !isApiLoaded) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const request = {
        input: query,
        componentRestrictions: { country: 'cz' },
        types: ['address']
      };

      service.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formattedSuggestions = predictions.slice(0, 5).map(p => p.description);
          setSuggestions(formattedSuggestions);
        } else {
          setSuggestions([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Google Places API error:', error);
      setSuggestions([]);
      setLoading(false);
    }
  }, [isApiLoaded]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchAddresses(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchAddresses]);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };
  // Generate map links
  const generateMapLinks = (address: string) => {
    if (!address.trim()) return null;
    
    const encodedAddress = encodeURIComponent(address);
    return {
      googleMaps: `https://maps.google.com/maps?q=${encodedAddress}`,
      mapyCz: `https://mapy.cz/zakladni?q=${encodedAddress}`
    };
  };

  const mapLinks = generateMapLinks(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="flex w-full max-w-full">
          <div className="flex-1 relative w-full max-w-full">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={`block w-full max-w-full pl-10 rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
              placeholder={apiError ? 'Zadejte adresu ručně (Google Maps API nedostupné)' : placeholder}
              disabled={false}
            />
            {(loading || !isApiLoaded) && !apiError && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          <div className="ml-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(value || '');
                  if (onCopy) onCopy();
                } catch {
                  /* ignore */
                }
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Kopírovat adresu"
              aria-label="Kopírovat adresu"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Address suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  selectSuggestion(suggestion);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-md last:rounded-b-md text-gray-900 dark:text-white"
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Links */}
      {mapLinks && (
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Zobrazit na mapě:</span>
          <a
            href={mapLinks.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Google Maps
          </a>
          <a
            href={mapLinks.mapyCz}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Mapy.cz
          </a>
        </div>
      )}
    </div>
  );
};