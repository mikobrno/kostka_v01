import React from 'react';
import { CopyButton } from '../CopyButton';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
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
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">Kč</span>
            <input
              type="number"
              value={data.price || ''}
              onChange={(e) => updateField('price', e.target.value)}
              className="block w-full pl-8 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="2000000"
              min="0"
            />
          </div>
          <CopyButton text={data.price || ''} />
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