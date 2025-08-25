import React, { useState } from 'react';
import { AdminService } from '../services/adminService';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface AdminPanelProps {
  toast?: ReturnType<typeof useToast>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ toast }) => {
  type ManagedListItem = { name: string; items: string[]; isAdvanced?: boolean };
  type ManagedLists = Record<string, ManagedListItem>;

  const [activeList, setActiveList] = useState<string>('titles');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [managedLists, setManagedLists] = useState<ManagedLists>({} as ManagedLists);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{listKey: string, index: number} | null>(null);

  const defaultLists: ManagedLists = {
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
      items: [],
      isAdvanced: true // Flag pro speciální handling
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
        // map DB list_type (snake_case) to frontend keys
        const frontendToDb: Record<string, string> = {
          titles: 'titles',
          maritalStatuses: 'marital_statuses',
          documentTypes: 'document_types',
          banks: 'banks',
          institutions: 'institutions',
          liabilityTypes: 'liability_types',
          advisors: 'advisors',
          citizenships: 'citizenships',
          housingTypes: 'housing_types'
        };

        const dbToFrontend: Record<string, string> = Object.fromEntries(
          Object.entries(frontendToDb).map(([k, v]) => [v, k])
        );

        const updatedLists: ManagedLists = { ...defaultLists };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((item: any) => {
          const frontKey = dbToFrontend[item.list_type] || item.list_type;
          if (updatedLists[frontKey]) {
            updatedLists[frontKey].items = item.items;
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
    
    setManagedLists((prev: ManagedLists) => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: [...prev[listKey].items, newItem.trim()]
      }
    }));
    setNewItem('');
  };

  const removeItem = (listKey: string, index: number) => {
    setManagedLists((prev: ManagedLists) => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: prev[listKey].items.filter((_, i: number) => i !== index)
      }
    }));
  };

  const updateItem = (listKey: string, index: number, value: string) => {
    setManagedLists((prev: ManagedLists) => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        items: prev[listKey].items.map((item: string, i: number) => i === index ? value : item)
      }
    }));
  };

  const saveAdminList = async (listKey: string) => {
    setLoading(true);
    try {
      console.log('🔄 Ukládání seznamu:', listKey, 'položky:', managedLists[listKey].items);

      // Map frontend list key to DB list_type (snake_case). If not present, disallow saving to DB.
      const frontendToDb: Record<string, string> = {
        titles: 'titles',
        maritalStatuses: 'marital_statuses',
        documentTypes: 'document_types',
        banks: 'banks',
        institutions: 'institutions',
        liabilityTypes: 'liability_types',
        advisors: 'advisors',
        citizenships: 'citizenships',
        housingTypes: 'housing_types'
      };

      const dbListType = frontendToDb[listKey];
      if (!dbListType) {
        // This list is not backed by DB schema CHECK — avoid attempting to upsert
        const msg = 'Tento seznam nelze ukládat do databáze (není povolen v DB)';
        console.error(msg, listKey);
        toast?.showError('Nelze uložit', msg);
        setLoading(false);
        return;
      }

      const { data, error } = await AdminService.updateAdminList(dbListType, managedLists[listKey].items);
      if (error) {
        console.error('❌ Chyba při ukládání:', error);
        throw new Error(error.message || 'Chyba při ukládání');
      }
      console.log('✅ Úspěšně uloženo:', data);
      toast?.showSuccess('Seznam uložen', `${managedLists[listKey].name} byl úspěšně aktualizován`);
    } catch (error) {
      console.error('Chyba při ukládání:', error);
  const msg = (error && (error as Error).message) ? (error as Error).message : String(error);
  toast?.showError('Chyba při ukládání', msg);
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
              {activeList === 'advisors' ? (
                <AdvisorManager
                  advisors={managedLists[activeList].items}
                  onUpdate={(newAdvisors) => {
                    setManagedLists(prev => ({
                      ...prev,
                      [activeList]: {
                        ...prev[activeList],
                        items: newAdvisors
                      }
                    }));
                  }}
                  toast={toast}
                />
              ) : (
                <>
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
                </>
              )}
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

// Speciální komponenta pro správu doporučitelů se dvěma poli
interface AdvisorManagerProps {
  advisors: string[];
  onUpdate: (advisors: string[]) => void;
  toast?: ReturnType<typeof useToast>;
}

const AdvisorManager: React.FC<AdvisorManagerProps> = ({ advisors, onUpdate, toast }) => {
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [newAdvisorNumber, setNewAdvisorNumber] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');

  const parseAdvisor = (advisor: string) => {
    const parts = advisor.split(' - ');
    return {
      name: parts[0] || '',
      number: parts.slice(1).join(' - ') || ''
    };
  };

  const addAdvisor = () => {
    if (!newAdvisorName.trim() || !newAdvisorNumber.trim()) {
      toast?.showError('Chyba', 'Vyplňte jméno i agenturní číslo');
      return;
    }

    const newAdvisor = `${newAdvisorName.trim()} - ${newAdvisorNumber.trim()}`;
    onUpdate([...advisors, newAdvisor]);
    setNewAdvisorName('');
    setNewAdvisorNumber('');
    toast?.showSuccess('Přidáno', 'Doporučitel byl úspěšně přidán');
  };

  const removeAdvisor = (index: number) => {
    const updated = advisors.filter((_, i) => i !== index);
    onUpdate(updated);
    toast?.showSuccess('Smazáno', 'Doporučitel byl odebrán');
  };

  const startEdit = (index: number) => {
    const advisor = parseAdvisor(advisors[index]);
    setEditingIndex(index);
    setEditName(advisor.name);
    setEditNumber(advisor.number);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editNumber.trim()) {
      toast?.showError('Chyba', 'Vyplňte jméno i agenturní číslo');
      return;
    }

    const updatedAdvisor = `${editName.trim()} - ${editNumber.trim()}`;
    const updated = advisors.map((advisor, i) => 
      i === editingIndex ? updatedAdvisor : advisor
    );
    onUpdate(updated);
    setEditingIndex(null);
    setEditName('');
    setEditNumber('');
    toast?.showSuccess('Uloženo', 'Doporučitel byl úspěšně upraven');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditNumber('');
  };

  return (
    <div className="space-y-4">
      {/* Seznam existujících doporučitelů */}
      <div className="space-y-3">
        {advisors.map((advisor, index) => {
          const parsed = parseAdvisor(advisor);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              {editingIndex === index ? (
                <div className="flex space-x-3 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Jméno a příjmení"
                  />
                  <input
                    type="text"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-32 block border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Číslo"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Uložit"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title="Zrušit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{parsed.name}</div>
                    <div className="text-sm text-gray-500">Agenturní číslo: {parsed.number}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(index)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Upravit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeAdvisor(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulář pro přidání nového doporučitele */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={newAdvisorName}
            onChange={(e) => setNewAdvisorName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAdvisor()}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Jméno a příjmení"
          />
          <input
            type="text"
            value={newAdvisorNumber}
            onChange={(e) => setNewAdvisorNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAdvisor()}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Agenturní číslo"
          />
          <button
            onClick={addAdvisor}
            disabled={!newAdvisorName.trim() || !newAdvisorNumber.trim()}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Přidat doporučitele
          </button>
        </div>
      </div>
    </div>
  );
};