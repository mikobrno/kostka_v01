import React from 'react';
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
  const addChild = () => {
    const newChild: Child = {
      id: Date.now(),
      name: '',
      birthDate: ''
    };
    onChange([...children, newChild]);
  };

  const removeChild = (id: number) => {
    onChange(children.filter(child => child.id !== id));
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
        <h4 className="text-md font-medium text-gray-900">Děti</h4>
      </div>

      {children.map((child, index) => (
        <div key={child.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-sm font-medium text-blue-900">
              Dítě #{index + 1}
            </h5>
            <button
              onClick={() => removeChild(child.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Jméno a příjmení
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Jméno dítěte"
                />
                <CopyButton text={child.name} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Datum narození
              </label>
              <div className="flex">
                <input
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(child.id, 'birthDate', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <CopyButton text={child.birthDate} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Věk
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md border border-gray-300">
                <span className="text-sm text-gray-600">
                  {child.age ? `${child.age} let` : 'Zadejte datum'}
                </span>
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
    </div>
  );
};