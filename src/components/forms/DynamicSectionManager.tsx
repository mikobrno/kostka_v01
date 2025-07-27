import React, { useState, useEffect } from 'react';
import { DynamicSectionService, DynamicSection as DynamicSectionType } from '../../services/dynamicSectionService';
import { DynamicSection } from './DynamicSection';
import { Plus, Layers } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Load dynamic sections
  useEffect(() => {
    if (clientId) {
      loadSections();
    }
  }, [clientId]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await DynamicSectionService.getDynamicSections(clientId);
      if (error) {
        console.error('Error loading dynamic sections:', error);
        toast?.showError('Chyba při načítání', 'Nepodařilo se načíst dynamické sekce');
        return;
      }
      setSections(data || []);
    } catch (error) {
      console.error('Error loading dynamic sections:', error);
      toast?.showError('Chyba při načítání', 'Nepodařilo se načíst dynamické sekce');
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

      setSections(prev => prev.filter(section => section.id !== sectionId));
    } catch (error) {
      console.error('Error deleting section:', error);
      toast?.showError('Chyba při mazání', error.message);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Vlastní sekce</h2>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {sections.length} sekcí
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat sekci
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((section) => (
          <DynamicSection
            key={section.id}
            section={section}
            onUpdate={handleUpdateSection}
            onDelete={handleDeleteSection}
            toast={toast}
          />
        ))}

        {sections.length === 0 && (
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
        )}
      </div>

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