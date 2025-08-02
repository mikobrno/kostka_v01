import React from 'react';
import { FileDown } from 'lucide-react';

export const PDFTestButton: React.FC = () => {
  const handleTestPDF = async () => {
    try {
      // Lazy loading HybridPDFService - používá jsPDF s lepší podporou fontů
      const { HybridPDFService } = await import('../services/hybridPDFService');
      
      // Test data s českou diakritikou
      const testClient = {
        applicant_title: 'Ing.',
        applicant_first_name: 'Jan',
        applicant_last_name: 'Novák',
        applicant_maiden_name: 'Svobodová',
        applicant_birth_number: '850315/1234',
        applicant_birth_date: '1985-03-15',
        applicant_age: 39,
        applicant_marital_status: 'ženatý/vdaná',
        applicant_permanent_address: 'Václavské náměstí 123, 110 00 Praha 1',
        applicant_contact_address: 'Wenceslas Square 123, 110 00 Prague 1',
        applicant_phone: '+420 123 456 789',
        applicant_email: 'jan.novak@email.cz',
        applicant_housing_type: 'vlastní byt',
        created_at: new Date().toISOString(),
        id: 'test-123'
      };

      const testEmployers = [
        {
          id: 'emp-1',
          ico: '12345678',
          company_name: 'Česká spořitelna, a.s.',
          company_address: 'Olbrachtova 1929/62, 140 00 Praha 4',
          net_income: 45000,
          job_position: 'senior vývojář',
          employed_since: '2020-01-15',
          contract_type: 'hlavní pracovní poměr',
          employer_type: 'applicant' as const
        }
      ];

      const testLiabilities = [
        {
          id: 'liability-1',
          institution: 'Česká spořitelna',
          type: 'hypotéka na bydlení',
          amount: 2500000,
          payment: 12500,
          balance: 2100000,
          notes: 'Standardní hypotéka na nemovitost v Praze'
        },
        {
          id: 'liability-2',
          institution: 'ČSOB',
          type: 'spotřebitelský úvěr',
          amount: 150000,
          payment: 3500,
          balance: 85000,
          notes: 'Úvěr na renovaci bytu'
        }
      ];

      const testProperty = {
        address: 'Národní třída 456, 110 00 Praha 1',
        price: 8500000
      };

      await HybridPDFService.generateClientPDF(testClient, testEmployers, testLiabilities, testProperty);
      
      alert('✅ PDF test s pdfMake úspěšný! Soubor byl stažen.');
    } catch (error) {
      console.error('Chyba při testu PDF:', error);
      alert('❌ Chyba při generování PDF: ' + (error instanceof Error ? error.message : 'Neznámá chyba'));
    }
  };

  return (
    <button
      onClick={handleTestPDF}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
    >
      <FileDown className="w-4 h-4 mr-2" />
      Test PDF generování
    </button>
  );
};
