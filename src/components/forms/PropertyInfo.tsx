import React from 'react';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { useToast } from '../../hooks/useToast';
import CopyIconButton from '../CopyIconButton';

interface PropertyInfoData {
  address?: string;
  price?: number | string;
}

interface PropertyInfoProps {
  data: PropertyInfoData;
  onChange: (data: PropertyInfoData) => void;
  title?: string;
}

export const PropertyInfo: React.FC<PropertyInfoProps> = ({ data, onChange, title = "Nemovitost" }) => {
  const toast = useToast();

  // use shared CopyIconButton component for consistency
  const updateField = (field: keyof PropertyInfoData, value: PropertyInfoData[keyof PropertyInfoData]) => {
    onChange({ ...data, [field]: value } as PropertyInfoData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adresa nemovitosti
          </label>
          <AddressWithMapLinks
            value={data.address || ''}
            onChange={(value) => updateField('address', value)}
            placeholder="Adresa nemovitosti"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kupní cena (Kč)
          </label>
          <div className="flex">
            <FormattedNumberInput
              value={data.price || ''}
              onChange={(value) => updateField('price', value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="2 000 000"
            />
            <CopyIconButton value={data.price ? formatNumber(data.price) : ''} label="Kopírovat cenu" toast={toast} className="w-10 border border-l-0 rounded-r-md bg-white dark:bg-gray-800" />
          </div>
        </div>

  {data.price !== undefined && data.price !== '' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Orientační výpočet</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-400">LTV 80%:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{(Number(data.price) ? (Number(data.price) * 0.8).toLocaleString('cs-CZ') : '0') } Kč</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400">LTV 90%:</span>
    <span className="float-right font-medium text-gray-900 dark:text-white">{(Number(data.price) ? (Number(data.price) * 0.9).toLocaleString('cs-CZ') : '0') } Kč</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};