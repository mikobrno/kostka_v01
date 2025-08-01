import React, { useState } from 'react';
import { CopyButton } from '../CopyButton';
import { AddressInput } from '../AddressInput';
import { Search, Building, MapPin } from 'lucide-react';
// Importujte AresService a AresCompanyData
import { AresService, AresCompanyData } from '../../services/aresService'; // Zkontrolujte, zda je cesta správná

interface EmployerInfoProps {
  data: any;
  onChange: (data: any) => void;
}

export const EmployerInfo: React.FC<EmployerInfoProps> = ({ data, onChange }) => {
  const [isLoadingAres, setIsLoadingAres] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null); // Nový stav pro chyby z ARES

  const updateField = (field: string, value: any) => {
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

  const fetchAresData = async (ico: string) => {
    console.log('🚀 fetchAresData volána s IČO:', ico); // Debug log
    
    // Validace IČO před voláním ARES služby
    if (!ico || ico.length !== 8 || !/^\d{8}$/.test(ico)) {
      console.log('❌ Neplatné IČO:', ico); // Debug log
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
      // Dočasně použijeme mock data pro testování - odkomentujte pro skutečné ARES volání
      const { data: companyAresData, error } = await AresService.getMockData(ico);
      
      // Skutečné volání ARES API pomocí AresService (zakomentováno pro testování)
      // const { data: companyAresData, error } = await AresService.searchByIco(ico);

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
    } catch (unexpectedError: any) {
      console.error('Neočekávaná chyba při volání ARES API:', unexpectedError);
      setAresError(`Neočekávaná chyba při načítání dat: ${unexpectedError.message}`);
    } finally {
      setIsLoadingAres(false);
    }
  };

  return (
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
              console.log('IČO pole změna:', e.target.value); // Debug log
              updateField('ico', e.target.value);
            }}
            onFocus={() => console.log('IČO pole má focus')}
            onBlur={() => console.log('IČO pole ztratilo focus')}
            className="flex-1 block w-full p-3 border-2 border-red-500 rounded-l-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm bg-yellow-50"
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
          <CopyButton text={data.ico || ''} />
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
          <div className="flex-1 relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.companyName || ''}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Název společnosti"
            />
          </div>
          <CopyButton text={data.companyName || ''} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresa firmy
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
          <AddressInput
            value={data.companyAddress || ''}
            onChange={(value) => updateField('companyAddress', value)}
            placeholder="Adresa společnosti"
            className="pl-10"
          />
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
          <CopyButton text={formatNumber(data.netIncome || '')} />
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
          <CopyButton text={data.jobPosition || ''} />
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
          >
            <option value="">Vyberte typ smlouvy</option>
            <option value="určitou">Určitou</option>
            <option value="neurčitou">Neurčitou</option>
          </select>
          <CopyButton text={data.contractType || ''} />
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
                />
                <CopyButton text={data.contractFromDate || ''} />
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
                />
                <CopyButton text={data.contractToDate || ''} />
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
              >
                <option value="">Vyberte možnost</option>
                <option value="ano">Ano</option>
                <option value="ne">Ne</option>
              </select>
              <CopyButton text={data.contractExtended || ''} />
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
          />
          <CopyButton text={data.employedSince || ''} />
        </div>
      </div>
    </div>
  );
};