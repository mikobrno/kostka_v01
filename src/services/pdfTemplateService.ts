import { PDFDocument, rgb } from 'pdf-lib';

export class PDFTemplateService {
  
  static async createBohemikaTemplate(): Promise<Uint8Array> {
    // Vytvoříme nový PDF dokument
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    const { height } = page.getSize();
    const fontSize = 12;
    const titleFontSize = 16;
    
    // Přidáme hlavičku
    page.drawText('BOHEMIKA', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Průvodní list k úvěru', {
      x: 50,
      y: height - 75,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    });

    // Definujeme pozice pro pole
    let currentY = height - 120;
    const leftMargin = 50;
    const labelWidth = 150;
    const fieldWidth = 200;
    const lineHeight = 30;

    // Funkce pro přidání pole
    const addFormField = (label: string, fieldName: string, isMultiline = false) => {
      // Label
      page.drawText(label, {
        x: leftMargin,
        y: currentY,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      // Vytvoříme text field
      const textField = pdfDoc.addTextField(fieldName);
      textField.setFontSize(fontSize);
      textField.enableMultiline(isMultiline);
      
      const fieldHeight = isMultiline ? 60 : 20;
      
      // Přidáme widget (vizuální reprezentaci pole)
      textField.addToPage(page, {
        x: leftMargin + labelWidth,
        y: currentY - fieldHeight + 5,
        width: fieldWidth,
        height: fieldHeight,
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
      });

      currentY -= isMultiline ? 80 : lineHeight;
    };

    // Sekce osobních údajů
    page.drawText('Osobní údaje klienta:', {
      x: leftMargin,
      y: currentY,
      size: fontSize + 2,
      color: rgb(0, 0, 0),
    });
    currentY -= 25;

    addFormField('Jméno a příjmení:', 'jmeno_prijmeni');
    addFormField('Rodné číslo:', 'rodne_cislo');
    addFormField('Adresa:', 'adresa');
    addFormField('Telefon:', 'telefon');
    addFormField('Email:', 'email');

    // Sekce zpracovatele
    currentY -= 20;
    page.drawText('Zpracovatel:', {
      x: leftMargin,
      y: currentY,
      size: fontSize + 2,
      color: rgb(0, 0, 0),
    });
    currentY -= 25;

    addFormField('Jméno zpracovatele:', 'zpracovatel_jmeno');
    addFormField('Telefon zpracovatele:', 'zpracovatel_telefon');
    addFormField('Email zpracovatele:', 'zpracovatel_email');

    // Sekce úvěru
    currentY -= 20;
    page.drawText('Údaje o úvěru:', {
      x: leftMargin,
      y: currentY,
      size: fontSize + 2,
      color: rgb(0, 0, 0),
    });
    currentY -= 25;

    addFormField('Částka úvěru:', 'castka_uveru');
    addFormField('Účel úvěru:', 'ucel_uveru');
    addFormField('Splatnost:', 'splatnost');
    addFormField('Typ nemovitosti:', 'typ_nemovitosti');
    addFormField('Poznámky:', 'poznamky', true);

    // Datum
    currentY -= 20;
    addFormField('Datum:', 'datum');

    // Vygenerujeme PDF jako bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
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
