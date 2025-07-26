import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CopyButton } from './CopyButton';
import { MapPin } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Mock suggestions pro demonstraci - v produkci nahradit skutečným API
      const mockSuggestions = [
        `${query}, Praha 1`,
        `${query}, Praha 2`,
        `${query}, Brno`,
        `${query}, Ostrava`,
        `${query}, Plzeň`
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      
      // Simulace API volání
      await new Promise(resolve => setTimeout(resolve, 300));
      setSuggestions(mockSuggestions.slice(0, 5));
    } catch (error) {
      console.error('Chyba při načítání adres:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []); // Odstraněna závislost na API klíči

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchAddresses(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchAddresses]); // Přidáno searchAddresses do závislostí

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
            className={`block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
            placeholder={placeholder}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <CopyButton text={value} />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onMouseDown={(e) => { // Použito onMouseDown pro zamezení blur události před kliknutím
                e.preventDefault(); 
                selectSuggestion(suggestion);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors first:rounded-t-md last:rounded-b-md"
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};