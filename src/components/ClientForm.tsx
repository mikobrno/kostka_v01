import React, { useState } from 'react';
import { ClientService } from '../services/clientService';
import { DynamicSectionManager } from './forms/DynamicSectionManager';
import { PersonalInfo } from './forms/PersonalInfo';
import { EmployerInfo } from './forms/EmployerInfo';
import { LiabilitiesInfo } from './forms/LiabilitiesInfo';
import { PropertyInfo } from './forms/PropertyInfo';
import { LoanSection } from './forms/LoanSection';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { Save, Plus, Eye, X, FileText, User, Layers } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ClientFormProps {
  selectedClient?: any;
  onClientSaved?: () => void;
  onClose?: () => void;
  toast?: ReturnType<typeof useToast>;
}

export const ClientForm: React.FC<ClientFormProps> = ({ selectedClient, onClientSaved, onClose, toast }) => {
  const [formData, setFormData] = useState({
    applicant: {},
    coApplicant: {},
    applicantEmployer: {},
    coApplicantEmployer: {},
    liabilities: [],
    applicantProperty: {},
    coApplicantProperty: {},
    loan: {}
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentClient, setCurrentClient] = useState(selectedClient);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'dynamic'>('basic');

  // Načtení dat vybraného klienta do formuláře
  React.useEffect(() => {
    if (selectedClient || currentClient) {
      const client = selectedClient || currentClient;
      setFormData({
        applicant: {
          title: client.applicant_title || '',
          firstName: client.applicant_first_name || '',
          lastName: client.applicant_last_name || '',
          birthNumber: client.applicant_birth_number || '',
          age: client.applicant_age || '',
          maritalStatus: client.applicant_marital_status || '',
          permanentAddress: client.applicant_permanent_address || '',
          contactAddress: client.applicant_contact_address || '',
          documentType: client.applicant_document_type || '',
          documentNumber: client.applicant_document_number || '',
          documentIssueDate: client.applicant_document_issue_date || '',
          documentValidUntil: client.applicant_document_valid_until || '',
          phone: client.applicant_phone || '',
          email: client.applicant_email || '',
          bank: client.applicant_bank || '',
          children: client.children?.filter(c => c.parent_type === 'applicant') || []
        },
        coApplicant: {
          title: client.co_applicant_title || '',
          firstName: client.co_applicant_first_name || '',
          lastName: client.co_applicant_last_name || '',
          birthNumber: client.co_applicant_birth_number || '',
          age: client.co_applicant_age || '',
          maritalStatus: client.co_applicant_marital_status || '',
          permanentAddress: client.co_applicant_permanent_address || '',
          contactAddress: client.co_applicant_contact_address || '',
          documentType: client.co_applicant_document_type || '',
          documentNumber: client.co_applicant_document_number || '',
          documentIssueDate: client.co_applicant_document_issue_date || '',
          documentValidUntil: client.co_applicant_document_valid_until || '',
          phone: client.co_applicant_phone || '',
          email: client.co_applicant_email || '',
          bank: client.co_applicant_bank || '',
          children: client.children?.filter(c => c.parent_type === 'co_applicant') || []
        },
        applicantEmployer: {
          ico: client.employers?.[0]?.ico || '',
          companyName: client.employers?.[0]?.company_name || '',
          companyAddress: client.employers?.[0]?.company_address || '',
          netIncome: client.employers?.[0]?.net_income || ''
        },
        coApplicantEmployer: {
          ico: client.employers?.[1]?.ico || '',
          companyName: client.employers?.[1]?.company_name || '',
          companyAddress: client.employers?.[1]?.company_address || '',
          netIncome: client.employers?.[1]?.net_income || ''
        },
        liabilities: client.liabilities || [],
        applicantProperty: {
          address: client.properties?.[0]?.address || '',
          price: client.properties?.[0]?.price || ''
        },
        coApplicantProperty: {
          address: client.properties?.[1]?.address || '',
          price: client.properties?.[1]?.price || ''
        },
        loan: {
          bank: client.loan?.bank || '',
          contractNumber: client.loan?.contract_number || '',
          signatureDate: client.loan?.signature_date || '',
          advisor: client.loan?.advisor || '',
          loanAmount: client.loan?.loan_amount || '',
          loanAmountWords: client.loan?.loan_amount_words || '',
          fixationYears: client.loan?.fixation_years || '',
          interestRate: client.loan?.interest_rate || '',
          insurance: client.loan?.insurance || '',
          propertyValue: client.loan?.property_value || '',
          monthlyPayment: client.loan?.monthly_payment || ''
        }
      });
    }
  }, [selectedClient, currentClient]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedClient || currentClient) {
        // Aktualizace existujícího klienta
        const clientId = selectedClient?.id || currentClient?.id;
        const { data, error } = await ClientService.updateClient(clientId, formData);
        if (error) {
          throw new Error(error.message || 'Chyba při aktualizaci klienta');
        }
        setCurrentClient(data);
        toast?.showSuccess('Klient aktualizován', 'Údaje klienta byly úspěšně uloženy');
        // Don't call onClientSaved to prevent navigation - user stays on current page
      } else {
        // Vytvoření nového klienta
        const { data, error } = await ClientService.createClient(formData);
        if (error) {
          throw new Error(error.message || 'Chyba při vytváření klienta');
        }
        setCurrentClient(data);
        toast?.showSuccess('Klient vytvořen', 'Nový klient byl úspěšně přidán do systému');
        // Don't call onClientSaved to prevent navigation - user stays on current page
        // After creation, we're now in edit mode with the saved client data
      }
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      toast?.showError('Chyba při ukládání', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    toast?.showInfo('PDF generování dočasně nedostupné', 'Funkce bude přidána v budoucí verzi');
  };

  const handleNewClient = () => {
    setCurrentClient(null);
    setFormData({
      applicant: {},
      coApplicant: {},
      applicantEmployer: {},
      coApplicantEmployer: {},
      liabilities: [],
      applicantProperty: {},
      coApplicantProperty: {},
      loan: {}
    });
    setShowPreview(false);
    // Call onClientSaved only when explicitly creating a new client
    // This will trigger navigation to a new client form
    onClientSaved?.();
  };

  if (showPreview && (selectedClient || currentClient)) {
    return (
      <ClientPreview 
        client={selectedClient || currentClient}
        formData={formData}
        onEdit={() => setShowPreview(false)}
        onClose={onClose}
        onExportPDF={handleExportPDF}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedClient || currentClient ? 'Úprava klienta' : 'Nový klient'}
          </h1>
          {(selectedClient || currentClient) && (
            <p className="text-gray-600 mt-1">
              {formData.applicant.firstName} {formData.applicant.lastName}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Zavřít
            </button>
          )}
          
          {(selectedClient || currentClient) && (
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Náhled
            </button>
          )}
          
          {(selectedClient || currentClient) && (
            <button
              onClick={handleNewClient}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nový klient
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Ukládám...' : (selectedClient || currentClient ? 'Aktualizovat' : 'Uložit')}
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={!selectedClient && !currentClient}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF (brzy)
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveFormTab('basic')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeFormTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Základní údaje</span>
          </button>
          <button
            onClick={() => setActiveFormTab('dynamic')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeFormTab === 'dynamic'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled={!selectedClient && !currentClient}
          >
            <Layers className="w-4 h-4" />
            <span>Vlastní sekce</span>
            {!selectedClient && !currentClient && (
              <span className="text-xs text-gray-400">(nejprve uložte klienta)</span>
            )}
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      {activeFormTab === 'basic' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
                  Žadatel
                </h2>
                <PersonalInfo 
                  data={formData.applicant}
                  onChange={(data) => setFormData(prev => ({ ...prev, applicant: data }))}
                  prefix="applicant"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                  Spolužadatel
                </h2>
                <PersonalInfo 
                  data={formData.coApplicant}
                  onChange={(data) => setFormData(prev => ({ ...prev, coApplicant: data }))}
                  prefix="coApplicant"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                Zaměstnavatel žadatele
              </h2>
              <EmployerInfo 
                data={formData.applicantEmployer}
                onChange={(data) => setFormData(prev => ({ ...prev, applicantEmployer: data }))}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                Zaměstnavatel spolužadatele
              </h2>
              <EmployerInfo 
                data={formData.coApplicantEmployer}
                onChange={(data) => setFormData(prev => ({ ...prev, coApplicantEmployer: data }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <PropertyInfo 
                data={formData.applicantProperty}
                onChange={(data) => setFormData(prev => ({ ...prev, applicantProperty: data }))}
                title="Nemovitost žadatele"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <PropertyInfo 
                data={formData.coApplicantProperty}
                onChange={(data) => setFormData(prev => ({ ...prev, coApplicantProperty: data }))}
                title="Nemovitost spolužadatele"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <LoanSection 
              data={formData.loan}
              onChange={(data) => setFormData(prev => ({ ...prev, loan: data }))}
              propertyPrice={formData.applicantProperty.price || formData.coApplicantProperty.price}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Závazky</h2>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4 mr-1" />
                Přidat závazek
              </button>
            </div>
            <LiabilitiesInfo 
              data={formData.liabilities}
              onChange={(data) => setFormData(prev => ({ ...prev, liabilities: data }))}
            />
          </div>
        </div>
      )}

      {/* Dynamic Sections Tab */}
      {activeFormTab === 'dynamic' && (
        <div className="space-y-8">
          {(selectedClient?.id || currentClient?.id) ? (
            <DynamicSectionManager 
              clientId={selectedClient?.id || currentClient?.id}
              toast={toast}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vlastní sekce nejsou dostupné</h3>
              <p className="text-gray-500 mb-6">
                Nejprve uložte základní údaje klienta, poté budete moci přidat vlastní sekce
              </p>
              <button
                onClick={() => setActiveFormTab('basic')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Přejít na základní údaje
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Komponenta pro náhled klienta
interface ClientPreviewProps {
  client: any;
  formData: any;
  onEdit: () => void;
  onClose?: () => void;
  onExportPDF: () => void;
}

const ClientPreview: React.FC<ClientPreviewProps> = ({ 
  client, 
  formData, 
  onEdit, 
  onClose, 
  onExportPDF 
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Neuvedeno';
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ');
    } catch {
      return 'Neplatné datum';
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return 'Neuvedeno';
    return price.toLocaleString('cs-CZ') + ' Kč';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Náhled klienta</h1>
          <p className="text-gray-600 mt-1">
            {formData.applicant.firstName} {formData.applicant.lastName}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Zavřít
            </button>
          )}
          
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Upravit
          </button>
          
          <button
            onClick={onExportPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF (brzy)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Žadatel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Žadatel
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Jméno:</span>
                <p className="text-gray-900">{formData.applicant.title} {formData.applicant.firstName} {formData.applicant.lastName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Rodné číslo:</span>
                <p className="text-gray-900">{formData.applicant.birthNumber || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Věk:</span>
                <p className="text-gray-900">{formData.applicant.age ? `${formData.applicant.age} let` : 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Rodinný stav:</span>
                <p className="text-gray-900">{formData.applicant.maritalStatus || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Trvalé bydliště:</span>
              <p className="text-gray-900">{formData.applicant.permanentAddress || 'Neuvedeno'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Telefon:</span>
                <p className="text-gray-900">{formData.applicant.phone || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{formData.applicant.email || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Banka:</span>
              <p className="text-gray-900">{formData.applicant.bank || 'Neuvedeno'}</p>
            </div>
          </div>
        </div>

        {/* Spolužadatel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Spolužadatel
          </h2>
          {formData.coApplicant.firstName ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Jméno:</span>
                  <p className="text-gray-900">{formData.coApplicant.title} {formData.coApplicant.firstName} {formData.coApplicant.lastName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Rodné číslo:</span>
                  <p className="text-gray-900">{formData.coApplicant.birthNumber || 'Neuvedeno'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Telefon:</span>
                  <p className="text-gray-900">{formData.coApplicant.phone || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{formData.coApplicant.email || 'Neuvedeno'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Spolužadatel nebyl zadán</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zaměstnavatel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Zaměstnavatel žadatele
          </h2>
          {formData.applicantEmployer.companyName ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Název firmy:</span>
                <p className="text-gray-900">{formData.applicantEmployer.companyName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">IČO:</span>
                <p className="text-gray-900">{formData.applicantEmployer.ico || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Adresa:</span>
                <p className="text-gray-900">{formData.applicantEmployer.companyAddress || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Čistý příjem:</span>
                <p className="text-gray-900">{formData.applicantEmployer.netIncome ? formatPrice(formData.applicantEmployer.netIncome) : 'Neuvedeno'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Zaměstnavatel nebyl zadán</p>
          )}
        </div>

        {/* Zaměstnavatel spolužadatele */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Zaměstnavatel spolužadatele
          </h2>
          {formData.coApplicantEmployer.companyName ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Název firmy:</span>
                <p className="text-gray-900">{formData.coApplicantEmployer.companyName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">IČO:</span>
                <p className="text-gray-900">{formData.coApplicantEmployer.ico || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Adresa:</span>
                <p className="text-gray-900">{formData.coApplicantEmployer.companyAddress || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Čistý příjem:</span>
                <p className="text-gray-900">{formData.coApplicantEmployer.netIncome ? formatPrice(formData.coApplicantEmployer.netIncome) : 'Neuvedeno'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Zaměstnavatel nebyl zadán</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nemovitost */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Nemovitosti
          </h2>
          {(formData.applicantProperty.address || formData.coApplicantProperty.address) ? (
            <div className="space-y-4">
              {formData.applicantProperty.address && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Nemovitost žadatele</h4>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Adresa:</span>
                    <p className="text-gray-900">{formData.applicantProperty.address}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Kupní cena:</span>
                    <p className="text-gray-900 text-lg font-semibold text-green-600">
                      {formData.applicantProperty.price ? formatPrice(formData.applicantProperty.price) : 'Neuvedeno'}
                    </p>
                  </div>
                </div>
              )}
              
              {formData.coApplicantProperty.address && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Nemovitost spolužadatele</h4>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Adresa:</span>
                    <p className="text-gray-900">{formData.coApplicantProperty.address}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Kupní cena:</span>
                    <p className="text-gray-900 text-lg font-semibold text-green-600">
                      {formData.coApplicantProperty.price ? formatPrice(formData.coApplicantProperty.price) : 'Neuvedeno'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nemovitosti nebyly zadány</p>
          )}
        </div>

        {/* Úvěr */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Úvěr
          </h2>
          {formData.loan.bank ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Banka:</span>
                <p className="text-gray-900">{formData.loan.bank}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Číslo smlouvy:</span>
                <p className="text-gray-900">{formData.loan.contractNumber || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Výše úvěru:</span>
                <p className="text-gray-900 text-lg font-semibold text-green-600">
                  {formData.loan.loanAmount ? formatPrice(formData.loan.loanAmount) : 'Neuvedeno'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Měsíční splátka:</span>
                <p className="text-gray-900 font-semibold">
                  {formData.loan.monthlyPayment ? formatPrice(formData.loan.monthlyPayment) : 'Neuvedeno'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Úvěr nebyl zadán</p>
          )}
        </div>
      </div>

      {/* Závazky */}
      {formData.liabilities && formData.liabilities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Závazky
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instituce
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Výše úvěru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Splátka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zůstatek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.liabilities.map((liability, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {liability.institution || 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {liability.type || 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {liability.amount ? formatPrice(liability.amount) : 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {liability.payment ? formatPrice(liability.payment) : 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {liability.balance ? formatPrice(liability.balance) : 'Neuvedeno'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Děti */}
      {((formData.applicant.children && formData.applicant.children.length > 0) || 
        (formData.coApplicant.children && formData.coApplicant.children.length > 0)) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            Děti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.applicant.children && formData.applicant.children.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Děti žadatele</h3>
                <div className="space-y-2">
                  {formData.applicant.children.map((child, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-900">{child.name}</p>
                      <p className="text-sm text-blue-700">
                        {child.birthDate ? formatDate(child.birthDate) : 'Datum narození neuvedeno'}
                        {child.age && ` (${child.age} let)`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {formData.coApplicant.children && formData.coApplicant.children.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Děti spolužadatele</h3>
                <div className="space-y-2">
                  {formData.coApplicant.children.map((child, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-900">{child.name}</p>
                      <p className="text-sm text-green-700">
                        {child.birthDate ? formatDate(child.birthDate) : 'Datum narození neuvedeno'}
                        {child.age && ` (${child.age} let)`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};