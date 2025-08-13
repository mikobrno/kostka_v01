import React from 'react';
import { AdminService } from '../../services/adminService';
import { CopyButton } from '../CopyButton';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { Calculator, CreditCard, Percent, Calendar } from 'lucide-react';

type LoanData = {
  bank?: string;
  contractNumber?: string;
  signatureDate?: string;
  advisor?: string; // legacy combined "Name - Number"
  advisorName?: string;
  advisorAgentNumber?: string;
  loanAmount?: string;
  loanAmountWords?: string;
  fixationYears?: string;
  interestRate?: string;
  insurance?: string;
  propertyValue?: string;
  maturityYears?: string;
  monthlyPayment?: string;
  ltv?: string;
};

interface LoanSectionProps {
  data: LoanData;
  onChange: (data: LoanData) => void;
  propertyPrice?: number;
}

export const LoanSection: React.FC<LoanSectionProps> = ({ data, onChange, propertyPrice }) => {
  const [adminLists, setAdminLists] = React.useState<{ banks: string[]; advisors: string[] }>({
    banks: [],
    advisors: []
  });

  // Pokud máme kupní cenu z Nemovitosti a loan.propertyValue chybí, předvyplň ji
  React.useEffect(() => {
    if (typeof propertyPrice === 'number' && propertyPrice > 0 && (!data.propertyValue || data.propertyValue === '')) {
      onChange({ ...data, propertyValue: String(propertyPrice) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyPrice]);

  // Načtení admin seznamů ze Supabase
  React.useEffect(() => {
    const loadAdminLists = async () => {
      try {
        const { data: adminData, error } = await AdminService.getAdminLists();
        if (error) {
          console.error('Chyba při načítání admin seznamů:', error);
          return;
        }

        if (adminData) {
          type AdminListItem = { list_type: string; items: string[] };
          const items = adminData as unknown as AdminListItem[];
          const lists: { banks: string[]; advisors: string[] } = { banks: [], advisors: [] };
          for (const item of items) {
            if (item.list_type === 'banks') lists.banks = item.items;
            if (item.list_type === 'advisors') lists.advisors = item.items;
          }
          setAdminLists(lists);
        }
      } catch (error) {
        console.error('Chyba při načítání admin seznamů:', error);
      }
    };

    loadAdminLists();
  }, []);

  const updateField = (field: keyof LoanData, value: string) => {
    const updated = { ...data, [field]: value };
    
    // Automatický výpočet LTV
    if ((field === 'loanAmount' || field === 'propertyValue') && updated.loanAmount && updated.propertyValue) {
      const ltv = (parseFloat(updated.loanAmount) / parseFloat(updated.propertyValue)) * 100;
      updated.ltv = ltv.toFixed(2);
    }
    
    // Převod číslice na slova (zjednodušená verze)
    if (field === 'loanAmount' && value) {
      updated.loanAmountWords = numberToWords(value);
    }

    // Umožni zadání úroku s desetinnou čárkou
    if (field === 'interestRate' && typeof value === 'string') {
      updated.interestRate = value.replace(',', '.');
    }

    // Udržuj zpětnou kompatibilitu: slož "advisor" z name/agentNumber
    if (field === 'advisorName' || field === 'advisorAgentNumber') {
      const name = field === 'advisorName' ? value : (updated.advisorName || '');
      const num = field === 'advisorAgentNumber' ? value : (updated.advisorAgentNumber || '');
      const combined = [name?.trim(), num?.trim()].filter(Boolean).join(' - ');
      updated.advisor = combined || '';
    }
    
    onChange(updated);
  };

  // Zjednodušená funkce pro převod čísel na slova
  const numberToWords = (num: string) => {
    const amount = parseInt(num.replace(/\s/g, ''));
    if (isNaN(amount) || amount <= 0) return '';
    
    const ones = ['', 'jeden', 'dva', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět'];
    const teens = ['deset', 'jedenáct', 'dvanáct', 'třináct', 'čtrnáct', 'patnáct', 'šestnáct', 'sedmnáct', 'osmnáct', 'devatenáct'];
    const tens = ['', '', 'dvacet', 'třicet', 'čtyřicet', 'padesát', 'šedesát', 'sedmdesát', 'osmdesát', 'devadesát'];
    const hundreds = ['', 'sto', 'dvě stě', 'tři sta', 'čtyři sta', 'pět set', 'šest set', 'sedm set', 'osm set', 'devět set'];
    
    const convertHundreds = (n: number): string => {
      if (n === 0) return '';
      let result = '';
      
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      
      if (h > 0) result += hundreds[h];
      
      if (t === 1) {
        if (result) result += ' ';
        result += teens[o];
      } else {
        if (t > 0) {
          if (result) result += ' ';
          result += tens[t];
        }
        if (o > 0) {
          if (result) result += ' ';
          result += ones[o];
        }
      }
      
      return result;
    };
    
    if (amount < 1000) {
      return convertHundreds(amount) + ' korun českých';
    } else if (amount < 1000000) {
      const thousands = Math.floor(amount / 1000);
      const remainder = amount % 1000;
      let result = convertHundreds(thousands);
      
      if (thousands === 1) result += ' tisíc';
      else if (thousands < 5) result += ' tisíce';
      else result += ' tisíc';
      
      if (remainder > 0) {
        result += ' ' + convertHundreds(remainder);
      }
      
      return result + ' korun českých';
    } else {
      const millions = Math.floor(amount / 1000000);
      const remainder = amount % 1000000;
      let result = convertHundreds(millions);
      
      if (millions === 1) result += ' milion';
      else if (millions < 5) result += ' miliony';
      else result += ' milionů';
      
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const lastRemainder = remainder % 1000;
        
        result += ' ' + convertHundreds(thousands);
        if (thousands === 1) result += ' tisíc';
        else if (thousands < 5) result += ' tisíce';
        else result += ' tisíc';
        
        if (lastRemainder > 0) {
          result += ' ' + convertHundreds(lastRemainder);
        }
      } else if (remainder > 0) {
        result += ' ' + convertHundreds(remainder);
      }
      
      return result + ' korun českých';
    }
  };

  const calculateLTV = () => {
    if (data.loanAmount && (data.propertyValue || typeof propertyPrice === 'number')) {
      const priceNum = data.propertyValue ? parseFloat(data.propertyValue) : (propertyPrice as number);
      return ((parseFloat(data.loanAmount) / priceNum) * 100).toFixed(2);
    }
    return '0';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Úvěr</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="bank" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Banka
            </label>
            <div className="flex">
              <select
                id="bank"
                aria-label="Banka"
                value={data.bank || ''}
                onChange={(e) => updateField('bank', e.target.value)}
                className="flex-1 w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="">Vyberte banku</option>
              {adminLists.banks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            <CopyButton text={data.bank || ''} />
          </div>
        </div>

        <div>
          <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Číslo smlouvy
          </label>
          <div className="flex">
            <input
              id="contractNumber"
              aria-label="Číslo smlouvy"
              type="text"
              value={data.contractNumber || ''}
              onChange={(e) => updateField('contractNumber', e.target.value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Číslo úvěrové smlouvy"
            />
            <CopyButton text={data.contractNumber || ''} />
          </div>
        </div>

        <div>
          <label htmlFor="signatureDate" className="block text-sm font-medium text-gray-700 mb-1">
            Datum podpisu
          </label>
          <div className="flex w-full">
            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="signatureDate"
                aria-label="Datum podpisu"
                type="date"
                value={data.signatureDate || ''}
                onChange={(e) => updateField('signatureDate', e.target.value)}
                className="flex-1 w-full min-w-0 pl-9 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            <CopyButton text={data.signatureDate || ''} />
          </div>
        </div>

        {/* Doporučitel (TIPAŘ) rozdělen na Jméno a Agenturní číslo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="advisorName" className="block text-sm font-medium text-gray-700 mb-1">
              Doporučitel – Jméno a příjmení
            </label>
            <div className="flex w-full">
              <div className="relative flex-1 min-w-0">
                <input
                  list="advisorsList"
                  id="advisorName"
                  aria-label="Doporučitel – Jméno a příjmení"
                  type="text"
                  value={data.advisorName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Pokud uživatel vybere/napíše ve formátu "Jméno - Číslo", rozsekneme
                    const parts = val.split(' - ');
                    if (parts.length >= 2) {
                      onChange({
                        ...data,
                        advisorName: parts[0],
                        advisorAgentNumber: parts.slice(1).join(' - '),
                        advisor: val
                      });
                    } else {
                      updateField('advisorName', val);
                    }
                  }}
                  className="flex-1 w-full min-w-0 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="Např. Jan Novák"
                />
                {/* Datalist pro rychlý výběr z Admin seznamu (formát: "Jméno - Číslo") */}
                <datalist id="advisorsList">
                  {adminLists.advisors.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
              <CopyButton text={data.advisorName || ''} />
            </div>
          </div>

          <div>
            <label htmlFor="advisorAgentNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Doporučitel – Agenturní číslo
            </label>
            <div className="flex w-full">
              <div className="relative flex-1 min-w-0">
                <input
                  id="advisorAgentNumber"
                  aria-label="Doporučitel – Agenturní číslo"
                  type="text"
                  value={data.advisorAgentNumber || ''}
                  onChange={(e) => updateField('advisorAgentNumber', e.target.value)}
                  className="flex-1 w-full min-w-0 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="např. 12345"
                />
              </div>
              <CopyButton text={data.advisorAgentNumber || ''} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Výše úvěru (Kč)
          </label>
      <div className="flex">
            <FormattedNumberInput
              value={data.loanAmount || ''}
              onChange={(value) => updateField('loanAmount', value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="1 500 000"
            />
            <CopyButton text={data.loanAmount ? formatNumber(data.loanAmount) : ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slovy
          </label>
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
            <span className="text-sm text-gray-600">
              {data.loanAmountWords || 'Zadejte výši úvěru'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fixace (roky)
          </label>
      <div className="flex">
            <input
              type="number"
              value={data.fixationYears || ''}
              onChange={(e) => updateField('fixationYears', e.target.value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="5"
              min="1"
              max="30"
            />
            <CopyButton text={data.fixationYears || ''} />
          </div>
        </div>

        <div>
          <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
            Úrok úvěru (%)
          </label>
          <div className="flex w-full">
            <div className="relative flex-1 min-w-0">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="interestRate"
                aria-label="Úrok úvěru (%)"
                type="number"
                step="0.01"
                value={data.interestRate || ''}
                onChange={(e) => updateField('interestRate', e.target.value)}
                className="flex-1 w-full min-w-0 pl-9 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="4.5"
                min="0"
                max="20"
              />
            </div>
            <CopyButton text={data.interestRate || ''} />
          </div>
        </div>

        <div>
          <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-1">
            Pojištění
          </label>
          <div className="flex">
            <select
              id="insurance"
              aria-label="Pojištění"
              value={data.insurance || ''}
              onChange={(e) => updateField('insurance', e.target.value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Vyberte možnost</option>
              <option value="ano">Ano</option>
              <option value="ne">Ne</option>
            </select>
            <CopyButton text={data.insurance || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hodnota nemovitosti - ocenění (Kč)
          </label>
          <div className="flex">
            <FormattedNumberInput
              value={data.propertyValue || propertyPrice || ''}
              onChange={(value) => updateField('propertyValue', value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="2 000 000"
            />
            <CopyButton text={data.propertyValue ? formatNumber(data.propertyValue) : (propertyPrice ? formatNumber(propertyPrice.toString()) : '')} />
          </div>
        </div>

        <div>
          <label htmlFor="maturityYears" className="block text-sm font-medium text-gray-700 mb-1">
            Doba splatnosti (roky)
          </label>
          <div className="flex w-full">
            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="maturityYears"
                aria-label="Doba splatnosti (roky)"
                type="number"
                value={data.maturityYears || ''}
                onChange={(e) => updateField('maturityYears', e.target.value)}
                className="flex-1 w-full min-w-0 pl-9 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="30"
                min="1"
                max="50"
              />
            </div>
            <CopyButton text={data.maturityYears || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Měsíční splátka (Kč)
          </label>
      <div className="flex">
            <FormattedNumberInput
              value={data.monthlyPayment || ''}
              onChange={(value) => updateField('monthlyPayment', value)}
        className="flex-1 w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="8 500"
            />
            <CopyButton text={data.monthlyPayment ? formatNumber(data.monthlyPayment) : ''} />
          </div>
        </div>
      </div>

      {/* LTV Výpočet */}
      {(data.loanAmount && (data.propertyValue || propertyPrice)) && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calculator className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-medium text-green-900">Výpočet LTV</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700">Výše úvěru:</span>
              <div className="font-medium">{parseInt(data.loanAmount || '0').toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div>
              <span className="text-green-700">Hodnota nemovitosti:</span>
              <div className="font-medium">{(data.propertyValue ? parseInt(data.propertyValue) : (propertyPrice ?? 0)).toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-400">LTV poměr:</span>
              <div className="font-bold text-lg text-green-800 dark:text-green-300">{calculateLTV()}%</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};