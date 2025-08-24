import React from 'react';
import { AddressWithMapLinks } from '../AddressWithMapLinks';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface PropertyInfoProps {
  data: any;
  onChange: (data: any) => void;
  title?: string;
}

export const PropertyInfo: React.FC<PropertyInfoProps> = ({ data, onChange, title = "Nemovitost" }) => {
  const toast = useToast();

  const CopyIconButton: React.FC<{ value?: string | number; label?: string }> = ({ value, label }) => {
    const [copied, setCopied] = React.useState(false);
    const text = value !== undefined && value !== null ? String(value) : '';
    const handleCopy = async () => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast?.showSuccess(label || 'Zkopírováno');
        setTimeout(() => setCopied(false), 1400);
      } catch {
        // fall back silently
      }
    };

    return (
      <button
        type="button"
        onClick={handleCopy}
        title={label}
        aria-label={label}
        className="flex items-center justify-center w-10 border border-l-0 rounded-r-md bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    );
  };
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
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
            <CopyIconButton value={data.price ? formatNumber(data.price) : ''} label="Kopírovat cenu" />
          </div>
        </div>

        {data.price && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Orientační výpočet</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-400">LTV 80%:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{(parseInt(data.price) * 0.8).toLocaleString('cs-CZ')} Kč</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400">LTV 90%:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{(parseInt(data.price) * 0.9).toLocaleString('cs-CZ')} Kč</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};