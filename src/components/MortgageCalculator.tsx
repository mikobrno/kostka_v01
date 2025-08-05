import React, { useState } from 'react';
import { Calculator, Home, DollarSign, Percent, TrendingUp, Calendar } from 'lucide-react';

export const MortgageCalculator: React.FC = () => {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('4.5');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [propertyValue, setPropertyValue] = useState<string>('');

  const calculate = (ltv: number) => {
    if (!purchasePrice) return { loan: 0, ownFunds: 0 };
    
    const price = parseInt(purchasePrice);
    const loan = price * (ltv / 100);
    const ownFunds = price - loan;
    
    return { loan, ownFunds };
  };

  const calculateMonthlyPayment = () => {
    if (!loanAmount || !interestRate || !loanTerm) return 0;
    
    const principal = parseFloat(loanAmount);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numberOfPayments = parseFloat(loanTerm) * 12;
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return monthlyPayment;
  };

  const calculatePropertyLTV = () => {
    if (!propertyValue) return { ltv80: 0, ltv90: 0 };
    
    const value = parseFloat(propertyValue);
    return {
      ltv80: value * 0.8,
      ltv90: value * 0.9
    };
  };

  const ltv80 = calculate(80);
  const ltv90 = calculate(90);
  const monthlyPayment = calculateMonthlyPayment();
  const propertyLTV = calculatePropertyLTV();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hypoteční kalkulačka</h1>
        <p className="text-lg text-gray-600">Výpočet maximální výše úvěru a vlastních zdrojů</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kalkulačka podle kupní ceny */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Kalkulace podle kupní ceny</h2>
          
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Home className="inline w-5 h-5 mr-2" />
              Kupní cena nemovitosti
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">Kč</span>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="2000000"
                min="0"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Zadejte kupní cenu nemovitosti v korunách českých
            </p>
          </div>

          {purchasePrice && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">LTV 80%</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-blue-700 font-medium">Výše úvěru:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {ltv80.loan.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-blue-700 font-medium">Vlastní zdroje:</span>
                    <span className="text-xl font-semibold text-blue-800">
                      {ltv80.ownFunds.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-4 bg-blue-100 rounded-lg p-3">
                    <strong>Konzervativní varianta</strong><br />
                    Nižší riziko pro banku i klienta. Vhodné pro stabilní příjmy.
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg mr-3">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900">LTV 90%</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-700 font-medium">Výše úvěru:</span>
                    <span className="text-2xl font-bold text-green-900">
                      {ltv90.loan.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-700 font-medium">Vlastní zdroje:</span>
                    <span className="text-xl font-semibold text-green-800">
                      {ltv90.ownFunds.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-4 bg-green-100 rounded-lg p-3">
                    <strong>Maximální varianta</strong><br />
                    Vyšší úvěr, nižší vlastní zdroje. Vyžaduje vyšší příjmy.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kalkulačka splátek */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kalkulace splátek</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                Výše úvěru (Kč)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="1500000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline w-4 h-4 mr-1" />
                Úroková sazba (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="4.5"
                min="0"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Splatnost (roky)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="30"
                min="1"
                max="50"
              />
            </div>
          </div>

          {loanAmount && interestRate && loanTerm && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Výsledek kalkulace</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">Měsíční splátka:</span>
                  <span className="text-2xl font-bold text-purple-900">
                    {monthlyPayment.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-600">Celkem zaplaceno:</span>
                  <span className="font-semibold text-purple-800">
                    {(monthlyPayment * parseFloat(loanTerm) * 12).toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-600">Celkové úroky:</span>
                  <span className="font-semibold text-purple-800">
                    {((monthlyPayment * parseFloat(loanTerm) * 12) - parseFloat(loanAmount)).toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kalkulace podle hodnoty nemovitosti */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Kalkulace podle hodnoty nemovitosti</h2>
        
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            <Home className="inline w-5 h-5 mr-2" />
            Hodnota nemovitosti (ocenění)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">Kč</span>
            <input
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="2200000"
              min="0"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Zadejte hodnotu nemovitosti podle znaleckého posudku
          </p>
        </div>

        {propertyValue && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-600 rounded-lg mr-3">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900">80% z ocenění</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-orange-200">
                  <span className="text-orange-700 font-medium">Maximální úvěr:</span>
                  <span className="text-2xl font-bold text-orange-900">
                    {propertyLTV.ltv80.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="text-sm text-orange-600 mt-4 bg-orange-100 rounded-lg p-3">
                  <strong>Standardní hypotéka</strong><br />
                  Běžná varianta bez nutnosti ručení
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-teal-600 rounded-lg mr-3">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-teal-900">90% z ocenění</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-teal-200">
                  <span className="text-teal-700 font-medium">Maximální úvěr:</span>
                  <span className="text-2xl font-bold text-teal-900">
                    {propertyLTV.ltv90.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="text-sm text-teal-600 mt-4 bg-teal-100 rounded-lg p-3">
                  <strong>Hypotéka s vyšším LTV</strong><br />
                  Může vyžadovat dodatečné zajištění
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Souhrn všech kalkulací */}
      {(purchasePrice || (loanAmount && interestRate && loanTerm) || propertyValue) && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Souhrn kalkulací</h2>
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              {purchasePrice && (
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-xl font-bold text-gray-900">
                    {parseInt(purchasePrice).toLocaleString('cs-CZ')} Kč
                  </div>
                  <div className="text-sm text-gray-600">Kupní cena</div>
                </div>
              )}
              
              {propertyValue && (
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-xl font-bold text-gray-900">
                    {parseInt(propertyValue).toLocaleString('cs-CZ')} Kč
                  </div>
                  <div className="text-sm text-gray-600">Hodnota nemovitosti</div>
                </div>
              )}
              
              {loanAmount && (
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-xl font-bold text-purple-600">
                    {parseInt(loanAmount).toLocaleString('cs-CZ')} Kč
                  </div>
                  <div className="text-sm text-gray-600">Výše úvěru</div>
                </div>
              )}
              
              {monthlyPayment > 0 && (
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-xl font-bold text-purple-600">
                    {monthlyPayment.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                  </div>
                  <div className="text-sm text-gray-600">Měsíční splátka</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};