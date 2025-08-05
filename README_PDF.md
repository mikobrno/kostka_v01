# PDF Form Filler - Návod k použití

## 📋 Přehled
Tento Python skript vyplňuje PDF formulář daty z Python slovníku pomocí knihovny `pypdf`.

## 🚀 Instalace a spuštění

### 1. Instalace požadovaných knihoven
```bash
pip install pypdf
```

Nebo pomocí requirements souboru:
```bash
pip install -r requirements_pdf.txt
```

### 2. Příprava souborů
- Umístěte váš PDF formulář do stejné složky jako skript
- Přejmenujte PDF formulář na `template.pdf`
- Ujistěte se, že PDF obsahuje vyplnitelná formulářová pole

### 3. Spuštění skriptu
```bash
python fill_pdf.py
```

## 📊 Vstupní data
Skript očekává data v následující struktuře:

```python
client_data = {
    "zadatel": {
        "jmeno": "Jaroslav",
        "prijmeni": "Raškovec",
        "rodne_cislo": "8010164778",
        "trvale_bydliste": "Ujčov 28, Ujčov, Česko"
    },
    "doklady": {
        "telefon": "739 557 684",
        "email": "raskovec@woga.cz"
    },
    "uver": {
        "produkt": "Hypoteční úvěr",
        "vyse_uveru": "3 000 000 Kč",
        "suma_zajisteni": "4 000 000 Kč",
        "ltv": "75%",
        "ucel": "Koupě nemovitosti",
        "mesicni_splatka": "15 000 Kč",
        "datum_podpisu": "02.08.2025"
    },
    "podpis": {
        "misto": "Brně",
        "datum": "02.08.2025"
    }
}
```

## 🔧 Mapování polí
Skript mapuje data na následující PDF pole:

| Klíč dat | PDF pole | Popis |
|----------|----------|-------|
| Jméno + Příjmení | `fill_11` | Celé jméno klienta |
| Rodné číslo | `fill_12` | Rodné číslo |
| Adresa | `Adresa` | Trvalé bydliště |
| Telefon | `Telefon` | Telefonní číslo |
| Email | `email` | E-mailová adresa |
| Produkt | `Produkt` | Typ úvěru |
| Výše úvěru | `fill_21` | Požadovaná suma |
| Suma zajištění | `fill_22` | Zajištění úvěru |
| LTV | `LTV` | Poměr úvěru k hodnotě |
| Účel | `fill_24` | Účel úvěru |
| Splátka | `fill_25` | Měsíční splátka |
| Datum smlouvy | `fill_26` | Datum podpisu |
| Město | `V` | Místo podpisu |
| Datum podpisu | `dne` | Datum podpisu |

## 📁 Výstup
- Vyplněný formulář se uloží jako `filled_form.pdf`
- Skript zobrazí informace o procesu vyplňování
- V případě chyby se zobrazí detailní chybové zprávy

## 🔍 Řešení problémů

### PDF neobsahuje formulářová pole
- Ujistěte se, že PDF má vyplnitelná pole
- Zkontrolujte názvy polí v PDF editoru

### Knihovna pypdf není nainstalována
```bash
pip install pypdf
```

### Soubor template.pdf nebyl nalezen
- Umístěte PDF soubor do stejné složky jako skript
- Přejmenujte soubor na `template.pdf`

## 🛠️ Přizpůsobení
Pro úpravu mapování polí upravte funkci `create_field_mapping()` v souboru `fill_pdf.py`.

## 📞 Podpora
V případě problémů zkontrolujte:
1. Správnost názvů PDF polí
2. Formát vstupních dat
3. Oprávnění k zápisu do složky
4. Verzi knihovny pypdf
