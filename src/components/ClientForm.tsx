/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ClientService } from '../services/clientService';
import { DynamicSectionManager } from './forms/DynamicSectionManager';
import { PdfUpload } from './forms/PdfUpload';
import { PersonalInfo } from './forms/PersonalInfo';
import { EmployerInfo } from './forms/EmployerInfo';
import { LiabilitiesInfo } from './forms/LiabilitiesInfo';
import { PropertyInfo } from './forms/PropertyInfo';
import { LoanSection } from './forms/LoanSection';
import { SimpleSearch } from './SimpleSearch';
import ClientStatusProgress from './ClientStatusProgress';
import { ClientStatus } from '../types/clientStatus';
import { Save, Plus, Eye, X, FileText, User, Layers, FileDown, Download, Upload } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ClientFormProps {
  selectedClient?: any;
  onClientSaved?: (updatedClient?: any) => void;
  onClose?: () => void;
  toast?: ReturnType<typeof useToast>;
  initialTab?: 'basic' | 'dynamic' | 'pdf'; // přidán prop
}

export const ClientForm: React.FC<ClientFormProps> = ({ selectedClient, onClientSaved, onClose, toast, initialTab = 'basic' }) => {
  // Volnější typování formuláře – zabrání chybám s never[] a {} při postupném vyplňování
  const [formData, setFormData] = useState<any>({
    applicant: {},
    coApplicant: {},
    applicantEmployer: {},
    coApplicantEmployer: {},
    liabilities: [] as any[],
    applicantProperty: {},
    coApplicantProperty: {},
    loan: {},
    status: 'inquiry' as ClientStatus
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentClient, setCurrentClient] = useState(selectedClient);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'dynamic' | 'pdf'>(initialTab);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Načtení dat vybraného klienta do formuláře
  React.useEffect(() => {
    if (selectedClient || currentClient) {
      const client = selectedClient || currentClient;
      setFormData({
        status: client.status || 'inquiry',
        applicant: {
          title: client.applicant_title || '',
          firstName: client.applicant_first_name || '',
          lastName: client.applicant_last_name || '',
          maidenName: client.applicant_maiden_name || '',
          birthNumber: client.applicant_birth_number || '',
          age: client.applicant_age || '',
          birthYear: client.applicant_birth_year || '',
          birthDate: client.applicant_birth_date || '',
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
          housingType: client.applicant_housing_type || '',
          education: client.applicant_education || '',
          citizenship: client.applicant_citizenship || '',
          children: client.children?.filter((c: any) => c.parent_type === 'applicant') || [],
          businesses: client.businesses?.filter((b: any) => b.parent_type === 'applicant') || [],
          documents: client.documents?.filter((d: any) => d.parent_type === 'applicant') || []
        },
        coApplicant: {
          title: client.co_applicant_title || '',
          firstName: client.co_applicant_first_name || '',
          lastName: client.co_applicant_last_name || '',
          maidenName: client.co_applicant_maiden_name || '',
          birthNumber: client.co_applicant_birth_number || '',
          age: client.co_applicant_age || '',
          birthYear: client.co_applicant_birth_year || '',
          birthDate: client.co_applicant_birth_date || '',
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
          education: client.co_applicant_education || '',
          citizenship: client.co_applicant_citizenship || '',
          children: client.children?.filter((c: any) => c.parent_type === 'co_applicant') || [],
          businesses: client.businesses?.filter((b: any) => b.parent_type === 'co_applicant') || [],
          documents: client.documents?.filter((d: any) => d.parent_type === 'co_applicant') || []
        },
        applicantEmployer: {
          ico: client.employers?.find((e: any) => e.employer_type === 'applicant')?.ico || '',
          companyName: client.employers?.find((e: any) => e.employer_type === 'applicant')?.company_name || '',
          companyAddress: client.employers?.find((e: any) => e.employer_type === 'applicant')?.company_address || '',
          netIncome: client.employers?.find((e: any) => e.employer_type === 'applicant')?.net_income || '',
          jobPosition: client.employers?.find((e: any) => e.employer_type === 'applicant')?.job_position || '',
          employedSince: client.employers?.find((e: any) => e.employer_type === 'applicant')?.employed_since || '',
          contractType: client.employers?.find((e: any) => e.employer_type === 'applicant')?.contract_type || '',
          contractFromDate: client.employers?.find((e: any) => e.employer_type === 'applicant')?.contract_from_date || '',
          contractToDate: client.employers?.find((e: any) => e.employer_type === 'applicant')?.contract_to_date || '',
          contractExtended: client.employers?.find((e: any) => e.employer_type === 'applicant')?.contract_extended || false
        },
        coApplicantEmployer: {
          ico: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.ico || '',
          companyName: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.company_name || '',
          companyAddress: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.company_address || '',
          netIncome: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.net_income || '',
          jobPosition: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.job_position || '',
          employedSince: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.employed_since || '',
          contractType: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.contract_type || '',
          contractFromDate: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.contract_from_date || '',
          contractToDate: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.contract_to_date || '',
          contractExtended: client.employers?.find((e: any) => e.employer_type === 'co_applicant')?.contract_extended || false
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
          // nové rozdělení doporučitele
          advisorName: (client.loan?.advisor_name) || (client.loan?.advisor?.includes(' - ') ? client.loan?.advisor?.split(' - ')[0] : client.loan?.advisor || ''),
          advisorAgentNumber: (client.loan?.advisor_agency_number) || (client.loan?.advisor?.includes(' - ') ? client.loan?.advisor?.split(' - ').slice(1).join(' - ') : ''),
          loanAmount: client.loan?.loan_amount || '',
          loanAmountWords: client.loan?.loan_amount_words || '',
          fixationYears: client.loan?.fixation_years || '',
          interestRate: client.loan?.interest_rate || '',
          insurance: client.loan?.insurance || '',
          propertyValue: client.loan?.property_value || '',
          monthlyPayment: client.loan?.monthly_payment || '',
          maturityYears: client.loan?.maturity_years || ''
        }
      });
    }
  }, [selectedClient, currentClient]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sestavení employer objektu pro ClientService
      const employer = {
        applicant: formData.applicantEmployer,
        coApplicant: formData.coApplicantEmployer
      };
      const payload = {
        ...formData,
        employer,
        property: formData.applicantProperty // nebo sloučit obě nemovitosti dle potřeby
      };
      if (selectedClient || currentClient) {
        // Aktualizace existujícího klienta
        const clientId = selectedClient?.id || currentClient?.id;
        const { data, error } = await ClientService.updateClient(clientId, payload);
        if (error) {
          throw new Error(error.message || 'Chyba při aktualizaci klienta');
        }
        // Po uložení načti aktuální data klienta ze Supabase
        const { data: freshData, error: freshError } = await ClientService.getClient(clientId);
        if (!freshError && freshData) {
          setCurrentClient(freshData);
          if (onClientSaved) {
            onClientSaved(freshData);
          }
        } else {
          setCurrentClient(data); // fallback
          if (onClientSaved) {
            onClientSaved(data);
          }
        }
        toast?.showSuccess('Klient aktualizován', 'Údaje klienta byly úspěšně uloženy');
      } else {
        // Vytvoření nového klienta
        const { data, error } = await ClientService.createClient(payload);
        if (error) {
          throw new Error(error.message || 'Chyba při vytváření klienta');
        }
        // Po uložení načti aktuální data klienta ze Supabase
        if (data && data.id) {
          const { data: freshData, error: freshError } = await ClientService.getClient(data.id);
          if (!freshError && freshData) {
            setCurrentClient(freshData);
             if (onClientSaved) {
              onClientSaved(freshData);
            }
          } else {
            setCurrentClient(data); // fallback
            if (onClientSaved) {
              onClientSaved(data);
            }
          }
        } else {
          setCurrentClient(data);
           if (onClientSaved) {
            onClientSaved(data);
          }
        }
        toast?.showSuccess('Klient vytvořen', 'Nový klient byl úspěšně přidán do systému');
      }
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      const err = error as any;
      toast?.showError('Chyba při ukládání', err?.message || 'Neznámá chyba');
    } finally {
      setSaving(false);
    }
  };

  // Automatické ukládání při zavření
  const handleClose = async () => {
    if (saving) return; // Pokud už se ukládá, neprovádej další akci
    
    try {
      await handleSave(); // Automaticky ulož před zavřením
    } catch (error) {
      console.error('Automatické ukládání před zavřením selhalo:', error);
      // I když se nepodaří uložit, zavři dialog - uživatel může uložit ručně později
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleExportPDF = async () => {
    try {
      console.log('Začínám export PDF...');
      
      // Lazy load PDFMakeService – používá vestavěný Roboto font (diakritika)
      const { PDFMakeService } = await import('../services/pdfMakeService');
      
      const client = selectedClient || currentClient;
      if (!client) {
        toast?.showError('Chyba', 'Nejsou dostupná data klienta pro export');
        return;
      }

      console.log('Klient nalezen:', client.applicant_first_name, client.applicant_last_name);

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

      // Závazky z formData
  const liabilities = formData.liabilities.map((liability: any) => ({
        id: liability.id?.toString() || '',
        institution: liability.institution,
        type: liability.type,
        amount: liability.amount ? parseFloat(String(liability.amount).replace(/\s/g, '')) : undefined,
        payment: liability.payment ? parseFloat(String(liability.payment).replace(/\s/g, '')) : undefined,
        balance: liability.balance ? parseFloat(String(liability.balance).replace(/\s/g, '')) : undefined,
        notes: liability.notes
      }));

      // Nemovitost
      const property = {
        address: formData.applicantProperty?.address || formData.coApplicantProperty?.address,
        price: formData.applicantProperty?.price || formData.coApplicantProperty?.price
      };

      console.log('Data připravena, volám PDFMakeService...');
      await PDFMakeService.generateClientPDF(clientData, employers, liabilities, property);
      
      toast?.showSuccess('PDF vytvořeno', 'Klientský profil byl úspěšně exportován do PDF');
    } catch (error) {
      console.error('Chyba při exportu PDF:', error);
      const err = error as any;
      toast?.showError('Chyba při vytváření PDF', err?.message || 'Neznámá chyba - zkontrolujte konzoli');
    }
  };

  const generateClientUrl = (clientId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?client=${clientId}`;
  };

  const downloadClientHtmlFile = () => {
    const client = selectedClient || currentClient;
    if (!client) {
      toast?.showError('Chyba', 'Nejsou dostupná data klienta');
      return;
    }

    const clientUrl = generateClientUrl(client.id);
    const clientName = `${client.applicant_first_name} ${client.applicant_last_name}`;
    const lastName = client.applicant_last_name || 'neznamy';
    
    // Vytvoření HTML obsahu s přesměrováním
    const htmlContent = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KostKa Úvěry - ${clientName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .logo {
            width: 64px;
            height: 64px;
            background: #3B82F6;
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 {
            color: #1F2937;
            margin: 0 0 8px;
            font-size: 28px;
            font-weight: 700;
        }
        .subtitle {
            color: #6B7280;
            margin: 0 0 32px;
            font-size: 16px;
        }
        .client-info {
            background: #F3F4F6;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .client-name {
            color: #1F2937;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px;
        }
        .client-details {
            color: #6B7280;
            font-size: 14px;
        }
        .redirect-btn {
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            margin: 16px 0;
        }
        .redirect-btn:hover {
            background: #2563EB;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        .countdown {
            color: #6B7280;
            font-size: 14px;
            margin-top: 16px;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
            color: #9CA3AF;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">K</div>
        <h1>KostKa Úvěry</h1>
        <p class="subtitle">Systém pro evidenci klientů</p>
        
        <div class="client-info">
            <div class="client-name">${clientName}</div>
            <div class="client-details">
                ${client.applicant_birth_number ? `RČ: ${client.applicant_birth_number}` : ''}
                ${client.applicant_phone ? ` • Tel: ${client.applicant_phone}` : ''}
            </div>
        </div>
        
        <a href="${clientUrl}" class="redirect-btn" id="redirectBtn">
            Zobrazit profil klienta
        </a>
        
        <div class="countdown">
            Automatické přesměrování za <span id="timer">5</span> sekund...
        </div>
        
        <div class="footer">
            Vygenerováno ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}
        </div>
    </div>

    <script>
        // Automatické přesměrování po 5 sekundách
        let countdown = 5;
        const timerElement = document.getElementById('timer');
        
        const timer = setInterval(() => {
            countdown--;
            timerElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = '${clientUrl}';
            }
        }, 1000);
        
        // Okamžité přesměrování při kliknutí na tlačítko
        document.getElementById('redirectBtn').addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timer);
            window.location.href = '${clientUrl}';
        });
    </script>
</body>
</html>`;

    // Vytvoření a stažení souboru
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kostka_${lastName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast?.showSuccess('Soubor stažen', `HTML soubor pro klienta ${clientName} byl stažen`);
  };

  // Normalizace textu (bez diakritiky, malá písmena) pro robustní vyhledávání
  const normalize = (v: string) =>
    v
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  // Funkce pro kontrolu, zda sekce obsahuje hledaný text – hledá v hodnotách i v poskytnutých popiscích
  const sectionMatchesSearch = (
    sectionData: any,
    searchTerm: string,
    labels: string[] = []
  ): boolean => {
    const term = searchTerm?.trim();
    if (!term) return true;

    const nTerm = normalize(term);

    const searchInObject = (obj: any): boolean => {
      if (obj == null) return false;
      if (typeof obj === 'string') {
        return normalize(obj).includes(nTerm);
      }
      if (typeof obj === 'number') {
        return obj.toString().includes(term);
      }
      if (typeof obj === 'boolean') {
        return false;
      }
      if (Array.isArray(obj)) {
        return obj.some((item) => searchInObject(item));
      }
      if (typeof obj === 'object') {
        return Object.values(obj).some((value) => searchInObject(value));
      }
      return false;
    };

    // shoda v datech nebo v doplňkových labelech/názvech tlačítek
    const matchInData = searchInObject(sectionData);
    const matchInLabels = labels.some((l) => normalize(l).includes(nTerm));
    return matchInData || matchInLabels;
  };

  const handleNewClient = () => {
    setCurrentClient(null);
    setFormData({
      applicant: {},
      coApplicant: {},
      applicantEmployer: {
        ico: '',
        companyName: '',
        companyAddress: '',
        netIncome: '',
        jobPosition: '',
        employedSince: '',
        contractType: '',
        contractFromDate: '',
        contractToDate: '',
        contractExtended: false
      },
      coApplicantEmployer: {
        ico: '',
        companyName: '',
        companyAddress: '',
        netIncome: '',
        jobPosition: '',
        employedSince: '',
        contractType: '',
        contractFromDate: '',
        contractToDate: '',
        contractExtended: false
      },
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
        generateClientUrl={generateClientUrl}
      />
    );
  }

  // Předvýpočet shody pro sekce – zahrnuje také popisky polí a názvy tlačítek
  const matchesApplicant = sectionMatchesSearch(formData.applicant, globalSearchTerm, [
    'Žadatel', 'Osobní údaje žadatele', 'Jméno', 'Příjmení', 'Rodné číslo', 'Datum narození', 'Věk',
    'Rodinný stav', 'Trvalé bydliště', 'Kontaktní adresa', 'Doklad totožnosti', 'Typ dokladu',
    'Číslo dokladu', 'Datum vydání', 'Platnost do', 'Telefon', 'Email', 'Banka', 'Druh bydlení',
    'Vzdělání', 'Občanství', 'Děti', 'Podnikání', 'Dokumenty', 'datum'
  ]);

  const matchesCoApplicant = sectionMatchesSearch(formData.coApplicant, globalSearchTerm, [
    'Spolužadatel', 'Osobní údaje spolužadatele', 'Jméno', 'Příjmení', 'Rodné číslo', 'Datum narození',
    'Telefon', 'Email', 'Trvalé bydliště', 'Rodinný stav', 'Doklad totožnosti', 'datum'
  ]);

  const matchesApplicantEmployer = sectionMatchesSearch(formData.applicantEmployer, globalSearchTerm, [
    'Zaměstnavatel žadatele', 'IČO', 'Název firmy', 'Adresa', 'Čistý příjem', 'Pracovní pozice',
    'Zaměstnán od', 'Typ smlouvy', 'Smlouva od', 'Smlouva do', 'Smlouva prodloužena', 'datum'
  ]);

  const matchesCoApplicantEmployer = sectionMatchesSearch(formData.coApplicantEmployer, globalSearchTerm, [
    'Zaměstnavatel spolužadatele', 'IČO', 'Název firmy', 'Adresa', 'Čistý příjem', 'Pracovní pozice',
    'Zaměstnán od', 'Typ smlouvy', 'Smlouva od', 'Smlouva do', 'Smlouva prodloužena', 'datum'
  ]);

  const matchesApplicantProperty = sectionMatchesSearch(formData.applicantProperty, globalSearchTerm, [
    'Nemovitost žadatele', 'Nemovitosti', 'Adresa', 'Kupní cena', 'Cena'
  ]);

  const matchesCoApplicantProperty = sectionMatchesSearch(formData.coApplicantProperty, globalSearchTerm, [
    'Nemovitost spolužadatele', 'Nemovitosti', 'Adresa', 'Kupní cena', 'Cena'
  ]);

  const matchesLoan = sectionMatchesSearch(formData.loan, globalSearchTerm, [
    'Úvěr', 'Půjčka', 'Banka', 'Číslo smlouvy', 'Podpis smlouvy', 'Poradce', 'Výše úvěru', 'Fixace',
    'Úroková sazba', 'Pojištění', 'Hodnota nemovitosti', 'Měsíční splátka', 'datum'
  ]);

  const matchesLiabilities = sectionMatchesSearch(formData.liabilities, globalSearchTerm, [
    'Závazky', 'Přidat závazek', 'Instituce', 'Typ', 'Výše úvěru', 'Splátka', 'Zůstatek', 'Poznámka'
  ]);

  return (
    <div className="space-y-8">
      {/* Hlavička s názvem klienta */}
      <div>
        {(() => {
          const a = (formData as any).applicant || {};
          const fullName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          return (
            <>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fullName || (selectedClient || currentClient ? 'Klient' : 'Nový klient')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {selectedClient || currentClient ? 'Úprava klienta' : (fullName ? 'Nový klient' : '')}
              </p>
            </>
          );
        })()}
      </div>

      {/* Vyhledávání a tlačítka - sticky */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Globální vyhledávání */}
          {(selectedClient || currentClient) && (
            <div className="flex flex-col flex-1 max-w-md">
              <SimpleSearch 
                onSearchChange={setGlobalSearchTerm}
                placeholder="Hledat v profilu klienta..."
                className="w-full"
              />
              {globalSearchTerm && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  🔍 Zobrazují se pouze sekce obsahující: "{globalSearchTerm}"
                </p>
              )}
            </div>
          )}
          
          {/* Tlačítka */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {onClose && (
              <button
                onClick={handleClose}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-2" />
                {saving ? 'Ukládám...' : 'Zavřít'}
              </button>
            )}
            
            {(selectedClient || currentClient) && (
              <button
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Náhled
              </button>
            )}
            
            {(selectedClient || currentClient) && (
              <button
                onClick={handleNewClient}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
              {saving ? 'Ukládám...' : 'Uložit'}
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={!selectedClient && !currentClient}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            
            <button
              onClick={downloadClientHtmlFile}
              disabled={!selectedClient && !currentClient}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Stáhnout odkaz
            </button>
          </div>
        </div>
      </div>

      {/* Rychlé odkazy na sekce - sticky */}
      <div className="sticky top-[88px] z-30 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 mb-6 shadow-sm">
        <nav className="flex flex-wrap gap-3 text-sm">
          {[
            { id: 'doklady', label: 'Doklady' },
            { id: 'podnikani', label: 'Podnikání' },
            { id: 'deti', label: 'Děti' },
            { id: 'zamestnavatel', label: 'Zaměstnavatel' },
            { id: 'nemovitost', label: 'Nemovitost' },
            { id: 'uver', label: 'Úvěr' },
            { id: 'zavazky', label: 'Závazky' }
          ].map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(link.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveFormTab('basic')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeFormTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
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
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            disabled={!selectedClient && !currentClient}
          >
            <Layers className="w-4 h-4" />
            <span>Vlastní sekce</span>
            {!selectedClient && !currentClient && (
              <span className="text-xs text-gray-400">(nejprve uložte klienta)</span>
            )}
          </button>
          <button
            onClick={() => setActiveFormTab('pdf')}
            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeFormTab === 'pdf'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Vložit PDF</span>
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      {activeFormTab === 'basic' && (
        <div className="space-y-8">
          {/* Status Progress Bar */}
          {(selectedClient || currentClient) && (
            <ClientStatusProgress
              currentStatus={formData.status}
              onChange={(newStatus: ClientStatus) => {
                setFormData({ ...formData, status: newStatus });
              }}
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Žadatel */}
            {matchesApplicant && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                    Žadatel
                  </h2>
                  <PersonalInfo 
                    data={formData.applicant}
                    onChange={(data) => setFormData((prev: any) => ({ ...prev, applicant: data }))}
                    prefix="applicant"
                    clientId={selectedClient?.id || currentClient?.id}
                    toast={toast}
                  />
                </div>
              </div>
            )}

            {/* Spolužadatel */}
            {matchesCoApplicant && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                    Spolužadatel
                  </h2>
                  <PersonalInfo 
                    data={formData.coApplicant}
                    onChange={(data) => setFormData((prev: any) => ({ ...prev, coApplicant: data }))}
                    prefix="co_applicant"
                    clientId={selectedClient?.id || currentClient?.id}
                    toast={toast}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zaměstnavatel žadatele */}
            {matchesApplicantEmployer && (
              <div id="zamestnavatel" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                  Zaměstnavatel žadatele
                </h2>
                <EmployerInfo 
                  data={formData.applicantEmployer}
                  onChange={(data) => setFormData((prev: any) => ({ ...prev, applicantEmployer: data }))}
                />
              </div>
            )}

            {/* Zaměstnavatel spolužadatele */}
            {matchesCoApplicantEmployer && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
                  Zaměstnavatel spolužadatele
                </h2>
                <EmployerInfo 
                  data={formData.coApplicantEmployer}
                  onChange={(data) => setFormData((prev: any) => ({ ...prev, coApplicantEmployer: data }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Nemovitost žadatele */}
            {matchesApplicantProperty && (
              <div id="nemovitost" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <PropertyInfo 
                  data={formData.applicantProperty}
                  onChange={(data) => setFormData((prev: any) => ({ ...prev, applicantProperty: data }))}
                  title="Nemovitost žadatele"
                />
              </div>
            )}

            {/* Nemovitost spolužadatele */}
            {matchesCoApplicantProperty && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <PropertyInfo 
                  data={formData.coApplicantProperty}
                  onChange={(data) => setFormData((prev: any) => ({ ...prev, coApplicantProperty: data }))}
                  title="Nemovitost spolužadatele"
                />
              </div>
            )}
          </div>

          {/* Úvěr/Půjčka */}
          {matchesLoan && (
            <div id="uver" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <LoanSection 
                data={formData.loan}
                onChange={(data) => setFormData((prev: any) => ({ ...prev, loan: data }))}
                propertyPrice={(formData as any).applicantProperty?.price || (formData as any).coApplicantProperty?.price}
              />
            </div>
          )}

          {/* Závazky */}
          {matchesLiabilities && (
            <div id="zavazky" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Závazky</h2>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  Přidat závazek
                </button>
              </div>
              <LiabilitiesInfo 
                data={formData.liabilities}
                onChange={(data) => setFormData((prev: any) => ({ ...prev, liabilities: data }))}
                clientId={selectedClient?.id || currentClient?.id}
                toast={toast}
              />
            </div>
          )}
          
          {/* Zpráva, když žádná sekce neodpovídá vyhledávání */}
          {globalSearchTerm &&
            !matchesApplicant &&
            !matchesCoApplicant &&
            !matchesApplicantEmployer &&
            !matchesCoApplicantEmployer &&
            !matchesApplicantProperty &&
            !matchesCoApplicantProperty &&
            !matchesLoan &&
            !matchesLiabilities && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Eye className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Žádné výsledky
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Pro hledaný výraz "{globalSearchTerm}" nebyla nalezena žádná data.
              </p>
            </div>
          )}
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
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Vlastní sekce nejsou dostupné</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Nejprve uložte základní údaje klienta, poté budete moci přidat vlastní sekce
              </p>
              <button
                onClick={() => setActiveFormTab('basic')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Přejít na základní údaje
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Upload Tab */}
      {activeFormTab === 'pdf' && (
        <div className="space-y-8">
          <PdfUpload
            onDataExtracted={(data) => {
              // Aplikuj extrahovaná data do formuláře
      if (data.applicant) {
                setFormData((prev: typeof formData) => ({
                  ...prev,
                  applicant: {
                    ...prev.applicant,
        ...data.applicant,
        birthNumber: data.applicant?.birthNumber || prev.applicant.birthNumber,
        netIncome3m: data.applicant?.netIncome3m || prev.applicant.netIncome3m,
  netIncome12m: data.applicant?.netIncome12m || prev.applicant.netIncome12m,
  children: data.applicant?.children?.length ? data.applicant.children : prev.applicant.children
                  }
                }));
              }
              if (data.coApplicant) {
                setFormData((prev: typeof formData) => ({
                  ...prev,
                  coApplicant: {
                    ...prev.coApplicant,
        ...data.coApplicant,
        birthNumber: data.coApplicant?.birthNumber || prev.coApplicant.birthNumber,
        netIncome3m: data.coApplicant?.netIncome3m || prev.coApplicant.netIncome3m,
  netIncome12m: data.coApplicant?.netIncome12m || prev.coApplicant.netIncome12m
                  }
                }));
              }
              if (data.loan) {
                setFormData((prev: typeof formData) => ({
                  ...prev,
                  loan: {
                    ...prev.loan,
        ...data.loan,
        loanAmount: data.loan?.amount || prev.loan.loanAmount,
        propertyValue: data.loan?.propertyValue || prev.loan.propertyValue,
        purpose: data.loan?.purpose || prev.loan.purpose,
        bank: data.loan?.bank || prev.loan.bank
                  }
                }));
              }
              if (data.property) {
                setFormData((prev: typeof formData) => ({
                  ...prev,
                  applicantProperty: {
                    ...prev.applicantProperty,
                    address: data.property?.address || prev.applicantProperty.address,
                    price: data.property?.price || prev.applicantProperty.price
                  },
                  // Pokud už žadatel má nemovitost a chceme druhou, lze upravit logiku – zatím primárně applicantProperty
                }));
              }
              toast?.showSuccess('Data extrahována', 'Data z PDF byla úspěšně načtena do formuláře');
            }}
            onError={(error) => {
              toast?.showError('Chyba při zpracování PDF', error);
            }}
          />
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
  generateClientUrl: (clientId: string) => string;
}

const ClientPreview: React.FC<ClientPreviewProps> = ({ 
  client, 
  formData, 
  onEdit, 
  onClose, 
  onExportPDF,
  generateClientUrl
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Náhled klienta</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {formData.applicant.firstName} {formData.applicant.lastName}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Zavřít
            </button>
          )}
          
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Upravit
          </button>
          
          <button
            onClick={onExportPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          
          <button
            onClick={() => {
              if (client) {
                const clientUrl = generateClientUrl(client.id);
                const clientName = `${client.applicant_first_name} ${client.applicant_last_name}`;
                const lastName = client.applicant_last_name || 'neznamy';
                
                // Stejná logika jako v downloadClientHtmlFile
                const htmlContent = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KostKa Úvěry - ${clientName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .logo {
            width: 64px;
            height: 64px;
            background: #3B82F6;
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 {
            color: #1F2937;
            margin: 0 0 8px;
            font-size: 28px;
            font-weight: 700;
        }
        .subtitle {
            color: #6B7280;
            margin: 0 0 32px;
            font-size: 16px;
        }
        .client-info {
            background: #F3F4F6;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .client-name {
            color: #1F2937;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px;
        }
        .client-details {
            color: #6B7280;
            font-size: 14px;
        }
        .redirect-btn {
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            margin: 16px 0;
        }
        .redirect-btn:hover {
            background: #2563EB;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        .countdown {
            color: #6B7280;
            font-size: 14px;
            margin-top: 16px;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
            color: #9CA3AF;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">K</div>
        <h1>KostKa Úvěry</h1>
        <p class="subtitle">Systém pro evidenci klientů</p>
        
        <div class="client-info">
            <div class="client-name">${clientName}</div>
            <div class="client-details">
                ${client.applicant_birth_number ? `RČ: ${client.applicant_birth_number}` : ''}
                ${client.applicant_phone ? ` • Tel: ${client.applicant_phone}` : ''}
            </div>
        </div>
        
        <a href="${clientUrl}" class="redirect-btn" id="redirectBtn">
            Zobrazit profil klienta
        </a>
        
        <div class="countdown">
            Automatické přesměrování za <span id="timer">5</span> sekund...
        </div>
        
        <div class="footer">
            Vygenerováno ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}
        </div>
    </div>

    <script>
        // Automatické přesměrování po 5 sekundách
        let countdown = 5;
        const timerElement = document.getElementById('timer');
        
        const timer = setInterval(() => {
            countdown--;
            timerElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = '${clientUrl}';
            }
        }, 1000);
        
        // Okamžité přesměrování při kliknutí na tlačítko
        document.getElementById('redirectBtn').addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timer);
            window.location.href = '${clientUrl}';
        });
    </script>
</body>
</html>`;

                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `kostka_${lastName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Stáhnout odkaz
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Žadatel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Žadatel
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Jméno:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.title} {formData.applicant.firstName} {formData.applicant.lastName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rodné číslo:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.birthNumber || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Věk:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.age ? `${formData.applicant.age} let` : 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rodinný stav:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.maritalStatus || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Trvalé bydliště:</span>
              <p className="text-gray-900 dark:text-white">{formData.applicant.permanentAddress || 'Neuvedeno'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.phone || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicant.email || 'Neuvedeno'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Banka:</span>
              <p className="text-gray-900 dark:text-white">{formData.applicant.bank || 'Neuvedeno'}</p>
            </div>
          </div>
        </div>

        {/* Spolužadatel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Spolužadatel
          </h2>
          {formData.coApplicant.firstName ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Jméno:</span>
                  <p className="text-gray-900 dark:text-white">{formData.coApplicant.title} {formData.coApplicant.firstName} {formData.coApplicant.lastName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rodné číslo:</span>
                  <p className="text-gray-900 dark:text-white">{formData.coApplicant.birthNumber || 'Neuvedeno'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon:</span>
                  <p className="text-gray-900 dark:text-white">{formData.coApplicant.phone || 'Neuvedeno'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <p className="text-gray-900 dark:text-white">{formData.coApplicant.email || 'Neuvedeno'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Spolužadatel nebyl zadán</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zaměstnavatel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Zaměstnavatel žadatele
          </h2>
          {formData.applicantEmployer.companyName ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Název firmy:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicantEmployer.companyName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">IČO:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicantEmployer.ico || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresa:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicantEmployer.companyAddress || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Čistý příjem:</span>
                <p className="text-gray-900 dark:text-white">{formData.applicantEmployer.netIncome ? formatPrice(formData.applicantEmployer.netIncome) : 'Neuvedeno'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Zaměstnavatel nebyl zadán</p>
          )}
        </div>

        {/* Zaměstnavatel spolužadatele */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Zaměstnavatel spolužadatele
          </h2>
          {formData.coApplicantEmployer.companyName ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Název firmy:</span>
                <p className="text-gray-900 dark:text-white">{formData.coApplicantEmployer.companyName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">IČO:</span>
                <p className="text-gray-900 dark:text-white">{formData.coApplicantEmployer.ico || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresa:</span>
                <p className="text-gray-900 dark:text-white">{formData.coApplicantEmployer.companyAddress || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Čistý příjem:</span>
                <p className="text-gray-900 dark:text-white">{formData.coApplicantEmployer.netIncome ? formatPrice(formData.coApplicantEmployer.netIncome) : 'Neuvedeno'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Zaměstnavatel nebyl zadán</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nemovitost */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Nemovitosti
          </h2>
          {(formData.applicantProperty.address || formData.coApplicantProperty.address) ? (
            <div className="space-y-4">
              {formData.applicantProperty.address && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">Nemovitost žadatele</h4>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresa:</span>
                    <p className="text-gray-900 dark:text-white">{formData.applicantProperty.address}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Kupní cena:</span>
                    <p className="text-lg font-semibold text-green-600">
                      {formData.applicantProperty.price ? formatPrice(formData.applicantProperty.price) : 'Neuvedeno'}
                    </p>
                  </div>
                </div>
              )}
              
              {formData.coApplicantProperty.address && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 dark:text-green-400 mb-2">Nemovitost spolužadatele</h4>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresa:</span>
                    <p className="text-gray-900 dark:text-white">{formData.coApplicantProperty.address}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Kupní cena:</span>
                    <p className="text-lg font-semibold text-green-600">
                      {formData.coApplicantProperty.price ? formatPrice(formData.coApplicantProperty.price) : 'Neuvedeno'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Nemovitosti nebyly zadány</p>
          )}
        </div>

        {/* Úvěr */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Úvěr
          </h2>
          {formData.loan.bank ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Banka:</span>
                <p className="text-gray-900 dark:text-white">{formData.loan.bank}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Číslo smlouvy:</span>
                <p className="text-gray-900 dark:text-white">{formData.loan.contractNumber || 'Neuvedeno'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Výše úvěru:</span>
                <p className="text-lg font-semibold text-green-600">
                  {formData.loan.loanAmount ? formatPrice(formData.loan.loanAmount) : 'Neuvedeno'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Měsíční splátka:</span>
                <p className="text-gray-900 font-semibold">
                  {formData.loan.monthlyPayment ? formatPrice(formData.loan.monthlyPayment) : 'Neuvedeno'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Úvěr nebyl zadán</p>
          )}
        </div>
      </div>

      {/* Závazky */}
      {formData.liabilities && formData.liabilities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Závazky
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Instituce
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Výše úvěru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Splátka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Zůstatek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Poznámka
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {formData.liabilities.map((liability: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {liability.institution || 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {liability.type || 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {liability.amount ? formatPrice(liability.amount) : 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {liability.payment ? formatPrice(liability.payment) : 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {liability.balance ? formatPrice(liability.balance) : 'Neuvedeno'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {liability.poznamky || 'Žádná poznámka'}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-3">
            Děti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.applicant.children && formData.applicant.children.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Děti žadatele</h3>
                <div className="space-y-2">
                  {formData.applicant.children.map((child: any, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-900 dark:text-blue-400">{child.name}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
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
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Děti spolužadatele</h3>
                <div className="space-y-2">
                  {formData.coApplicant.children.map((child: any, index: number) => (
                    <div key={index} className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-900 dark:text-green-400">{child.name}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
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