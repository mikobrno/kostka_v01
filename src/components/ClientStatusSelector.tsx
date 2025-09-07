import React, { useState } from 'react';
import { ClientStatus, CLIENT_STATUSES } from '../types/clientStatus';
import ClientStatusBadge from './ClientStatusBadge';
import { ChevronDown } from 'lucide-react';

interface ClientStatusSelectorProps {
  currentStatus: ClientStatus;
  onChange: (status: ClientStatus) => void;
  disabled?: boolean;
  className?: string;
}

const ClientStatusSelector: React.FC<ClientStatusSelectorProps> = ({
  currentStatus,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusSelect = (status: ClientStatus) => {
    onChange(status);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-sm'
        }`}
      >
        <ClientStatusBadge status={currentStatus} />
        {!disabled && (
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </button>

      {isOpen && !disabled && (
        <>
          {/* Overlay pro zavření */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              Změnit stav klienta
            </div>
            
            {CLIENT_STATUSES.map(status => (
              <button
                key={status.id}
                onClick={() => handleStatusSelect(status.id)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  status.id === currentStatus ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{status.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </div>
                    {status.id === currentStatus && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Aktuální stav
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientStatusSelector;
