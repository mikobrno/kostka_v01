import React from 'react';
import { Search } from 'lucide-react';

interface SearchToggleButtonProps {
  onClick: () => void;
  isSearchVisible: boolean;
}

export const SearchToggleButton: React.FC<SearchToggleButtonProps> = ({ onClick, isSearchVisible }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed top-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-200 ${
        isSearchVisible 
          ? 'bg-blue-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      } border border-gray-200 dark:border-gray-700`}
      title="Vyhledávání na stránce (Ctrl+F)"
    >
      <Search className="w-5 h-5" />
    </button>
  );
};
