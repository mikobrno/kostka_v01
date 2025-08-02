import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown, EyeOff } from 'lucide-react';

interface FloatingSearchProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface SearchResult {
  element: HTMLElement;
  text: string;
  index: number;
}

export const FloatingSearch: React.FC<FloatingSearchProps> = ({ isVisible, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalScrollBehavior = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vyčištění highlightů
  const clearHighlights = () => {
    try {
      const highlights = document.querySelectorAll('.search-highlight');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        }
      });
      
      // Normalize text nodes
      const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label, button');
      elements.forEach(element => {
        if (element.normalize) {
          element.normalize();
        }
      });
    } catch (error) {
      console.error('Error clearing highlights:', error);
    }
  };

  // Hledání textu v DOM
  const searchInDOM = useCallback((term: string): SearchResult[] => {
    // Performance check - limit search term length
    if (term.length < 2) return [];
    
    clearHighlights();
    
    if (!term.trim()) return [];

    const results: SearchResult[] = [];
    let index = 0;
    
    // Use more efficient search method
    const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label, button');
    
    for (const element of elements) {
      // Skip our search components
      if (element.closest('.floating-search-container')) continue;
      
      const textContent = element.textContent || '';
      if (!textContent.toLowerCase().includes(term.toLowerCase())) continue;
      
      // Limit results for performance
      if (results.length >= 50) break;
      
      // Simple highlighting for performance
      const innerHTML = element.innerHTML;
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      if (regex.test(textContent)) {
        const highlightedHTML = innerHTML.replace(regex, '<span class="search-highlight bg-yellow-300 dark:bg-yellow-600 px-1 rounded">$1</span>');
        element.innerHTML = highlightedHTML;
        
        const highlights = element.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
          results.push({
            element: highlight as HTMLElement,
            text: highlight.textContent || '',
            index: index++
          });
        });
      }
    }

    return results;
  }, []);

  // Scroll k výsledku
  const scrollToResult = useCallback((index: number) => {
    if (results[index]) {
      const element = results[index].element;
      
      // Dočasně nastavit smooth scroll
      document.documentElement.style.scrollBehavior = 'smooth';
      
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight current result
      results.forEach((result, i) => {
        if (i === index) {
          result.element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-200', 'dark:bg-blue-800');
          result.element.classList.remove('bg-yellow-300', 'dark:bg-yellow-600');
        } else {
          result.element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-200', 'dark:bg-blue-800');
          result.element.classList.add('bg-yellow-300', 'dark:bg-yellow-600');
        }
      });
      
      // Restore original scroll behavior after animation
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = originalScrollBehavior.current;
      }, 500);
    }
  }, [results]);

  // Hledání při změně textu s debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          const searchResults = searchInDOM(searchTerm);
          setResults(searchResults);
          setCurrentIndex(0);
          
          if (searchResults.length > 0) {
            scrollToResult(0);
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        clearHighlights();
        setResults([]);
        setCurrentIndex(0);
        setIsSearching(false);
      }
    }, 500); // Increased debounce to 500ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchInDOM, scrollToResult]);

  // Navigace výsledky
  const nextResult = useCallback(() => {
    if (results.length > 0) {
      const newIndex = (currentIndex + 1) % results.length;
      setCurrentIndex(newIndex);
      scrollToResult(newIndex);
    }
  }, [currentIndex, results.length, scrollToResult]);

  const prevResult = useCallback(() => {
    if (results.length > 0) {
      const newIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToResult(newIndex);
    }
  }, [currentIndex, results.length, scrollToResult]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible && e.key === 'Escape') {
        onToggle();
      }
      if (isVisible && e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        nextResult();
      }
      if (isVisible && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        prevResult();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, nextResult, prevResult, onToggle]);

  // Focus input když se otevře
  useEffect(() => {
    if (isVisible && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, isMinimized]);

  // Cleanup při zavření
  useEffect(() => {
    if (!isVisible) {
      clearHighlights();
      setSearchTerm('');
      setResults([]);
      setCurrentIndex(0);
    }
  }, [isVisible]);

  // Uložit původní scroll behavior
  useEffect(() => {
    originalScrollBehavior.current = document.documentElement.style.scrollBehavior || 'auto';
  }, []);

  if (!isVisible) return null;

  return (
    <div className="floating-search-container fixed bottom-4 left-20 z-50">
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all duration-200 ${
        isMinimized ? 'w-12 h-12' : 'w-80'
      }`}>
        {isMinimized ? (
          // Minimized view
          <div className="p-3 flex items-center justify-center">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Rozbalit vyhledávání"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        ) : (
          // Full view
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vyhledávání
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
                  title="Minimalizovat"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
                <button
                  onClick={onToggle}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
                  title="Zavřít (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Vyhledat text na stránce..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            {searchTerm && (
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>
                    {results.length > 0 
                      ? `${currentIndex + 1} z ${results.length}` 
                      : 'Žádné výsledky'
                    }
                  </span>
                  {results.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={prevResult}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Předchozí (Shift+Enter)"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={nextResult}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Další (Ctrl+Enter)"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  <div>Ctrl+Enter: Další</div>
                  <div>Shift+Enter: Předchozí</div>
                  <div>Esc: Zavřít</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
