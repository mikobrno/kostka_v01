import React from 'react';
import { CopyButton } from '../CopyButton';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { MapPin } from 'lucide-react';

interface PropertyInfoProps {
  data: any;
  onChange: (data: any) => void;
  title?: string;
}

export const PropertyInfo: React.FC<PropertyInfoProps> = ({ data, onChange, title = "Nemovitost" }) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresa nemovitosti
        </label>
        <AddressWithMapLinks
          value={data.address || ''}
          onChange={(value) => updateField('address', value)}
          placeholder="Adresa nemovitosti"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kupní cena (Kč)
        </label>
        <div className="flex">
          <FormattedNumberInput
            value={data.price || ''}
            onChange={(value) => updateField('price', value)}
            className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="2 000 000"
          />
          <CopyButton text={data.price ? formatNumber(data.price) : ''} />
        </div>
      </div>

      {data.price && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Orientační výpočet</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">LTV 80%:</span>
              <span className="float-right font-medium">{(parseInt(data.price) * 0.8).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div>
              <span className="text-blue-700">LTV 90%:</span>
              <span className="float-right font-medium">{(parseInt(data.price) * 0.9).toLocaleString('cs-CZ')} Kč</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};