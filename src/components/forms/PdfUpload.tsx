import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, User } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

// Mapování názvů polí formuláře -> interní klíče (globální konstanta mimo komponentu kvůli stable reference)
const FIELD_MAP: Record<string, string[]> = {
  applicant_firstName: ['jméno_1', 'jmeno_1', 'jméno1', 'jmeno1', 'jméno.1', 'jmeno.1', 'zadatel_jmeno', 'jmeno'],
  applicant_lastName: ['příjmení_1', 'prijmeni_1', 'příjmení1', 'prijmeni1', 'příjmení.1', 'prijmeni.1', 'zadatel_prijmeni', 'prijmeni'],
  applicant_birthNumber: ['rc_1', 'rodne_1', 'rc1', 'rodnecislo_1', 'rodne', 'rc', 'rodnecislo'],
  applicant_birthDate: ['datum_narození_1', 'datum_narozeni_1', 'datnar_1', 'dn_1'],
  applicant_phone: ['mobil_1', 'tel_1', 'telefon_1', 'mobil'],
  applicant_email: ['email_1', 'e-mail_1', 'mail_1', 'email'],
  applicant_bank: ['bank', 'bankovni_ucet', 'banka_1', 'banky_1', 'banka'],
  applicant_income3: ['příjmy_1', 'prijmy_1', 'cisty_prijem_3m_1'],
  applicant_income12: ['příjmy_2', 'prijmy_2', 'cisty_prijem_12m_1'],
  co_firstName: ['jméno_2', 'jmeno_2', 'jméno2', 'jmeno2', 'jméno.2', 'jmeno.2', 'spoluzadatel_jmeno'],
  co_lastName: ['příjmení_2', 'prijmeni_2', 'příjmení2', 'prijmeni2', 'příjmení.2', 'prijmeni.2', 'spoluzadatel_prijmeni'],
  co_birthNumber: ['rc_2', 'rodne_2', 'rc2', 'rodnecislo_2', 'rodne2'],
  co_birthDate: ['datum_narození_2', 'datum_narozeni_2', 'datnar_2', 'dn_2', 'datum_narozeni.2'],
  co_phone: ['mobil_2', 'telefon_2', 'tel_2', 'mobil2', 'mobil.2', 'telefon.2'],
  co_email: ['email_2', 'mail_2', 'e-mail_2', 'email2', 'email.2'],
  co_bank: ['banka_2', 'banky_2', 'bank_2'],
  co_income3: ['příjmy_3', 'prijmy_3', 'cisty_prijem_3m_2'],
  co_income12: ['příjmy_4', 'prijmy_4', 'cisty_prijem_12m_2'],
  loan_amount: ['požadovaná_výše', 'pozadovana_vyse', 'pozadovana_castka', '1._požadovaná_výše', '1_pozadovana_vyse'],
  loan_propertyValue: ['zjištěná_cena', 'zjistena_cena', 'zj_cena', 'tržní_hodnota', 'trzni_hodnota'],
  loan_purpose: ['účel', 'ucel', 'refinancování', 'refinancovani'],
  loan_bank: ['banka', 'banka_úvěr', 'banka_uver']
};

// Heuristické nápovědy pro další pole
const ADDRESS_KEY_HINTS = ['adresa', 'address', 'ulice', 'bydliste', 'bydliště'];
const PROPERTY_ADDRESS_HINTS = ['zajisteni', 'zajištění', 'nemovit', 'zastava', 'zástava', 'byt', 'dum', 'dům', 'pozemek'];
const PROPERTY_PRICE_HINTS = ['zj_cena', 'zjištěná_cena', 'zjistena_cena', 'tržní_hodnota', 'trzni_hodnota', 'cena_nemovitosti', 'kupni_cena', 'kupní_cena', 'cena'];

interface ExtractedData {
  applicant?: {
    firstName?: string;
    lastName?: string;
    birthNumber?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    address?: string;
    bank?: string;
    netIncome3m?: number;
    netIncome12m?: number;
  children?: { name?: string; birthDate?: string }[];
  };
  coApplicant?: {
    firstName?: string;
    lastName?: string;
    birthNumber?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    address?: string;
    bank?: string;
    netIncome3m?: number;
    netIncome12m?: number;
  children?: { name?: string; birthDate?: string }[]; // rezervováno pokud by bylo potřeba později
  };
  loan?: {
    amount?: number;
    purpose?: string;
    bank?: string;
    propertyValue?: number;
  };
  property?: {
    address?: string;
    price?: number;
  };
  // případně další sekce – liabilities, children atd.
}

interface PdfUploadProps {
  onDataExtracted: (data: ExtractedData) => void;
  onError: (error: string) => void;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({ onDataExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [rawFieldDump, setRawFieldDump] = useState<Record<string,string>>({});

  // Utility: normalizace čísla/ceny (odstranění mezer, teček, Kč)
  const parseNumber = (v?: string) => {
    if (!v) return undefined;
    const cleaned = v
      .replace(/\s+/g, '')
      .replace(/Kč|CZK|,-/gi, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  // Vybere hodnotu z mapy fieldů podle kandidátů
  const normalize = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[._\s]/g, '');

  const pickValue = (fields: Record<string, string>, candidates: string[]) => {
    const entries = Object.entries(fields).map(([k,v]) => [normalize(k), v] as [string,string]);
    for (const cand of candidates) {
      const c = normalize(cand);
      const hit = entries.find(([k]) => k.includes(c));
      if (hit && hit[1]) return hit[1];
    }
    return undefined;
  };

  // Hlavní funkce extrakce z PDF formuláře
  const extractDataFromPdf = async (file: File): Promise<ExtractedData> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    let form;
    try {
      form = pdfDoc.getForm();
    } catch {
      // PDF nemá formulář – fallback (zatím žádný další parsing)
      return {};
    }
    const rawFields: Record<string, string> = {};
  form.getFields().forEach(field => {
      const name = field.getName();
      try {
        // PDF-lib typy jsou generické, bezpečně feature-detect
        const f: unknown = field as unknown;
        if (typeof (f as { getText?: () => string }).getText === 'function') {
          const val = (f as { getText: () => string }).getText();
          if (val) rawFields[name] = String(val).trim();
        } else if (typeof (f as { isChecked?: () => boolean }).isChecked === 'function') {
          rawFields[name] = (f as { isChecked: () => boolean }).isChecked() ? 'X' : '';
        } else if (typeof (f as { getSelected?: () => string[] }).getSelected === 'function') {
          const sel = (f as { getSelected: () => string[] }).getSelected();
          if (sel && sel.length) rawFields[name] = sel.join(',');
        }
      } catch {
        /* ignore individual field errors */
      }
    });
  setRawFieldDump(rawFields);

    // Sestavení výsledku
    const applicant = {
      firstName: pickValue(rawFields, FIELD_MAP.applicant_firstName),
      lastName: pickValue(rawFields, FIELD_MAP.applicant_lastName),
      birthNumber: pickValue(rawFields, FIELD_MAP.applicant_birthNumber),
      birthDate: pickValue(rawFields, FIELD_MAP.applicant_birthDate),
      phone: pickValue(rawFields, FIELD_MAP.applicant_phone),
      email: pickValue(rawFields, FIELD_MAP.applicant_email),
      bank: pickValue(rawFields, FIELD_MAP.applicant_bank),
      netIncome3m: parseNumber(pickValue(rawFields, FIELD_MAP.applicant_income3)),
      netIncome12m: parseNumber(pickValue(rawFields, FIELD_MAP.applicant_income12)),
  address: undefined as string | undefined,
  children: undefined as { name?: string; birthDate?: string }[] | undefined
    };
    const coApplicant = {
      firstName: pickValue(rawFields, FIELD_MAP.co_firstName),
      lastName: pickValue(rawFields, FIELD_MAP.co_lastName),
      birthNumber: pickValue(rawFields, FIELD_MAP.co_birthNumber),
      birthDate: pickValue(rawFields, FIELD_MAP.co_birthDate),
      phone: pickValue(rawFields, FIELD_MAP.co_phone),
      email: pickValue(rawFields, FIELD_MAP.co_email),
      bank: pickValue(rawFields, FIELD_MAP.co_bank),
      netIncome3m: parseNumber(pickValue(rawFields, FIELD_MAP.co_income3)),
      netIncome12m: parseNumber(pickValue(rawFields, FIELD_MAP.co_income12)),
  address: undefined as string | undefined,
  children: undefined as { name?: string; birthDate?: string }[] | undefined
    };
    // Heuristiky – pokud pole nejsou nalezena přes názvy
    // 1) Rodná čísla: najdeme všechna ve formátu 6 číslic / 3-4 číslice
    const birthNumbers = Object.values(rawFields).filter(v => v && /^\d{6}\/\d{3,4}$/.test(v.trim()));
    console.log('Birth numbers found:', birthNumbers);
    if (!applicant.birthNumber && birthNumbers.length > 0) {
      applicant.birthNumber = birthNumbers[0];
      console.log('Assigned birth number to applicant:', birthNumbers[0]);
    }
    if (!coApplicant.birthNumber && birthNumbers.length > 1) {
      coApplicant.birthNumber = birthNumbers[1];
      console.log('Assigned birth number to coApplicant:', birthNumbers[1]);
    }

    // Speciální kontrola pro RC pole - přímé vyhledání podle hodnot
    const rcEntries = Object.entries(rawFields).filter(([,v]) => 
      v && /^\d{6}\/\d{3,4}$/.test(v.trim())
    );
    console.log('RC entries found:', rcEntries);
    if (!applicant.birthNumber && rcEntries.length > 0) {
      applicant.birthNumber = rcEntries[0][1];
      console.log('Found first RC:', rcEntries[0]);
    }
    if (!coApplicant.birthNumber && rcEntries.length > 1) {
      coApplicant.birthNumber = rcEntries[1][1];
      console.log('Found second RC:', rcEntries[1]);
    }

    // 2) Jména – pokud chybí spolužadatel, zkusíme najít druhé jméno/příjmení dle pořadí
    if (!coApplicant.firstName || !coApplicant.lastName) {
      const nameFieldEntries = Object.entries(rawFields)
        .filter(([k]) => /jme?n(o|ó)/i.test(k) || /pr(i|í)jme?n/i.test(k));
      // seřadíme podle názvu pro predikovatelné pořadí
      nameFieldEntries.sort((a,b) => a[0].localeCompare(b[0]));
      const firstNameCandidates = nameFieldEntries.filter(([k]) => /jme?n(o|ó)/i.test(k));
      const lastNameCandidates = nameFieldEntries.filter(([k]) => /pr(i|í)jme?n/i.test(k));
      if (!coApplicant.firstName && firstNameCandidates.length > 1) {
        const second = firstNameCandidates[1][1];
        if (second && second !== applicant.firstName) coApplicant.firstName = second;
      }
      if (!coApplicant.lastName && lastNameCandidates.length > 1) {
        const second = lastNameCandidates[1][1];
        if (second && second !== applicant.lastName) coApplicant.lastName = second;
      }
    }

    // 3) Pokud není přímé pole pro příjem spolužadatele, ale existují více než 1 příjmové pole, zkusíme přiřadit druhé
    if (!coApplicant.netIncome3m || !coApplicant.netIncome12m) {
      const incomeValues = Object.entries(rawFields)
        .filter(([k]) => /pr(i|í)jmy|cisty_prijem/i.test(k))
        .map(([,v]) => parseNumber(v))
        .filter(v => typeof v === 'number') as number[];
      if (incomeValues.length > 1) {
        if (!coApplicant.netIncome3m && incomeValues[1] && incomeValues[1] !== applicant.netIncome3m) coApplicant.netIncome3m = incomeValues[1];
        if (!coApplicant.netIncome12m && incomeValues[3] && incomeValues[3] !== applicant.netIncome12m) coApplicant.netIncome12m = incomeValues[3];
      }
    }
    const loan = {
      amount: parseNumber(pickValue(rawFields, FIELD_MAP.loan_amount)),
      propertyValue: parseNumber(pickValue(rawFields, FIELD_MAP.loan_propertyValue)),
      purpose: pickValue(rawFields, FIELD_MAP.loan_purpose),
      bank: pickValue(rawFields, FIELD_MAP.loan_bank)
    };

    // Heuristiky pro adresy a nemovitost
    const lowerEntries = Object.entries(rawFields).map(([k,v]) => [k.toLowerCase(), v] as [string,string]);
    const findFirstByHints = (hints: string[], validator?: (val:string)=>boolean) => {
      for (const [k,v] of lowerEntries) {
        if (hints.some(h => k.includes(h))) {
          if (!validator || validator(v)) return v;
        }
      }
      return undefined;
    };

    if (!applicant.address) {
      const addr = findFirstByHints(ADDRESS_KEY_HINTS, v => /\d{1,4}/.test(v));
      if (addr) applicant.address = addr;
    }
    if (!coApplicant.address) {
      const allAddrValues = lowerEntries
        .filter(([k]) => ADDRESS_KEY_HINTS.some(h => k.includes(h)))
        .map(([,v]) => v)
        .filter(Boolean);
      const unique = Array.from(new Set(allAddrValues));
      if (unique.length > 1) {
        const second = unique.find(v => v !== applicant.address);
        if (second) coApplicant.address = second;
      }
    }

    const propertyAddress = findFirstByHints(PROPERTY_ADDRESS_HINTS, v => /\d{1,4}/.test(v));
    let propertyPrice: number | undefined;
    for (const [k,v] of lowerEntries) {
      if (PROPERTY_PRICE_HINTS.some(h => k.includes(h))) {
        const num = parseNumber(v);
        if (num && (!propertyPrice || num > propertyPrice)) propertyPrice = num; // nejvyšší = často tržní hodnota
      }
    }
    const property: ExtractedData['property'] = {};
    if (propertyAddress) property.address = propertyAddress;
    if (propertyPrice) property.price = propertyPrice;

    // 4) Děti – kid_1 (jméno), kid_2 (datum), kid_3 (jméno), kid_4 (datum) ...
    console.log('All raw field keys:', Object.keys(rawFields));
    const kidEntries = Object.keys(rawFields)
      .map(k => ({ key: k, norm: normalize(k) }))
      .filter(o => {
        const matches = /^kid\d+$/.test(o.norm);
        if (matches) console.log('Kid field found:', o.key, '->', o.norm);
        return matches;
      });
    console.log('Kid entries found:', kidEntries);
    if (kidEntries.length) {
      const indices = Array.from(new Set(kidEntries.map(o => {
        const match = o.norm.match(/^kid(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      }))).filter(i => i > 0).sort((a,b)=>a-b);
      console.log('Kid indices:', indices);
      const children: { name?: string; birthDate?: string }[] = [];
      for (let i = 0; i < indices.length; i += 2) {
        const nameIdx = indices[i];
        const birthIdx = indices[i + 1];
        const nameKey = kidEntries.find(e => {
          const match = e.norm.match(/^kid(\d+)$/);
          return match && parseInt(match[1], 10) === nameIdx;
        })?.key;
        const birthKey = kidEntries.find(e => {
          const match = e.norm.match(/^kid(\d+)$/);
          return match && parseInt(match[1], 10) === birthIdx;
        })?.key;
        const nameVal = nameKey ? rawFields[nameKey] : undefined;
        const birthVal = birthKey ? rawFields[birthKey] : undefined;
        console.log(`Kid pair ${nameIdx}/${birthIdx}: name=${nameVal}, birth=${birthVal}`);
        if (nameVal || birthVal) {
          children.push({ name: nameVal || '', birthDate: birthVal || '' });
        }
      }
      console.log('Children extracted:', children);
      if (children.length) {
        applicant.children = children;
      }
    }

    const result: ExtractedData = {};
    if (Object.values(applicant).some(v => v !== undefined && v !== '')) result.applicant = applicant;
    if (Object.values(coApplicant).some(v => v !== undefined && v !== '')) result.coApplicant = coApplicant;
    if (Object.values(loan).some(v => v !== undefined && v !== '')) result.loan = loan;
    if (Object.values(property).some(v => v !== undefined && v !== '')) result.property = property;
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError('Prosím nahrajte pouze PDF soubor');
      setUploadStatus('error');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setUploadStatus('processing');

    try {
  const extracted = await extractDataFromPdf(file);
  setExtractedData(extracted);
  setUploadStatus('success');
  onDataExtracted(extracted);
    } catch (error) {
      console.error('Chyba při extrakci dat z PDF:', error);
      setUploadStatus('error');
  onError('Nepodařilo se extrahovat data – zkontrolujte, že PDF obsahuje vyplněný formulář');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      handleFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setExtractedData(null);
    setFileName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vložit PDF formulář</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Nahrajte PDF formulář a automaticky extrahujte data klienta
          </p>
        </div>
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isProcessing
            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isProcessing ? 'Zpracovávám PDF...' 
               : uploadStatus === 'success' ? 'Data extrahována (formulář)'
               : uploadStatus === 'error' ? 'Chyba při zpracování'
               : 'Nahrát PDF formulář'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isProcessing 
                ? `Extrahuji data z "${fileName}", prosím čekejte...`
                : uploadStatus === 'success'
                ? `Úspěšně zpracován soubor: ${fileName}`
                : uploadStatus === 'error'
                ? 'Zkuste to prosím znovu s jiným souborem'
                : 'Přetáhněte PDF soubor sem nebo klikněte pro výběr'
              }
            </p>
          </div>

          <div className="flex space-x-3">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="pdf-upload"
            />
            
            {uploadStatus !== 'success' && (
              <label
                htmlFor="pdf-upload"
                className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                  isProcessing 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {uploadStatus === 'error' ? 'Zkusit znovu' : 'Vybrat PDF soubor'}
              </label>
            )}

            {uploadStatus === 'success' && (
              <button
                onClick={resetUpload}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Nahrát nový soubor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extracted data preview */}
      {extractedData && uploadStatus === 'success' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Extrahovaná data
            </h3>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Připraveno k použití
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Žadatel */}
            {extractedData.applicant && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Žadatel
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Jméno:</span> {extractedData.applicant.firstName} {extractedData.applicant.lastName}</div>
                  <div><span className="font-medium">Rodné číslo:</span> {extractedData.applicant.birthNumber}</div>
                  <div><span className="font-medium">Datum narození:</span> {extractedData.applicant.birthDate}</div>
                  <div><span className="font-medium">Telefon:</span> {extractedData.applicant.phone}</div>
                  <div><span className="font-medium">Email:</span> {extractedData.applicant.email}</div>
                  <div><span className="font-medium">Adresa:</span> {extractedData.applicant.address}</div>
                  {(extractedData.applicant.netIncome3m || extractedData.applicant.netIncome12m) && (
                    <div><span className="font-medium">Čistý příjem (3/12m):</span> {extractedData.applicant.netIncome3m?.toLocaleString('cs-CZ')} / {extractedData.applicant.netIncome12m?.toLocaleString('cs-CZ')}</div>
                  )}
                  {extractedData.applicant.children?.length && (
                    <div>
                      <span className="font-medium">Děti:</span>{' '}
                      {extractedData.applicant.children.map((c,i) => (
                        <span key={i} className="inline-block mr-2">{c.name}{c.birthDate ? ` (${c.birthDate})` : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spolužadatel */}
            {extractedData.coApplicant && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Spolužadatel
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Jméno:</span> {extractedData.coApplicant.firstName} {extractedData.coApplicant.lastName}</div>
                  <div><span className="font-medium">Rodné číslo:</span> {extractedData.coApplicant.birthNumber}</div>
                  <div><span className="font-medium">Datum narození:</span> {extractedData.coApplicant.birthDate}</div>
                  <div><span className="font-medium">Telefon:</span> {extractedData.coApplicant.phone}</div>
                  <div><span className="font-medium">Email:</span> {extractedData.coApplicant.email}</div>
                  <div><span className="font-medium">Adresa:</span> {extractedData.coApplicant.address}</div>
                  {(extractedData.coApplicant.netIncome3m || extractedData.coApplicant.netIncome12m) && (
                    <div><span className="font-medium">Čistý příjem (3/12m):</span> {extractedData.coApplicant.netIncome3m?.toLocaleString('cs-CZ')} / {extractedData.coApplicant.netIncome12m?.toLocaleString('cs-CZ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Úvěr */}
            {extractedData.loan && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Úvěr
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Výše úvěru:</span> {extractedData.loan.amount?.toLocaleString('cs-CZ')} Kč</div>
                  <div><span className="font-medium">Účel:</span> {extractedData.loan.purpose}</div>
                  <div><span className="font-medium">Banka:</span> {extractedData.loan.bank}</div>
                  {extractedData.loan.propertyValue && (
                    <div><span className="font-medium">Hodnota / zjištěná cena:</span> {extractedData.loan.propertyValue.toLocaleString('cs-CZ')} Kč</div>
                  )}
                </div>
              </div>
            )}

            {/* Nemovitost */}
            {extractedData.property && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Nemovitost
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Adresa:</span> {extractedData.property.address}</div>
                  {extractedData.property.price && (
                    <div><span className="font-medium">Cena / hodnota:</span> {extractedData.property.price.toLocaleString('cs-CZ')} Kč</div>
                  )}
                </div>
              </div>
            )}

            {/* Zaměstnavatel */}
            {/* Zaměstnavatel zatím neparsujeme – lze doplnit */}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Tip:</strong> Data jsou načtena z názvů polí formuláře. Pokud něco chybí, zkontrolujte názvy ve zdrojovém PDF nebo je přidejte do mapy ve `PdfUpload.tsx` (konstanta FIELD_MAP).</p>
            <p className="text-xs opacity-75">(Žádné údaje nejsou odeslány na server – vše běží lokálně v prohlížeči.)</p>
            {Object.keys(rawFieldDump).length > 0 && (
              <details className="mt-2" open>
                <summary className="cursor-pointer text-xs underline">Zobrazit syrové názvy a hodnoty polí ({Object.keys(rawFieldDump).length})</summary>
                <div className="mt-2 max-h-60 overflow-auto text-[11px] bg-white/60 dark:bg-gray-900/40 p-2 rounded border border-blue-200 dark:border-blue-700 space-y-1">
                  {Object.entries(rawFieldDump).map(([k,v]) => (
                    <div key={k}><span className="font-mono text-blue-700 dark:text-blue-300">{k}</span>: <span className="font-mono">{v}</span></div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Dummy reference aby ESLint nevnímal mapu jako nepoužitou při určitém uspořádání bundleru
void FIELD_MAP;
