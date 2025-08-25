import React, { useState, useEffect, useRef } from 'react';
import { AddressInput } from '../AddressInput';
import { Search, Building, MapPin, Copy, Check } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
// Importujte AresService a AresCompanyData
import { AresService, AresCompanyData } from '../../services/aresService'; // Zkontrolujte, zda je cesta správná

type EmployerData = {
  ico?: string;
  companyName?: string;
  companyAddress?: string;
  netIncome?: string;
  jobPosition?: string;
  contractType?: string;
  contractFromDate?: string;
  contractToDate?: string;
  contractExtended?: string;
  employedSince?: string;
};

interface EmployerInfoProps {
  data: EmployerData;
  onChange: (data: EmployerData) => void;
}

export const EmployerInfo: React.FC<EmployerInfoProps> = ({ data, onChange }) => {
  const [isLoadingAres, setIsLoadingAres] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null); // Nový stav pro chyby z ARES
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState<AresCompanyData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateField = (field: keyof EmployerData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Funkce pro formátování čísel s mezerami jako tisícové oddělovače
  const formatNumber = (value: string | number): string => {
    if (!value) return '';
    const numStr = value.toString().replace(/\s/g, ''); // Odebere všechny mezery
    if (!/^\d+$/.test(numStr)) return value.toString(); // Pokud není číslo, vrátí původní hodnotu
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // Přidá mezery každé 3 cifry
  };

  // Funkce pro odstranění formátování (mezery) z čísla
  const unformatNumber = (value: string): string => {
    return value.replace(/\s/g, '');
  };

  // Small copy icon button used inline to avoid duplicated visible values
  const toast = useToast();
  const CopyIconButton: React.FC<{ value: string | undefined; label?: string }> = ({ value, label }) => {
    const [done, setDone] = React.useState(false);
    const handle = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value || '');
        } else {
          // fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = value || '';
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        toast?.showSuccess('Zkopírováno', label || 'Text zkopírován');
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

  const fetchAresData = async (ico: string) => {
    // Validace IČO před voláním ARES služby
    if (!ico || ico.length !== 8 || !/^\d{8}$/.test(ico)) {
      setAresError('IČO musí být 8místné číslo.');
      updateField('companyName', '');
      updateField('companyAddress', '');
      return;
    }

    setIsLoadingAres(true);
    setAresError(null); // Vyčistíme předchozí chyby
    updateField('companyName', ''); // Vyčistíme data před načítáním
    updateField('companyAddress', '');

    try {
      // Skutečné volání ARES API pomocí AresService
      const { data: companyAresData, error } = await AresService.searchByIco(ico);
      
      // Můžete použít i mock data pro vývoj/testování (odkomentujte a zakomentujte řádek výše):
      // const { data: companyAresData, error } = await AresService.getMockData(ico);

      if (error) {
        setAresError(error); // Nastavíme chybu z ARES služby
      } else if (companyAresData) {
        // Pokud data z ARES existují, aktualizujeme pole formuláře
        updateField('companyName', companyAresData.companyName);
        updateField('companyAddress', companyAresData.address);
        // Zde můžete také aktualizovat další pole, jako je DIC, právní forma atd.
        // updateField('dic', companyAresData.dic);
        // updateField('legalForm', companyAresData.legalForm);
      } else {
        // Pokud data nejsou nalezena (data je null a error je také null, což by nemělo nastat
        // pokud ARES service správně zpracovává "firma nenalezena" jako chybu)
        setAresError('Firma s tímto IČO nebyla nalezena.');
      }
    } catch (unexpectedError) {
      console.error('Neočekávaná chyba při volání ARES API:', unexpectedError);
      setAresError('Neočekávaná chyba při načítání dat');
    } finally {
      setIsLoadingAres(false);
    }
  };

  // Hledání podle názvu s debounce
  useEffect(() => {
    const handler = setTimeout(async () => {
      const q = nameQuery.trim();
      if (q.length < 3) { setNameResults([]); return; }
      const { data, error } = await AresService.searchByName(q);
      if (error) {
        setAresError(error);
        setNameResults([]);
      } else {
        setAresError(null);
        setNameResults(data);
        setShowDropdown(true);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [nameQuery]);

  // Klik mimo dropdown zavře
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IČO
        </label>
        <div className="flex">
          <input
            type="text"
            value={data.ico || ''}
            onChange={(e) => {
              const newIco = e.target.value.replace(/\D/g, ''); // Pouze číslice
              updateField('ico', newIco);
            }}
            className="flex-1 block w-full p-2 rounded-l-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Zadejte IČO (8 číslic)"
            maxLength={8}
            autoComplete="off"
          />
          <button
            onClick={() => {
              const ico = data.ico?.replace(/\D/g, '') || '';
              if (ico.length === 8) {
                fetchAresData(ico);
              }
            }}
            disabled={isLoadingAres}
            className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-r"
          >
            {isLoadingAres ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
          <CopyIconButton value={data.ico} label="Kopírovat IČO" />
        </div>
        {aresError && (
          <p className="mt-1 text-sm text-red-600">{aresError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Zadáním IČO se automaticky vyplní název a adresa firmy z ARES
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Název firmy
        </label>
        <div className="flex">
          <div className="flex-1 relative" ref={dropdownRef}>
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.companyName || nameQuery}
              onChange={(e) => {
                const v = e.target.value;
                updateField('companyName', v);
                setNameQuery(v);
                if (v.length >= 3) setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (!showDropdown) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, nameResults.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeIndex >= 0 && nameResults[activeIndex]) {
                    const item = nameResults[activeIndex];
                    updateField('ico', item.ico);
                    updateField('companyName', item.companyName);
                    updateField('companyAddress', item.address);
                    setNameQuery(item.companyName);
                    setShowDropdown(false);
                    setActiveIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                  setActiveIndex(-1);
                }
              }}
              className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Název společnosti (začněte psát pro vyhledávání)"
              title="Název společnosti"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="ares-results-list"
            />
            {showDropdown && nameResults.length > 0 && (
              <div id="ares-results-list" role="listbox" aria-label="Výsledky hledání ARES" className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {nameResults.map((item, idx) => (
                  <button
                    key={`${item.ico}-${item.companyName}`}
                    type="button"
                    onClick={() => {
                      updateField('ico', item.ico);
                      updateField('companyName', item.companyName);
                      updateField('companyAddress', item.address);
                      setNameQuery(item.companyName);
                      setShowDropdown(false);
                      setActiveIndex(-1);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${idx === activeIndex ? 'bg-blue-50' : ''}`}
                    role="option"
                  >
                    <div className="text-sm font-medium text-gray-900">{item.companyName}</div>
                    <div className="text-xs text-gray-600">IČO: {item.ico} • {item.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <CopyIconButton value={data.companyName} label="Kopírovat název firmy" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresa firmy
        </label>
        <div className="flex items-center">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
            <AddressInput
              value={data.companyAddress || ''}
              onChange={(value) => updateField('companyAddress', value)}
              placeholder="Adresa společnosti"
              className="pl-10"
            />
          </div>
          <CopyIconButton value={data.companyAddress} label="Kopírovat adresu firmy" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Čistý příjem (Kč)
        </label>
        <div className="flex">
          <input
            type="text"
            value={formatNumber(data.netIncome || '')}
            onChange={(e) => {
              const unformattedValue = unformatNumber(e.target.value);
              updateField('netIncome', unformattedValue);
            }}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="50 000"
            pattern="[0-9\s]*"
          />
          <CopyIconButton value={String(data.netIncome || '')} label="Kopírovat čistý příjem" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pracovní pozice dle smlouvy
        </label>
        <div className="flex">
          <input
            type="text"
            value={data.jobPosition || ''}
            onChange={(e) => updateField('jobPosition', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Manažer, Programátor, Účetní..."
          />
          <CopyIconButton value={data.jobPosition} label="Kopírovat pracovní pozici" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Smlouva na dobu
        </label>
        <div className="flex">
          <select
            value={data.contractType || ''}
            onChange={(e) => updateField('contractType', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            title="Typ smlouvy"
          >
            <option value="">Vyberte typ smlouvy</option>
            <option value="určitou">Určitou</option>
            <option value="neurčitou">Neurčitou</option>
          </select>
          <CopyIconButton value={data.contractType} label="Kopírovat typ smlouvy" />
        </div>
      </div>

      {data.contractType === 'určitou' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doba určitá od
              </label>
              <div className="flex">
                <input
                  type="date"
                  value={data.contractFromDate || ''}
                  onChange={(e) => updateField('contractFromDate', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  title="Doba určitá od"
                />
                  <CopyIconButton value={data.contractFromDate} label="Kopírovat datum od" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doba určitá do
              </label>
              <div className="flex">
                <input
                  type="date"
                  value={data.contractToDate || ''}
                  onChange={(e) => updateField('contractToDate', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  title="Doba určitá do"
                />
                  <CopyIconButton value={data.contractToDate} label="Kopírovat datum do" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doba určitá - prodlouženo?
            </label>
            <div className="flex">
              <select
                value={data.contractExtended || ''}
                onChange={(e) => updateField('contractExtended', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                title="Doba určitá - prodlouženo?"
              >
                <option value="">Vyberte možnost</option>
                <option value="ano">Ano</option>
                <option value="ne">Ne</option>
              </select>
                <CopyIconButton value={data.contractExtended} label="Kopírovat informace o prodloužení" />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zaměstnán od
        </label>
        <div className="flex">
          <input
            type="date"
            value={data.employedSince || ''}
            onChange={(e) => updateField('employedSince', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            title="Zaměstnán od"
          />
          <CopyIconButton value={data.employedSince} label="Kopírovat datum zaměstnání od" />
        </div>
      </div>
      </div>
    </div>
  );
};