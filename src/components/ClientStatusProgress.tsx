import React from 'react';
import { ClientStatus, CLIENT_STATUSES } from '../types/clientStatus';

interface ClientStatusProgressProps {
  currentStatus: ClientStatus;
  onChange?: (status: ClientStatus) => void;
  readonly?: boolean;
  className?: string;
}

const ClientStatusProgress: React.FC<ClientStatusProgressProps> = ({
  currentStatus,
  onChange,
  readonly = false,
  className = ''
}) => {
  const currentStatusIndex = CLIENT_STATUSES.findIndex(s => s.id === currentStatus);

  return (
    <div className={`w-full bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Stav klienta</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {readonly ? 'Aktuální stav zpracování' : 'Klikněte na stav pro změnu'}
        </p>
      </div>
      
      <div className="flex items-center justify-between relative">
        {/* Propojovací čára - pozadí */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-300 dark:bg-gray-600 z-0"></div>
        
        {/* Propojovací čára - aktivní část */}
        <div 
          className={`absolute top-4 left-4 h-0.5 bg-blue-500 z-0 transition-all duration-500`}
          style={{ 
            width: currentStatusIndex > 0 
              ? `${(currentStatusIndex / (CLIENT_STATUSES.length - 1)) * 100}%` 
              : '0%' 
          }}
        ></div>

        {CLIENT_STATUSES.map((status, index) => {
          const isActive = status.id === currentStatus;
          const isCompleted = index <= currentStatusIndex;
          const isClickable = !readonly && onChange;

          return (
            <div
              key={status.id}
              className={`flex flex-col items-center z-10 transition-all duration-200 ${
                isClickable ? 'cursor-pointer hover:scale-105' : ''
              }`}
              onClick={() => isClickable && onChange(status.id)}
              title={status.label}
            >
              {/* Kroužek se stavem */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium border-2 transition-all duration-200 shadow-sm ${
                  isActive
                    ? `${status.bgColor} ${status.color} border-current shadow-md scale-110`
                    : isCompleted
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'
                }`}
              >
                {isCompleted && !isActive ? '✓' : status.icon}
              </div>

              {/* Popisek */}
              <span
                className={`mt-2 text-xs font-medium text-center transition-colors duration-200 ${
                  isActive
                    ? status.color
                    : isCompleted
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientStatusProgress;
