import React, { useState } from 'react';
import { Building, Search, Plus, Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { CopyButton } from '../CopyButton';

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
  registry_data?: any;
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

  // Mock Business Registry API call
  const searchBusinessByIco = async (ico: string) => {
    setIsSearching(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - in production, this would call actual Business Registry API
      const mockBusinessData: Partial<BusinessData> = {
        ico: ico,
        company_name: `Vzorová společnost ${ico} s.r.o.`,
        legal_form: 's.r.o.',
        registration_date: '2020-01-15',
        business_address: 'Václavské náměstí 1, 110 00 Praha 1',
        business_activity: 'Výroba a prodej software',
        nace_code: '62010',
        employee_count: 25,
        business_status: 'active',
        sync_status: 'synced',
        last_sync_date: new Date().toISOString(),
        is_active: true,
        registry_data: {
          source: 'business_registry_api',
          fetched_at: new Date().toISOString(),
          raw_data: { /* mock raw API response */ }
        }
      };

      return mockBusinessData;
    } catch (error) {
      throw new Error('Nepodařilo se načíst data z obchodního rejstříku');
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
      alert(`Chyba při vyhledávání: ${error.message}`);
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
      alert(`Chyba při aktualizaci: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Podnikání</h2>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {businesses.filter(b => b.is_active).length} aktivních
          </span>
        </div>
      </div>

      {/* Business Search */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vyhledat firmu podle IČO</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchIco}
              onChange={(e) => setSearchIco(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Přidat ručně
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné firmy</h3>
          <p className="text-gray-500 mb-6">Přidejte první firmu klienta</p>
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Přidat ručně
            </button>
          </div>
        </div>
      )}
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

  const handleFieldChange = (field: string, value: any) => {
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
              <CopyButton text={editData.ico || ''} />
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
              <CopyButton text={editData.company_name || ''} />
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
              />
              <CopyButton text={editData.business_address || ''} />
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
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
              title="Otevřít web"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {onRefresh && business.sync_status !== 'manual' && (
            <button
              onClick={onRefresh}
              className="text-blue-600 hover:text-blue-800"
              title="Aktualizovat data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800"
              title="Upravit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800"
              title="Smazat"
            >
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