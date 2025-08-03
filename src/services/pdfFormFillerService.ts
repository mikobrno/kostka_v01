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
      // Připravíme data pro vyplnění PDF formuláře podle skutečných názvů polí
      const formData = {
        // Klient sekce - podle skutečných názvů z PDF debug výstupu
        'fill_11': `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim(),
        'fill_12': client.applicant_birth_number || '',
        'Adresa': client.applicant_permanent_address || '',
        'Telefon': client.applicant_phone || '',
        'email': client.applicant_email || '',
        
        // Zpracovatel (pevné údaje)
        'fill_16': 'Ing. Milan Kost',
        'fill_17': '8680020061',
        
        // Úvěr sekce
        'Produkt': loan.product || '',
        'fill_21': this.formatCurrency(loan.amount),
        'fill_22': this.formatCurrency(loan.amount), // Suma zajištění = částka úvěru
        'LTV': loan.ltv ? `${loan.ltv}%` : '',
        'fill_24': loan.purpose || '', // Účel úvěru
        'fill_25': this.formatCurrency(loan.monthly_payment), // Měsíční splátka
        'fill_26': this.formatDate(loan.contract_date), // Datum podpisu úvěru
        
        // Číslo smlouvy a datum
        'fill_10': `SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        'dne': new Date().toLocaleDateString('cs-CZ'),
        'V': 'Brno'
      };

      console.log('📋 Volám JavaScript PDF form filler s daty:', formData);
      
      // Nejdříve načteme template z public složky
      const templateResponse = await fetch('/bohemika_template.pdf');
      if (!templateResponse.ok) {
        throw new Error(`Template nedostupný: ${templateResponse.status}`);
      }
      
      // Převedeme template na base64
      const templateBlob = await templateResponse.blob();
      const templateArrayBuffer = await templateBlob.arrayBuffer();
      const templateBase64 = btoa(String.fromCharCode(...new Uint8Array(templateArrayBuffer)));
      
      // Přidáme template k form datům
      const requestData = {
        ...formData,
        templateBase64
      };
      
      // Zavoláme novou JavaScript Netlify funkci pro vyplnění PDF template
      const response = await fetch('/.netlify/functions/fill-pdf-js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
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
      a.download = `bohemika_${formData.fill_11.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Vyplněný PDF template úspěšně stažen!');

    } catch (error: unknown) {
      console.error('Chyba při vyplňování PDF template:', error);
      
      // Fallback informace
      alert(`❌ PDF template není dostupný.\n\nPro správné fungování potřebujete:\n1. Nahrát PDF šablonu do public/bohemika_template.pdf\n2. PDF musí mít vyplnitelná pole s názvy:\n   - fill_1 (jméno a příjmení)\n   - fill_2 (rodné číslo)\n   - Adresa\n   - Telefon\n   - email\n   - fill_16 (zpracovatel)\n   - atd.\n\n💡 Zkontrolujte názvy polí v PDF template.`);
      
      throw error;
    }
  }
}
