import React, { useState, useEffect } from 'react';
import { ClientService } from '../services/clientService';
import { Users, Search, Eye, Edit, Trash2, RefreshCw, Calendar, Phone, Mail, X, MapPin, Building, CreditCard, User, FileDown, Link, Copy } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ClientListProps {
  onSelectClient?: (client: any) => void;
  toast?: ReturnType<typeof useToast>;
  refreshKey?: number;
}

export const ClientList: React.FC<ClientListProps> = ({ onSelectClient, toast, refreshKey }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showClientPreview, setShowClientPreview] = useState<any | null>(null);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Načítám klienty ze Supabase...');
    
    try {
      const { data, error } = await ClientService.getClients();
      
      if (error) {
        console.error('Supabase error:', error);
        setError(`Chyba při načítání klientů: ${error.message || 'Neznámá chyba'}`);
        setClients([]);
        return;
      }
      
      console.log('📥 Přijatá data ze Supabase:', data);
      
      setClients(data || []);
    } catch (error) {
      console.error('Chyba při načítání klientů:', error);
      setError(`Chyba při načítání klientů: ${error?.message || 'Neočekávaná chyba'}`);
      setClients([]);
    } finally {
      console.log('✅ Načítání dokončeno');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Kontrola připojení k Supabase
    if (!window.location.hostname.includes('localhost') && !import.meta.env.VITE_SUPABASE_URL) {
      setError('Aplikace není správně nakonfigurována pro Supabase');
      return;
    }
    loadClients();
  }, [refreshKey]);

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.applicant_first_name?.toLowerCase().includes(searchLower) ||
      client.applicant_last_name?.toLowerCase().includes(searchLower) ||
      client.applicant_email?.toLowerCase().includes(searchLower) ||
      client.applicant_phone?.includes(searchTerm) ||
      client.properties?.[0]?.address?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Neznámé datum';
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return 'Neuvedeno';
    return parseInt(price).toLocaleString('cs-CZ') + ' Kč';
  };

  const handleDeleteClient = async (clientId: string) => {
    setShowDeleteConfirm(clientId);
  };

  const confirmDeleteClient = async (clientId: string) => {
    setShowDeleteConfirm(null);

    try {
      const { error } = await ClientService.deleteClient(clientId);
      if (error) {
        throw new Error(error.message || 'Chyba při mazání klienta');
      }
      
      toast?.showSuccess('Klient smazán', 'Klient byl úspěšně odstraněn ze systému');
      loadClients(); // Obnovit seznam
    } catch (error) {
      console.error('Chyba při mazání klienta:', error);
      toast?.showError('Chyba při mazání', error.message);
    }
  };

  const cancelDeleteClient = () => {
    setShowDeleteConfirm(null);
  };

  const generateClientUrl = (clientId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?client=${clientId}`;
  };

  const copyClientUrl = async (clientId: string, clientName: string) => {
    const url = generateClientUrl(clientId);
    try {
      await navigator.clipboard.writeText(url);
      toast?.showSuccess('Odkaz zkopírován', `Odkaz na klienta ${clientName} byl zkopírován do schránky`);
    } catch (error) {
      console.error('Chyba při kopírování do schránky:', error);
      // Fallback - zobrazit URL v alert
      prompt('Zkopírujte tento odkaz:', url);
    }
  };

  const handleExportPDF = async (client: any) => {
    try {
      // Lazy loading PDFService
      const { PDFService } = await import('../services/pdfService');
      
      // Připravení dat pro PDF
      const clientData = {
        applicant_title: client.applicant_title,
        applicant_first_name: client.applicant_first_name,
        applicant_last_name: client.applicant_last_name,
        applicant_maiden_name: client.applicant_maiden_name,
        applicant_birth_number: client.applicant_birth_number,
        applicant_birth_date: client.applicant_birth_date,
        applicant_age: client.applicant_age,
        applicant_marital_status: client.applicant_marital_status,
        applicant_permanent_address: client.applicant_permanent_address,
        applicant_contact_address: client.applicant_contact_address,
        applicant_phone: client.applicant_phone,
        applicant_email: client.applicant_email,
        applicant_housing_type: client.applicant_housing_type,
        co_applicant_title: client.co_applicant_title,
        co_applicant_first_name: client.co_applicant_first_name,
        co_applicant_last_name: client.co_applicant_last_name,
        co_applicant_maiden_name: client.co_applicant_maiden_name,
        co_applicant_birth_number: client.co_applicant_birth_number,
        co_applicant_birth_date: client.co_applicant_birth_date,
        co_applicant_age: client.co_applicant_age,
        co_applicant_marital_status: client.co_applicant_marital_status,
        co_applicant_permanent_address: client.co_applicant_permanent_address,
        co_applicant_contact_address: client.co_applicant_contact_address,
        co_applicant_phone: client.co_applicant_phone,
        co_applicant_email: client.co_applicant_email,
        created_at: client.created_at,
        id: client.id
      };

      // Zaměstnavatelé
      const employers = (client.employers || []).map((emp: any) => ({
        id: emp.id,
        ico: emp.ico,
        company_name: emp.company_name,
        company_address: emp.company_address,
        net_income: emp.net_income,
        job_position: emp.job_position,
        employed_since: emp.employed_since,
        contract_type: emp.contract_type,
        employer_type: emp.employer_type
      }));

      // Závazky
      const liabilities = (client.liabilities || []).map((liability: any) => ({
        id: liability.id?.toString() || '',
        institution: liability.institution,
        type: liability.type,
        amount: liability.amount,
        payment: liability.payment,
        balance: liability.balance,
        notes: liability.notes
      }));

      // Nemovitost
      const property = {
        address: client.properties?.[0]?.address,
        price: client.properties?.[0]?.price
      };

      await PDFService.generateClientPDF(clientData, employers, liabilities, property);
      toast?.showSuccess('PDF vytvořeno', `Klientský profil pro ${client.applicant_first_name} ${client.applicant_last_name} byl úspěšně exportován`);
    } catch (error) {
      console.error('Chyba při exportu PDF:', error);
      toast?.showError('Chyba', 'Nepodařilo se vytvořit PDF soubor');
    }
  };

  const closeClientPreview = () => {
    setShowClientPreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Seznam klientů</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">Přehled všech zadaných klientů</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Smazat klienta
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tohoto klienta? Tato akce je nevratná a smaže všechna související data.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cancelDeleteClient}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => confirmDeleteClient(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Preview Modal */}
      {showClientPreview && (
        <ClientPreviewModal 
          client={showClientPreview} 
          onClose={closeClientPreview}
          onEdit={() => {
            onSelectClient?.(showClientPreview);
            closeClientPreview();
          }}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Hledat podle jména, emailu, telefonu..."
              />
            </div>
            
            <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 dark:text-gray-300">
                Celkem: {filteredClients.length} klientů
              </span>
              <button
                onClick={loadClients}
                disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Obnovit
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  ⚠️ {error}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  Zkuste obnovit stránku nebo kontaktujte podporu.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">Načítám klienty...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Žádní klienti nenalezeni' : 'Žádní klienti'}
              </h3>
              <p className="text-gray-500 dark:text-gray-300">
                {searchTerm 
                  ? 'Zkuste upravit vyhledávací kritéria'
                  : 'Zatím nebyli zadáni žádní klienti'
                }
              </p>
            </div>
          ) : (
            <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nemovitost
                  </th>
                  <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Datum zadání
                  </th>
                  <th className="w-1/6 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                              {client.applicant_firstName?.[0]}{client.applicant_lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <button
                              onClick={() => onSelectClient?.(client)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              title={`Zobrazit detail klienta - URL: ${generateClientUrl(client.id)}`}
                              aria-label={`Zobrazit detail klienta ${client.applicant_first_name} ${client.applicant_last_name}`}
                            >
                              {client.applicant_first_name} {client.applicant_last_name}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            RČ: {client.applicant_birth_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center mb-1">
                          <Phone className="w-3 h-3 text-gray-400 dark:text-gray-500 mr-1" />
                          {client.applicant_phone}
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 text-gray-400 dark:text-gray-500 mr-1" />
                          {client.applicant_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {client.properties?.[0]?.address || 'Neuvedeno'}
                      </div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {client.properties?.[0]?.price ? formatPrice(client.properties[0].price.toString()) : 'Neuvedeno'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <Calendar className="w-3 h-3 mr-1 dark:text-gray-400" />
                        {formatDate(client.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => copyClientUrl(client.id, `${client.applicant_first_name} ${client.applicant_last_name}`)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 rounded p-1"
                          title="Zkopírovat odkaz na klienta"
                          aria-label={`Zkopírovat odkaz na klienta ${client.applicant_first_name} ${client.applicant_last_name}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectClient?.(client)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 rounded p-1"
                          title="Zobrazit detail"
                          aria-label={`Zobrazit detail klienta ${client.applicant_first_name} ${client.applicant_last_name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectClient?.(client)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition-colors"
                          title="Upravit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(client)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
                          title="Export do PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteClient(client.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {filteredClients.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
              <span>
                Zobrazeno {filteredClients.length} z {clients.length} klientů
              </span>
              <span>
                Poslední aktualizace: {new Date().toLocaleTimeString('cs-CZ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Client Preview Modal Component
interface ClientPreviewModalProps {
  client: any;
  onClose: () => void;
  onEdit: () => void;
}

const ClientPreviewModal: React.FC<ClientPreviewModalProps> = ({ client, onClose, onEdit }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Neuvedeno';
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ');
    } catch {
      return 'Neplatné datum';
    }
  };

  const formatPrice = (price: number | string) => {
    if (!price) return 'Neuvedeno';
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return numPrice.toLocaleString('cs-CZ') + ' Kč';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {client.applicant_first_name} {client.applicant_last_name}
              </h2>
              <p className="text-sm text-gray-500">
                Vytvořeno: {formatDate(client.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Upravit
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Zavřít
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
          {/* Žadatel */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Žadatel
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-700">Jméno:</span>
                  <p className="text-blue-900 font-medium">
                    {[client.applicant_title, client.applicant_first_name, client.applicant_last_name]
                      .filter(Boolean).join(' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Věk:</span>
                  <p className="text-blue-900">{client.applicant_age ? `${client.applicant_age} let` : 'Neuvedeno'}</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-blue-700">Rodné číslo:</span>
                <p className="text-blue-900 font-mono">{client.applicant_birth_number || 'Neuvedeno'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-blue-700">Rodinný stav:</span>
                <p className="text-blue-900">{client.applicant_marital_status || 'Neuvedeno'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-blue-700 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Trvalé bydliště:
                </span>
                <p className="text-blue-900 text-sm">{client.applicant_permanent_address || 'Neuvedeno'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-700 flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    Telefon:
                  </span>
                  <p className="text-blue-900 font-mono text-sm">{client.applicant_phone || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Email:
                  </span>
                  <p className="text-blue-900 text-sm">{client.applicant_email || 'Neuvedeno'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spolužadatel */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Spolužadatel
            </h3>
            {client.co_applicant_first_name ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-700">Jméno:</span>
                    <p className="text-green-900 font-medium">
                      {[client.co_applicant_title, client.co_applicant_first_name, client.co_applicant_last_name]
                        .filter(Boolean).join(' ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Věk:</span>
                    <p className="text-green-900">{client.co_applicant_age ? `${client.co_applicant_age} let` : 'Neuvedeno'}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-green-700">Rodné číslo:</span>
                  <p className="text-green-900 font-mono">{client.co_applicant_birth_number || 'Neuvedeno'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-700 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      Telefon:
                    </span>
                    <p className="text-green-900 font-mono text-sm">{client.co_applicant_phone || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      Email:
                    </span>
                    <p className="text-green-900 text-sm">{client.co_applicant_email || 'Neuvedeno'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-green-700 italic">Spolužadatel nebyl zadán</p>
            )}
          </div>

          {/* Zaměstnavatel */}
          {client.employers && client.employers.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Zaměstnavatel
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-purple-700">Název firmy:</span>
                  <p className="text-purple-900 font-medium">{client.employers[0]?.company_name || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-purple-700">IČO:</span>
                  <p className="text-purple-900 font-mono">{client.employers[0]?.ico || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-purple-700">Čistý příjem:</span>
                  <p className="text-purple-900 font-semibold text-lg">
                    {client.employers[0]?.net_income ? formatPrice(client.employers[0].net_income) : 'Neuvedeno'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nemovitost */}
          {client.properties && client.properties.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Nemovitost
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-orange-700">Adresa:</span>
                  <p className="text-orange-900">{client.properties[0]?.address || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-orange-700">Kupní cena:</span>
                  <p className="text-orange-900 font-bold text-xl text-green-600">
                    {client.properties[0]?.price ? formatPrice(client.properties[0].price) : 'Neuvedeno'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Závazky */}
          {client.liabilities && client.liabilities.length > 0 && (
            <div className="bg-red-50 rounded-lg p-6 border border-red-200 lg:col-span-2">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Závazky ({client.liabilities.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-red-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700 uppercase">Instituce</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700 uppercase">Typ</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700 uppercase">Splátka</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-700 uppercase">Zůstatek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200">
                    {client.liabilities.slice(0, 3).map((liability: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-red-900">{liability.institution || 'Neuvedeno'}</td>
                        <td className="px-3 py-2 text-sm text-red-900">{liability.type || 'Neuvedeno'}</td>
                        <td className="px-3 py-2 text-sm text-red-900 font-medium">
                          {liability.payment ? formatPrice(liability.payment) : 'Neuvedeno'}
                        </td>
                        <td className="px-3 py-2 text-sm text-red-900 font-medium">
                          {liability.balance ? formatPrice(liability.balance) : 'Neuvedeno'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {client.liabilities.length > 3 && (
                  <p className="text-xs text-red-600 mt-2">
                    ... a {client.liabilities.length - 3} dalších závazků
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};