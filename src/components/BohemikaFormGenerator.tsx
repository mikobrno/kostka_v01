import React, { useState, useEffect } from 'react';
import { ClientService } from '../services/clientService';
import { PDFFormFillerService } from '../services/pdfFormFillerService';
import { PDFTemplateService } from '../services/pdfTemplateService';

interface ClientData {
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_birth_number?: string;
  applicant_permanent_address?: string;
  applicant_phone?: string;
  applicant_email?: string;
  id?: string;
}

interface LoanData {
  product?: string;
  amount?: number;
  ltv?: number;
  purpose?: string;
  monthly_payment?: number;
  contract_date?: string;
}

interface BohemikaFormGeneratorProps {
  selectedClientId?: string;
  toast?: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

const BohemikaFormGenerator: React.FC<BohemikaFormGeneratorProps> = ({ 
  selectedClientId,
  toast 
}) => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [client, setClient] = useState<ClientData>({
    applicant_first_name: '',
    applicant_last_name: '',
    applicant_birth_number: '',
    applicant_permanent_address: '',
    applicant_phone: '',
    applicant_email: ''
  });

  const [loan, setLoan] = useState<LoanData>({
    product: '',
    amount: 0,
    ltv: 0,
    purpose: '',
    monthly_payment: 0,
    contract_date: ''
  });

  // Načtení seznamu klientů
  useEffect(() => {
    const loadClientsOnMount = async () => {
      try {
        setLoading(true);
        const { data, error } = await ClientService.getClients();
        if (error) {
          toast?.error('Chyba při načítání klientů: ' + error.message);
          return;
        }
        if (data) {
          setClients(data);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast?.error('Nastala chyba při načítání klientů');
      } finally {
        setLoading(false);
      }
    };
    loadClientsOnMount();
  }, [toast]);

  // Předvyplnění dat při výběru klienta
  useEffect(() => {
    if (selectedClientId) {
      const foundClient = clients.find(c => c.id === selectedClientId);
      if (foundClient) {
        setSelectedClient(foundClient);
        setClient(foundClient);
      }
    }
  }, [selectedClientId, clients]);

  const handleClientSelect = (clientId: string) => {
    const foundClient = clients.find(c => c.id === clientId);
    if (foundClient) {
      setSelectedClient(foundClient);
      setClient({
        applicant_first_name: foundClient.applicant_first_name,
        applicant_last_name: foundClient.applicant_last_name,
        applicant_birth_number: foundClient.applicant_birth_number,
        applicant_permanent_address: foundClient.applicant_permanent_address,
        applicant_phone: foundClient.applicant_phone,
        applicant_email: foundClient.applicant_email,
        id: foundClient.id
      });
      toast?.success(`Načteny údaje klienta: ${foundClient.applicant_first_name} ${foundClient.applicant_last_name}`);
    }
  };

  const handleClientChange = (field: keyof ClientData, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
  };

  const handleLoanChange = (field: keyof LoanData, value: string | number) => {
    setLoan(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = async () => {
    try {
      if (!client || !loan) {
        toast?.error('Nejsou vybrána data klienta nebo úvěru');
        return;
      }

      // Použijeme PDF form filler service
      await PDFFormFillerService.fillBohemikaForm(client, loan);
      
      toast?.success('PDF úspěšně vygenerováno a staženo!');
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      
      // Fallback - zobrazíme data klienta
      const clientName = `${client?.applicant_first_name} ${client?.applicant_last_name}`;
      const loanInfo = `Produkt: ${loan?.product}, Výše: ${loan?.amount} Kč`;
      
      alert(`Bohemika formulář pro:\n${clientName}\n${loanInfo}\n\nChyba při PDF generování: ${error}\n\nZkontrolujte, zda je nahrán PDF template v public/bohemika_template.pdf`);
      
      toast?.error('Chyba při generování PDF - zkontrolujte konzoli pro detaily');
    }
  };

  const createPDFTemplate = async () => {
    try {
      await PDFTemplateService.saveBohemikaTemplate();
      toast?.success('PDF template vytvořen! Nahrajte ho do složky public/');
    } catch (error) {
      console.error('Chyba při vytváření template:', error);
      toast?.error('Chyba při vytváření PDF template');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Bohemika - Průvodní list k úvěru</h2>
      
      {/* Výběr klienta */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Výběr klienta</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vyberte klienta ze seznamu
            </label>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              title="Vyberte klienta ze seznamu"
            >
              <option value="">-- Vyberte klienta nebo vyplňte ručně --</option>
              {clients.map((clientOption) => (
                <option key={clientOption.id} value={clientOption.id}>
                  {clientOption.applicant_first_name} {clientOption.applicant_last_name}
                  {clientOption.applicant_birth_number && ` (${clientOption.applicant_birth_number})`}
                </option>
              ))}
            </select>
            {loading && (
              <p className="text-sm text-gray-500 mt-1">Načítám klienty...</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Klient sekce */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Údaje o klientovi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jméno
            </label>
            <input
              type="text"
              value={client.applicant_first_name || ''}
              onChange={(e) => handleClientChange('applicant_first_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Zadejte jméno"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Příjmení
            </label>
            <input
              type="text"
              value={client.applicant_last_name || ''}
              onChange={(e) => handleClientChange('applicant_last_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Zadejte příjmení"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rodné číslo
            </label>
            <input
              type="text"
              value={client.applicant_birth_number || ''}
              onChange={(e) => handleClientChange('applicant_birth_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456/7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="text"
              value={client.applicant_phone || ''}
              onChange={(e) => handleClientChange('applicant_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+420 123 456 789"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresa
            </label>
            <input
              type="text"
              value={client.applicant_permanent_address || ''}
              onChange={(e) => handleClientChange('applicant_permanent_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ulice 123, 12345 Město"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={client.applicant_email || ''}
              onChange={(e) => handleClientChange('applicant_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>

      {/* Úvěr sekce */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Údaje o úvěru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produkt
            </label>
            <input
              type="text"
              value={loan.product || ''}
              onChange={(e) => handleLoanChange('product', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Např. Hypoteční úvěr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Výše úvěru (Kč)
            </label>
            <input
              type="number"
              value={loan.amount || ''}
              onChange={(e) => handleLoanChange('amount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LTV (%)
            </label>
            <input
              type="number"
              value={loan.ltv || ''}
              onChange={(e) => handleLoanChange('ltv', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="80"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Měsíční splátka (Kč)
            </label>
            <input
              type="number"
              value={loan.monthly_payment || ''}
              onChange={(e) => handleLoanChange('monthly_payment', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Účel úvěru
            </label>
            <input
              type="text"
              value={loan.purpose || ''}
              onChange={(e) => handleLoanChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nákup nemovitosti"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum podpisu úvěru
            </label>
            <input
              type="date"
              value={loan.contract_date || ''}
              onChange={(e) => handleLoanChange('contract_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Vyberte datum podpisu úvěru"
            />
          </div>
        </div>
      </div>

      {/* Tlačítka pro generování */}
      <div className="text-center space-y-4">
        <button
          onClick={generatePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          Vygenerovat Průvodní list PDF
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Pokud nemáte PDF template:</p>
          <button
            onClick={createPDFTemplate}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out"
          >
            Vytvořit PDF Template
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600 text-center">
        <p>Formulář bude vygenerován ve formátu odpovídajícím oficiálnímu průvodnímu listu Bohemika.</p>
      </div>
    </div>
  );
};

export default BohemikaFormGenerator;
