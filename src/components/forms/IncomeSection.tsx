import React, { useState } from 'react';
import { DollarSign, Briefcase, TrendingUp, TrendingDown, Calculator, Plus, Trash2 } from 'lucide-react';
import { CopyButton } from '../CopyButton';

interface IncomeData {
  id: string;
  person_type: 'applicant' | 'co_applicant';
  
  // Employment Income
  gross_salary?: number;
  net_salary?: number;
  employment_type?: string;
  employment_duration_months?: number;
  employer_name?: string;
  position?: string;
  
  // Additional Income
  rental_income?: number;
  investment_income?: number;
  pension_income?: number;
  social_benefits?: number;
  other_income?: number;
  other_income_description?: string;
  
  // Deductions
  tax_deductions?: number;
  social_insurance?: number;
  health_insurance?: number;
  union_fees?: number;
  
  // Documentation
  income_proof_type?: string;
  verification_date?: string;
  verified_by?: string;
  notes?: string;
}

interface IncomeSectionProps {
  applicantIncome?: IncomeData;
  coApplicantIncome?: IncomeData;
  onChange: (applicantIncome?: IncomeData, coApplicantIncome?: IncomeData) => void;
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  applicantIncome,
  coApplicantIncome,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'applicant' | 'co_applicant'>('applicant');

  const employmentTypes = [
    'permanent',
    'temporary', 
    'self_employed',
    'unemployed'
  ];

  const employmentTypeLabels = {
    permanent: 'Trvalý pracovní poměr',
    temporary: 'Dočasný pracovní poměr',
    self_employed: 'OSVČ',
    unemployed: 'Nezaměstnaný'
  };

  const incomeProofTypes = [
    'payslip',
    'tax_return',
    'bank_statement',
    'employer_confirmation',
    'other'
  ];

  const incomeProofLabels = {
    payslip: 'Výplatní páska',
    tax_return: 'Daňové přiznání',
    bank_statement: 'Výpis z účtu',
    employer_confirmation: 'Potvrzení zaměstnavatele',
    other: 'Jiné'
  };

  const updateIncomeData = (personType: 'applicant' | 'co_applicant', field: string, value: any) => {
    const currentData = personType === 'applicant' ? applicantIncome : coApplicantIncome;
    const updatedData = {
      ...currentData,
      id: currentData?.id || `income-${personType}-${Date.now()}`,
      person_type: personType,
      [field]: value
    };

    if (personType === 'applicant') {
      onChange(updatedData, coApplicantIncome);
    } else {
      onChange(applicantIncome, updatedData);
    }
  };

  const calculateTotals = (incomeData?: IncomeData) => {
    if (!incomeData) return { totalGross: 0, totalDeductions: 0, netDisposable: 0 };

    const totalGross = (incomeData.gross_salary || 0) +
                      (incomeData.rental_income || 0) +
                      (incomeData.investment_income || 0) +
                      (incomeData.pension_income || 0) +
                      (incomeData.social_benefits || 0) +
                      (incomeData.other_income || 0);

    const totalDeductions = (incomeData.tax_deductions || 0) +
                           (incomeData.social_insurance || 0) +
                           (incomeData.health_insurance || 0) +
                           (incomeData.union_fees || 0);

    const netDisposable = totalGross - totalDeductions;

    return { totalGross, totalDeductions, netDisposable };
  };

  const currentIncomeData = activeTab === 'applicant' ? applicantIncome : coApplicantIncome;
  const totals = calculateTotals(currentIncomeData);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <DollarSign className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Příjmy</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('applicant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applicant'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Žadatel
          </button>
          <button
            onClick={() => setActiveTab('co_applicant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'co_applicant'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Spolužadatel
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Income Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Information */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Zaměstnání</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ zaměstnání
                </label>
                <select
                  value={currentIncomeData?.employment_type || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'employment_type', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="">Vyberte typ</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>
                      {employmentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Délka zaměstnání (měsíce)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.employment_duration_months || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'employment_duration_months', parseInt(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="24"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zaměstnavatel
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={currentIncomeData?.employer_name || ''}
                    onChange={(e) => updateIncomeData(activeTab, 'employer_name', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Název společnosti"
                  />
                  <CopyButton text={currentIncomeData?.employer_name || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pozice
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={currentIncomeData?.position || ''}
                    onChange={(e) => updateIncomeData(activeTab, 'position', e.target.value)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Manažer, Programátor, ..."
                  />
                  <CopyButton text={currentIncomeData?.position || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hrubý plat (Kč)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={currentIncomeData?.gross_salary || ''}
                    onChange={(e) => updateIncomeData(activeTab, 'gross_salary', parseFloat(e.target.value) || 0)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="50000"
                    min="0"
                  />
                  <CopyButton text={currentIncomeData?.gross_salary?.toString() || ''} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Čistý plat (Kč)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={currentIncomeData?.net_salary || ''}
                    onChange={(e) => updateIncomeData(activeTab, 'net_salary', parseFloat(e.target.value) || 0)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="38000"
                    min="0"
                  />
                  <CopyButton text={currentIncomeData?.net_salary?.toString() || ''} />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Income */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Další příjmy</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Příjmy z pronájmu (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.rental_income || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'rental_income', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investiční příjmy (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.investment_income || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'investment_income', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Důchod (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.pension_income || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'pension_income', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sociální dávky (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.social_benefits || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'social_benefits', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ostatní příjmy (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.other_income || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'other_income', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Popis ostatních příjmů
                </label>
                <input
                  type="text"
                  value={currentIncomeData?.other_income_description || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'other_income_description', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="Freelance, konzultace, ..."
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Srážky</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daňové srážky (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.tax_deductions || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'tax_deductions', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sociální pojištění (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.social_insurance || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'social_insurance', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zdravotní pojištění (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.health_insurance || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'health_insurance', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odborové příspěvky (Kč)
                </label>
                <input
                  type="number"
                  value={currentIncomeData?.union_fees || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'union_fees', parseFloat(e.target.value) || 0)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">Dokumentace</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ dokladu o příjmech
                </label>
                <select
                  value={currentIncomeData?.income_proof_type || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'income_proof_type', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="">Vyberte typ</option>
                  {incomeProofTypes.map(type => (
                    <option key={type} value={type}>
                      {incomeProofLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum ověření
                </label>
                <input
                  type="date"
                  value={currentIncomeData?.verification_date || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'verification_date', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ověřil
                </label>
                <input
                  type="text"
                  value={currentIncomeData?.verified_by || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'verified_by', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Jméno ověřovatele"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poznámky
                </label>
                <textarea
                  value={currentIncomeData?.notes || ''}
                  onChange={(e) => updateIncomeData(activeTab, 'notes', e.target.value)}
                  rows={3}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Dodatečné informace..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6 sticky top-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Souhrn příjmů</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Celkové hrubé příjmy:</span>
                  <span className="text-lg font-bold text-green-600">
                    {totals.totalGross.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Plat + další příjmy
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Celkové srážky:</span>
                  <span className="text-lg font-bold text-red-600">
                    -{totals.totalDeductions.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Daně + pojištění + ostatní
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Čistý disponibilní příjem:</span>
                  <span className="text-xl font-bold">
                    {totals.netDisposable.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="text-xs opacity-90">
                  Příjmy po odečtení všech srážek
                </div>
              </div>

              {/* Income Breakdown */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Rozložení příjmů</h4>
                <div className="space-y-2 text-xs">
                  {currentIncomeData?.gross_salary && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hrubý plat:</span>
                      <span>{currentIncomeData.gross_salary.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  {currentIncomeData?.rental_income && currentIncomeData.rental_income > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pronájem:</span>
                      <span>{currentIncomeData.rental_income.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  {currentIncomeData?.investment_income && currentIncomeData.investment_income > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investice:</span>
                      <span>{currentIncomeData.investment_income.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  {currentIncomeData?.pension_income && currentIncomeData.pension_income > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Důchod:</span>
                      <span>{currentIncomeData.pension_income.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                  {currentIncomeData?.other_income && currentIncomeData.other_income > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ostatní:</span>
                      <span>{currentIncomeData.other_income.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};