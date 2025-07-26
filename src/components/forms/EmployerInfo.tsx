import React, { useState } from 'react';
import { CopyButton } from '../CopyButton';
import { AddressInput } from '../AddressInput';
import { Search, Building, MapPin } from 'lucide-react';

interface EmployerInfoProps {
  data: any;
  onChange: (data: any) => void;
}

export const EmployerInfo: React.FC<EmployerInfoProps> = ({ data, onChange }) => {
  const [isLoadingAres, setIsLoadingAres] = useState(false);

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const fetchAresData = async (ico: string) => {
    if (ico.length !== 8) return;
    
    setIsLoadingAres(true);
    try {
      // Mock ARES API call - v produkci nahradit skutečným API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData = {
        name: 'Vzorová společnost s.r.o.',
        address: 'Václavské náměstí 1, 110 00 Praha 1'
      };
      
      updateField('companyName', mockData.name);
      updateField('companyAddress', mockData.address);
    } catch (error) {
      console.error('Chyba při načítání dat z ARES:', error);
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
              updateField('ico', e.target.value);
              if (e.target.value.length === 8) {
                fetchAresData(e.target.value);
              }
            }}
            className="flex-1 block w-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="12345678"
            maxLength={8}
            style={{ borderTopLeftRadius: '0.375rem', borderBottomLeftRadius: '0.375rem' }}
          />
          <button
            onClick={() => fetchAresData(data.ico)}
            disabled={isLoadingAres || data.ico?.length !== 8}
            className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingAres ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
          <CopyButton text={data.ico || ''} />
        </div>
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
            type="number"
            value={data.netIncome || ''}
            onChange={(e) => updateField('netIncome', e.target.value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="50000"
            min="0"
          />
          <CopyButton text={data.netIncome || ''} />
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