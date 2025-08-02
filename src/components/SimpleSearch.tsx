import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SimpleSearchProps {
  onSearchChange: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleSearch: React.FC<SimpleSearchProps> = ({ 
  onSearchChange, 
  placeholder = "Vyhledat...", 
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearchChange]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        placeholder={placeholder}
      />
      {searchTerm && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Vymazat vyhledávání"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
