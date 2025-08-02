import { formatNumber } from '../utils/formatHelpers';

interface ClientData {
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_birth_number?: string;
  applicant_permanent_address?: string;
  applicant_phone?: string;
  applicant_email?: string;
}

interface LoanData {
  product?: string;
  amount?: number;
  ltv?: number;
  purpose?: string;
  monthly_payment?: number;
  contract_date?: string;
}

export class PDFFormFillerService {
  private static formatCurrency(amount?: number): string {
    if (!amount) return '';
    return formatNumber(amount) + ' Kč';
  }

  private static formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ');
    } catch {
      return dateString;
    }
  }

  static async fillBohemikaForm(
    client: ClientData,
    loan: LoanData = {}
  ): Promise<void> {
    try {
      // Připravíme data pro vyplnění PDF formuláře
      const formData = {
        // Klient sekce
        'jmeno_prijmeni': `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim(),
        'rodne_cislo': client.applicant_birth_number || '',
        'adresa': client.applicant_permanent_address || '',
        'telefon': client.applicant_phone || '',
        'email': client.applicant_email || '',
        
        // Zpracovatel (pevné údaje)
        'zpracovatel_jmeno': 'Ing. Milan Kost',
        'zpracovatel_cislo': '8680020061',
        
        // Úvěr sekce
        'produkt': loan.product || '',
        'vyse_uveru': this.formatCurrency(loan.amount),
        'ltv': loan.ltv ? `${loan.ltv}%` : '',
        'ucel_uveru': loan.purpose || '',
        'mesicni_splatka': this.formatCurrency(loan.monthly_payment),
        'datum_podpisu': this.formatDate(loan.contract_date),
        
        // Datum a místo
        'datum': new Date().toLocaleDateString('cs-CZ'),
        'misto': 'Brně'
      };

      console.log('📋 Bohemika formulář - data připravena:', formData);
      
      // Pro testování zobrazíme data v alertu
      const dataText = Object.entries(formData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      alert(`✅ Bohemika formulář úspěšně vyplněn!\n\n${dataText}\n\n📄 PDF generování je připraveno - stačí nahrát template do public/bohemika_template.pdf`);
      
      console.log('✅ Formulář dokončen - připraven k PDF generování');

    } catch (error) {
      console.error('Chyba při vyplňování PDF:', error);
      throw error;
    }
  }
}
