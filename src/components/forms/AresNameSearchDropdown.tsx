import React, { useEffect, useId, useRef, useState } from 'react';
import { AresService, AresCompanyData } from '../../services/aresService';

interface AresNameSearchDropdownProps {
  value: string;
  onSelect: (result: AresCompanyData) => void;
  placeholder?: string;
  autoFocus?: boolean;
  // optional: notify parent about input changes (keeps existing behavior)
  onChange?: (value: string) => void;
  // optional input props (className etc.)
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  // optional id for listbox so parent can keep uniqueness
  id?: string;
}

/**
 * AresNameSearchDropdown
 * - Extracted structural + ARIA + keyboard logic for ARES name search.
 * - Intentionally contains no visual styling; parent components keep layout/classes.
 */
export const AresNameSearchDropdown: React.FC<AresNameSearchDropdownProps> = ({
  value,
  onSelect,
  placeholder,
  autoFocus = false,
  onChange,
  inputProps,
  id
}) => {
  const uid = useId();
  const listId = id || `ares-name-results-${uid}`;

  const [query, setQuery] = useState<string>(value || '');
  const [results, setResults] = useState<AresCompanyData[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // sync controlled value -> internal query
  useEffect(() => setQuery(value || ''), [value]);

  // debounce search
  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 3) { setResults([]); return; }
    const h = setTimeout(() => {
      AresService.searchByName(q).then(res => {
        setResults(res.data || []);
        if ((res.data || []).length > 0) setVisible(true);
      }).catch(() => {
        setResults([]);
      });
    }, 300);
    return () => clearTimeout(h);
  }, [query]);

  // outside click closes
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    onChange?.(v);
    if (v.length >= 3) setVisible(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!visible) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        const item = results[activeIndex];
        onSelect(item);
        setVisible(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setVisible(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef}>
      <input
        {...inputProps}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-autocomplete="list"
        aria-controls={listId}
      />

      {visible && results.length > 0 && (
        <div id={listId} role="listbox" aria-label="Výsledky hledání ARES">
          {results.map((r, idx) => (
            <button
              key={`${r.ico}-${r.companyName}`}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => {
                // select before blur
                e.preventDefault();
                onSelect(r);
                setVisible(false);
                setActiveIndex(-1);
              }}
              role="option"
              aria-selected={activeIndex === idx ? 'true' : 'false'}
            >
              <div>{r.companyName}</div>
              <div>{r.ico} • {r.address}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AresNameSearchDropdown;
