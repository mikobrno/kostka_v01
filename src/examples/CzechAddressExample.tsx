import React, { useState } from 'react';
import CzechAddressAutocomplete, { CzechAddressComponents } from '../components/CzechAddressAutocomplete';

/**
 * Example component demonstrating Czech address autocomplete with auto-population
 */
const CzechAddressExample: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<CzechAddressComponents | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Handle address selection with complete Czech formatting
   */
  const handleAddressSelect = (addressData: CzechAddressComponents) => {
    console.log('Complete Czech address data:', addressData);
    setSelectedAddress(addressData);
    setError(''); // Clear any previous errors
  };

  /**
   * Handle errors from the autocomplete component
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Czech address autocomplete error:', errorMessage);
  };

  /**
   * Handle loading state changes
   */
  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Czech Address Autocomplete with Auto-Population
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Automatic form field population with properly formatted Czech addresses
        </p>
        <p className="text-sm text-gray-500">
          Format: "Street Number, Postal Code City, Country"
        </p>
      </div>

      {/* Address Input Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Address Input
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zadejte adresu:
            </label>
            <CzechAddressAutocomplete
              onAddressSelect={handleAddressSelect}
              placeholder="Začněte psát adresu (např. Zborovská, Brno)..."
              className="w-full text-lg"
              onError={handleError}
              onLoadingChange={handleLoadingChange}
            />
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
              <span className="text-sm">Zpracovávám adresu...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Chyba při zpracování adresy
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4">
            ✅ Automaticky vyplněná adresa
          </h2>
          
          {/* Formatted Address Display */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">
              Česky formátovaná adresa:
            </h3>
            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
              <p className="text-xl font-semibold text-green-900">
                {selectedAddress.czechFormattedAddress}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Formát: "Ulice Číslo, PSČ Město, Země"
              </p>
            </div>
          </div>

          {/* Address Components Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-green-800 mb-3">
                Komponenty adresy:
              </h3>
              <div className="bg-white p-4 rounded-lg border space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Ulice:</span>
                  <span className="text-gray-900">{selectedAddress.streetName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Číslo:</span>
                  <span className="text-gray-900">{selectedAddress.streetNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Město:</span>
                  <span className="text-gray-900">{selectedAddress.city || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">PSČ:</span>
                  <span className={`font-bold ${selectedAddress.postalCode ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAddress.postalCode || 'Nedostupné'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-700">Země:</span>
                  <span className="text-gray-900">{selectedAddress.country || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-green-800 mb-3">
                Porovnání formátů:
              </h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Google formát:</h4>
                  <p className="text-sm text-gray-600 break-words">
                    {selectedAddress.formattedAddress}
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                  <h4 className="font-medium text-green-800 mb-2">Český formát:</h4>
                  <p className="text-sm text-green-700 font-medium break-words">
                    {selectedAddress.czechFormattedAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Details */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">
              🔧 Implementační detaily:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Automatické získání place_id z autocomplete</li>
              <li>✅ Načtení detailních informací pomocí Places Details API</li>
              <li>✅ Extrakce všech komponent adresy</li>
              <li>✅ Formátování podle českých standardů</li>
              <li>✅ Automatické vyplnění input pole</li>
              <li>✅ Ošetření chybějících komponent</li>
            </ul>
          </div>

          {/* JSON Output for Developers */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-green-800 hover:text-green-600 mb-2">
              📋 Zobrazit kompletní JSON data (pro vývojáře)
            </summary>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto border">
              {JSON.stringify(selectedAddress, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Implementation Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📚 Implementační průvodce
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Klíčové kroky:</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li><strong>Získání place_id</strong> z autocomplete výběru</li>
              <li><strong>Načtení detailů</strong> pomocí Places Details API</li>
              <li><strong>Extrakce komponent</strong> z address_components</li>
              <li><strong>Formátování</strong> podle českých standardů</li>
              <li><strong>Vyplnění pole</strong> s formátovanou adresou</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Český formát adresy:</h3>
            <div className="bg-white p-3 rounded border text-sm">
              <p className="font-mono text-green-600 mb-2">
                "Ulice Číslo, PSČ Město, Země"
              </p>
              <p className="text-gray-600">Příklad:</p>
              <p className="font-mono text-blue-600">
                "Zborovská 939/2, 602 00 Brno, Česká republika"
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">
            ⚠️ Důležité poznámky:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>Komponenta automaticky ošetřuje chybějící části adresy</li>
            <li>PSČ je extrahováno z address_components pole</li>
            <li>První písmeno výsledné adresy je automaticky velké</li>
            <li>Pro domácí adresy se země obvykle vynechává</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CzechAddressExample;