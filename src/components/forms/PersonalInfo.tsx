import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { CopyButton } from '../CopyButton';
import { AddressInput } from '../AddressInput';
import { ChildrenManager } from '../ChildrenManager';
import { Copy, Calendar, User, Plus, Trash2, Save, X, Edit } from 'lucide-react';

interface PersonalInfoProps {
  data: any;
  onChange: (data: any) => void;
  prefix: string;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange, prefix }) => {
  const [hasChildren, setHasChildren] = useState(false);

  const [adminLists, setAdminLists] = useState({
    titles: [],
    maritalStatuses: [],
    documentTypes: [],
    banks: [],
    citizenships: [
      'Česká republika',
      'Slovenská republika', 
      'Německo',
      'Rakousko',
      'Polsko',
      'Maďarsko',
      'Ukrajina',
      'Rusko',
      'Jiné'
    ],
    housingTypes: [
      'vlastní byt',
      'vlastní dům',
      'nájemní byt',
      'nájemní dům',
      'družstevní byt',
      'služební byt',
      'u rodičů/příbuzných',
      'jiné'
    ]
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
            titles: [],
            maritalStatuses: [],
            documentTypes: [],
            banks: [],
            citizenships: adminLists.citizenships, // Keep default citizenships
            housingTypes: adminLists.housingTypes  // Keep default housing types
          };

          data.forEach(item => {
            switch (item.list_type) {
              case 'titles':
                lists.titles = item.items;
                break;
              case 'marital_statuses':
                lists.maritalStatuses = item.items;
                break;
              case 'document_types':
                lists.documentTypes = item.items;
                break;
              case 'banks':
                lists.banks = item.items;
                break;
              case 'citizenships':
                lists.citizenships = item.items;
                break;
              case 'housing_types':
                lists.housingTypes = item.items;
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

  const calculateAgeFromBirthNumber = (birthNumber: string) => {
    if (birthNumber.length !== 10) return null;
    
    let year = parseInt(birthNumber.substring(0, 2));
    let month = parseInt(birthNumber.substring(2, 4));
    let day = parseInt(birthNumber.substring(4, 6));
    
    // Adjust month for women (month - 50)
    if (month > 50) {
      month -= 50;
    }
    
    // Determine century (simplified, assumes 19xx or 20xx)
    const currentYearFull = new Date().getFullYear();
    let fullYear;
    if (year <= (currentYearFull % 100)) {
      fullYear = 2000 + year;
    } else {
      fullYear = 1900 + year;
    }
    
    // Basic validation for month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null; // Invalid month or day
    }
    
    const birthDateObj = new Date(fullYear, month - 1, day); // Month is 0-indexed in Date object
    
    // Check if the date is valid (e.g., 31st Feb would be invalid)
    if (birthDateObj.getFullYear() !== fullYear || birthDateObj.getMonth() !== (month - 1) || birthDateObj.getDate() !== day) {
      return null; // Invalid date (e.g., 31st Feb)
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    // Format birthDate to YYYY-MM-DD
    const formattedBirthDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return { age, birthYear: fullYear, birthDate: formattedBirthDate };
  };

  const updateField = (field: string, value: any) => {
    const updated = { ...data, [field]: value };
    
    // Auto-calculate age and birth date from birth number
    if (field === 'birthNumber') {
      const ageData = calculateAgeFromBirthNumber(value);
      if (ageData) {
        updated.age = ageData.age;
        updated.birthYear = ageData.birthYear;
        updated.birthDate = ageData.birthDate; // Store birth date
      } else {
        updated.age = null;
        updated.birthYear = null;
        updated.birthDate = null; // Clear if invalid
      }
    }
    
    // Auto-set document validity to +10 years
    if (field === 'documentIssueDate' && value) {
      const issueDate = new Date(value);
      const validityDate = new Date(issueDate);
      validityDate.setFullYear(validityDate.getFullYear() + 10);
      updated.documentValidUntil = validityDate.toISOString().split('T')[0];
    }
    
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titul
          </label>
          <div className="flex">
            <select
              value={data.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Vyberte titul</option>
              {adminLists.titles.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <CopyButton text={data.title || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rodné příjmení
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.maidenName || ''}
              onChange={(e) => updateField('maidenName', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Rodné příjmení (pokud se liší)"
            />
            <CopyButton text={data.maidenName || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rodinný stav
          </label>
          <div className="flex">
            <select
              value={data.maritalStatus || ''}
              onChange={(e) => updateField('maritalStatus', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Vyberte stav</option>
              {adminLists.maritalStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <CopyButton text={data.maritalStatus || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Občanství
          </label>
          <div className="flex">
            <select
              value={data.citizenship || 'Česká republika'}
              onChange={(e) => updateField('citizenship', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Vyberte občanství</option>
              {adminLists.citizenships.map(citizenship => (
                <option key={citizenship} value={citizenship}>{citizenship}</option>
              ))}
            </select>
            <CopyButton text={data.citizenship || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Druh současného bydlení
          </label>
          <div className="flex">
            <select
              value={data.housingType || ''}
              onChange={(e) => updateField('housingType', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Vyberte druh bydlení</option>
              {adminLists.housingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <CopyButton text={data.housingType || ''} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jméno
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.firstName || ''}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-bold"
              placeholder="Zadejte jméno"
            />
            <CopyButton text={data.firstName || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Příjmení
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.lastName || ''}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-bold"
              placeholder="Zadejte příjmení"
            />
            <CopyButton text={data.lastName || ''} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rodné číslo
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.birthNumber || ''}
              onChange={(e) => updateField('birthNumber', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="YYMMDDXXXX"
              maxLength={10}
            />
            <CopyButton text={data.birthNumber || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Věk
          </label>
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {data.age ? `${data.age} let` : 'Zadejte rodné číslo'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rok narození
          </label>
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {data.birthYear || 'Automaticky'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum narození
          </label>
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {data.birthDate ? new Date(data.birthDate).toLocaleDateString('cs-CZ') : 'Automaticky z rodného čísla'}
            </span>
          </div>
        </div>
        <div>
          {/* Placeholder for future field or leave empty for layout */}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trvalé bydliště
        </label>
        <AddressInput
          value={data.permanentAddress || ''}
          onChange={(value) => updateField('permanentAddress', value)}
          placeholder="Začněte psát adresu..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kontaktní adresa
        </label>
        <AddressInput
          value={data.contactAddress || ''}
          onChange={(value) => updateField('contactAddress', value)}
          placeholder="Začněte psát adresu..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typ dokladu
          </label>
          <div className="flex">
            <select
              value={data.documentType || ''}
              onChange={(e) => updateField('documentType', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Vyberte typ</option>
              {adminLists.documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <CopyButton text={data.documentType || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Číslo dokladu
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.documentNumber || ''}
              onChange={(e) => updateField('documentNumber', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Číslo dokladu"
            />
            <CopyButton text={data.documentNumber || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum vydání
          </label>
          <div className="flex">
            <input
              type="date"
              value={data.documentIssueDate || ''}
              onChange={(e) => updateField('documentIssueDate', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <CopyButton text={data.documentIssueDate || ''} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Platnost do
        </label>
        <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            {data.documentValidUntil || 'Automaticky +10 let od vydání'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <div className="flex">
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-bold"
              placeholder="+420 xxx xxx xxx"
            />
            <CopyButton text={data.phone || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="flex">
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-bold"
              placeholder="email@example.com"
            />
            <CopyButton text={data.email || ''} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Banka
        </label>
        <div className="flex">
          <select
            value={data.bank || ''}
            onChange={(e) => updateField('bank', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Vyberte banku</option>
            {adminLists.banks.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          <CopyButton text={data.bank || ''} />
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-3 mb-4">
          <h4 className="text-md font-medium text-gray-900">Doklady totožnosti</h4>
          <button
            onClick={() => {
              const newDocument = {
                id: Date.now(),
                documentType: '',
                documentNumber: '',
                documentIssueDate: '',
                documentValidUntil: '',
                issuingAuthority: '',
                placeOfBirth: '',
                controlNumber: ''
              };
              const currentDocuments = data.documents || [];
              updateField('documents', [...currentDocuments, newDocument]);
            }}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Přidat doklad
          </button>
        </div>
        
        {(data.documents || []).map((document, index) => (
          <div key={document.id} className="bg-gray-50 rounded-lg p-4 border mb-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-sm font-medium text-gray-900">
                Doklad #{index + 1}
              </h5>
              {(data.documents || []).length > 1 && (
                <button
                  onClick={() => {
                    const updatedDocuments = (data.documents || []).filter(d => d.id !== document.id);
                    updateField('documents', updatedDocuments);
                  }}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ dokladu
                </label>
                <select
                  value={document.documentType || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, documentType: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Vyberte typ</option>
                  {adminLists.documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Číslo dokladu
                </label>
                <input
                  type="text"
                  value={document.documentNumber || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, documentNumber: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Číslo dokladu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum vydání
                </label>
                <input
                  type="date"
                  value={document.documentIssueDate || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, documentIssueDate: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vydáno kým
                </label>
                <input
                  type="text"
                  value={document.issuingAuthority || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, issuingAuthority: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Magistrát města Brna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Místo narození
                </label>
                <input
                  type="text"
                  value={document.placeOfBirth || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, placeOfBirth: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Praha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontrolní číslo OP
                </label>
                <input
                  type="text"
                  value={document.controlNumber || ''}
                  onChange={(e) => {
                    const updatedDocuments = (data.documents || []).map(d => 
                      d.id === document.id ? { ...d, controlNumber: e.target.value } : d
                    );
                    updateField('documents', updatedDocuments);
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ABC123"
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id={`${prefix}-no-children`}
            checked={!hasChildren}
            onChange={(e) => setHasChildren(!e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`${prefix}-no-children`} className="text-sm font-medium text-gray-700">
            Nemá děti
          </label>
        </div>
        
        {hasChildren && (
          <ChildrenManager
            children={data.children || []}
            onChange={(children) => updateField('children', children)}
          />
        )}
      </div>

      {/* Extra dynamická pole */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Extra pole</h4>
          <button
            onClick={() => {
              const newField = {
                id: Date.now(),
                label: '',
                value: ''
              };
              const currentFields = data.extraFields || [];
              updateField('extraFields', [...currentFields, newField]);
            }}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Přidat pole
          </button>
        </div>
        
        <div className="space-y-3">
          {(data.extraFields || []).map((field, index) => (
            <ExtraFieldDisplay
              key={field.id}
              field={field}
              index={index}
              onUpdate={(updatedField) => {
                const updatedFields = (data.extraFields || []).map(f => 
                  f.id === field.id ? updatedField : f
                );
                updateField('extraFields', updatedFields);
              }}
              onDelete={() => {
                const updatedFields = (data.extraFields || []).filter(f => f.id !== field.id);
                updateField('extraFields', updatedFields);
              }}
            />
          ))}
        </div>
        
        {(!data.extraFields || data.extraFields.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>Žádná extra pole nejsou přidána.</p>
            <p className="text-sm">Klikněte na "Přidat pole" pro vytvoření vlastního pole.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Extra Field Display Component with Edit Functionality
interface ExtraFieldDisplayProps {
  field: any;
  index: number;
  onUpdate: (field: any) => void;
  onDelete: () => void;
}

const ExtraFieldDisplay: React.FC<ExtraFieldDisplayProps> = ({ field, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(!field.label || !field.value); // Auto-edit if empty
  const [editData, setEditData] = useState(field);

  const handleSave = () => {
    if (!editData.label.trim() || !editData.value.trim()) {
      alert('Název pole a hodnota jsou povinné');
      return;
    }
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(field);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-medium text-blue-900">
            {field.label ? 'Úprava pole' : `Nové pole #${index + 1}`}
          </h5>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
            >
              <Save className="w-3 h-3 mr-1" />
              Uložit
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="w-3 h-3 mr-1" />
              Zrušit
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Název pole
            </label>
            <input
              type="text"
              value={editData.label || ''}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Např. Poznámka, Speciální požadavek..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hodnota
            </label>
            <input
              type="text"
              value={editData.value || ''}
              onChange={(e) => setEditData({ ...editData, value: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Zadejte hodnotu..."
            />
          </div>
        </div>
      </div>
    );
  }

  // Display mode - compact view with reduced width
  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-900 truncate">
              {field.label}:
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 break-words">
                {field.value}
              </span>
              <CopyButton text={field.value || ''} />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Upravit pole"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Smazat pole"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};