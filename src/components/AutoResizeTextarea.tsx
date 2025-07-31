import React, { useRef, useEffect, useCallback } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  rows?: number;
  label?: string;
  helpText?: string;
}

/**
 * Auto-Resizing Textarea Component
 * 
 * This component automatically adjusts its height based on content length.
 * It provides smooth transitions and maintains performance even with large amounts of text.
 * 
 * Features:
 * - Automatic height adjustment based on content
 * - Configurable min/max height constraints
 * - Smooth CSS transitions
 * - Performance optimized with useCallback
 * - Accessibility support
 * - Cross-browser compatibility
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder = "Začněte psát...",
  className = "",
  minHeight = 60,
  maxHeight = 300,
  disabled = false,
  rows = 3,
  label,
  helpText
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Calculates and applies the appropriate height for the textarea
   * 
   * How it works:
   * 1. Temporarily set height to 'auto' to get accurate scrollHeight
   * 2. Calculate new height within min/max constraints
   * 3. Apply the new height with smooth transition
   * 4. Handle overflow for content exceeding max height
   */
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Store current scroll position to maintain user's view
    const scrollTop = textarea.scrollTop;

    // Reset height to auto to get accurate scrollHeight measurement
    textarea.style.height = 'auto';

    // Calculate new height within constraints
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    // Apply new height
    textarea.style.height = `${newHeight}px`;

    // Handle overflow behavior
    if (scrollHeight > maxHeight) {
      textarea.style.overflow = 'auto';
      // Restore scroll position if content was scrolled
      textarea.scrollTop = scrollTop;
    } else {
      textarea.style.overflow = 'hidden';
    }
  }, [minHeight, maxHeight]);

  /**
   * Handle input changes with auto-resize
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Adjust height after state update
    setTimeout(adjustHeight, 0);
  }, [onChange, adjustHeight]);

  /**
   * Handle focus event to ensure proper height
   */
  const handleFocus = useCallback(() => {
    adjustHeight();
  }, [adjustHeight]);

  /**
   * Handle paste events for large content
   */
  const handlePaste = useCallback(() => {
    // Delay to allow paste content to be processed
    setTimeout(adjustHeight, 10);
  }, [adjustHeight]);

  // Adjust height when value changes externally (e.g., form reset)
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Initial height adjustment on mount
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  // Generate unique ID for accessibility
  const textareaId = `auto-resize-textarea-${Math.random().toString(36).substr(2, 9)}`;
  const helpTextId = helpText ? `${textareaId}-help` : undefined;

  return (
    <div className="auto-resize-textarea-container">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={textareaRef}
        id={textareaId}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          block w-full border-gray-300 rounded-md shadow-sm 
          focus:border-blue-500 focus:ring-blue-500 
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-none transition-all duration-200 ease-in-out
          ${className}
        `}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflow: 'hidden'
        }}
        aria-describedby={helpTextId}
        aria-label={label || "Auto-resizing text area"}
      />
      
      {helpText && (
        <div id={helpTextId} className="mt-1 text-xs text-gray-500">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default AutoResizeTextarea;