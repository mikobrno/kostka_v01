import React, { useState } from 'react';
import { Copy, Check, User } from 'lucide-react';

interface FullNameCopyButtonProps {
  title?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Enhanced Copy Button for Full Name (Title + First Name + Last Name)
 * 
 * This component combines title, first name, and last name into a properly
 * formatted string and provides one-click copying functionality.
 * 
 * Features:
 * - Combines title + firstName + lastName with proper spacing
 * - Handles missing fields gracefully
 * - Visual feedback on successful copy
 * - Accessible design with proper ARIA labels
 * - Two display variants: full button or icon-only
 */
export const FullNameCopyButton: React.FC<FullNameCopyButtonProps> = ({ 
  title = '', 
  firstName = '', 
  lastName = '', 
  className = '',
  variant = 'button'
}) => {
  const [copied, setCopied] = useState(false);

  // Combine title, first name, and last name with proper formatting
  const getFullName = (): string => {
    const nameParts = [
      title?.trim(),
      firstName?.trim(), 
      lastName?.trim()
    ].filter(Boolean); // Remove empty/undefined parts
    
    return nameParts.join(' ');
  };

  const fullName = getFullName();

  const handleCopy = async () => {
    if (!fullName) {
      console.warn('No name data available to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(fullName);
      setCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
      
      console.log('Full name copied to clipboard:', fullName);
    } catch (error) {
      console.error('Failed to copy full name to clipboard:', error);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = fullName;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
      }
    }
  };

  // Don't render if no name data is available
  if (!fullName) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200 ${
          copied ? 'text-green-600 bg-green-100' : ''
        } ${className}`}
        title={copied ? `Zkopírováno: ${fullName}` : `Kopírovat celé jméno: ${fullName}`}
        aria-label={copied ? 'Jméno zkopírováno' : 'Kopírovat celé jméno'}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      disabled={!fullName}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
        copied ? 'bg-green-100 text-green-700 border-green-300' : ''
      } ${className}`}
      title={copied ? `Zkopírováno: ${fullName}` : `Kopírovat: ${fullName}`}
      aria-label={copied ? 'Celé jméno zkopírováno' : 'Kopírovat celé jméno'}
    >
      <User className="w-4 h-4 mr-2" />
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Zkopírováno!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Kopírovat jméno
        </>
      )}
    </button>
  );
};

export default FullNameCopyButton;