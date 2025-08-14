import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

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
  contract_number?: string;
  advisor_name?: string;
  advisor_agency_number?: string;
}

export class SimpleBohemikaService {
  // Funkce pro odstranění diakritiky
  private static removeDiacritics(text: string): string {
    const diacriticMap: { [key: string]: string } = {
      'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
      'č': 'c', 'ć': 'c', 'ĉ': 'c', 'ċ': 'c', 'ç': 'c',
      'ď': 'd', 'đ': 'd',
      'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'ĕ': 'e', 'ė': 'e', 'ę': 'e', 'ě': 'e',
      'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i', 'ĭ': 'i', 'į': 'i',
      'ĺ': 'l', 'ľ': 'l', 'ł': 'l',
      'ň': 'n', 'ń': 'n', 'ñ': 'n', 'ņ': 'n',
      'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ŏ': 'o', 'ő': 'o', 'ø': 'o',
      'ř': 'r', 'ŕ': 'r',
      'š': 's', 'ś': 's', 'ŝ': 's', 'ş': 's', 'ș': 's',
      'ť': 't', 'ţ': 't', 'ț': 't',
      'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ŭ': 'u', 'ů': 'u', 'ű': 'u', 'ų': 'u',
      'ý': 'y', 'ỳ': 'y', 'ÿ': 'y', 'ŷ': 'y',
      'ž': 'z', 'ź': 'z', 'ż': 'z',
      'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ā': 'A', 'Ă': 'A', 'Ą': 'A',
      'Č': 'C', 'Ć': 'C', 'Ĉ': 'C', 'Ċ': 'C', 'Ç': 'C',
      'Ď': 'D', 'Đ': 'D',
      'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Ē': 'E', 'Ĕ': 'E', 'Ė': 'E', 'Ę': 'E', 'Ě': 'E',
      'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I', 'Ī': 'I', 'Ĭ': 'I', 'Į': 'I',
      'Ĺ': 'L', 'Ľ': 'L', 'Ł': 'L',
      'Ň': 'N', 'Ń': 'N', 'Ñ': 'N', 'Ņ': 'N',
      'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Ō': 'O', 'Ŏ': 'O', 'Ő': 'O', 'Ø': 'O',
      'Ř': 'R', 'Ŕ': 'R',
      'Š': 'S', 'Ś': 'S', 'Ŝ': 'S', 'Ş': 'S', 'Ș': 'S',
      'Ť': 'T', 'Ţ': 'T', 'Ț': 'T',
      'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ū': 'U', 'Ŭ': 'U', 'Ů': 'U', 'Ű': 'U', 'Ų': 'U',
      'Ý': 'Y', 'Ỳ': 'Y', 'Ÿ': 'Y', 'Ŷ': 'Y',
      'Ž': 'Z', 'Ź': 'Z', 'Ż': 'Z'
    };

    return text.replace(/[^\u0000-\u007F]/g, (char) => {
      return diacriticMap[char] || char;
    });
  }

  // Bezpečná metoda pro vyplnění pole
  private static safeSetText(form: any, fieldName: string, value: string | undefined | null, font?: PDFFont): void {
    if (!value) return;
    
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        // Odstranění diakritiky pro lepší kompatibilitu
        const cleanValue = this.removeDiacritics(value.toString());
        
        if (font) {
          field.setFontAndSize(font, 10);
        }
        field.setText(cleanValue);
        field.enableReadOnly();
      }
    } catch (error) {
      console.warn(`Chyba při vyplňování pole ${fieldName}:`, error);
    }
  }

  public static async generatePDF(clientData: ClientData, loanData: LoanData): Promise<Uint8Array> {
    try {
      // Načtení PDF šablony
      const templateResponse = await fetch('/bohemika_template.pdf');
      if (!templateResponse.ok) {
        throw new Error(`Nepodařilo se načíst šablonu: ${templateResponse.status}`);
      }
      
      const templateBytes = await templateResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Použití standardního fontu Helvetica
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const form = pdfDoc.getForm();
      
      // Vyplnění základních údajů o klientovi
      this.safeSetText(form, 'applicant_first_name', clientData.applicant_first_name, font);
      this.safeSetText(form, 'applicant_last_name', clientData.applicant_last_name, font);
      this.safeSetText(form, 'applicant_birth_number', clientData.applicant_birth_number, font);
      this.safeSetText(form, 'applicant_permanent_address', clientData.applicant_permanent_address, font);
      this.safeSetText(form, 'applicant_phone', clientData.applicant_phone, font);
      this.safeSetText(form, 'applicant_email', clientData.applicant_email, font);
      
      // Vyplnění údajů o úvěru
      this.safeSetText(form, 'product', loanData.product, font);
      this.safeSetText(form, 'amount', loanData.amount?.toString(), font);
      this.safeSetText(form, 'ltv', loanData.ltv?.toString(), font);
      this.safeSetText(form, 'purpose', loanData.purpose, font);
      this.safeSetText(form, 'monthly_payment', loanData.monthly_payment?.toString(), font);
      this.safeSetText(form, 'contract_date', loanData.contract_date, font);
      this.safeSetText(form, 'contract_number', loanData.contract_number, font);
      this.safeSetText(form, 'advisor_name', loanData.advisor_name, font);
      this.safeSetText(form, 'advisor_agency_number', loanData.advisor_agency_number, font);
      
      // Uložení PDF
      const pdfBytes = await pdfDoc.save();
      console.log('PDF úspěšně vygenerováno');
      
      return pdfBytes;
      
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      throw new Error(`Nepodařilo se vygenerovat PDF: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  }
}
