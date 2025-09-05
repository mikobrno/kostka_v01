import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { AresService } from '../../services/aresService';
import { supabase } from '../../lib/supabase';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { ChildrenManager } from '../ChildrenManager';
import CopyIconButton from '../CopyIconButton';
import { User, Plus, Trash2, Save, X, Edit, Building, Search, Check, Copy } from 'lucide-react';

// Local domain types (minimal, extend as project-wide types are available)
interface DocumentShape {
  id: string | number;
  supabase_id?: string | number | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentIssueDate?: string | null;
  documentValidUntil?: string | null;
  issuingAuthority?: string | null;
  placeOfBirth?: string | null;
  controlNumber?: string | null;
}

interface BusinessShape {
  id: string | number;
  ico?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  businessStartDate?: string | null;
}

interface ChildShape {
  id: number;
  name: string;
  birthDate: string;
}

interface ExtraFieldShape {
  id: string | number;
  label?: string;
  value?: string;
}


interface PersonalData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthNumber?: string;
  birthDate?: string;
  birthYear?: number | string | null;
  age?: number | null;
  documents?: DocumentShape[];
  businesses?: BusinessShape[];
  children?: ChildShape[];
  extraFields?: ExtraFieldShape[];
  title?: string;
  maidenName?: string;
  maritalStatus?: string;
  citizenship?: string;
  housingType?: string;
  education?: string;
  permanentAddress?: string;
  contactAddress?: string;
}

interface PersonalInfoProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
  prefix: string;
  clientId?: string | number;
  toast?: { showSuccess?: (t: string, m?: string) => void; showError?: (t: string, m?: string) => void } | null;
}

// Top-level helper used by multiple components in this file
function formatDateDDMMYYYY(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Note: helper formatDateDDMMYYYY is defined inside the component to avoid export-only-file Fast Refresh warning.

// Card wrapper to standardize column appearance and padding
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {children}
    </div>
  );
}

// Default admin lists (module-level so they're stable for hooks)
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
] as string[];

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
] as string[];

const DEFAULT_HOUSING_TYPES = [
  'vlastní byt',
  'vlastní dům',
  'nájemní byt',
  'nájemní dům',
  'družstevní byt',
  'služební byt',
  'u rodičů/příbuzných',
  'jiné'
] as string[];

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange, prefix, clientId, toast }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [savingDocument, setSavingDocument] = useState<string | number | null>(null);
  const [savedDocument, setSavedDocument] = useState<string | number | null>(null);
  
  // Load admin lists once on mount. Module-level DEFAULT_* constants are stable.
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
  }, [data, onChange]);
  
  // admin lists stored in state so we can update them after loading
  interface AdminLists {
    titles: string[];
    maritalStatuses: string[];
    documentTypes: string[];
    banks: string[];
    citizenships: string[];
    educationLevels: string[];
    housingTypes: string[];
  }

  const [adminLists, setAdminLists] = useState<AdminLists>({
    titles: [] as string[],
    maritalStatuses: [] as string[],
    documentTypes: [] as string[],
    banks: [] as string[],
    citizenships: DEFAULT_CITIZENSHIPS,
    educationLevels: DEFAULT_EDUCATION_LEVELS,
    housingTypes: DEFAULT_HOUSING_TYPES
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
          const lists: AdminLists = {
            titles: [],
            maritalStatuses: [],
            documentTypes: [],
            banks: [],
            citizenships: DEFAULT_CITIZENSHIPS, // Keep default citizenships
            housingTypes: DEFAULT_HOUSING_TYPES,  // Keep default housing types
            educationLevels: DEFAULT_EDUCATION_LEVELS // Keep default education levels
          };

          interface AdminListItem {
            list_type: 'titles' | 'marital_statuses' | 'document_types' | 'banks' | 'citizenships' | 'housing_types' | 'education_levels' | string;
            items?: string[];
          }

          if (Array.isArray(data)) {
            const arr = data as AdminListItem[];
            arr.forEach((item) => {
              switch (item.list_type) {
                case 'titles':
                  lists.titles = item.items ?? [];
                  break;
                case 'marital_statuses':
                  lists.maritalStatuses = item.items ?? [];
                  break;
                case 'document_types':
                  lists.documentTypes = item.items ?? [];
                  break;
                case 'banks':
                  lists.banks = item.items ?? [];
                  break;
                case 'citizenships':
                  lists.citizenships = item.items ?? lists.citizenships;
                  break;
                case 'housing_types':
                  lists.housingTypes = item.items ?? lists.housingTypes;
                  break;
                case 'education_levels':
                  lists.educationLevels = item.items ?? lists.educationLevels;
                  break;
                default:
                  break;
              }
            });
          }

          setAdminLists(lists);
        }
      } catch (error) {
        console.error('Chyba při načítání admin seznamů:', error);
      }
    };

    loadAdminLists();
  }, []);

  const calculateAgeFromBirthNumber = (birthNumber?: string | null) => {
    if (!birthNumber || birthNumber.length !== 10) return null;

    const year = parseInt(birthNumber.substring(0, 2), 10);
    let month = parseInt(birthNumber.substring(2, 4), 10);
    const day = parseInt(birthNumber.substring(4, 6), 10);

    // Adjust month for women (month - 50)
    if (month > 50) month -= 50;

    // Determine century (simple heuristic: 00- currentYear%100 => 2000s else 1900s)
    const currentYearFull = new Date().getFullYear();
    const century = year <= (currentYearFull % 100) ? 2000 : 1900;
    const fullYear = century + year;

    // Basic validation for month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const birthDateObj = new Date(fullYear, month - 1, day);
    if (birthDateObj.getFullYear() !== fullYear || birthDateObj.getMonth() !== (month - 1) || birthDateObj.getDate() !== day) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) age--;

    const formattedBirthDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { age, birthYear: fullYear, birthDate: formattedBirthDate };
  };

  // Formátovat datum jako DD.MM.YYYY (s leading zero pro den a měsíc)
  // formatDateDDMMYYYY helper is declared at top-level to be reused.

  // Helper to display date as dd-mm-yyyy from ISO or other formats
  const formatDateDisplay = (isoOrAny?: string | null) => {
    if (!isoOrAny) return '';
    const d = new Date(isoOrAny);
    if (Number.isNaN(d.getTime())) return isoOrAny; // fallback to raw
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Parse display format dd-mm-yyyy to ISO yyyy-mm-dd. If parsing fails, return original string.
  const parseDisplayToISO = (display?: string | null) => {
    if (!display) return '';
    const parts = display.split('-');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      // basic validation
      const day = parseInt(dd, 10);
      const month = parseInt(mm, 10);
      const year = parseInt(yyyy, 10);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // try Date parse fallback
    const d = new Date(display);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return display;
  };

  const getBirthYearFromDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return String(d.getFullYear());
  };

  const updateField = (field: string, value: unknown) => {
    const updated: PersonalData = { ...data, [field]: value } as PersonalData;

    // Auto-calculate age and birth date from birth number
    if (field === 'birthNumber') {
      const ageData = calculateAgeFromBirthNumber(String(value || ''));
      if (ageData) {
        updated.age = ageData.age;
        updated.birthYear = ageData.birthYear;
        updated.birthDate = ageData.birthDate; // Store birth date
      } else {
        updated.age = null;
        updated.birthYear = null;
        updated.birthDate = undefined; // Clear if invalid
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
  toast?.showError?.('Chyba', 'Není dostupné ID klienta pro uložení dokladu');
      return;
    }

    setSavingDocument(documentId);
    try {
      // Najdi specifický doklad
  const document = (data.documents || []).find((doc: DocumentShape) => doc.id == documentId);
      console.log('📄 Nalezený dokument:', document);
      if (!document) {
        throw new Error('Doklad nebyl nalezen');
      }

      // Připrav data pro Supabase (bez lokálního ID)
      const documentData = {
        client_id: String(clientId),
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
  // Preferuj explicitní `supabase_id` (uložené ID z DB). Pokud není, zvaž `id` pouze pokud je to string (např. při načtení ze serveru)
  // Tím zabráníme použití lokálních číselných ID (Date.now()) jako UUID při volání Supabase.
  const isStringId = typeof document.id === 'string' && document.id.trim() !== '';
  let maybeId = document.supabase_id ?? (isStringId ? document.id : undefined);
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
        const updatedDocuments = (data.documents || []).map((doc: DocumentShape) => 
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
        let updatedDocuments = (data.documents || []).map((doc: DocumentShape) => 
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
        updatedDocuments = updatedDocuments.filter((d: DocumentShape) => {
          const key = d.supabase_id ? String(d.supabase_id) : `local:${d.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        onChange({ ...data, documents: updatedDocuments });
      }

  setSavedDocument(documentId);
  toast?.showSuccess?.('Uloženo', `Doklad byl úspěšně uložen`);
      
      // Skryj ikonku checkmarku po 2 sekundách
      setTimeout(() => {
        setSavedDocument(null);
      }, 2000);
    } catch (error) {
      console.error('Chyba při ukládání dokladu:', error);
      toast?.showError?.('Chyba', error instanceof Error ? error.message : 'Nepodařilo se uložit doklad');
    } finally {
      setSavingDocument(null);
    }
  };

  // Derived values for top summary
  // derived values are calculated inline where needed

  const CopyIconButton: React.FC<{ value?: string | number; label?: string }> = ({ value, label }) => {
    const [done, setDone] = React.useState(false);
    const handle = async () => {
      try {
  await navigator.clipboard.writeText(String(value || ''));
  toast?.showSuccess?.('Zkopírováno', label || 'Text zkopírován');
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      } catch {
        // ignore
      }
    };
    return (
      <button
        type="button"
        onClick={handle}
        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
        title={label || 'Kopírovat'}
        aria-label={label || 'Kopírovat'}
      >
        {done ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {prefix === 'applicant' ? 'Osobní údaje žadatele' : 'Osobní údaje spolužadatele'}
      </h3>
      
      {/* Horní sekce: Základní údaje (upravené rozložení) */}
  <div className="mb-4">
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 p-4 min-h-40">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Základní údaje</h4>
              <div className="flex items-center space-x-2">
                {/* small per-field copy buttons are used next to each input */}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div className="space-y-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jméno</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    title="Jméno"
                    placeholder="Jméno"
                    aria-label="Jméno"
                    value={data.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <CopyIconButton value={`${data.firstName || ''}`} label="Kopírovat jméno" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    title="Telefon"
                    placeholder="Telefon"
                    aria-label="Telefon"
                    value={data.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 px-3 py-2 bg-white text-sm"
                  />
                  <CopyIconButton value={`${data.phone || ''}`} label="Kopírovat telefon" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rodné číslo</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    title="Rodné číslo"
                    placeholder="Rodné číslo"
                    aria-label="Rodné číslo"
                    value={data.birthNumber || ''}
                    onChange={(e) => updateField('birthNumber', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  />
                  <CopyIconButton value={`${data.birthNumber || ''}`} label="Kopírovat rodné číslo" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Příjmení</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    title="Příjmení"
                    placeholder="Příjmení"
                    aria-label="Příjmení"
                    value={data.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <CopyIconButton value={`${data.lastName || ''}`} label="Kopírovat příjmení" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center">
                  <input
                    type="email"
                    title="Email"
                    placeholder="Email"
                    aria-label="Email"
                    value={data.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 px-3 py-2 bg-white text-sm"
                  />
                  <CopyIconButton value={`${data.email || ''}`} label="Kopírovat email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum narození</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    title="Datum narození"
                    placeholder="dd-mm-rrrr"
                    aria-label="Datum narození"
                    value={data.birthDate ? formatDateDisplay(data.birthDate) : ''}
                    onChange={(e) => updateField('birthDate', parseDisplayToISO(e.target.value))}
                    className="flex-1 block w-full rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <CopyIconButton value={`${data.birthDate ? formatDateDisplay(data.birthDate) : ''}`} label="Kopírovat datum narození" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="py-1 flex items-center">
              <label className="text-sm text-gray-600 mr-2">Věk</label>
              <div className="flex items-center w-full">
                <input type="text" readOnly aria-label="Věk" title="Věk" value={String(calculateAgeFromBirthNumber(data.birthNumber)?.age ?? '')} className="flex-1 block w-full rounded-l-md border border-gray-300 px-3 py-2 bg-white text-sm" />
                <CopyIconButton value={String(calculateAgeFromBirthNumber(data.birthNumber)?.age ?? '')} label="Kopírovat věk" />
              </div>
            </div>
            <div className="py-1 text-right flex items-center justify-end">
              <label className="text-sm text-gray-600 mr-2">Rok narození</label>
              <div className="flex items-center w-40">
                <input type="text" readOnly aria-label="Rok narození" title="Rok narození" value={String(calculateAgeFromBirthNumber(data.birthNumber)?.birthYear ?? getBirthYearFromDate(data.birthDate))} className="flex-1 block w-full rounded-l-md border border-gray-300 px-3 py-2 bg-white text-sm text-right" />
                <CopyIconButton value={String(calculateAgeFromBirthNumber(data.birthNumber)?.birthYear ?? getBirthYearFromDate(data.birthDate))} label="Kopírovat rok narození" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-6 items-start form-grid-layout">
    <Card>
      {/* Levý sloupec */}
      <div>
        {/* Osobní údaje */}
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
                title="Rodinný stav"
              >
                <option value="">Vyberte stav</option>
                {adminLists.maritalStatuses.map((status: string) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
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
                title="Občanství"
              >
                <option value="">Vyberte občanství</option>
                {adminLists.citizenships.map((citizenship: string) => (
                  <option key={citizenship} value={citizenship}>{citizenship}</option>
                ))}
              </select>
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
                title="Druh bydlení"
              >
                <option value="">Vyberte druh bydlení</option>
                {adminLists.housingTypes.map((type: string) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
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
                title="Nejvyšší dosažené vzdělání"
              >
                <option value="">Vyberte vzdělání</option>
                {adminLists.educationLevels.map((level: string) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

  {/* starší duplicity telefon/email/rodne cislo/vek/rok/datum byly odstraněny protože jsou v horní sekci */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trvalé bydliště
          </label>
          <AddressWithMapLinks
            value={data.permanentAddress || ''}
            onChange={(value) => updateField('permanentAddress', value)}
            onCopy={() => toast?.showSuccess?.('Zkopírováno', 'Trvalé bydliště zkopírováno')}
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
            onCopy={() => toast?.showSuccess?.('Zkopírováno', 'Kontaktní adresa zkopírována')}
            placeholder="Začněte psát adresu..."
          />
        </div>

    {/* Doklady totožnosti sekce - vloženo nad Podnikání */}
    {/* Anchor místo vkládáme přímo na sekci pomocí scroll-mt-20 - bezpečnější než negativní margin */}
  <div id={prefix === 'applicant' ? 'doklady' : undefined} className="mt-6 min-h-64 scroll-mt-20">
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
        title="Přidat doklad"
            >
              <Plus className="w-3 h-3 mr-1" />
              Přidat doklad
            </button>
          </div>

            {(data.documents || []).map((document: DocumentShape, index: number) => (
            <div key={document.id} className="bg-gray-50 rounded-lg p-4 border mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Doklad #{index + 1}</h5>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => saveDocument(document.id)}
                    disabled={savingDocument === document.id}
                    className="p-1 text-blue-600 hover:text-blue-800 disabled:text-blue-400 transition-colors"
                    title="Uložit doklad"
                    aria-label={`Uložit doklad ${index + 1}`}
                  >
                    {savingDocument === document.id ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : savedDocument === document.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(`document-${document.id.toString()}`)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Smazat doklad"
                    aria-label={`Smazat doklad ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ dokladu</label>
                  <div className="flex">
                    <select
                      value={document.documentType || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
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
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.documentType || '');
                            toast?.showSuccess?.('Zkopírováno', 'Typ dokladu zkopírován');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat typ dokladu"
                        aria-label="Kopírovat typ dokladu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Číslo dokladu</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={document.documentNumber || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, documentNumber: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Číslo dokladu"
                      title="Číslo dokladu"
                    />
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.documentNumber || '');
                            toast?.showSuccess?.('Zkopírováno', 'Číslo dokladu zkopírováno');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat číslo dokladu"
                        aria-label="Kopírovat číslo dokladu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum vydání</label>
                  <div className="flex">
                    <input
                      type="date"
                      value={document.documentIssueDate || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, documentIssueDate: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      title="Datum vydání dokladu"
                    />
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.documentIssueDate || '');
                            toast?.showSuccess?.('Zkopírováno', 'Datum vydání zkopírováno');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat datum vydání"
                        aria-label="Kopírovat datum vydání"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platnost do</label>
                  <div className="flex">
                    <input
                      type="date"
                      value={document.documentValidUntil || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, documentValidUntil: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      title="Platnost do"
                      aria-label="Platnost do"
                    />
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.documentValidUntil || '');
                            toast?.showSuccess?.('Zkopírováno', 'Platnost do zkopírována');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat platnost"
                        aria-label="Kopírovat platnost dokladu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doklad vydal</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={document.issuingAuthority || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, issuingAuthority: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Kdo doklad vydal"
                      title="Doklad vydal"
                    />
                     <div className="ml-2">
                       <button
                         type="button"
                         onClick={async () => {
                           try {
                             await navigator.clipboard.writeText(document.issuingAuthority || '');
                             toast?.showSuccess?.('Zkopírováno', 'Doklad vydal - zkopírováno');
                           } catch {
                             /* ignore */
                           }
                         }}
                         className="p-1 text-gray-500 hover:text-gray-700"
                         title="Kopírovat kdo vydal doklad"
                         aria-label="Kopírovat kdo vydal doklad"
                       >
                         <Copy className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Místo narození</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={document.placeOfBirth || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, placeOfBirth: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Praha"
                      title="Místo narození"
                    />
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.placeOfBirth || '');
                            toast?.showSuccess?.('Zkopírováno', 'Místo narození zkopírováno');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat místo narození"
                        aria-label="Kopírovat místo narození"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontrolní číslo OP</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={document.controlNumber || ''}
                      onChange={(e) => {
                        const updatedDocuments = (data.documents || []).map((d: DocumentShape) => 
                          d.id === document.id ? { ...d, controlNumber: e.target.value } : d
                        );
                        updateField('documents', updatedDocuments);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="ABC123"
                      title="Kontrolní číslo"
                    />
                    <div className="ml-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(document.controlNumber || '');
                            toast?.showSuccess?.('Zkopírováno', 'Kontrolní číslo zkopírováno');
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Kopírovat kontrolní číslo"
                        aria-label="Kopírovat kontrolní číslo"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

          <div className="flex flex-col gap-6 mt-4">
          {/* Podnikání - samostatný blok (nad sebou) */}
          <div id={prefix === 'applicant' ? 'podnikani' : undefined} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full min-h-64 scroll-mt-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-purple-600" />
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Podnikání</h4>
              </div>
              <div className="flex items-center space-x-2">
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

            {(data.businesses || []).map((business: BusinessShape, index: number) => (
              <BusinessDisplay
                key={business.id}
                business={business}
                index={index}
                onUpdate={(updatedBusiness) => {
                  const updatedBusinesses = (data.businesses || []).map((b: BusinessShape) => 
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

          {/* Sekce Děti - samostatný blok pod podnikáním */}
          <div id={prefix === 'applicant' ? 'deti' : undefined} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full min-h-64 scroll-mt-20">
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
                checked={!(data.children && data.children.length > 0)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateField('children', []);
                  } else {
                    updateField('children', data.children || []);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <label htmlFor={`${prefix}-no-children`} className="text-sm font-medium text-gray-700">
                Nemá děti
              </label>
            </div>

            {(data.children && data.children.length > 0) && (
              <ChildrenManager
                children={data.children || []}
                onChange={(children: ChildShape[]) => updateField('children', children)}
              />
            )}
          </div>

          {/* Extra dynamická pole - pod nimi */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Extra pole</h4>
              <button
                onClick={() => {
                  const newField = { id: Date.now(), label: '', value: '' };
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
              {(data.extraFields || []).map((field: ExtraFieldShape, index: number) => (
                <ExtraFieldDisplay
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={(updatedField) => {
                    const updatedFields = (data.extraFields || []).map((f: ExtraFieldShape) => 
                      f.id === field.id ? updatedField : f
                    );
                    updateField('extraFields', updatedFields);
                  }}
                  onDelete={() => setShowDeleteConfirm(`field-${field.id.toString()}`)}
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
    </Card>

    <Card>
      {/* Pravý sloupec - vyhrazený pro budoucí obsah */}
      <div>
        {/* Prázdný pravý sloupec */}
      </div>
    </Card>
  </div>

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
                const documentToDelete = (data.documents || []).find((d: DocumentShape) => d.id == documentId);
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
                      toast?.showError?.('Chyba', `Nepodařilo se smazat doklad z databáze: ${error.message}`);
                      // Zastavíme se, pokud smazání z DB selže
                      return; 
                    }
                    console.log('✅ Dokument úspěšně smazán ze Supabase.');
                    toast?.showSuccess?.('Smazáno', 'Doklad byl úspěšně smazán z databáze.');
                  } catch (errUnknown) {
                    console.error('❌ Došlo k výjimce při mazání:', errUnknown);
                    const message = errUnknown instanceof Error ? errUnknown.message : String(errUnknown);
                    toast?.showError?.('Chyba', message);
                    return;
                  }
                } else {
                  console.log('ℹ️ Dokument nemá supabase_id, mažu pouze lokálně.');
                }

                // Smaž doklad z lokálního stavu
                console.log('🔄 Aktualizuji lokální stav.');
                const updatedDocuments = (data.documents || []).filter((d: { id: string | number }) => d.id !== documentId);
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
                  const updatedBusinesses = (data.businesses || []).filter((b: { id: string | number }) => b.id !== businessId);
                  updateField('businesses', updatedBusinesses);
                } else {
                  const fieldId = parseInt(showDeleteConfirm.replace('field-', ''));
                  const updatedFields = (data.extraFields || []).filter((f: { id: string | number }) => f.id !== fieldId);
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

  {/* konec returnu komponenty PersonalInfo */}
  </div>
  );
};

// Enhanced Extra Field Display Component with Edit Functionality
interface ExtraFieldDisplayProps {
  field: ExtraFieldShape;
  index: number;
  onUpdate: (field: ExtraFieldShape) => void;
  onDelete: () => void;
}

const ExtraFieldDisplay: React.FC<ExtraFieldDisplayProps> = ({ field, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(!field.label || !field.value); // Auto-edit if empty
  const [editData, setEditData] = useState(field);

  const handleSave = () => {
    const label = String(editData.label || '').trim();
    const value = String(editData.value || '').trim();
    if (!label || !value) {
      alert('Název pole a hodnota jsou povinné');
      return;
    }
    onUpdate({ ...editData, label, value });
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
                title="Smazat pole"
                aria-label="Smazat pole"
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
          <div className="flex-1 break-words leading-relaxed"><span className="break-words">{field.value || ''}</span></div>
          <CopyIconButton value={field.value || ''} />
        </div>
      </div>
    </div>
  );
};

// Business Display Component
interface BusinessDisplayProps {
  business: BusinessShape;
  index: number;
  onUpdate: (business: BusinessShape) => void;
  onDelete: () => void;
}

const BusinessDisplay: React.FC<BusinessDisplayProps> = ({ business, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<boolean>(!business.ico || !business.companyName);
  const [editData, setEditData] = useState<BusinessShape>(() => ({
    id: business.id,
    ico: business.ico || '',
    companyName: business.companyName || '',
    companyAddress: business.companyAddress || '',
    businessStartDate: business.businessStartDate || ''
  } as BusinessShape));
  const [isLoadingAres, setIsLoadingAres] = useState<boolean>(false);

  const handleSave = () => {
    if (!String(editData.ico || '').trim() || !String(editData.companyName || '').trim()) {
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
        setEditData((prev: BusinessShape) => ({ ...prev, companyName: data.companyName, companyAddress: data.address }));
      }
    } catch (err) {
      console.error('Chyba při načítání dat z ARES:', err);
      alert('Chyba při načítání dat z ARES');
    } finally {
      setIsLoadingAres(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-medium text-purple-900">{business.ico ? 'Úprava podnikání' : `Nové podnikání #${index + 1}`}</h5>
          <div className="flex items-center space-x-2">
            <button onClick={handleSave} className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"><Save className="w-3 h-3 mr-1" />Uložit</button>
            <button onClick={handleCancel} className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"><X className="w-3 h-3 mr-1" />Zrušit</button>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 transition-colors" title="Smazat podnikání" aria-label="Smazat podnikání"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">IČO *</label>
            <div className="flex">
              <input type="text" value={editData.ico || ''} onChange={(e) => { const ico = e.target.value.replace(/\D/g, '').slice(0,8); setEditData({ ...editData, ico }); if (ico.length===8) fetchAresData(ico); }} className="flex-1 block w-full border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm rounded-l-md" placeholder="12345678" maxLength={8} />
              <button onClick={() => editData.ico && fetchAresData(String(editData.ico))} disabled={isLoadingAres || !(editData.ico && editData.ico.length === 8)} className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md" title="Načíst data z ARES" aria-label="Načíst data z ARES">{isLoadingAres ? <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" /> : <Search className="w-4 h-4" />}</button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Zadáním IČO se automaticky vyplní název a adresa firmy z ARES</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Název firmy *</label>
            <input type="text" value={editData.companyName || ''} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm" placeholder="Název společnosti" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresa firmy</label>
            <AddressWithMapLinks value={editData.companyAddress || ''} onChange={(value) => setEditData({ ...editData, companyAddress: value })} placeholder="Adresa sídla společnosti" className="text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Začátek podnikání</label>
            <input type="date" value={editData.businessStartDate || ''} onChange={(e) => setEditData({ ...editData, businessStartDate: e.target.value })} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm" title="Začátek podnikání" placeholder="YYYY-MM-DD" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border w-full mb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2"><Building className="w-4 h-4 text-purple-600" /><span className="text-sm font-medium text-gray-900 dark:text-white">{business.companyName || 'Název firmy'}</span></div>
          <div className="flex items-center space-x-2"><button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Upravit podnikání"><Edit className="w-4 h-4" /></button><button onClick={onDelete} className="text-red-600 hover:text-red-800 transition-colors" title="Smazat podnikání"><Trash2 className="w-4 h-4" /></button></div>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">IČO:</span><div className="flex items-center space-x-2"><span className="text-gray-900 dark:text-white">{business.ico || ''}</span><CopyIconButton value={business.ico || ''} /></div></div>
          <div><span className="text-gray-500">Adresa:</span><div className="flex items-center space-x-2"><span className="text-gray-900 truncate">{business.companyAddress || ''}</span><CopyIconButton value={business.companyAddress || ''} /></div></div>
          <div><span className="text-gray-500">Začátek podnikání:</span><div className="flex items-center space-x-2"><span className="text-gray-900 dark:text-white">{business.businessStartDate ? formatDateDDMMYYYY(business.businessStartDate) : ''}</span><CopyIconButton value={business.businessStartDate ? formatDateDDMMYYYY(business.businessStartDate) : ''} /></div></div>
        </div>
      </div>
    </div>
  );
};

