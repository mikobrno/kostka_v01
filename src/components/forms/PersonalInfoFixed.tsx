import React, { useState, useCallback, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { Calendar, User } from 'lucide-react';

interface AdminLists {
  titles: string[];
  maritalStatuses: string[];
  documentTypes: string[];
  banks: string[];
  citizenships: string[];
  housingTypes: string[];
}

interface Business {
  id: number;
  name: string;
  ico: string;
  address: string;
}

interface PersonalData {
  title?: string;
  firstName?: string;
  lastName?: string;
  birthNumber?: string;
  age?: number;
  birthYear?: number;
  birthDate?: string;
  maritalStatus?: string;
  permanentAddress?: string;
  contactAddress?: string;
  documentType?: string;
  documentNumber?: string;
  documentIssueDate?: string;
  documentValidUntil?: string;
  businesses?: Business[];
  children?: any[];
}

interface PersonalInfoProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
  prefix: string;
}

const defaultCitizenships = [
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

const defaultHousingTypes = [
  'vlastní byt',
  'vlastní dům',
  'nájemní byt',
  'nájemní dům',
  'družstevní byt',
  'služební byt',
  'u rodičů/příbuzných',
  'jiné'
];

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange }) => {
  const [adminLists, setAdminLists] = useState<AdminLists>({
    titles: [],
    maritalStatuses: [],
    documentTypes: [],
    banks: [],
    citizenships: defaultCitizenships,
    housingTypes: defaultHousingTypes
  });

  const calculateAgeFromBirthNumber = useCallback((birthNumber: string) => {
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
  }, []);

  // Automatický výpočet věku a roku narození při načtení komponenty nebo změně rodného čísla
  useEffect(() => {
    if (!data.birthNumber) return;
    
    const ageData = calculateAgeFromBirthNumber(data.birthNumber);
    if (ageData && (!data.age || !data.birthYear || !data.birthDate)) {
      onChange({
        ...data,
        age: ageData.age,
        birthYear: ageData.birthYear,
        birthDate: ageData.birthDate
      });
    }
  }, [data, onChange, calculateAgeFromBirthNumber]);

  // Načtení admin seznamů
  useEffect(() => {
    const loadAdminLists = async () => {
      try {
        const { data: apiData, error } = await AdminService.getAdminLists();
        if (error) {
          console.error('Chyba při načítání admin seznamů:', error);
          return;
        }

        if (apiData) {
          const lists: AdminLists = {
            titles: [],
            maritalStatuses: [],
            documentTypes: [],
            banks: [],
            citizenships: defaultCitizenships,
            housingTypes: defaultHousingTypes
          };

          apiData.forEach(item => {
            const items = item.items as string[];
            switch (item.list_type) {
              case 'titles':
                lists.titles = items;
                break;
              case 'marital_statuses':
                lists.maritalStatuses = items;
                break;
              case 'document_types':
                lists.documentTypes = items;
                break;
              case 'banks':
                lists.banks = items;
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

  const updateField = (field: string, value: any) => {
    const updated = { ...data, [field]: value };
    
    // Auto-calculate age and birth date from birth number
    if (field === 'birthNumber') {
      const ageData = calculateAgeFromBirthNumber(value);
      if (ageData) {
        updated.age = ageData.age;
        updated.birthYear = ageData.birthYear;
        updated.birthDate = ageData.birthDate;
      } else {
        updated.age = undefined;
        updated.birthYear = undefined;
        updated.birthDate = undefined;
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
            Rodné číslo
          </label>
          <input
            type="text"
            value={data.birthNumber || ''}
            onChange={(e) => updateField('birthNumber', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="YYMMDDXXXX"
            maxLength={10}
            title="Rodné číslo ve formátu YYMMDDXXXX"
          />
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
  );
};
