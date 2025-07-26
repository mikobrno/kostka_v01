import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Nepodařilo se zkopírovat text:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className={`px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
        copied ? 'bg-green-100 text-green-600 border-green-300' : ''
      } ${className}`}
      style={{ 
        borderTopRightRadius: '0.375rem', 
        borderBottomRightRadius: '0.375rem' 
      }}
      title={copied ? 'Zkopírováno!' : 'Kopírovat do schránky'}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};