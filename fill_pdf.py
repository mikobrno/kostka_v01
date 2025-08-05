#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Form Filler Script
======================

Tento skript vyplňuje PDF formulář daty z Python slovníku.
Používá knihovnu pypdf pro čtení a vyplňování PDF formulářů.

Autor: AI Assistant
Datum: 2. srpna 2025
"""

import os
import sys
from typing import Dict, Any
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("CHYBA: Knihovna pypdf není nainstalována.")
    print("Nainstalujte ji pomocí: pip install pypdf")
    sys.exit(1)


def create_field_mapping() -> Dict[str, str]:
    """
    Vytvoří mapování mezi klíči z client_data a názvy polí v PDF formuláři.
    
    Returns:
        Dict[str, str]: Slovník mapující klíče na názvy PDF polí
    """
    return {
        # Základní informace o klientovi
        'client_full_name': 'fill_11',        # Jméno a příjmení
        'client_birth_number': 'fill_12',     # Rodné číslo
        'client_address': 'Adresa',           # Adresa
        'client_phone': 'Telefon',           # Telefon
        'client_email': 'email',             # Email
        
        # Informace o úvěru
        'loan_product': 'Produkt',           # Produkt
        'loan_amount': 'fill_21',            # Výše úvěru
        'collateral_amount': 'fill_22',      # Suma zajištění
        'ltv': 'LTV',                        # LTV
        'loan_purpose': 'fill_24',           # Účel úvěru
        'monthly_payment': 'fill_25',        # Měsíční splátka
        'contract_date': 'fill_26',          # Datum podpisu úvěru
        
        # Informace o podpisu
        'signing_city': 'V',                 # Město podpisu
        'signing_date': 'dne'                # Datum podpisu
    }


def prepare_form_data(client_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Připraví data z client_data slovníku pro vyplnění PDF formuláře.
    
    Args:
        client_data (Dict[str, Any]): Vstupní data klienta
        
    Returns:
        Dict[str, str]: Připravená data pro vyplnění formuláře
    """
    # Spojení jména a příjmení
    full_name = f"{client_data['zadatel']['jmeno']} {client_data['zadatel']['prijmeni']}"
    
    # Příprava dat pro formulář
    form_data = {
        'client_full_name': full_name,
        'client_birth_number': client_data['zadatel']['rodne_cislo'],
        'client_address': client_data['zadatel']['trvale_bydliste'],
        'client_phone': client_data['doklady']['telefon'],
        'client_email': client_data['doklady']['email'],
        
        'loan_product': client_data['uver']['produkt'],
        'loan_amount': client_data['uver']['vyse_uveru'],
        'collateral_amount': client_data['uver']['suma_zajisteni'],
        'ltv': client_data['uver']['ltv'],
        'loan_purpose': client_data['uver']['ucel'],
        'monthly_payment': client_data['uver']['mesicni_splatka'],
        'contract_date': client_data['uver']['datum_podpisu'],
        
        'signing_city': client_data['podpis']['misto'],
        'signing_date': client_data['podpis']['datum']
    }
    
    return form_data


def fill_pdf_form(template_path: str, output_path: str, client_data: Dict[str, Any]) -> bool:
    """
    Vyplní PDF formulář daty z client_data slovníku.
    
    Args:
        template_path (str): Cesta k šabloně PDF
        output_path (str): Cesta pro uložení vyplněného PDF
        client_data (Dict[str, Any]): Data klienta
        
    Returns:
        bool: True pokud se podařilo vyplnit formulář, False jinak
    """
    try:
        # Kontrola existence souboru šablony
        if not os.path.exists(template_path):
            print(f"CHYBA: Soubor šablony '{template_path}' nebyl nalezen.")
            return False
        
        # Načtení PDF šablony
        print(f"Načítám PDF šablonu: {template_path}")
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Příprava dat pro formulář
        form_data = prepare_form_data(client_data)
        field_mapping = create_field_mapping()
        
        # Vytvoření mapy pro vyplnění
        pdf_form_data = {}
        for data_key, form_value in form_data.items():
            if data_key in field_mapping:
                pdf_field_name = field_mapping[data_key]
                pdf_form_data[pdf_field_name] = str(form_value)
        
        print(f"Připravena data pro {len(pdf_form_data)} polí")
        
        # Kontrola, zda PDF obsahuje formulář
        has_form = False
        if len(reader.pages) > 0:
            page = reader.pages[0]
            if "/Annots" in page or "/AcroForm" in reader.trailer.get("/Root", {}):
                has_form = True
        
        if not has_form:
            print("VAROVÁNÍ: PDF neobsahuje formulářová pole nebo AcroForm.")
            print("Vytvářím kopii PDF bez vyplnění polí.")
        
        # Procházení všech stránek
        fields_filled = 0
        for page_num, page in enumerate(reader.pages):
            print(f"Zpracovávám stránku {page_num + 1}")
            
            # Přidání stránky do výstupního PDF
            writer.add_page(page)
            
            # Pokus o vyplnění formulářových polí
            if has_form and pdf_form_data:
                try:
                    # Pokus o vyplnění všech polí najednou
                    writer.update_page_form_field_values(writer.pages[-1], pdf_form_data)
                    fields_filled = len(pdf_form_data)
                    print(f"  ✓ Vyplněno {fields_filled} polí na stránce {page_num + 1}")
                    
                    # Výpis vyplněných polí
                    for field_name, value in pdf_form_data.items():
                        print(f"    - {field_name}: {value}")
                        
                except Exception as form_error:
                    print(f"  ⚠ Problém s vyplněním formuláře: {form_error}")
                    # Pokus o vyplnění polí jednotlivě
                    for field_name, value in pdf_form_data.items():
                        try:
                            writer.update_page_form_field_values(
                                writer.pages[-1], {field_name: value}
                            )
                            fields_filled += 1
                            print(f"    ✓ {field_name}: {value}")
                        except Exception as field_error:
                            print(f"    ✗ {field_name}: {field_error}")
        
        # Uložení vyplněného PDF
        print(f"Ukládám vyplněný formulář: {output_path}")
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        if fields_filled > 0:
            print(f"✅ ÚSPĚCH: PDF formulář byl vyplněn ({fields_filled} polí) a uložen jako '{output_path}'")
        else:
            print(f"⚠ VAROVÁNÍ: PDF byl uložen jako '{output_path}', ale žádná pole nebyla vyplněna")
            print("   Možné příčiny:")
            print("   - PDF neobsahuje vyplnitelná formulářová pole")
            print("   - Názvy polí v PDF se neshodují s očekávanými názvy")
            print("   - PDF má jiný formát než očekávaný")
        
        return True
        
    except Exception as e:
        print(f"❌ CHYBA při vyplňování PDF: {e}")
        return False


def get_sample_client_data() -> Dict[str, Any]:
    """
    Vrátí ukázková data klienta pro testování.
    
    Returns:
        Dict[str, Any]: Ukázková data klienta
    """
    return {
        "zadatel": {  # Žadatel (Applicant)
            "jmeno": "Jaroslav",
            "prijmeni": "Raškovec", 
            "rodne_cislo": "8010164778",
            "trvale_bydliste": "Ujčov 28, Ujčov, Česko"
        },
        "doklady": {  # Doklady (Documents)
            "telefon": "739 557 684",
            "email": "raskovec@woga.cz"
        },
        "uver": {  # Informace o úvěru (Loan information)
            "produkt": "Hypoteční úvěr",
            "vyse_uveru": "3 000 000 Kč",
            "suma_zajisteni": "4 000 000 Kč", 
            "ltv": "75%",
            "ucel": "Koupě nemovitosti",
            "mesicni_splatka": "15 000 Kč",
            "datum_podpisu": "02.08.2025"
        },
        "podpis": {  # Informace o podpisu (Signing information)
            "misto": "Brně",
            "datum": "02.08.2025"
        }
    }


def main():
    """
    Hlavní funkce skriptu.
    """
    print("=" * 60)
    print("PDF FORM FILLER - Vyplňování PDF formulářů")
    print("=" * 60)
    
    # Cesty k souborům
    template_path = "template.pdf"
    output_path = "filled_form.pdf"
    
    # Získání dat klienta (v reálné aplikaci by se načetla odjinud)
    client_data = get_sample_client_data()
    
    print("\nPoužitá data klienta:")
    print("-" * 30)
    print(f"Jméno: {client_data['zadatel']['jmeno']} {client_data['zadatel']['prijmeni']}")
    print(f"Rodné číslo: {client_data['zadatel']['rodne_cislo']}")
    print(f"Email: {client_data['doklady']['email']}")
    print(f"Produkt: {client_data['uver']['produkt']}")
    print(f"Výše úvěru: {client_data['uver']['vyse_uveru']}")
    
    print(f"\nZačínám vyplňování formuláře...")
    print("-" * 40)
    
    # Vyplnění PDF formuláře
    success = fill_pdf_form(template_path, output_path, client_data)
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 HOTOVO! PDF formulář byl úspěšně vyplněn.")
        print(f"📄 Výstupní soubor: {output_path}")
        
        # Zobrazení velikosti souboru
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"📊 Velikost souboru: {file_size:,} bytů")
    else:
        print("❌ Vyplňování se nezdařilo. Zkontrolujte chybové zprávy výše.")
    print("=" * 60)


if __name__ == "__main__":
    """
    Spuštění skriptu z příkazové řádky.
    
    Použití:
        python fill_pdf.py
        
    Požadavky:
        - Soubor template.pdf ve stejné složce
        - Nainstalovaná knihovna pypdf (pip install pypdf)
    """
    main()
