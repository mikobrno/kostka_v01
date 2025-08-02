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
        'zpracovatel_telefon': '608 123 456',
        'zpracovatel_email': 'milan.kost@bohemika.cz',
        
        // Úvěr sekce
        'castka_uveru': this.formatCurrency(loan.amount),
        'ucel_uveru': loan.purpose || '',
        'splatnost': loan.ltv ? `${loan.ltv} let` : '',
        'typ_nemovitosti': 'Rodinný dům',
        'poznamky': `Produkt: ${loan.product || ''}\nMěsíční splátka: ${this.formatCurrency(loan.monthly_payment)}\nDatum podpisu: ${this.formatDate(loan.contract_date)}`,
        
        // Datum
        'datum': new Date().toLocaleDateString('cs-CZ')
      };

      console.log('📋 Volám PDF form filler s daty:', formData);
      
      // Zavoláme Netlify funkci pro vyplnění PDF template
      const response = await fetch('/.netlify/functions/fill-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generování selhalo: ${response.status} - ${errorText}`);
      }

      // Stáhneme vyplněný PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bohemika_${formData.jmeno_prijmeni.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Vyplněný PDF template úspěšně stažen!');

    } catch (error: unknown) {
      console.error('Chyba při vyplňování PDF template:', error);
      
      // Fallback informace
      alert(`❌ PDF template není dostupný.\n\nPro správné fungování potřebujete:\n1. Nahrát PDF šablonu do public/bohemika_template.pdf\n2. PDF musí mít vyplnitelná pole s názvy:\n   - jmeno_prijmeni\n   - rodne_cislo\n   - adresa\n   - telefon\n   - email\n   - zpracovatel_jmeno\n   - atd.\n\n💡 Můžete použít náš HTML template (bohemika_form_template.html) pro vytvoření PDF s vyplnitelnými poli.`);
      
      throw error;
    }
  }
}
