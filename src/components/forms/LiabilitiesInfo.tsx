import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import { CopyButton } from '../CopyButton';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { Plus, Trash2, Save, Check } from 'lucide-react';

interface LiabilitiesInfoProps {
  data: any[];
  onChange: (data: any[]) => void;
  clientId?: string | number;
  toast?: any;
}

export const LiabilitiesInfo: React.FC<LiabilitiesInfoProps> = ({ data = [], onChange, clientId, toast }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

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
      balance: '',
      poznamky: ''
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

  const saveLiability = async (liabilityId: number) => {
    if (!clientId) {
      toast?.showError('Chyba', 'Není dostupné ID klienta pro uložení závazku');
      return;
    }

    setSaving(liabilityId);
    try {
      // Najdi specifický závazek
      const liability = data.find(item => item.id === liabilityId);
      if (!liability) {
        throw new Error('Závazek nebyl nalezen');
      }

      // Aktualizuj přímo v supabase tabulce clients
      const { error } = await supabase
        .from('clients')
        .update({ liabilities: data })
        .eq('id', String(clientId));

      if (error) {
        throw new Error(error.message || 'Chyba při ukládání závazku');
      }

      setSaved(liabilityId);
      toast?.showSuccess('Uloženo', `Závazek #${data.findIndex(item => item.id === liabilityId) + 1} byl úspěšně uložen`);
      
      // Skryj ikonku checkmarku po 2 sekundách
      setTimeout(() => {
        setSaved(null);
      }, 2000);
    } catch (error) {
      console.error('Chyba při ukládání závazku:', error);
      toast?.showError('Chyba', error instanceof Error ? error.message : 'Nepodařilo se uložit závazek');
    } finally {
      setSaving(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <Trash2 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Žádné závazky</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Přidejte závazky klienta pomocí tlačítka níže.</p>
        <button
          onClick={addLiability}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
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
        <div key={liability.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Závazek #{index + 1}
            </h4>
            <div className="flex items-center space-x-2">
              {/* Tlačítko pro uložení */}
              <button
                onClick={() => saveLiability(liability.id)}
                disabled={saving === liability.id}
                className="p-1 text-blue-600 hover:text-blue-800 disabled:text-blue-400 transition-colors"
                title="Uložit závazek"
              >
                {saving === liability.id ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : saved === liability.id ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
              
              {/* Tlačítko pro smazání */}
              <button
                onClick={() => handleDeleteLiability(liability.id)}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                title="Smazat závazek"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instituce
              </label>
              <div className="flex">
                <select
                  value={liability.institution || ''}
                  onChange={(e) => updateLiability(liability.id, 'institution', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  title="Vyberte instituci"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ závazku
              </label>
              <div className="flex">
                <select
                  value={liability.type || ''}
                  onChange={(e) => updateLiability(liability.id, 'type', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  title="Vyberte typ závazku"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Výše úvěru (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.amount || ''}
                  onChange={(value) => updateLiability(liability.id, 'amount', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="500 000"
                />
                <CopyButton text={liability.amount ? formatNumber(liability.amount) : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Splátka (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.payment || ''}
                  onChange={(value) => updateLiability(liability.id, 'payment', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="5 000"
                />
                <CopyButton text={liability.payment ? formatNumber(liability.payment) : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zůstatek (Kč)
              </label>
              <div className="flex">
                <FormattedNumberInput
                  value={liability.balance || ''}
                  onChange={(value) => updateLiability(liability.id, 'balance', value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="450 000"
                />
                <CopyButton text={liability.balance ? formatNumber(liability.balance) : ''} />
              </div>
            </div>
          </div>
          {/* Poznámka k závazku */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Poznámka
            </label>
            <textarea
              value={liability.poznamky || ''}
              onChange={e => updateLiability(liability.id, 'poznamky', e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Zde můžete zadat poznámku k závazku..."
              rows={2}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addLiability}
        className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Přidat další závazek
      </button>

      {/* Delete Confirmation Modal for Liabilities */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">
                Smazat závazek
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Opravdu chcete smazat tento závazek? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => removeLiability(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 border border-transparent rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
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