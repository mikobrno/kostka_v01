import React, { useState } from 'react';
import { AdminService } from '../services/adminService';
import { Plus, Edit, Trash2, Save, Settings, Globe, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface AdminPanelProps {
  toast?: ReturnType<typeof useToast>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ toast }) => {
  const [activeList, setActiveList] = useState('titles');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [managedLists, setManagedLists] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{listKey: string, index: number} | null>(null);

  const defaultLists = {
    titles: {
      name: 'Tituly',
      items: ['Bc.', 'Mgr.', 'Ing.', 'MUDr.', 'JUDr.', 'PhDr.', 'RNDr.', 'Dr.']
    },
    maritalStatuses: {
      name: 'Rodinné stavy',
      items: ['svobodný/á', 'ženatý/vdaná', 'rozvedený/á', 'vdovec/vdova', 'partnerský svazek']
    },
    documentTypes: {
      name: 'Typy dokladů',
      items: ['občanský průkaz', 'pas', 'řidičský průkaz']
    },
    banks: {
      name: 'Banky',
      items: ['Česká spořitelna', 'Komerční banka', 'ČSOB', 'UniCredit Bank', 'Raiffeisenbank']
    },
    institutions: {
      name: 'Instituce (závazky)',
      items: ['Česká spořitelna', 'Komerční banka', 'ČSOB', 'Cetelem', 'Home Credit']
    },
    liabilityTypes: {
      name: 'Typy závazků',
      items: ['hypotéka', 'spotřebitelský úvěr', 'kreditní karta', 'kontokorent', 'leasing']
    },
    citizenships: {
      name: 'Občanství',
      items: ['Česká republika', 'Slovenská republika', 'Německo', 'Rakousko', 'Polsko', 'Maďarsko', 'Ukrajina', 'Rusko', 'Jiné']
    },
    advisors: {
      name: 'Doporučitelé',
      items: ['Jan Novák - 12345', 'Marie Svobodová - 67890', 'Petr Dvořák - 54321']
    },
    housingTypes: {
      name: 'Druhy bydlení',
      items: ['vlastní byt', 'vlastní dům', 'nájemní byt', 'nájemní dům', 'družstevní byt', 'služební byt', 'u rodičů/příbuzných', 'jiné']
    },
    educationLevels: {
      name: 'Úrovně vzdělání',
      items: ['Základní', 'Vyučen', 'Vyučen s maturitou', 'Středoškolské', 'Vyšší odborné', 'Vysokoškolské - bakalářské', 'Vysokoškolské - magisterské', 'Vysokoškolské - doktorské', 'Bez vzdělání']
    }
  };

  // Načtení dat ze Supabase při načtení komponenty
  React.useEffect(() => {
    // Inicializace s výchozími hodnotami
    setManagedLists(defaultLists);
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const { data, error } = await AdminService.getAdminLists();
      if (error) {
        console.error('Chyba při načítání admin dat:', error);
        return;
      }

      if (data) {
        const updatedLists = { ...defaultLists };
        data.forEach(item => {
          if (updatedLists[item.list_type]) {
            updatedLists[item.list_type].items = item.items;
          }
        });
        setManagedLists(updatedLists);
      }
    } catch (error) {
      console.error('Chyba při načítání admin dat:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (listKey: string) => {
    if (!newItem.trim()) return;
    
    setManagedLists(prev => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: [...prev[listKey].items, newItem.trim()]
      }
    }));
    setNewItem('');
  };

  const removeItem = (listKey: string, index: number) => {
    setManagedLists(prev => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: prev[listKey].items.filter((_, i) => i !== index)
      }
    }));
  };

  const updateItem = (listKey: string, index: number, value: string) => {
    setManagedLists(prev => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: prev[listKey].items.map((item, i) => i === index ? value : item)
      }
    }));
  };

  const saveAdminList = async (listKey: string) => {
    setLoading(true);
    try {
      const { data, error } = await AdminService.updateAdminList(listKey, managedLists[listKey].items);
      if (error) {
        throw new Error(error.message || 'Chyba při ukládání');
      }
      toast?.showSuccess('Seznam uložen', `${managedLists[listKey].name} byl úspěšně aktualizován`);
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      toast?.showError('Chyba při ukládání', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrace</h1>
        <p className="text-lg text-gray-600">Správa dropdown seznamů a nastavení aplikace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {Object.entries(managedLists).length > 0 && Object.entries(managedLists).map(([key, list]) => (
              <button
                key={key}
                onClick={() => setActiveList(key)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeList === key
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {list.name}
                <span className="float-right text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {list.items.length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3">
          {managedLists[activeList] && (
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {managedLists[activeList].name}
              </h2>
              <button
                onClick={() => saveAdminList(activeList)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Ukládám...' : 'Uložit změny'}
              </button>
            </div>

            <div className="space-y-3">
              {managedLists[activeList].items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {editingItem === `${activeList}-${index}` ? (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(activeList, index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingItem(null);
                          e.preventDefault();
                        } else if (e.key === 'Escape') {
                          setEditingItem(null);
                          e.preventDefault();
                        }
                      }}
                      className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      autoFocus
                      onBlur={(e) => {
                        // Only close editing if clicking outside the input area
                        setTimeout(() => {
                          if (!e.target.contains(document.activeElement)) {
                            setEditingItem(null);
                          }
                        }, 100);
                      }}
                    />
                  ) : (
                    <span className="flex-1 text-gray-900">{item}</span>
                  )}
                  
                  <div className="flex space-x-2">
                    {editingItem === `${activeList}-${index}` ? (
                      <>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Uložit změny"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Reset to original value and close editing
                            setManagedLists(prev => ({
                              ...prev,
                              [activeList]: {
                                ...prev[activeList],
                                items: prev[activeList].items
                              }
                            }));
                            setEditingItem(null);
                          }}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Zrušit úpravy"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingItem(`${activeList}-${index}`)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Upravit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(activeList, index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex space-x-3 pt-4 border-t">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem(activeList)}
                  className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={`Přidat novou položku do ${managedLists[activeList].name.toLowerCase()}`}
                />
                <button
                  onClick={() => addItem(activeList)}
                  disabled={!newItem.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Přidat
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal for Admin Items */}
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
                Smazat položku
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tuto položku ze seznamu? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => removeItem(showDeleteConfirm.listKey, showDeleteConfirm.index)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informace o Supabase */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          📊 Databáze: Supabase
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <strong>Výhody Supabase:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Realtime synchronizace dat</li>
              <li>Automatické zálohování</li>
              <li>Row Level Security (RLS)</li>
              <li>PostgreSQL databáze</li>
            </ul>
          </div>
          <div>
            <strong>Bezpečnost:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Každý uživatel vidí pouze svá data</li>
              <li>Šifrované připojení (HTTPS)</li>
              <li>Autentizace pomocí JWT tokenů</li>
              <li>API rate limiting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};