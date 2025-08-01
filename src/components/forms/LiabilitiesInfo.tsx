import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { CopyButton } from '../CopyButton';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { Plus, Trash2 } from 'lucide-react';

interface LiabilitiesInfoProps {
  data: any[];
  onChange: (data: any[]) => void;
}

export const LiabilitiesInfo: React.FC<LiabilitiesInfoProps> = ({ data = [], onChange }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [adminLists, setAdminLists] = React.useState({
    institutions: [],
    liabilityTypes: []
  });

  // Načtení admin seznamů ze Supabase
  React.useEffect(() => {
    const loadAdminLists = async () => {
      try {
        const { data, error } = await AdminService.getAdminLists();
        if (error) {
          console.error('Chyba při načítání admin seznamů:', error);
          return;
        }

        if (data) {
          const lists = {
            institutions: [],
            liabilityTypes: []
          };

          data.forEach(item => {
            switch (item.list_type) {
              case 'institutions':
                lists.institutions = item.items;
                break;
              case 'liability_types':
                lists.liabilityTypes = item.items;
                break;
            }
          });

          setAdminLists(lists);
        }
      } catch (error) {
        console.error('Chyba při načítání admin seznamů:', error);
      }
    };

    loadAdminLists();
  }, []);

  const addLiability = () => {
    const newLiability = {
      id: Date.now(),
      institution: '',
      type: '',
      amount: '',
      payment: '',
      balance: ''
    };
    onChange([...data, newLiability]);
  };

  const removeLiability = (id: number) => {
    setShowDeleteConfirm(null);
    onChange(data.filter(item => item.id !== id));
  };

  const handleDeleteLiability = (id: number) => {
    setShowDeleteConfirm(id);
  };

  const updateLiability = (id: number, field: string, value: any) => {
    onChange(data.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Trash2 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné závazky</h3>
        <p className="text-gray-500 mb-6">Přidejte závazky klienta pomocí tlačítka níže.</p>
        <button
          onClick={addLiability}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat závazek
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((liability, index) => (
        <div key={liability.id} className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Závazek #{index + 1}
            </h4>
            <button
              onClick={() => handleDeleteLiability(liability.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instituce
              </label>
              <div className="flex">
                <select
                  value={liability.institution || ''}
                  onChange={(e) => updateLiability(liability.id, 'institution', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Vyberte instituci</option>
                  {adminLists.institutions.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
                <CopyButton text={liability.institution || ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ závazku
              </label>
              <div className="flex">
                <select
                  value={liability.type || ''}
                  onChange={(e) => updateLiability(liability.id, 'type', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Vyberte typ</option>
                  {adminLists.liabilityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <CopyButton text={liability.type || ''} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Výše úvěru (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.amount || ''}
                  onChange={(value) => updateLiability(liability.id, 'amount', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="500 000"
                />
                <CopyButton text={liability.amount ? formatNumber(liability.amount) : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Splátka (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.payment || ''}
                  onChange={(value) => updateLiability(liability.id, 'payment', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="5 000"
                />
                <CopyButton text={liability.payment ? formatNumber(liability.payment) : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zůstatek (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.balance || ''}
                  onChange={(value) => updateLiability(liability.id, 'balance', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="450 000"
                />
                <CopyButton text={liability.balance ? formatNumber(liability.balance) : ''} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addLiability}
        className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Přidat další závazek
      </button>

      {/* Delete Confirmation Modal for Liabilities */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Smazat závazek
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tento závazek? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => removeLiability(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};