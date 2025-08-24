import React from 'react';
import { User } from 'lucide-react';
import InlineEditableCopy from './InlineEditableCopy';

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

  // If no full name, render nothing
  if (!fullName) return null;

  // For icon variant, render a small InlineEditableCopy but visually as an icon button
  if (variant === 'icon') {
    return (
      <InlineEditableCopy
        value={fullName}
        className={`p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${className}`}
      />
    );
  }

  // Default: render a button-like InlineEditableCopy with user icon
  return (
    <div className={`inline-flex items-center ${className}`}>
      <User className="w-4 h-4 mr-2 text-gray-500" />
      <InlineEditableCopy value={fullName} className="" />
    </div>
  );
};

export default FullNameCopyButton;