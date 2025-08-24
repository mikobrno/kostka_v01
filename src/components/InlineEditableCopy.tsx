import React, { useEffect, useRef, useState } from 'react';

interface InlineEditableCopyProps {
  value: string;
  onSave?: (newValue: string) => void;
  onCopy?: () => void;
  className?: string;
  placeholder?: string;
  copyFeedbackDuration?: number; // ms
}

/**
 * InlineEditableCopy
 * - Single click: copy current text to clipboard (shows brief visual feedback)
 * - Double click: enter edit mode (shows input). Enter or blur saves and exits.
 * - Mobile long-press: treated as copy (when detected)
 *
 * Implementation notes:
 * - Uses a small click timeout to distinguish click vs dblclick.
 * - Prevents click firing when dblclick or long-press detected.
 */
export const InlineEditableCopy: React.FC<InlineEditableCopyProps> = ({
  value,
  onSave,
  onCopy,
  className = '',
  placeholder = '—',
  copyFeedbackDuration = 1400,
}) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [copied, setCopied] = useState(false);
  const clickTimeout = useRef<number | null>(null);
  const ignoreClick = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setLocalValue(value), [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // copy helper
  const doCopy = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (typeof onCopy === 'function') {
        try { onCopy(); } catch { /* swallow */ }
      }
      window.setTimeout(() => setCopied(false), copyFeedbackDuration);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // handle single click vs dblclick
  const handleClick = () => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }

    // set small timeout to allow dblclick to cancel
    if (clickTimeout.current) {
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    clickTimeout.current = window.setTimeout(() => {
      doCopy(localValue || '');
      clickTimeout.current = null;
    }, 180); // 180ms threshold
  };

  const handleDoubleClick = () => {
    // prevent the pending single-click action
    if (clickTimeout.current) {
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    ignoreClick.current = true;
    setEditing(true);
  };

  // mobile long-press -> copy
  const handleTouchStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      ignoreClick.current = true;
      doCopy(localValue || '');
      // keep pressed state briefly
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const saveAndClose = () => {
    setEditing(false);
    if (onSave && localValue !== value) {
      onSave(localValue);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveAndClose();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setEditing(false);
    }
  };

  return (
    <div className={`inline-block ${className}`}> 
      {!editing ? (
        <div
          className="relative inline-flex items-center cursor-pointer select-none"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          title="Klikni pro kopírování, dvojklik pro editaci"
        >
          <span className="text-sm text-gray-900 dark:text-white pr-10">
            {localValue || placeholder}
          </span>

          {/* small floating feedback */}
          <div className="absolute right-0 mr-1">
            <div className={`flex items-center transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-xs text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">Zkopírováno</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            className="block w-48 pr-10 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={saveAndClose}
            onKeyDown={onKeyDown}
            title="Upravit hodnotu"
            placeholder={placeholder}
          />
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            type="button"
            onClick={() => doCopy(localValue || '')}
            title="Kopírovat"
            aria-label="Kopírovat"
          >
            {/* small SVG copy icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default InlineEditableCopy;
