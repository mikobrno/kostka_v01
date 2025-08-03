import { PDFDocument } from 'pdf-lib';

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
  ): Promise<Uint8Array> {
    try {
      // Načteme template PDF
      const templatePath = '/bohemika_template.pdf';
      const response = await fetch(templatePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      
      const existingPdfBytes = await response.arrayBuffer();
      
      // Načteme PDF dokument
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      const form = pdfDoc.getForm();
      
      // Mapování dat na pole formuláře (podle Python scriptu)
      const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
      
      const formData = {
        'fill_11': clientName,
        'fill_12': client.applicant_birth_number || '',
        'Adresa': client.applicant_permanent_address || '',
        'Telefon': client.applicant_phone || '',
        'email': client.applicant_email || '',
        'fill_16': 'Ing. Milan Kost', // Zpracovatel
        'fill_17': '8680020061', // IČO zpracovatele
        'Produkt': loan.product || 'Např. Hypoteční úvěr',
        'fill_21': loan.amount ? `${loan.amount} Kč` : '',
        'fill_22': loan.amount ? `${loan.amount} Kč` : '',
        'LTV': loan.ltv ? `${loan.ltv}%` : '',
        'fill_24': loan.purpose || 'Nákup nemovitosti',
        'fill_25': loan.monthly_payment ? `${loan.monthly_payment} Kč` : '',
        'V': 'Brno',
        'dne': loan.contract_date || new Date().toLocaleDateString('cs-CZ')
      };
      
      // Vyplníme pole formuláře
      for (const [fieldName, value] of Object.entries(formData)) {
        if (value) {
          try {
            const field = form.getField(fieldName);
            if (field) {
              // Zkusíme různé typy polí
              if ('setText' in field) {
                (field as any).setText(value);
                console.log(`Filled field '${fieldName}' with value '${value}'`);
              } else if ('select' in field) {
                (field as any).select(value);
                console.log(`Selected field '${fieldName}' with value '${value}'`);
              }
            }
          } catch (error) {
            console.warn(`Could not fill field '${fieldName}':`, error);
          }
        }
      }
      
      // Vygenerujeme PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      console.error('Error generating Bohemika PDF:', error);
      throw error;
    }
  }

  static async downloadBohemikaForm(
    client: ClientData,
    loan: LoanData = {}
  ): Promise<void> {
    try {
      const pdfBytes = await this.generateBohemikaForm(client, loan);
      
      // Vytvoříme blob a spustíme download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bohemika_pruvodny_list.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Bohemika PDF:', error);
      throw error;
    }
  }
}
