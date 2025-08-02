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

  private static createSimplePdf(formData: Record<string, string>): string {
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 400
>>
stream
BT
/F1 16 Tf
50 750 Td
(BOHEMIKA - Pruvodny list k uveru) Tj
0 -40 Td
/F1 12 Tf
(Jmeno: ${formData.jmeno_prijmeni}) Tj
0 -20 Td
(Rodne cislo: ${formData.rodne_cislo}) Tj
0 -20 Td
(Adresa: ${formData.adresa}) Tj
0 -20 Td
(Telefon: ${formData.telefon}) Tj
0 -20 Td
(Email: ${formData.email}) Tj
0 -30 Td
(Zpracovatel: ${formData.zpracovatel_jmeno}) Tj
0 -30 Td
(Vyse uveru: ${formData.vyse_uveru}) Tj
0 -20 Td
(Ucel: ${formData.ucel_uveru}) Tj
0 -20 Td
(Datum: ${formData.datum}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000700 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
760
%%EOF`;
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
      
      // Vytvoříme jednoduché PDF s daty
      const pdfContent = this.createSimplePdf(formData);
      
      // Převedeme na blob a stáhneme
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bohemika_${formData.jmeno_prijmeni.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ PDF úspěšně stažen!');

    } catch (error: unknown) {
      console.error('Chyba při vyplňování PDF:', error);
      throw error;
    }
  }
}
