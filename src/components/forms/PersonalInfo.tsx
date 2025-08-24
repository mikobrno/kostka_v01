import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { AresService } from '../../services/aresService';
import { supabase } from '../../lib/supabase';
import { CopyButton } from '../CopyButton';
import { FullNameCopyButton } from '../FullNameCopyButton';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { ChildrenManager } from '../ChildrenManager';
import { Copy, Calendar, User, Plus, Trash2, Save, X, Edit, Building, Search, ExternalLink, Check } from 'lucide-react';

interface PersonalInfoProps {
  data: any;
  onChange: (data: any) => void;
  prefix: string;
  clientId?: string | number;
  toast?: any;
}

// Formátovat datum jako DD.MM.YYYY (s leading zero pro den a měsíc)
export const formatDateDDMMYYYY = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

// Card wrapper to standardize column appearance and padding
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {children}
    </div>
  );
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange, prefix, clientId, toast }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [savingDocument, setSavingDocument] = useState<string | number | null>(null);
  const [savedDocument, setSavedDocument] = useState<string | number | null>(null);
  
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

  // Inicializace hasChildren na základě existujících dat
  React.useEffect(() => {
    if (data.children && data.children.length > 0) {
      setHasChildren(true);
    }
  }, [data.children]);

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
    educationLevels: [
      'Základní',
      'Vyučen',
      'Vyučen s maturitou',
      'Středoškolské',
      'Vyšší odborné',
      'Vysokoškolské - bakalářské',
      'Vysokoškolské - magisterské',
      'Vysokoškolské - doktorské',
      'Bez vzdělání'
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
            housingTypes: adminLists.housingTypes,  // Keep default housing types
            educationLevels: adminLists.educationLevels // Keep default education levels
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
              case 'education_levels':
                lists.educationLevels = item.items;
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

  // Formátovat datum jako DD.MM.YYYY (s leading zero pro den a měsíc)
  const formatDateDDMMYYYY = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
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
    
    // Auto-set document validity to +10 years, but only when not manually specified
    if (field === 'documentIssueDate' && value) {
      if (!updated.documentValidUntil) {
        const issueDate = new Date(value);
        const validityDate = new Date(issueDate);
        validityDate.setFullYear(validityDate.getFullYear() + 10);
        updated.documentValidUntil = validityDate.toISOString().split('T')[0];
      }
    }
    
    onChange(updated);
  };

  const saveDocument = async (documentId: string | number) => {
    console.log('🔍 Pokus o uložení dokumentu s lokálním ID:', documentId);
    console.log('📝 ClientId:', clientId);
    console.log('📋 Data dokumentů:', data.documents);
    
    if (!clientId) {
      console.error('❌ Chybí clientId pro uložení dokumentu.');
      toast?.showError('Chyba', 'Není dostupné ID klienta pro uložení dokladu');
      return;
    }

    setSavingDocument(documentId);
    try {
      // Najdi specifický doklad
      const document = (data.documents || []).find((doc: any) => doc.id == documentId);
      console.log('📄 Nalezený dokument:', document);
      if (!document) {
        throw new Error('Doklad nebyl nalezen');
      }

      // Připrav data pro Supabase (bez lokálního ID)
      const documentData = {
        client_id: String(clientId),
        parent_type: prefix, // 'applicant' nebo 'co_applicant'
        document_type: document.documentType || null,
        document_number: document.documentNumber || null,
        document_issue_date: document.documentIssueDate || null,
        document_valid_until: document.documentValidUntil || null,
        issuing_authority: document.issuingAuthority || null,
        place_of_birth: document.placeOfBirth || null,
        control_number: document.controlNumber || null
      };
      
      console.log('💾 Data pro uložení do Supabase:', documentData);


      // Rozhodni, zda aktualizovat existující záznam nebo vytvořit nový.
      // Některé dokumenty načtené z backendu mají přímo `id` (DB id) a nemají pole `supabase_id`.
      // Použijeme fallback: dbId = supabase_id || id.
      let maybeId = document.supabase_id ?? document.id;
      let dbId = (maybeId !== undefined && maybeId !== null && String(maybeId) !== '') ? maybeId : null;

      // Pokud nemáme žádné ID, zkontroluj na serveru, zda už neexistuje dokument se stejným číslem pro tohoto klienta
      // (jednoduchá deduplikace podle client_id + document_number + parent_type).
      if (!dbId && document.documentNumber) {
        try {
          const { data: existing, error: selectErr } = await supabase
            .from('documents')
            .select('id')
            .eq('client_id', String(clientId))
            .eq('document_number', document.documentNumber)
            .eq('parent_type', prefix)
            .limit(1)
            .maybeSingle();

          if (selectErr) {
            console.warn('⚠️ Chyba při kontrole duplicity dokumentu:', selectErr);
          } else if (existing && existing.id) {
            console.log('ℹ️ Nalezen existující dokument na serveru se stejným číslem. Použiju jeho ID pro update:', existing.id);
            dbId = existing.id;
            maybeId = existing.id;
          }
        } catch (err) {
          console.warn('⚠️ Výjimka při kontrole duplicity dokumentu:', err);
        }
      }

      if (dbId) {
        console.log('🔄 Aktualizuji existující dokument v Supabase s ID:', dbId);
        // Po aktualizaci požádej o vrácení upraveného záznamu a aktualizuj lokální položku
        const { data: updatedRow, error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', dbId)
          .select()
          .single();

        if (error) {
          console.error('❌ Chyba při aktualizaci dokumentu v Supabase:', error);
          throw new Error(error.message || 'Chyba při aktualizaci dokladu');
        }

        console.log('📤 Supabase updated row:', updatedRow);
        // Aktualizuj lokální data podle vráceného řádku
        const updatedDocuments = (data.documents || []).map((doc: any) => 
          doc.id == documentId
            ? {
                ...doc,
                supabase_id: updatedRow.id,
                documentType: updatedRow.document_type ?? document.documentType,
                documentNumber: updatedRow.document_number ?? document.documentNumber,
                documentIssueDate: updatedRow.document_issue_date ?? document.documentIssueDate,
                documentValidUntil: updatedRow.document_valid_until ?? document.documentValidUntil,
                issuingAuthority: updatedRow.issuing_authority ?? document.issuingAuthority,
                placeOfBirth: updatedRow.place_of_birth ?? document.placeOfBirth,
                controlNumber: updatedRow.control_number ?? document.controlNumber
              }
            : doc
        );
        onChange({ ...data, documents: updatedDocuments });
        console.log('✅ Dokument úspěšně aktualizován v Supabase.');
      } else {
        // Jinak vytvoř nový záznam
        console.log('➕ Vytvářím nový záznam dokumentu v Supabase.');
        const { data: newDocument, error } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();

        if (error) {
          console.error('❌ Chyba při vkládání nového dokumentu do Supabase:', error);
          throw new Error(error.message || 'Chyba při vytváření dokladu');
        }
        console.log('📤 Supabase inserted row:', newDocument);

        // Aktualizuj lokální data s celým vloženým záznamem
        let updatedDocuments = (data.documents || []).map((doc: any) => 
          doc.id == documentId 
            ? {
                ...doc,
                supabase_id: newDocument.id,
                documentType: newDocument.document_type ?? doc.documentType,
                documentNumber: newDocument.document_number ?? doc.documentNumber,
                documentIssueDate: newDocument.document_issue_date ?? doc.documentIssueDate,
                documentValidUntil: newDocument.document_valid_until ?? doc.documentValidUntil,
                issuingAuthority: newDocument.issuing_authority ?? doc.issuingAuthority,
                placeOfBirth: newDocument.place_of_birth ?? doc.placeOfBirth,
                controlNumber: newDocument.control_number ?? doc.controlNumber
              }
            : doc
        );

        // Odeber případné duplicitní lokální záznamy, které referencují stejné supabase_id
        const seen = new Set<string>();
        updatedDocuments = updatedDocuments.filter((d: any) => {
          const key = d.supabase_id ? String(d.supabase_id) : `local:${d.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        onChange({ ...data, documents: updatedDocuments });
      }

      setSavedDocument(documentId);
      toast?.showSuccess('Uloženo', `Doklad byl úspěšně uložen`);
      
      // Skryj ikonku checkmarku po 2 sekundách
      setTimeout(() => {
        setSavedDocument(null);
      }, 2000);
    } catch (error) {
      console.error('Chyba při ukládání dokladu:', error);
      toast?.showError('Chyba', error instanceof Error ? error.message : 'Nepodařilo se uložit doklad');
    } finally {
      setSavingDocument(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {prefix === 'applicant' ? 'Osobní údaje žadatele' : 'Osobní údaje spolužadatele'}
      </h3>
      
  <div className="grid gap-6 items-start form-grid-layout">
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titul
          </label>
          <div className="flex">
            <select
              value={data.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              title="Titul"
            >
              <option value="">Vyberte titul</option>
                  {adminLists.titles.map((title: string) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
            </select>
            <CopyButton text={data.title || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              {adminLists.maritalStatuses.map((status: string) => (
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
              {adminLists.citizenships.map((citizenship: string) => (
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
              {adminLists.housingTypes.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <CopyButton text={data.housingType || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nejvyšší dosažené vzdělání
          </label>
          <div className="flex">
            <select
              value={data.education || ''}
              onChange={(e) => updateField('education', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Vyberte vzdělání</option>
              {adminLists.educationLevels.map((level: string) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <CopyButton text={data.education || ''} />
          </div>
        </div>
      </div>

    </Card>

    <Card>
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

      {/* Telefon a Email (přesunuto pod tlačítko kopírování jména) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
              {data.birthDate ? formatDateDDMMYYYY(data.birthDate) : 'Automaticky z rodného čísla'}
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

  {/* Horní jednorázová pole dokladu odstraněna - používáme pouze sekci 'Doklady totožnosti' níže */}

  {/* Spacer removed - using CSS Grid on parent container to align column tops */}

  {/* Doklady totožnosti sekce */}
      {prefix === 'applicant' && (
        <span id="doklady" className="block -mt-20 pt-20" />
      )}
      <div className="mt-6">
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
        
  {(data.documents || []).map((document: any, index: number) => (
          <div key={document.id} className="bg-gray-50 rounded-lg p-4 border mb-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Doklad #{index + 1}
              </h5>
              <div className="flex items-center space-x-2">
                {/* Tlačítko pro uložení */}
                <button
                  onClick={() => saveDocument(document.id)}
                  disabled={savingDocument === document.id}
                  className="p-1 text-blue-600 hover:text-blue-800 disabled:text-blue-400 transition-colors"
                  title="Uložit doklad"
                >
                  {savingDocument === document.id ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : savedDocument === document.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
                
                {/* Tlačítko pro smazání */}
                <button
                  onClick={() => {
                    setShowDeleteConfirm(`document-${document.id.toString()}`);
                  }}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="Smazat doklad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ dokladu
                </label>
                <div className="flex">
                  <select
                    value={document.documentType || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, documentType: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Typ dokladu"
                  >
                    <option value="">Vyberte typ</option>
                          {adminLists.documentTypes.map((type: string) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                  </select>
                  <CopyButton text={document.documentType || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Číslo dokladu
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={document.documentNumber || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, documentNumber: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Číslo dokladu"
                    title="Číslo dokladu"
                  />
                  <CopyButton text={document.documentNumber || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum vydání
                </label>
                <div className="flex">
                  <input
                    type="date"
                    value={document.documentIssueDate || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, documentIssueDate: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Datum vydání dokladu"
                  />
                  <CopyButton text={document.documentIssueDate || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platnost do
                </label>
                <div className="flex">
                  {/* Visible editable date input (previously an invisible overlay) */}
                  <input
                    type="date"
                    value={document.documentValidUntil || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, documentValidUntil: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Platnost do"
                    aria-label="Platnost do"
                  />
                  <CopyButton text={document.documentValidUntil ? formatDateDDMMYYYY(document.documentValidUntil) : ''} title="Kopírovat platnost" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doklad vydal
                  </label>
                <div className="flex">
                  <input
                    type="text"
                    value={document.issuingAuthority || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, issuingAuthority: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Kdo doklad vydal"
                    title="Doklad vydal"
                  />
                  <CopyButton text={document.issuingAuthority || ''} title="Kopírovat vydavatele" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Místo narození
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={document.placeOfBirth || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, placeOfBirth: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Praha"
                    title="Místo narození"
                  />
                  <CopyButton text={document.placeOfBirth || ''} title="Kopírovat místo narození" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontrolní číslo OP
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={document.controlNumber || ''}
                    onChange={(e) => {
                      const updatedDocuments = (data.documents || []).map((d: any) => 
                        d.id === document.id ? { ...d, controlNumber: e.target.value } : d
                      );
                      updateField('documents', updatedDocuments);
                    }}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="ABC123"
                    title="Kontrolní číslo"
                  />
                  <CopyButton text={document.controlNumber || ''} title="Kopírovat kontrolní číslo" />
                </div>
              </div>
            </div>
          </div>
        ))}
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

    <div className="flex flex-col gap-6">

  {/* Podnikání sekce */}
      {prefix === 'applicant' && (
        <span id="podnikani" className="block -mt-20 pt-20" />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-purple-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Podnikání</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
                if (fullName) {
                  // Zkopíruj jméno do schránky
                  navigator.clipboard.writeText(fullName).then(() => {
                    // Zobraz notifikaci
                    alert(`Jméno "${fullName}" bylo zkopírováno do schránky. Vložte ho na RŽP stránce.`);
                    // Otevři RŽP stránku
                    window.open('https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu', '_blank');
                  }).catch(() => {
                    // Fallback pokud clipboard nefunguje
                    window.open('https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu', '_blank');
                  });
                } else {
                  window.open('https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu', '_blank');
                }
              }}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              title="Zkopírovat jméno do schránky a otevřít RŽP vyhledávání"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              RŽP vyhledání
            </button>
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
        </div>
        
  {(data.businesses || []).map((business: any, index: number) => (
          <BusinessDisplay
            key={business.id}
            business={business}
            index={index}
            onUpdate={(updatedBusiness) => {
              const updatedBusinesses = (data.businesses || []).map((b: any) => 
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

      {/* Sekce Děti */}
      {prefix === 'applicant' && (
        <span id="deti" className="block -mt-20 pt-20" />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Děti</h4>
          </div>
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

    </div>
  </Card>

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
                  onClick={async () => {
                    // Získej celé ID dokumentu ze showDeleteConfirm (odstraň prefix "document-")
                    const documentId = showDeleteConfirm.replace('document-', '');
                    console.log('�️ Pokus o smazání dokumentu s ID:', documentId);
                    
                    // Najdi doklad pro smazání podle správného ID
                    const documentToDelete = (data.documents || []).find(d => d.id == documentId);
                    console.log('📄 Dokument k smazání:', documentToDelete);

                    // Pokud má doklad supabase_id, smaž ho i z databáze
                    if (documentToDelete?.supabase_id) {
                      console.log('🗑️ Mažu dokument ze Supabase s ID:', documentToDelete.supabase_id);
                      try {
                        const { error } = await supabase
                          .from('documents')
                          .delete()
                          .eq('id', documentToDelete.supabase_id);

                        if (error) {
                          console.error('❌ Chyba při mazání dokumentu ze Supabase:', error);
                          toast?.showError('Chyba', `Nepodařilo se smazat doklad z databáze: ${error.message}`);
                          // Zastavíme se, pokud smazání z DB selže
                          return; 
                        }
                        console.log('✅ Dokument úspěšně smazán ze Supabase.');
                        toast?.showSuccess('Smazáno', 'Doklad byl úspěšně smazán z databáze.');
                      } catch (error) {
                        console.error('❌ Došlo k výjimce při mazání:', error);
                        toast?.showError('Chyba', `Chyba při komunikaci s databází: ${error.message}`);
                        return;
                      }
                    } else {
                      console.log('ℹ️ Dokument nemá supabase_id, mažu pouze lokálně.');
                    }

                    // Smaž doklad z lokálního stavu
                    console.log('🔄 Aktualizuji lokální stav.');
                    const updatedDocuments = (data.documents || []).filter(d => d.id != documentId);
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
    {(data.extraFields || []).map((field: any, index: number) => (
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
                className="flex-1 block w-full border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm rounded-l-md"
                placeholder="12345678"
                maxLength={8}
              />
              <button
                onClick={() => fetchAresData(editData.ico)}
                disabled={isLoadingAres || editData.ico?.length !== 8}
                className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
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
            <AddressWithMapLinks
              value={editData.companyAddress || ''}
              onChange={(value) => setEditData({ ...editData, companyAddress: value })}
              placeholder="Adresa sídla společnosti"
              className="text-sm"
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
                {business.businessStartDate ? formatDateDDMMYYYY(business.businessStartDate) : 'Neuvedeno'}
              </span>
              <CopyButton text={business.businessStartDate ? formatDateDDMMYYYY(business.businessStartDate) : ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// (Card defined above)