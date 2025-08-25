import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import InlineEditableCopy from '../InlineEditableCopy';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { ChildrenManager } from '../ChildrenManager';
import { DocumentManager } from './DocumentManager';
import { Calendar, User, Globe } from 'lucide-react';

// Defaults for admin lists
const DEFAULT_CITIZENSHIPS = [
  'Česká republika',
  'Slovenská republika',
  'Německo',
  'Rakousko',
  'Polsko',
  'Maďarsko',
  'Ukrajina',
  'Rusko',
  'Jiné'
];

const DEFAULT_EDUCATION_LEVELS = [
  'Základní',
  'Vyučen',
  'Vyučen s maturitou',
  'Středoškolské',
  'Vyšší odborné',
  'Vysokoškolské - bakalářské',
  'Vysokoškolské - magisterské',
  'Vysokoškolské - doktorské',
  'Bez vzdělání'
];

type PersonalInfoData = Record<string, unknown> & {
  title?: string;
  maritalStatus?: string;
  firstName?: string;
  lastName?: string;
  maidenName?: string;
  citizenship?: string;
  education?: string;
  birthNumber?: string;
  age?: number;
  birthYear?: number;
  permanentAddress?: string;
  contactAddress?: string;
  phone?: string;
  email?: string;
  bank?: string;
  documents?: LocalDocument[];
  children?: LocalChild[];
};

type AdminLists = {
  titles: string[];
  maritalStatuses: string[];
  documentTypes: string[];
  banks: string[];
  citizenships: string[];
  educationLevels: string[];
};

type AdminListRow = {
  list_type?: string;
  items?: string[];
};

// Local dynamic shapes — keep them minimal so we can avoid project-wide any
type LocalDocument = {
  id: string;
  supabase_id?: string;
  client_id?: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  valid_until: string;
  issuing_authority: string;
  place_of_birth: string;
  control_number: string;
  is_primary: boolean;
  [k: string]: unknown;
};

type LocalChild = {
  id: number;
  name: string;
  birthDate: string;
  age?: number;
  [k: string]: unknown;
};

interface EnhancedPersonalInfoProps {
  data: PersonalInfoData;
  onChange: (data: PersonalInfoData) => void;
  prefix: string;
}

export const EnhancedPersonalInfo: React.FC<EnhancedPersonalInfoProps> = ({ 
  data, 
  onChange, 
  prefix 
}) => {
  const [hasChildren, setHasChildren] = useState(false);

  const [adminLists, setAdminLists] = useState<AdminLists>({
    titles: [],
    maritalStatuses: [],
    documentTypes: [],
    banks: [],
    citizenships: DEFAULT_CITIZENSHIPS,
    educationLevels: DEFAULT_EDUCATION_LEVELS
  });

  // Load admin lists from Supabase
  React.useEffect(() => {
    const loadAdminLists = async () => {
      try {
  const res = await AdminService.getAdminLists();
  const adminData = (res && (res.data as AdminListRow[] | undefined)) || undefined;
  const error = res && (res.error as unknown);
        if (error) {
          console.error('Error loading admin lists:', error);
          return;
        }

  if (adminData) {
          const lists: AdminLists = {
            titles: [],
            maritalStatuses: [],
            documentTypes: [],
            banks: [],
            citizenships: DEFAULT_CITIZENSHIPS,
            educationLevels: DEFAULT_EDUCATION_LEVELS
          };

          if (adminData && adminData.length) {
            adminData.forEach((item: AdminListRow) => {
            const lt = item.list_type;
            const items = item.items;
            if (!lt || !items) return;
            if (lt === 'titles') lists.titles = items;
            else if (lt === 'marital_statuses') lists.maritalStatuses = items;
            else if (lt === 'document_types') lists.documentTypes = items;
            else if (lt === 'banks') lists.banks = items;
            else if (lt === 'education_levels') lists.educationLevels = items;
            else if (lt === 'citizenships') lists.citizenships = items;
          });

          }

          // set parsed lists into state
          setAdminLists(lists);
        }
      } catch (error) {
        console.error('Error loading admin lists:', error);
      }
    };

    loadAdminLists();
  }, []);

  const calculateAgeFromBirthNumber = (birthNumber: string) => {
    if (birthNumber.length !== 10) return null;
    
    const year = parseInt(birthNumber.substr(0, 2));
    const month = parseInt(birthNumber.substr(2, 2));
    
    // Determine century
    let fullYear = year;
    if (month > 50) {
      fullYear = 1900 + year; // woman
    } else if (month > 20) {
      fullYear = 2000 + year; // man after 2000
    } else {
      fullYear = 1900 + year; // man before 2000
    }
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - fullYear;
    
    return { age, birthYear: fullYear };
  };

  const updateField = (field: string, value: unknown) => {
    const updated: PersonalInfoData = { ...data, [field]: value } as PersonalInfoData;
    
    // Auto-calculate age from birth number
  if (field === 'birthNumber' && typeof value === 'string') {
      const ageData = calculateAgeFromBirthNumber(value);
      if (ageData) {
        updated.age = ageData.age;
        updated.birthYear = ageData.birthYear;
      }
    }
    
    onChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="space-y-8">
        {/* Basic Personal Information */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Základní údaje</h3>
        
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
                title="Titul"
                aria-label="Titul"
              >
                <option value="">Vyberte titul</option>
                {adminLists.titles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              <InlineEditableCopy value={data.title || ''} onSave={(v) => onChange({ ...data, title: v })} />
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
                title="Rodinný stav"
                aria-label="Rodinný stav"
              >
                <option value="">Vyberte stav</option>
                {adminLists.maritalStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <InlineEditableCopy value={data.maritalStatus || ''} onSave={(v) => onChange({ ...data, maritalStatus: v })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jméno
            </label>
            <div className="flex">
              <input
                type="text"
                value={data.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Zadejte jméno"
              />
              <InlineEditableCopy value={data.firstName || ''} onSave={(v) => onChange({ ...data, firstName: v })} />
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
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Zadejte příjmení"
              />
              <InlineEditableCopy value={data.lastName || ''} onSave={(v) => onChange({ ...data, lastName: v })} />
            </div>
          </div>

          {/* NEW: Maiden Name Field */}
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
              <InlineEditableCopy value={data.maidenName || ''} onSave={(v) => onChange({ ...data, maidenName: v })} />
            </div>
          </div>

          {/* NEW: Citizenship Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Státní občanství
            </label>
            <div className="flex">
              <div className="flex-1 relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={data.citizenship || 'Česká republika'}
                  onChange={(e) => updateField('citizenship', e.target.value)}
                  className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  title="Státní občanství"
                  aria-label="Státní občanství"
                >
                  {adminLists.citizenships.map(citizenship => (
                    <option key={citizenship} value={citizenship}>{citizenship}</option>
                  ))}
                </select>
              </div>
              <InlineEditableCopy value={data.citizenship || ''} onSave={(v) => onChange({ ...data, citizenship: v })} />
            </div>
          </div>

          {/* NEW: Education Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nejvyšší dosažené vzdělání
            </label>
            <div className="flex">
              <select
                value={data.education || ''}
                onChange={(e) => updateField('education', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                title="Nejvyšší dosažené vzdělání"
                aria-label="Nejvyšší dosažené vzdělání"
              >
                <option value="">Vyberte vzdělání</option>
                {adminLists.educationLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <InlineEditableCopy value={data.education || ''} onSave={(v) => onChange({ ...data, education: v })} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
              <InlineEditableCopy value={data.birthNumber || ''} onSave={(v) => onChange({ ...data, birthNumber: v })} />
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
      </div>

      {/* Address Information with Map Links */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Adresy</h3>
        
        <div className="space-y-4">
          <AddressWithMapLinks
            value={data.permanentAddress || ''}
            onChange={(value) => updateField('permanentAddress', value)}
            placeholder="Začněte psát adresu..."
            label="Trvalé bydliště"
          />

          <AddressWithMapLinks
            value={data.contactAddress || ''}
            onChange={(value) => updateField('contactAddress', value)}
            placeholder="Začněte psát adresu..."
            label="Kontaktní adresa"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Kontaktní údaje</h3>
        
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
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="+420 xxx xxx xxx"
              />
              <InlineEditableCopy value={data.phone || ''} onSave={(v) => onChange({ ...data, phone: v })} />
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
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="email@example.com"
              />
              <InlineEditableCopy value={data.email || ''} onSave={(v) => onChange({ ...data, email: v })} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banka
            </label>
            <div className="flex">
              <select
                value={data.bank || ''}
                onChange={(e) => updateField('bank', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                title="Banka"
                aria-label="Banka"
              >
                <option value="">Vyberte banku</option>
                {adminLists.banks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              <InlineEditableCopy value={data.bank || ''} onSave={(v) => onChange({ ...data, bank: v })} />
            </div>
          </div>
        </div>
      </div>

      {/* Document Management */}
      <div className="bg-white rounded-lg border p-6">
          <DocumentManager
            documents={(data.documents || []) as LocalDocument[]}
            onChange={(documents) => updateField('documents', documents as LocalDocument[])}
            documentTypes={adminLists.documentTypes}
          />
      </div>

      {/* Children Management */}
      <div className="bg-white rounded-lg border p-6">
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
              children={(data.children || []) as LocalChild[]}
              onChange={(children) => updateField('children', children as LocalChild[])}
            />
          )}
      </div>
      </div>
    </div>
  );
};