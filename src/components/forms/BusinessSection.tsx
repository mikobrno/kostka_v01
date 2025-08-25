import React, { useState } from 'react';
import { Building, Search, Plus, Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import InlineEditableCopy from '../InlineEditableCopy';
import { AresService } from '../../services/aresService';

interface BusinessData {
  id: string;
  ico: string;
  company_name: string;
  legal_form?: string;
  registration_date?: string;
  business_address?: string;
  business_activity?: string;
  nace_code?: string;
  annual_revenue?: number;
  employee_count?: number;
  share_percentage?: number;
  position_in_company?: string;
  business_phone?: string;
  business_email?: string;
  website?: string;
  registry_data?: Record<string, unknown>;
  last_sync_date?: string;
  sync_status?: 'pending' | 'synced' | 'failed' | 'manual';
  sync_error?: string;
  is_active: boolean;
  business_status?: 'active' | 'inactive' | 'dissolved' | 'bankruptcy';
}

interface BusinessSectionProps {
  businesses: BusinessData[];
  onChange: (businesses: BusinessData[]) => void;
}

export const BusinessSection: React.FC<BusinessSectionProps> = ({
  businesses = [],
  onChange
}) => {
  const [searchIco, setSearchIco] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null);
  const [newBusiness, setNewBusiness] = useState<Partial<BusinessData> | null>(null);

  const legalForms = [
    's.r.o.',
    'a.s.',
    'OSVČ',
    'v.o.s.',
    'k.s.',
    'družstvo',
    'obecně prospěšná společnost',
    'jiné'
  ];

  const businessStatuses = [
    { value: 'active', label: 'Aktivní' },
    { value: 'inactive', label: 'Neaktivní' },
    { value: 'dissolved', label: 'Zrušená' },
    { value: 'bankruptcy', label: 'Konkurz' }
  ];

  const positions = [
    'Jednatel',
    'Ředitel',
    'Majitel',
    'Společník',
    'Zaměstnanec',
    'Konzultant',
    'Jiné'
  ];

  // ARES Business Registry API call
  const searchBusinessByIco = async (ico: string) => {
    setIsSearching(true);
    try {
      // Call ARES service
      const result = await AresService.searchByIco(ico);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!result.data) {
        throw new Error('Firma s tímto IČO nebyla nalezena');
      }

      // Transform ARES data to BusinessData format
      const businessData: Partial<BusinessData> = {
        ico: result.data.ico,
        company_name: result.data.companyName,
        legal_form: result.data.legalForm,
        registration_date: result.data.registrationDate,
        business_address: result.data.address,
        business_status: result.data.isActive ? 'active' : 'inactive',
        is_active: result.data.isActive,
        registry_data: {
          source: 'ares_api',
          dic: result.data.dic,
          last_updated: new Date().toISOString()
        },
        last_sync_date: new Date().toISOString(),
        sync_status: 'synced'
      };

      return businessData;
    } catch (error) {
      throw new Error(`Nepodařilo se načíst data z ARES: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIcoSearch = async () => {
    if (!searchIco || searchIco.length !== 8) {
      alert('IČO musí mít 8 číslic');
      return;
    }

    // Check if business already exists
    const existingBusiness = businesses.find(b => b.ico === searchIco);
    if (existingBusiness) {
      alert('Firma s tímto IČO již existuje');
      return;
    }

    try {
      const businessData = await searchBusinessByIco(searchIco);
      setNewBusiness({
        ...businessData,
        id: `business-${Date.now()}`
      });
      setSearchIco('');
    } catch (error) {
      alert(`Chyba při vyhledávání: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  const addBusiness = () => {
    const newBiz: Partial<BusinessData> = {
      id: `business-${Date.now()}`,
      ico: '',
      company_name: '',
      legal_form: 's.r.o.',
      business_status: 'active',
      is_active: true,
      sync_status: 'manual'
    };
    setNewBusiness(newBiz);
  };

  const saveBusiness = (business: Partial<BusinessData>) => {
    if (!business.ico || !business.company_name) {
      alert('IČO a název firmy jsou povinné');
      return;
    }

    if (business.id?.startsWith('business-temp')) {
      // New business
      const finalBusiness = {
        ...business,
        id: `business-${Date.now()}`
      } as BusinessData;
      onChange([...businesses, finalBusiness]);
    } else {
      // Update existing business
      const updated = businesses.map(biz => 
        biz.id === business.id ? { ...biz, ...business } : biz
      );
      onChange(updated);
    }
    setNewBusiness(null);
    setEditingBusiness(null);
  };

  const deleteBusiness = (businessId: string) => {
    if (confirm('Opravdu chcete smazat tuto firmu?')) {
      const filtered = businesses.filter(biz => biz.id !== businessId);
      onChange(filtered);
    }
  };

  const refreshBusinessData = async (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;

    try {
      const updatedData = await searchBusinessByIco(business.ico);
      const updated = businesses.map(biz => 
        biz.id === businessId 
          ? { ...biz, ...updatedData, last_sync_date: new Date().toISOString(), sync_status: 'synced' as const }
          : biz
      );
      onChange(updated);
      alert('Data byla úspěšně aktualizována');
    } catch (error) {
      alert(`Chyba při aktualizaci: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Podnikání</h2>
            <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {businesses.filter(b => b.is_active).length} aktivních
            </span>
          </div>
        </div>

        {/* Business Search */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vyhledat firmu podle IČO</h3>
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchIco}
                onChange={(e) => setSearchIco(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Zadejte 8-místné IČO"
                maxLength={8}
              />
            </div>
            <button
              onClick={handleIcoSearch}
              disabled={isSearching || searchIco.length !== 8}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isSearching ? 'Vyhledávám...' : 'Vyhledat'}
            </button>
            <button
              onClick={addBusiness}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Přidat ručně
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Vyhledání automaticky načte data z obchodního rejstříku
          </p>
        </div>

        {/* Business List */}
        <div className="space-y-4">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              legalForms={legalForms}
              businessStatuses={businessStatuses}
              positions={positions}
              isEditing={editingBusiness === business.id}
              onEdit={() => setEditingBusiness(business.id)}
              onSave={(updatedBiz) => saveBusiness(updatedBiz)}
              onCancel={() => setEditingBusiness(null)}
              onDelete={() => deleteBusiness(business.id)}
              onRefresh={() => refreshBusinessData(business.id)}
            />
          ))}

          {/* New Business Form */}
          {newBusiness && (
            <BusinessCard
              business={newBusiness}
              legalForms={legalForms}
              businessStatuses={businessStatuses}
              positions={positions}
              isEditing={true}
              onSave={(updatedBiz) => saveBusiness(updatedBiz)}
              onCancel={() => setNewBusiness(null)}
              isNew={true}
            />
          )}
        </div>

        {businesses.length === 0 && !newBusiness && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Žádné firmy</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Přidejte první firmu klienta</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setSearchIco('')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Vyhledat podle IČO
              </button>
              <button
                onClick={addBusiness}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Přidat ručně
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Business Card Component
interface BusinessCardProps {
  business: Partial<BusinessData>;
  legalForms: string[];
  businessStatuses: Array<{value: string, label: string}>;
  positions: string[];
  isEditing: boolean;
  onEdit?: () => void;
  onSave: (business: Partial<BusinessData>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  isNew?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  legalForms,
  businessStatuses,
  positions,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onRefresh,
  isNew = false
}) => {
  const [editData, setEditData] = useState(business);

  React.useEffect(() => {
    setEditData(business);
  }, [business]);

  const handleFieldChange = (field: string, value: unknown) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!editData.ico || !editData.company_name) {
      alert('IČO a název firmy jsou povinné');
      return;
    }
    onSave(editData);
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSyncStatusLabel = (status?: string) => {
    switch (status) {
      case 'synced': return 'Synchronizováno';
      case 'failed': return 'Chyba synchronizace';
      case 'pending': return 'Čeká na synchronizaci';
      case 'manual': return 'Zadáno ručně';
      default: return 'Neznámý stav';
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">
            {isNew ? 'Nová firma' : 'Úprava firmy'}
          </h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
            >
              Uložit
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Zrušit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IČO *
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.ico || ''}
                onChange={(e) => handleFieldChange('ico', e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="12345678"
                maxLength={8}
              />
              <InlineEditableCopy value={editData.ico || ''} onSave={(v) => handleFieldChange('ico', v.replace(/\D/g, '').slice(0, 8))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název firmy *
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.company_name || ''}
                onChange={(e) => handleFieldChange('company_name', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Název společnosti"
              />
              <InlineEditableCopy value={editData.company_name || ''} onSave={(v) => handleFieldChange('company_name', v)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Právní forma
            </label>
            <select
              value={editData.legal_form || ''}
              onChange={(e) => handleFieldChange('legal_form', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              title="Právní forma"
              aria-label="Právní forma"
            >
              <option value="">Vyberte formu</option>
              {legalForms.map(form => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum registrace
            </label>
            <input
              type="date"
              value={editData.registration_date || ''}
              onChange={(e) => handleFieldChange('registration_date', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              title="Datum registrace"
              aria-label="Datum registrace"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresa firmy
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.business_address || ''}
                onChange={(e) => handleFieldChange('business_address', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Adresa sídla společnosti"
                title="Adresa firmy"
                aria-label="Adresa firmy"
              />
              <InlineEditableCopy value={editData.business_address || ''} onSave={(v) => handleFieldChange('business_address', v)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Předmět podnikání
            </label>
            <input
              type="text"
              value={editData.business_activity || ''}
              onChange={(e) => handleFieldChange('business_activity', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="Hlavní činnost"
              title="Předmět podnikání"
              aria-label="Předmět podnikání"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NACE kód
            </label>
            <input
              type="text"
              value={editData.nace_code || ''}
              onChange={(e) => handleFieldChange('nace_code', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="62010"
              title="NACE kód"
              aria-label="NACE kód"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roční obrat (Kč)
            </label>
            <input
              type="number"
              value={editData.annual_revenue || ''}
              onChange={(e) => handleFieldChange('annual_revenue', parseFloat(e.target.value) || 0)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="1000000"
              min="0"
              title="Roční obrat"
              aria-label="Roční obrat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Počet zaměstnanců
            </label>
            <input
              type="number"
              value={editData.employee_count || ''}
              onChange={(e) => handleFieldChange('employee_count', parseInt(e.target.value) || 0)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="10"
              min="0"
              title="Počet zaměstnanců"
              aria-label="Počet zaměstnanců"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Podíl klienta (%)
            </label>
            <input
              type="number"
              value={editData.share_percentage || ''}
              onChange={(e) => handleFieldChange('share_percentage', parseFloat(e.target.value) || 0)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="100"
              min="0"
              max="100"
              step="0.01"
              title="Podíl klienta v procentech"
              aria-label="Podíl klienta v procentech"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozice ve firmě
            </label>
            <select
              value={editData.position_in_company || ''}
              onChange={(e) => handleFieldChange('position_in_company', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              title="Pozice ve firmě"
              aria-label="Pozice ve firmě"
            >
              <option value="">Vyberte pozici</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stav firmy
            </label>
            <select
              value={editData.business_status || ''}
              onChange={(e) => handleFieldChange('business_status', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              title="Stav firmy"
              aria-label="Stav firmy"
            >
              {businessStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className={`bg-white rounded-lg border p-6 ${!business.is_active ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
            business.business_status === 'active' ? 'bg-purple-600' : 'bg-gray-400'
          }`}>
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {business.company_name}
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>IČO: {business.ico}</span>
              <span>•</span>
              <span>{business.legal_form}</span>
              {business.sync_status && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSyncStatusColor(business.sync_status)}`}>
                    {getSyncStatusLabel(business.sync_status)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Otevřít web firmy">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {onEdit && (
            <button onClick={onEdit} title="Upravit" className="p-2 text-gray-600 hover:text-gray-800">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onRefresh && (
            <button onClick={onRefresh} title="Aktualizovat" className="p-2 text-gray-600 hover:text-gray-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} title="Smazat" className="p-2 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Adresa:</span>
          <p className="font-medium">{business.business_address || 'Neuvedeno'}</p>
        </div>
        <div>
          <span className="text-gray-500">Činnost:</span>
          <p className="font-medium">{business.business_activity || 'Neuvedeno'}</p>
        </div>
        <div>
          <span className="text-gray-500">Pozice klienta:</span>
          <p className="font-medium">{business.position_in_company || 'Neuvedeno'}</p>
        </div>
        <div>
          <span className="text-gray-500">Podíl:</span>
          <p className="font-medium">
            {business.share_percentage ? `${business.share_percentage}%` : 'Neuvedeno'}
          </p>
        </div>
      </div>

      {business.last_sync_date && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Poslední synchronizace: {new Date(business.last_sync_date).toLocaleString('cs-CZ')}
          </p>
        </div>
      )}
    </div>
  );
};