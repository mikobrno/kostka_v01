import React from 'react';
import { AdminService } from '../../services/adminService';
import { CopyButton } from '../CopyButton';
import { Plus, Trash2 } from 'lucide-react';

interface LiabilitiesInfoProps {
  data: any[];
  onChange: (data: any[]) => void;
}

export const LiabilitiesInfo: React.FC<LiabilitiesInfoProps> = ({ data = [], onChange }) => {
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
    onChange(data.filter(item => item.id !== id));
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
              onClick={() => removeLiability(liability.id)}
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
                <input
                  type="number"
                  value={liability.amount || ''}
                  onChange={(e) => updateLiability(liability.id, 'amount', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="500000"
                  min="0"
                />
                <CopyButton text={liability.amount || ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Splátka (Kč)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={liability.payment || ''}
                  onChange={(e) => updateLiability(liability.id, 'payment', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="5000"
                  min="0"
                />
                <CopyButton text={liability.payment || ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zůstatek (Kč)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={liability.balance || ''}
                  onChange={(e) => updateLiability(liability.id, 'balance', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="450000"
                  min="0"
                />
                <CopyButton text={liability.balance || ''} />
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
    </div>
  );
};