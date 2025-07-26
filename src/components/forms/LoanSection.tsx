import React from 'react';
import { AdminService } from '../../services/adminService';
import { CopyButton } from '../CopyButton';
import { Calculator, CreditCard, Percent, Calendar } from 'lucide-react';

interface LoanSectionProps {
  data: any;
  onChange: (data: any) => void;
  propertyPrice?: number;
}

export const LoanSection: React.FC<LoanSectionProps> = ({ data, onChange, propertyPrice }) => {
  const [adminLists, setAdminLists] = React.useState({
    banks: [],
    advisors: []
  });

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
          const lists = {
            banks: [],
            advisors: []
          };

          adminData.forEach(item => {
            switch (item.list_type) {
              case 'banks':
                lists.banks = item.items;
                break;
              case 'advisors':
                lists.advisors = item.items;
                break;
            }
          });

          setAdminLists(lists);
        }
      } catch (error) {
        console.error('Chyba při načítání admin seznamů:', error);
      }
    };

    loadAdminLists();
  }, []);

  const updateField = (field: string, value: any) => {
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
    
    onChange(updated);
  };

  // Zjednodušená funkce pro převod čísel na slova
  const numberToWords = (num: string) => {
    const amount = parseInt(num);
    if (amount < 1000000) {
      return `${(amount / 1000).toFixed(0)} tisíc korun českých`;
    } else {
      return `${(amount / 1000000).toFixed(1)} milionu korun českých`;
    }
  };

  const calculateLTV = () => {
    if (data.loanAmount && (data.propertyValue || propertyPrice)) {
      const price = data.propertyValue || propertyPrice;
      return ((parseFloat(data.loanAmount) / parseFloat(price)) * 100).toFixed(2);
    }
    return '0';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <CreditCard className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Úvěr</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banka
          </label>
          <div className="flex">
            <select
              value={data.bank || ''}
              onChange={(e) => updateField('bank', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Číslo smlouvy
          </label>
          <div className="flex">
            <input
              type="text"
              value={data.contractNumber || ''}
              onChange={(e) => updateField('contractNumber', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Číslo úvěrové smlouvy"
            />
            <CopyButton text={data.contractNumber || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum podpisu
          </label>
          <div className="flex">
            <input
              type="date"
              value={data.signatureDate || ''}
              onChange={(e) => updateField('signatureDate', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
            <CopyButton text={data.signatureDate || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doporučitel
          </label>
          <div className="flex">
            <select
              value={data.advisor || ''}
              onChange={(e) => updateField('advisor', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Vyberte doporučitele</option>
              {adminLists.advisors.map(advisor => (
                <option key={advisor} value={advisor}>{advisor}</option>
              ))}
            </select>
            <CopyButton text={data.advisor || ''} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Výše úvěru (Kč)
          </label>
          <div className="flex">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">Kč</span>
              <input
                type="number"
                value={data.loanAmount || ''}
                onChange={(e) => updateField('loanAmount', e.target.value)}
                className="block w-full pl-8 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="1500000"
                min="0"
              />
            </div>
            <CopyButton text={data.loanAmount || ''} />
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
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="5"
              min="1"
              max="30"
            />
            <CopyButton text={data.fixationYears || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Úrok úvěru (%)
          </label>
          <div className="flex">
            <div className="flex-1 relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={data.interestRate || ''}
                onChange={(e) => updateField('interestRate', e.target.value)}
                className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="4.5"
                min="0"
                max="20"
              />
            </div>
            <CopyButton text={data.interestRate || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pojištění
          </label>
          <div className="flex">
            <select
              value={data.insurance || ''}
              onChange={(e) => updateField('insurance', e.target.value)}
              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">Kč</span>
              <input
                type="number"
                value={data.propertyValue || propertyPrice || ''}
                onChange={(e) => updateField('propertyValue', e.target.value)}
                className="block w-full pl-8 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="2000000"
                min="0"
              />
            </div>
            <CopyButton text={data.propertyValue || propertyPrice?.toString() || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doba splatnosti (roky)
          </label>
          <div className="flex">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={data.maturityYears || ''}
                onChange={(e) => updateField('maturityYears', e.target.value)}
                className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">Kč</span>
              <input
                type="number"
                value={data.monthlyPayment || ''}
                onChange={(e) => updateField('monthlyPayment', e.target.value)}
                className="block w-full pl-8 rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="8500"
                min="0"
              />
            </div>
            <CopyButton text={data.monthlyPayment || ''} />
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
              <div className="font-medium">{parseInt(data.loanAmount).toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div>
              <span className="text-green-700">Hodnota nemovitosti:</span>
              <div className="font-medium">{parseInt(data.propertyValue || propertyPrice).toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div>
              <span className="text-green-700">LTV poměr:</span>
              <div className="font-bold text-lg text-green-800">{calculateLTV()}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};