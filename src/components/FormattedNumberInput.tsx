import React, { useState, useEffect } from 'react';
import { formatNumber } from '../utils/formatHelpers';

interface FormattedNumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  suffix?: string;
  disabled?: boolean;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "",
  label,
  suffix,
  disabled = false
}) => {
  // State for raw (unformatted) value
  const [rawValue, setRawValue] = useState(value.toString());
  
  // Format display value
  const displayValue = rawValue ? formatNumber(rawValue) : '';

  // Update raw value when prop changes
  useEffect(() => {
    setRawValue(value.toString());
  }, [value]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    const numeric = e.target.value.replace(/[^\d]/g, '');
    setRawValue(numeric);
    onChange(numeric);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 
            border border-gray-300 dark:border-gray-600 
            rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            text-gray-900 dark:text-white 
            bg-white dark:bg-gray-700
            placeholder-gray-400 dark:placeholder-gray-500
            ${suffix ? 'pr-12' : ''}
            ${className}
          `}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {suffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormattedNumberInput;
