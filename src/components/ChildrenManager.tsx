import React, { useState } from 'react';
import { CopyButton } from './CopyButton';
import { Plus, Trash2, Baby } from 'lucide-react';

interface Child {
  id: number;
  name: string;
  birthDate: string;
  age?: number;
}

interface ChildrenManagerProps {
  children: Child[];
  onChange: (children: Child[]) => void;
}

export const ChildrenManager: React.FC<ChildrenManagerProps> = ({ children = [], onChange }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const addChild = () => {
    const newChild: Child = {
      id: Date.now(),
      name: '',
      birthDate: ''
    };
    onChange([...children, newChild]);
  };

  const removeChild = (id: number) => {
    setShowDeleteConfirm(null);
    onChange(children.filter(child => child.id !== id));
  };

  const handleDeleteChild = (id: number) => {
    setShowDeleteConfirm(id);
  };

  const updateChild = (id: number, field: string, value: string) => {
    const updated = children.map(child => {
      if (child.id === id) {
        const updatedChild = { ...child, [field]: value };
        
        // Automatický výpočet věku
        if (field === 'birthDate' && value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          updatedChild.age = age;
        }
        
        return updatedChild;
      }
      return child;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Baby className="w-5 h-5 text-blue-600" />
        <h4 className="text-md font-medium text-gray-900 dark:text-white">Děti</h4>
      </div>

      {children.map((child, index) => (
        <div key={child.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Dítě #{index + 1}
            </h5>
            <button
              onClick={() => handleDeleteChild(child.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jméno a příjmení
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Jméno dítěte"
                />
                <CopyButton text={child.name} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum narození
              </label>
              <div className="flex">
                <input
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(child.id, 'birthDate', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <CopyButton text={child.birthDate} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Věk
              </label>
              <div className="flex">
                <div className="flex-1 flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-l-md border border-gray-300 dark:border-gray-600">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {child.age ? `${child.age} let` : 'Zadejte datum'}
                  </span>
                </div>
                <CopyButton text={child.age ? `${child.age} let` : ''} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addChild}
        className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Přidat dítě
      </button>

      {/* Delete Confirmation Modal for Children */}
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
                Smazat dítě
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tento záznam o dítěti? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => removeChild(showDeleteConfirm)}
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