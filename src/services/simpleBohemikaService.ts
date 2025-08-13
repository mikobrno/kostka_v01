import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Vite: import URL fontu jako asset (funguje v dev i po buildu)
// Soubor je v public/fonts/NotoSans-Regular.ttf
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
  // Rozšíření v této větvi – ponecháme kvůli kompatibilitě komponenty
  contract_number?: string;
  advisor_name?: string;
  advisor_agency_number?: string;
}

export class SimpleBohemikaService {
  // Přísné formátování data na dd.MM.yyyy (např. 18.08.2025)
  private static formatDateStrict(value?: string | Date): string {
    if (!value) return '';
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else {
      // Pokud přijde ISO (YYYY-MM-DD) z <input type="date">, new Date to zvládne
      // Jinak zkusíme rozpoznat běžné formáty dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy
      const trimmed = value.trim();
  const m = trimmed.match(/^(\d{1,2})[./-\s](\d{1,2})[./-\s](\d{4})$/);
      if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        const yyyy = m[3];
        return `${dd}.${mm}.${yyyy}`;
      }
      d = new Date(trimmed);
    }
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
  // Odstranění diakritiky pro fallback (drženo z produkce)
  private static removeDiacritics(text: string): string {
    const map: Record<string, string> = {
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
    // ponecháme pouze tisknutelné ASCII znaky; ostatní zkusíme mapovat
    return text.replace(/[^\x20-\x7E]/g, (ch) => map[ch] || ch);
  }

  // Bezpečné nastavení hodnoty do pole (TextField nebo výběr)
  private static trySetFieldValue(field: unknown, value: string, allowDiacritics: boolean) {
    if (!value) return;
    const hasSetText = (obj: unknown): obj is { setText: (v: string) => void } => {
      return !!obj && typeof obj === 'object' && 'setText' in (obj as Record<string, unknown>);
    };
    const hasSelect = (obj: unknown): obj is { select: (v: string) => void } => {
      return !!obj && typeof obj === 'object' && 'select' in (obj as Record<string, unknown>);
    };

    const prepared = allowDiacritics ? value : this.removeDiacritics(value);
    if (hasSetText(field)) {
      try {
        field.setText(prepared);
      } catch {
        const safe = this.removeDiacritics(prepared);
        field.setText(safe);
        console.warn('PDF: fallback bez diakritiky v textovém poli');
      }
      return;
    }
    if (hasSelect(field)) {
      try {
        field.select(prepared);
      } catch {
        const safe = this.removeDiacritics(prepared);
        field.select(safe);
        console.warn('PDF: fallback bez diakritiky ve výběrovém poli');
      }
    }
  }

  // Načte vlastní font s podporou diakritiky; fallback na Helvetica
  private static async loadCustomFont(pdfDoc: PDFDocument): Promise<PDFFont | null> {
    try {
      const fontUrl = notoSansUrl || '/fonts/NotoSans-Regular.ttf';
      const res = await fetch(fontUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch font: ${res.status} ${res.statusText}`);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) throw new Error(`Font URL returned HTML (content-type: ${ct})`);
      const ab = await res.arrayBuffer();
      const fontBytes = new Uint8Array(ab);
      // Rychlá kontrola signatury (TTF/OTF)
      const s0 = fontBytes[0], s1 = fontBytes[1], s2 = fontBytes[2], s3 = fontBytes[3];
      const sigStr = String.fromCharCode(s0, s1, s2, s3);
      const isTTF = s0 === 0x00 && s1 === 0x01 && s2 === 0x00 && s3 === 0x00;
      const isOTF = sigStr === 'OTTO';
      if (!isTTF && !isOTF) throw new Error('Invalid font binary signature');

      pdfDoc.registerFontkit(fontkit);
      const custom = await pdfDoc.embedFont(fontBytes, { subset: true });
      return custom;
    } catch (e) {
      console.error('PDF: Chyba při načtení vlastního fontu, fallback na Helvetica:', e);
      try {
        return await pdfDoc.embedFont(StandardFonts.Helvetica);
      } catch (he) {
        console.error('PDF: Selhal i fallback Helvetica:', he);
        return null;
      }
    }
  }

  // Interní generátor s volitelnou sanitizací diakritiky
  private static async generateBohemikaFormInternal(
    client: ClientData,
    loan: LoanData = {},
    forceSanitize = false
  ): Promise<Uint8Array> {
    const templatePath = '/bohemika_template.pdf';
    const response = await fetch(templatePath);
    if (!response.ok) throw new Error(`Failed to load template: ${response.statusText}`);
    const existingPdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const customFont = await this.loadCustomFont(pdfDoc);
    const form = pdfDoc.getForm();
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();

    const sanitize = (t?: string) => (t ? (forceSanitize ? this.removeDiacritics(t) : t) : '');
    const currency = (n?: number) => (n ? `${n} Kč` : '');
    const defaultProduct = 'Např. Hypoteční úvěr';

    const formData: Record<string, string> = {
      fill_11: sanitize(clientName),
      fill_12: sanitize(client.applicant_birth_number),
      Adresa: sanitize(client.applicant_permanent_address),
      Telefon: sanitize(client.applicant_phone),
      email: sanitize(client.applicant_email),
      fill_16: 'Ing. Milan Kost', // Zpracovatel
      fill_17: '8680020061', // IČO zpracovatele
      Produkt: sanitize(loan.product || defaultProduct),
      fill_21: currency(loan.amount),
      fill_22: currency(loan.amount),
  LTV: loan.ltv ? `${loan.ltv}%` : '',
  ltv: loan.ltv ? `${loan.ltv}%` : '', // alternativní název pole (pro jinou šablonu)
      fill_24: sanitize(loan.purpose || 'Nákup nemovitosti'),
      fill_25: currency(loan.monthly_payment),
      V: 'Brno',
  // Datum podpisu dole ("dne") a datum smlouvy (fill_26) ve formátu dd.MM.yyyy
  fill_26: this.formatDateStrict(loan.contract_date),
  dne: this.formatDateStrict(loan.contract_date) || this.formatDateStrict(new Date()),
  // Rozšířená pole – číslo smlouvy a doporučitel (TIPAŘ)
  contract_number: sanitize(loan.contract_number),
  advisor_name: sanitize(loan.advisor_name),
  advisor_agency_number: sanitize(loan.advisor_agency_number),
    };

    if (customFont) {
      try { form.updateFieldAppearances(customFont); } catch { /* ignore appearance init */ }
    }

    for (const [fieldName, value] of Object.entries(formData)) {
      if (!value) continue;
      try {
        const field = form.getField(fieldName);
        if (field) this.trySetFieldValue(field, value, !forceSanitize);
      } catch (err) {
        console.warn(`Could not fill field '${fieldName}':`, err);
      }
    }

    if (customFont) {
      try {
        form.updateFieldAppearances(customFont);
        form.flatten();
      } catch { /* ignore flatten issues */ }
    }

    return await pdfDoc.save();
  }

  static async generateBohemikaForm(client: ClientData, loan: LoanData = {}): Promise<Uint8Array> {
    try {
      return await this.generateBohemikaFormInternal(client, loan, false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('WinAnsi') || msg.includes('cannot encode')) {
        console.warn('PDF: fallback – generuji bez diakritiky...', error);
        return await this.generateBohemikaFormInternal(client, loan, true);
      }
      throw error;
    }
  }

  static async downloadBohemikaForm(client: ClientData, loan: LoanData = {}): Promise<void> {
    const pdfBytes = await this.generateBohemikaForm(client, loan);
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Název souboru ponecháme jednoduchý jako v produkci
    link.download = 'bohemika_pruvodny_list.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
