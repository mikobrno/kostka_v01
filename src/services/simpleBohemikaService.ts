import { PDFDocument, PDFFont } from 'pdf-lib';

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

  // Bezpečné nastavení textu do libovolného pole formuláře –
  // nejdřív zkusí originál s diakritikou, při chybě použije fallback bez diakritiky
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

  // Pokusné načtení TTF fontu z několika možných umístění
  private static async loadCustomFont(pdfDoc: PDFDocument): Promise<PDFFont | null> {
    const ts = Date.now();
    const candidates = [
      `/fonts/NotoSans-Regular.ttf?ts=${ts}`,     // standardní cesta z public/
      `/fonts/NotoSans-Regular?ts=${ts}`,         // kdyby chyběla přípona
      `/NotoSans-Regular.ttf?ts=${ts}`,           // kořen public
      `/NotoSans-Regular?ts=${ts}`
    ];
    for (const url of candidates) {
      try {
        const resp = await fetch(url, { cache: 'no-store' });
        console.log('PDF: Pokus o načtení fontu z', url, 'status:', resp.status);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const font = await pdfDoc.embedFont(new Uint8Array(buf), { subset: true });
          console.log(`PDF: Načten vlastní TTF font z ${url} – diakritika povolena`);
          return font;
        }
      } catch {
        // zkusíme další variantu
      }
    }
    console.warn('PDF: Nepodařilo se načíst TTF font z /fonts – generuji bez záruky diakritiky');
    return null;
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

      // Pokus o načtení TTF fontu pro diakritiku
  const customFont = await this.loadCustomFont(pdfDoc);

      
  // Připravíme pomocné proměnné a form
  const form = pdfDoc.getForm();
  const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
  // Preferujeme originální texty; fallback aplikujeme jen pokud zápis selže
  const sanitize = (t?: string) => (t || '');
  const currency = (n?: number) => (n ? `${n} Kč` : '');
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

      // Vyplníme pole formuláře (s chytrým fallbackem) – povolíme diakritiku jen pokud je font načten
      const allowDiacritics = !!customFont;
      for (const [fieldName, value] of Object.entries(formData)) {
        if (!value) continue;
        try {
          const field = form.getField(fieldName);
          if (field) {
            this.trySetFieldValue(field, value, allowDiacritics);
            console.log(`Filled field '${fieldName}' with value '${value}'`);
          }
        } catch (error) {
          console.warn(`Could not fill field '${fieldName}':`, error);
        }
      }
      
  // Pokud máme vlastní font, aktualizujeme vzhled polí tímto fontem
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
