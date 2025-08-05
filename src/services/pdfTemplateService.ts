import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PDFTemplateService {
  
  static async createBohemikaTemplate(): Promise<Uint8Array> {
    try {
      // Vytvoříme nový PDF dokument
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      
      // Použijeme standardní font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const { height } = page.getSize();
      const fontSize = 12;
      
      // Přidáme hlavičku
      page.drawText('BOHEMIKA', {
        x: 50,
        y: height - 50,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Pruvodny list k uveru', {
        x: 50,
        y: height - 75,
        size: 16,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Jednoduchá statická verze s prostorem pro ruční přidání polí
      let currentY = height - 120;
      const leftMargin = 50;
      const lineHeight = 25;

      const formLabels = [
        'Osobni udaje klienta:',
        '',
        'Jmeno a prijmeni: ____________________________',
        'Rodne cislo: ____________________________',
        'Adresa: ____________________________',
        'Telefon: ____________________________',
        'Email: ____________________________',
        '',
        'Zpracovatel:',
        '',
        'Jmeno zpracovatele: ____________________________',
        'Telefon zpracovatele: ____________________________',
        'Email zpracovatele: ____________________________',
        '',
        'Udaje o uveru:',
        '',
        'Castka uveru: ____________________________',
        'Ucel uveru: ____________________________',
        'Splatnost: ____________________________',
        'Typ nemovitosti: ____________________________',
        '',
        'Poznamky:',
        '________________________________________',
        '________________________________________',
        '________________________________________',
        '',
        'Datum: ____________________________'
      ];

      // Vykreslíme formulář
      formLabels.forEach(label => {
        if (label.includes(':') && !label.includes('____')) {
          // Hlavičky sekcí
          page.drawText(label, {
            x: leftMargin,
            y: currentY,
            size: fontSize + 1,
            font: font,
            color: rgb(0, 0, 0),
          });
        } else if (label.trim() !== '') {
          // Pole s podtržítky
          page.drawText(label, {
            x: leftMargin + 10,
            y: currentY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
        currentY -= lineHeight;
      });

      // Instrukce na konci
      page.drawText('Instrukce:', {
        x: 50,
        y: 100,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText('Pro vytvoreni PDF s vyplnitelnymi poli pouzijte Adobe Acrobat', {
        x: 50,
        y: 85,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText('nebo online nastroj PDFEscape.com', {
        x: 50,
        y: 70,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Vygenerujeme PDF jako bytes
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      console.error('Chyba při vytváření PDF template:', error);
      throw new Error(`Nelze vytvořit PDF template: ${error}`);
    }
  }

  static async saveBohemikaTemplate(): Promise<void> {
    try {
      const pdfBytes = await this.createBohemikaTemplate();
      
      // Vytvoříme blob a stáhneme
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'bohemika_template.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ PDF template vygenerován a stažen!');
      alert('📄 PDF template byl stažen!\n\n1. Nahrajte stažený soubor "bohemika_template.pdf" do složky public/\n2. Pak znovu zkuste generovat PDF s daty klienta');
      
    } catch (error) {
      console.error('Chyba při vytváření PDF template:', error);
      throw error;
    }
  }
}
