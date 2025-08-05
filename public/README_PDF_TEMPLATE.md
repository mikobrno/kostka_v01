# Bohemika PDF Template - Instrukce

Pro dokončení PDF generování je potřeba:

1. **Nahrát PDF šablonu**
   - Soubor: `public/bohemika_template.pdf`
   - Musí obsahovat vyplnitelná pole s názvy:
     - jmeno_prijmeni
     - rodne_cislo
     - adresa
     - telefon
     - email
     - zpracovatel_jmeno
     - zpracovatel_telefon
     - zpracovatel_email
     - poznamky
     - datum
     - castka_uveru
     - ucel_uveru
     - splatnost
     - typ_nemovitosti

2. **Instalace Python závislostí**
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

3. **Test Python skriptu**
   ```bash
   cd scripts
   python fill_bohemika_pdf.py '{"jmeno_prijmeni":"Test Klient","telefon":"123456789"}'
   ```

## Jak vytvořit vyplnitelné PDF:

1. **Adobe Acrobat Pro**: Otevřít PDF → Prepare Form → Automaticky detekovat pole nebo vytvořit ručně
2. **LibreOffice**: Vytvořit formulář s Form Controls → Export jako PDF s formulářovými poli
3. **Online nástroje**: PDFEscape, JotForm, Formstack

## Struktura Bohemika formuláře:

Formulář by měl obsahovat sekce:
- **Osobní údaje**: Jméno, rodné číslo, adresa, kontakty
- **Zpracovatel**: Kontaktní údaje poradce
- **Úvěr**: Částka, účel, splatnost, typ nemovitosti
- **Poznámky**: Volný text pro dodatečné informace
- **Datum**: Datum vyplnění formuláře

Po nahrání správného PDF template souboru bude generování fungovat automaticky.
