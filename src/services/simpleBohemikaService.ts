import { PDFMakeService } from './pdfMakeService';

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

export class SimpleBohemikaService {
  static async generateBohemikaForm(
    client: ClientData,
    loan: LoanData = {}
  ): Promise<void> {
    // Pro nyní použijeme existující PDFMakeService jako základ
    // později můžeme implementovat speciální Bohemika layout
    
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    
    // Vytvoříme jednoduchý dokument s Bohemika informacemi
    const bohemikaClient = {
      ...client,
      // Přidáme dodatečné informace pro Bohemika formulář
      applicant_title: '',
      applicant_age: undefined,
      applicant_marital_status: '',
      applicant_housing_type: '',
      co_applicant_first_name: '',
      co_applicant_last_name: '',
      created_at: new Date().toISOString()
    };

    // Vytvoříme prázdné pole pro zaměstnavatele, závazky a nemovitost
    const employers: any[] = [];
    const liabilities: any[] = [];
    const property = {
      address: '',
      price: loan.amount || 0
    };

    // Použijeme existující PDFMakeService
    await PDFMakeService.generateClientPDF(bohemikaClient, employers, liabilities, property);
  }
}
