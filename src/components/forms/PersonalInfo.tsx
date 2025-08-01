import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { AresService } from '../../services/aresService';
import { CopyButton } from '../CopyButton';
import { FullNameCopyButton } from '../FullNameCopyButton';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { ChildrenManager } from '../ChildrenManager';
import { Copy, Calendar, User, Plus, Trash2, Save, X, Edit, Building, Search } from 'lucide-react';

interface PersonalInfoProps {
  data: any;
  onChange: (data: any) => void;
  prefix: string;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange, prefix }) => {
  React.useEffect(() => {
    if (data.birthNumber && (!data.birthYear || !data.birthDate)) {
      const ageData = calculateAgeFromBirthNumber(data.birthNumber);
      if (ageData) {
        onChange({
          ...data,
          age: ageData.age,
          birthYear: ageData.birthYear,
          birthDate: ageData.birthDate,
        });
      }
    }
  }, []);
  const [hasChildren, setHasChildren] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    <>
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
          <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2">
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

      {/* Full Name Copy Button */}
      {(data.title || data.firstName || data.lastName) && (
        <div className="flex justify-center">
          <FullNameCopyButton
            title={data.title}
            firstName={data.firstName}
            lastName={data.lastName}
            className="w-auto"
          />
        </div>
      )}

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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
          <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
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
          <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
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
          <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
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
        <AddressWithMapLinks
          value={data.permanentAddress || ''}
          onChange={(value) => updateField('permanentAddress', value)}
          placeholder="Začněte psát adresu..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kontaktní adresa
        </label>
        <AddressWithMapLinks
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <CopyButton text={data.documentIssueDate || ''} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Platnost do
        </label>
        <div className="flex">
          <div className="flex-1 relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.documentValidUntil ? new Date(data.documentValidUntil).toLocaleDateString('cs-CZ') : ''}
              readOnly
              className="block w-full pl-10 rounded-l-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              placeholder="Automaticky +10 let od vydání"
            />
          </div>
          <CopyButton text={data.documentValidUntil ? new Date(data.documentValidUntil).toLocaleDateString('cs-CZ') : ''} />
        </div>
      </div>

      {/* Doklady totožnosti sekce */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Doklady totožnosti</h4>
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
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Doklad #{index + 1}
              </h5>
              <button
                onClick={() => {
                  setShowDeleteConfirm(`document-${document.id.toString()}`);
                }}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="ABC123"
                />
              </div>
            </div>
          </div>
        ))}
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
            className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Vyberte banku</option>
            {adminLists.banks.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          <CopyButton text={data.bank || ''} />
        </div>
      </div>

      {/* Podnikání sekce */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-purple-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Podnikání</h4>
          </div>
          <button
            onClick={() => {
              const newBusiness = {
                id: Date.now(),
                ico: '',
                companyName: '',
                companyAddress: '',
                businessStartDate: ''
              };
              const currentBusinesses = data.businesses || [];
              updateField('businesses', [...currentBusinesses, newBusiness]);
            }}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Přidat podnikání
          </button>
        </div>
        
        {(data.businesses || []).map((business, index) => (
          <BusinessDisplay
            key={business.id}
            business={business}
            index={index}
            onUpdate={(updatedBusiness) => {
              const updatedBusinesses = (data.businesses || []).map(b => 
                b.id === business.id ? updatedBusiness : b
              );
              updateField('businesses', updatedBusinesses);
            }}
            onDelete={() => {
              setShowDeleteConfirm(`business-${business.id.toString()}`);
            }}
          />
        ))}
        
        {(!data.businesses || data.businesses.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Žádné podnikání není přidáno.</p>
            <p className="text-sm">Klikněte na "Přidat podnikání" pro vytvoření záznamu o podnikání.</p>
          </div>
        )}
      </div>
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id={`${prefix}-no-children`}
            checked={!hasChildren}
            onChange={(e) => setHasChildren(!e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
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

      <div className="flex items-center space-x-3 mb-4">
        <input
          type="checkbox"
          id={`${prefix}-no-children`}
          checked={!hasChildren}
          onChange={(e) => setHasChildren(!e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
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

      {/* Delete Confirmation Modal for Documents */}
      {showDeleteConfirm && showDeleteConfirm.startsWith('document-') && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">
                Smazat doklad
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tento doklad? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => {
                    const documentId = parseInt(showDeleteConfirm.replace('document-', ''));
                    const updatedDocuments = (data.documents || []).filter(d => d.id !== documentId);
                    updateField('documents', updatedDocuments);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Extra Fields and Business */}
      {showDeleteConfirm && (showDeleteConfirm.startsWith('field-') || showDeleteConfirm.startsWith('business-')) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">
                {showDeleteConfirm.startsWith('business-') ? 'Smazat podnikání' : 'Smazat pole'}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                {showDeleteConfirm.startsWith('business-') 
                  ? 'Opravdu chcete smazat tento záznam o podnikání? Tato akce je nevratná.'
                  : 'Opravdu chcete smazat toto pole? Tato akce je nevratná.'
                }
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.startsWith('business-')) {
                      const businessId = parseInt(showDeleteConfirm.replace('business-', ''));
                      const updatedBusinesses = (data.businesses || []).filter(b => b.id !== businessId);
                      updateField('businesses', updatedBusinesses);
                    } else {
                      const fieldId = parseInt(showDeleteConfirm.replace('field-', ''));
                      const updatedFields = (data.extraFields || []).filter(f => f.id !== fieldId);
                      updateField('extraFields', updatedFields);
                    }
                    setShowDeleteConfirm(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra dynamická pole */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Extra pole</h4>
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
                setShowDeleteConfirm(`field-${field.id.toString()}`);
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
    </>
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

        <div className="space-y-3">
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

  // Display mode - full width view with edit functionality
  return (
    <div className="bg-gray-50 rounded-lg p-4 border w-full">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 mr-4">
            {field.label}
          </span>
          <div className="flex items-center space-x-2">
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
        <div className="flex items-start space-x-2 w-full">
          <span className="text-sm text-gray-700 flex-1 break-words leading-relaxed">
            {field.value}
          </span>
          <div className="flex-shrink-0">
            <CopyButton text={field.value || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Business Display Component
interface BusinessDisplayProps {
  business: any;
  index: number;
  onUpdate: (business: any) => void;
  onDelete: () => void;
}

const BusinessDisplay: React.FC<BusinessDisplayProps> = ({ business, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(!business.ico || !business.companyName); // Auto-edit if empty
  const [editData, setEditData] = useState(business);
  const [isLoadingAres, setIsLoadingAres] = useState(false);

  const handleSave = () => {
    if (!editData.ico.trim() || !editData.companyName.trim()) {
      alert('IČO a název firmy jsou povinné');
      return;
    }
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(business);
    setIsEditing(false);
  };

  const fetchAresData = async (ico: string) => {
    if (ico.length !== 8) return;
    
    setIsLoadingAres(true);
    try {
      const { data, error } = await AresService.searchByIco(ico);
      
      if (error) {
        alert(`Chyba při načítání z ARES: ${error}`);
        return;
      }
      
      if (data) {
        setEditData(prev => ({
          ...prev,
          companyName: data.companyName,
          companyAddress: data.address
        }));
      }
    } catch (error) {
      console.error('Chyba při načítání dat z ARES:', error);
      alert('Chyba při načítání dat z ARES');
    } finally {
      setIsLoadingAres(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-medium text-purple-900">
            {business.ico ? 'Úprava podnikání' : `Nové podnikání #${index + 1}`}
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

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              IČO *
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.ico || ''}
                onChange={(e) => {
                  const ico = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setEditData({ ...editData, ico });
                  if (ico.length === 8) {
                    fetchAresData(ico);
                  }
                }}
                className="flex-1 block w-full border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                placeholder="12345678"
                maxLength={8}
                style={{ borderTopLeftRadius: '0.375rem', borderBottomLeftRadius: '0.375rem' }}
              />
              <button
                onClick={() => fetchAresData(editData.ico)}
                disabled={isLoadingAres || editData.ico?.length !== 8}
                className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}
              >
                {isLoadingAres ? (
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Zadáním IČO se automaticky vyplní název a adresa firmy z ARES
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Název firmy *
            </label>
            <input
              type="text"
              value={editData.companyName || ''}
              onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              placeholder="Název společnosti"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Adresa firmy
            </label>
            <input
              type="text"
              value={editData.companyAddress || ''}
              onChange={(e) => setEditData({ ...editData, companyAddress: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              placeholder="Adresa sídla společnosti"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Začátek podnikání
            </label>
            <input
              type="date"
              value={editData.businessStartDate || ''}
              onChange={(e) => setEditData({ ...editData, businessStartDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="bg-gray-50 rounded-lg p-4 border w-full mb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {business.companyName || 'Název firmy'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Upravit podnikání"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Smazat podnikání"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">IČO:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white">{business.ico || 'Neuvedeno'}</span>
              <CopyButton text={business.ico || ''} />
            </div>
          </div>
          <div>
            <span className="text-gray-500">Adresa:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 truncate">{business.companyAddress || 'Neuvedeno'}</span>
              <CopyButton text={business.companyAddress || ''} />
            </div>
          </div>
          <div>
            <span className="text-gray-500">Začátek podnikání:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white">
                {business.businessStartDate ? new Date(business.businessStartDate).toLocaleDateString('cs-CZ') : 'Neuvedeno'}
              </span>
              <CopyButton text={business.businessStartDate ? new Date(business.businessStartDate).toLocaleDateString('cs-CZ') : ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};