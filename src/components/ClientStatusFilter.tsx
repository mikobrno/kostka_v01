import React from 'react';
import { ClientStatus, CLIENT_STATUSES } from '../types/clientStatus';
import ClientStatusBadge from './ClientStatusBadge';

interface ClientStatusFilterProps {
  selectedStatuses: ClientStatus[];
  onChange: (statuses: ClientStatus[]) => void;
  className?: string;
}

const ClientStatusFilter: React.FC<ClientStatusFilterProps> = ({
  selectedStatuses,
  onChange,
  className = ''
}) => {
  const toggleStatus = (status: ClientStatus) => {
    const isSelected = selectedStatuses.includes(status);
    if (isSelected) {
      onChange(selectedStatuses.filter(s => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const toggleAll = () => {
    if (selectedStatuses.length === CLIENT_STATUSES.length) {
      onChange([]);
    } else {
      onChange(CLIENT_STATUSES.map(s => s.id));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filtrovat podle stavu</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleAll}
            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {selectedStatuses.length === CLIENT_STATUSES.length ? 'Zrušit vše' : 'Vybrat vše'}
          </button>
          {selectedStatuses.length > 0 && (
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Vymazat
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {CLIENT_STATUSES.map(status => (
          <ClientStatusBadge
            key={status.id}
            status={status.id}
            size="sm"
            onClick={() => toggleStatus(status.id)}
            className={`transition-all duration-200 ${
              selectedStatuses.includes(status.id)
                ? 'opacity-100 scale-100 ring-2 ring-blue-500 ring-opacity-50'
                : 'opacity-60 scale-95 hover:opacity-80 hover:scale-100'
            }`}
          />
        ))}
      </div>
      
      {selectedStatuses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Zobrazeno: {selectedStatuses.length} z {CLIENT_STATUSES.length} stavů
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientStatusFilter;
