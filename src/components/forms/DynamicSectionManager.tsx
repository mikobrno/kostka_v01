import React, { useState, useEffect } from 'react';
import { DynamicSectionService, DynamicSection as DynamicSectionType } from '../../services/dynamicSectionService';
import { DynamicSection } from './DynamicSection';
import { Plus, Layers, Edit, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface DynamicSectionManagerProps {
  clientId: string;
  toast?: ReturnType<typeof useToast>;
}

export const DynamicSectionManager: React.FC<DynamicSectionManagerProps> = ({
  clientId,
  toast
}) => {
  const [sections, setSections] = useState<DynamicSectionType[]>([]);
  const [activeDynamicSectionId, setActiveDynamicSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // Load dynamic sections
  useEffect(() => {
    if (clientId && clientId !== 'undefined') {
      loadSections();
    }
  }, [clientId]);

  const loadSections = async () => {
    if (!clientId || clientId === 'undefined') {
      console.warn('⚠️ Invalid clientId for loading dynamic sections:', clientId);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Loading dynamic sections for client:', clientId);
      const { data, error } = await DynamicSectionService.getDynamicSections(clientId);
      if (error) {
        console.error('Error loading dynamic sections:', error);
        // Don't show error if table doesn't exist yet (migration not run)
        if (error.message?.includes('relation "client_dynamic_sections" does not exist')) {
          console.warn('⚠️ Dynamic sections table does not exist yet. Migration may not have been run.');
          setSections([]);
        } else {
          toast?.showError('Chyba při načítání', 'Nepodařilo se načíst dynamické sekce');
        }
        return;
      }
      setSections(data || []);
      console.log('✅ Dynamic sections loaded successfully:', data?.length || 0);
      
      // Set first section as active if no active section is set
      if (data && data.length > 0 && !activeDynamicSectionId) {
        setActiveDynamicSectionId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading dynamic sections:', error);
      // Don't show error toast for missing table
      if (!error.message?.includes('relation "client_dynamic_sections" does not exist')) {
        toast?.showError('Chyba při načítání', 'Nepodařilo se načíst dynamické sekce');
      }
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast?.showWarning('Název je povinný', 'Zadejte název nové sekce');
      return;
    }

    try {
      const orderIndex = await DynamicSectionService.getNextOrderIndex(clientId);
      const { data, error } = await DynamicSectionService.createDynamicSection(
        clientId,
        newSectionName.trim(),
        orderIndex
      );

      if (error) {
        throw new Error(error.message || 'Chyba při vytváření sekce');
      }

      if (data) {
        setSections(prev => [...prev, data]);
        setActiveDynamicSectionId(data.id); // Make new section active
        setNewSectionName('');
        setShowAddModal(false);
        toast?.showSuccess('Sekce vytvořena', `Sekce "${data.section_name}" byla úspěšně přidána`);
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast?.showError('Chyba při vytváření', error.message);
    }
  };

  const handleUpdateSection = async (sectionId: string, updates: any) => {
    try {
      const { data, error } = await DynamicSectionService.updateDynamicSection(sectionId, updates);
      if (error) {
        throw new Error(error.message || 'Chyba při aktualizaci sekce');
      }

      if (data) {
        setSections(prev => prev.map(section => 
          section.id === sectionId ? data : section
        ));
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast?.showError('Chyba při aktualizaci', error.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const { error } = await DynamicSectionService.deleteDynamicSection(sectionId);
      if (error) {
        throw new Error(error.message || 'Chyba při mazání sekce');
      }

      const updatedSections = sections.filter(section => section.id !== sectionId);
      setSections(updatedSections);
      
      // If deleted section was active, set new active section
      if (activeDynamicSectionId === sectionId) {
        if (updatedSections.length > 0) {
          // Set first remaining section as active
          setActiveDynamicSectionId(updatedSections[0].id);
        } else {
          // No sections left
          setActiveDynamicSectionId(null);
        }
      }
      
      toast?.showSuccess('Sekce smazána', 'Sekce byla úspěšně odstraněna');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast?.showError('Chyba při mazání', error.message);
    }
  };

  const handleRenameSectionStart = (sectionId: string, currentName: string) => {
    setEditingSectionId(sectionId);
    setEditingSectionName(currentName);
  };

  const handleRenameSectionSave = async () => {
    if (!editingSectionId || !editingSectionName.trim()) return;
    
    try {
      await handleUpdateSection(editingSectionId, { section_name: editingSectionName.trim() });
      setEditingSectionId(null);
      setEditingSectionName('');
      toast?.showSuccess('Název sekce změněn', 'Název byl úspěšně aktualizován');
    } catch (error) {
      console.error('Error renaming section:', error);
      toast?.showError('Chyba při přejmenování', error.message);
    }
  };

  const handleRenameSectionCancel = () => {
    setEditingSectionId(null);
    setEditingSectionName('');
  };

  // Get currently active section
  const activeSection = sections.find(section => section.id === activeDynamicSectionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Načítám dynamické sekce...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        /* No sections - show empty state */
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné vlastní sekce</h3>
          <p className="text-gray-500 mb-6">
            Přidejte vlastní sekce pro organizaci specifických informací o klientovi
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Přidat první sekci
          </button>
        </div>
      ) : (
        /* Sections exist - show tabbed interface */
        <>
          {/* Horizontal Section Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center">
                  {editingSectionId === section.id ? (
                    /* Editing section name */
                    <div className="flex items-center space-x-2 px-3 py-2 border-b-2 border-purple-500">
                      <input
                        type="text"
                        value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 w-32"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSectionSave();
                          if (e.key === 'Escape') handleRenameSectionCancel();
                        }}
                        autoFocus
                        onBlur={handleRenameSectionSave}
                      />
                      <button
                        onClick={handleRenameSectionSave}
                        className="text-green-600 hover:text-green-800"
                        title="Uložit"
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                      <button
                        onClick={handleRenameSectionCancel}
                        className="text-gray-600 hover:text-gray-800"
                        title="Zrušit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    /* Normal section tab */
                    <button
                      onClick={() => setActiveDynamicSectionId(section.id)}
                      className={`group flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeDynamicSectionId === section.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{section.section_name}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameSectionStart(section.id, section.section_name);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Přejmenovat sekci"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Opravdu chcete smazat sekci "${section.section_name}"?`)) {
                              handleDeleteSection(section.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600"
                          title="Smazat sekci"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add New Section Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300 font-medium text-sm transition-colors whitespace-nowrap"
                title="Přidat novou sekci"
              >
                <Plus className="w-4 h-4" />
                <span>Přidat sekci</span>
              </button>
            </div>
          </div>

          {/* Active Section Content */}
          <div className="mt-6">
            {activeSection ? (
              <DynamicSection
                key={activeSection.id}
                section={activeSection}
                onUpdate={handleUpdateSection}
                onDelete={handleDeleteSection}
                toast={toast}
                hideHeader={true} // Hide the section header since we show it in tabs
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Vyberte sekci</h3>
                <p className="text-gray-500">
                  Klikněte na záložku výše pro zobrazení obsahu sekce
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Přidat novou sekci
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Název sekce
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Např. Dodatečné informace, Speciální požadavky..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection();
                    if (e.key === 'Escape') setShowAddModal(false);
                  }}
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSectionName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleAddSection}
                  disabled={!newSectionName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Přidat sekci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};