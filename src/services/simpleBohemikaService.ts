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

    return text.replace(/[^\x20-\x7E]/g, (char) => diacriticMap[char] || char);
  }

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
        'fill_11': this.removeDiacritics(clientName),
        'fill_12': this.removeDiacritics(client.applicant_birth_number || ''),
        'Adresa': this.removeDiacritics(client.applicant_permanent_address || ''),
        'Telefon': this.removeDiacritics(client.applicant_phone || ''),
        'email': this.removeDiacritics(client.applicant_email || ''),
        'fill_16': 'Ing. Milan Kost', // Zpracovatel
        'fill_17': '8680020061', // IČO zpracovatele
        'Produkt': this.removeDiacritics(loan.product || 'Napr. Hypotecni uver'),
        'fill_21': loan.amount ? `${loan.amount} Kc` : '',
        'fill_22': loan.amount ? `${loan.amount} Kc` : '',
        'LTV': loan.ltv ? `${loan.ltv}%` : '',
        'fill_24': this.removeDiacritics(loan.purpose || 'Nakup nemovitosti'),
        'fill_25': loan.monthly_payment ? `${loan.monthly_payment} Kc` : '',
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
