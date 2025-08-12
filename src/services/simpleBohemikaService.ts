import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Vite: import URL fontu jako asset (zajistí správné servírování v dev i build)
// Pozn.: soubor je v public/fonts/NotoSans-Regular.ttf
import notoSansUrl from '/fonts/NotoSans-Regular.ttf?url';

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

  // Bezpečné nastavení textu do libovolného pole formuláře
  private static trySetFieldValue(field: unknown, value: string, allowDiacritics: boolean) {
    if (!value) return;
    const hasSetText = (obj: unknown): obj is { setText: (v: string) => void } => {
      return !!obj && typeof obj === 'object' && 'setText' in (obj as Record<string, unknown>);
    };
    const hasSelect = (obj: unknown): obj is { select: (v: string) => void } => {
      return !!obj && typeof obj === 'object' && 'select' in (obj as Record<string, unknown>);
    };

    // Pokud není povolena diakritika, předem očistíme
    const prepared = allowDiacritics ? value : this.removeDiacritics(value);
    // Pole s textem (TextField)
    if (hasSetText(field)) {
      try {
        field.setText(prepared);
      } catch {
        // pdf-lib může vyhodit chybu při nepodporovaných znacích – použijeme bezdiakritický fallback
        const safe = this.removeDiacritics(prepared);
        field.setText(safe);
        console.warn('PDF: znak(y) mimo podporu fontu – použit fallback bez diakritiky v jednom poli');
      }
      return;
    }
    // Výběrová pole
    if (hasSelect(field)) {
      try {
        field.select(prepared);
      } catch {
        const safe = this.removeDiacritics(prepared);
        field.select(safe);
        console.warn('PDF: select fallback bez diakritiky');
      }
    }
  }

  // Načte vlastní TTF font s plnou podporou diakritiky
  private static async loadCustomFont(pdfDoc: PDFDocument): Promise<PDFFont | null> {
    try {
      const fontUrl = notoSansUrl || '/fonts/NotoSans-Regular.ttf';
  const res = await fetch(fontUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch font: ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type') || '';
  console.log('PDF: Font fetch', { fontUrl, contentType });
      if (contentType.includes('text/html')) {
        throw new Error(`Font URL returned HTML instead of font (content-type: ${contentType})`);
      }
      const ab = await res.arrayBuffer();
      const fontBytes = new Uint8Array(ab);
      // Validace hlavičky souboru (TTF: 00 01 00 00, OTF: 'OTTO')
      const sig0 = fontBytes[0], sig1 = fontBytes[1], sig2 = fontBytes[2], sig3 = fontBytes[3];
      const sigStr = String.fromCharCode(sig0, sig1, sig2, sig3);
      const isTTF = sig0 === 0x00 && sig1 === 0x01 && sig2 === 0x00 && sig3 === 0x00;
      const isOTF = sigStr === 'OTTO';
      if (!isTTF && !isOTF) {
        throw new Error(`Invalid font binary signature: [${sig0.toString(16)},${sig1.toString(16)},${sig2.toString(16)},${sig3.toString(16)}] (likely not a TTF/OTF file)`);
      }

      // Zaregistrujeme fontkit
      pdfDoc.registerFontkit(fontkit);

      // Vložíme font do PDF (subset kvůli velikosti)
      const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });
      console.log('PDF: Úspěšně načten vlastní font NotoSans-Regular.ttf');
      return customFont;
    } catch (e) {
      console.error('PDF: Chyba při načítání vlastního fontu, zkouším fallback na Helvetica:', e);
      try {
        // Fallback na standardní font, pokud vlastní selže
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        console.log('PDF: Použit standardní Helvetica font (základní diakritika)');
        return helveticaFont;
      } catch (helveticaError) {
        console.error('PDF: Selhalo i načtení standardního fontu Helvetica:', helveticaError);
        return null;
      }
    }
  }

  // Interní metoda pro generování s možností vynucení sanitizace diakritiky
  private static async generateBohemikaFormInternal(
    client: ClientData,
    loan: LoanData = {},
    forceSanitize: boolean = false
  ): Promise<Uint8Array> {
    // Načteme template PDF
    const templatePath = '/bohemika_template.pdf';
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const existingPdfBytes = await response.arrayBuffer();
    
    // Načteme PDF dokument
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Pokus o načtení fontu (standardní Helvetica)
    const customFont = await this.loadCustomFont(pdfDoc);

    // Připravíme pomocné proměnné a form
    const form = pdfDoc.getForm();
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    
    // Funkce pro sanitizaci podle toho, zda vynucujeme odstranění diakritiky
    const sanitize = (t?: string) => {
      if (!t) return '';
      return forceSanitize ? this.removeDiacritics(t) : t;
    };
    
    const currency = (n?: number) => (n ? `${n} Kč` : ''); // Vrátíme zpět "Kč"
    const defaultProduct = 'Např. Hypoteční úvěr';

    const formData: Record<string, string> = {
      'fill_11': sanitize(clientName),
      'fill_12': sanitize(client.applicant_birth_number),
      'Adresa': sanitize(client.applicant_permanent_address),
      'Telefon': sanitize(client.applicant_phone),
      'email': sanitize(client.applicant_email),
      'fill_16': 'Ing. Milan Kost', // Zpracovatel
      'fill_17': '8680020061', // IČO zpracovatele
      'Produkt': sanitize(loan.product || defaultProduct),
      'fill_21': currency(loan.amount),
      'fill_22': currency(loan.amount),
      'LTV': loan.ltv ? `${loan.ltv}%` : '',
      'fill_24': sanitize(loan.purpose || 'Nákup nemovitosti'),
      'fill_25': currency(loan.monthly_payment),
      'V': 'Brno',
      'dne': loan.contract_date || new Date().toLocaleDateString('cs-CZ')
    };

    // Pokud máme vlastní font, nastavíme jej hned, aby setText používal správnou sadu znaků
    if (customFont) {
      try {
        form.updateFieldAppearances(customFont);
      } catch (e) {
        console.warn('PDF: Nepodařilo se připravit vzhled polí vlastním fontem – pokračuji', e);
      }
    }

    // Vyplníme pole formuláře
    for (const [fieldName, value] of Object.entries(formData)) {
      if (!value) continue;
      try {
        const field = form.getField(fieldName);
        if (field) {
          this.trySetFieldValue(field, value, !forceSanitize); // Pokud nevynucujeme sanitizaci, zkusíme s diakritkou
          console.log(`Filled field '${fieldName}' with value '${value}'`);
        }
      } catch (error) {
        console.warn(`Could not fill field '${fieldName}':`, error);
      }
    }
    
    if (customFont) {
      try {
        // Po vyplnění ještě jednou přestylujeme a zafixujeme vzhled
        form.updateFieldAppearances(customFont);
        // Pro maximální kompatibilitu vložíme hodnoty napevno do PDF (odstraní editační pole)
        form.flatten();
      } catch (e) {
        console.warn('PDF: Nepodařilo se aktualizovat vzhled/flatten polí vlastním fontem – pokračuji', e);
      }
    }

    // Vygenerujeme PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  static async generateBohemikaForm(
    client: ClientData,
    loan: LoanData = {}
  ): Promise<Uint8Array> {
    try {
      console.log('PDF: Pokus o generování s diakritikou...');
      // Nejprve zkusíme s diakritikou
      return await this.generateBohemikaFormInternal(client, loan, false);
      
    } catch (error) {
      // Pokud to selže kvůli WinAnsi encoding chybě, zkusíme bez diakritiky
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('WinAnsi') || errorMessage.includes('cannot encode')) {
        console.warn('PDF: Diakritika způsobila chybu, zkouším bez diakritiky...', error);
        try {
          return await this.generateBohemikaFormInternal(client, loan, true);
        } catch (fallbackError) {
          console.error('PDF: Selhalo i generování bez diakritiky:', fallbackError);
          throw fallbackError;
        }
      }
      
      // Pokud to není chyba související s enkódováním, prohodíme původní chybu
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
      // TS může být přísný na BlobPart typy – provedeme úzký cast
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
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
