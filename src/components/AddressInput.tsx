import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CopyButton } from './CopyButton';
import { MapPin } from 'lucide-react';

// Global type declarations for Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

// Vite environment variables type declaration
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Zadejte adresu",
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadGoogleMapsApi = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🔑 API Key found:', !!apiKey);
    
    if (!apiKey) {
      console.error('❌ Google Maps API key not found in environment');
      setApiError('Google Maps API key not found');
      return;
    }
    
    if (window.google?.maps?.places) {
      console.log('✅ Google Maps API already loaded');
      setIsApiLoaded(true);
      return;
    }

    console.log('📝 Loading Google Maps API script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ Google Maps API script loaded successfully');
        setIsApiLoaded(true);
        resolve(void 0);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps API script:', error);
        setApiError('Failed to load Google Maps API');
        reject(new Error('Failed to load Google Maps API'));
      };
      document.head.appendChild(script);
    });
  }, []);

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
    loadGoogleMapsApi();
  }, [loadGoogleMapsApi]);

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

  return (
    <div className="relative">
      <div className="flex">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={`block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
            placeholder={apiError ? 'Chyba načítání API' : placeholder}
            disabled={!!apiError}
          />
          {(loading || !isApiLoaded) && !apiError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <CopyButton text={value} />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onMouseDown={(e) => { // Použito onMouseDown pro zamezení blur události před kliknutím
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
  );
};