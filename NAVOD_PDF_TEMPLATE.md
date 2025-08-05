# Rychlý návod - Vytvoření PDF template s vyplnitelnými poli

## 🎯 Cíl
Převést náš HTML formulář na PDF s vyplnitelnými poli, které pak Python skript vyplní daty.

## 📝 Krok za krokem

### 1. Otevřete HTML template
```
bohemika_form_template.html
```

### 2. Vytiskněte jako PDF
- Otevřete v prohlížeči
- Ctrl+P (Print)
- **Destination: Save as PDF**
- **Layout: Portrait**
- **Paper size: A4**
- Uložte jako `bohemika_base.pdf`

### 3. Přidejte vyplnitelná pole

#### Online nástroj - PDFEscape (ZDARMA):
1. Jděte na **pdfescape.com**
2. **Upload PDF** → nahrajte `bohemika_base.pdf`
3. **Form → Text Field** pro každé pole:

**Pole k vytvoření:**
```
jmeno_prijmeni      → u "Jméno a příjmení:"
rodne_cislo         → u "Rodné číslo:"
adresa             → u "Adresa:"
telefon            → u "Telefon:"
email              → u "Email:"
zpracovatel_jmeno  → u "Jméno zpracovatele:"
zpracovatel_telefon → u "Telefon zpracovatele:"
zpracovatel_email  → u "Email zpracovatele:"
castka_uveru       → u "Částka úvěru:"
ucel_uveru         → u "Účel úvěru:"
splatnost          → u "Splatnost:"
typ_nemovitosti    → u "Typ nemovitosti:"
poznamky           → u "Poznámky:" (multiline)
datum              → u "Datum:"
```

4. **Download PDF** jako `bohemika_template.pdf`

### 4. Nahrajte do projektu
```
public/bohemika_template.pdf
```

### 5. Otestujte
- Refreshněte aplikaci
- Klikněte "Generovat PDF"
- Mělo by se stáhnout vyplněné PDF s vašimi daty

## 🔧 Alternativní nástroje

### Adobe Acrobat Pro:
- Tools → Prepare Form → Auto-detect fields
- Přejmenujte pole podle našich názvů

### LibreOffice Writer:
- Insert → Form Controls
- Export as PDF with form fields

## ✅ Výsledek
Po nahrání správného PDF template se data z formuláře automaticky vyplní do polí a stáhne se kompletní vyplněný PDF!

**Toto je přesně to, co jste chtěl - vyplňování existujícího PDF, ne vytváření nového! 📄✨**
