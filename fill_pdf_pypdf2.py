#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Form Filler Script (PyPDF2 Alternative)
==========================================

Alternativní verze skriptu používající PyPDF2 knihovnu.
Použijte tuto verzi, pokud pypdf nefunguje správně.

Instalace: pip install PyPDF2
"""

import os
import sys
from typing import Dict, Any

try:
    from PyPDF2 import PdfReader, PdfWriter
except ImportError:
    print("CHYBA: Knihovna PyPDF2 není nainstalována.")
    print("Nainstalujte ji pomocí: pip install PyPDF2")
    sys.exit(1)


def fill_pdf_form_pypdf2(template_path: str, output_path: str, client_data: Dict[str, Any]) -> bool:
    """
    Vyplní PDF formulář pomocí PyPDF2 knihovny.
    
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
        full_name = f"{client_data['zadatel']['jmeno']} {client_data['zadatel']['prijmeni']}"
        
        # Mapování dat na PDF pole
        form_fields = {
            'fill_11': full_name,
            'fill_12': client_data['zadatel']['rodne_cislo'],
            'Adresa': client_data['zadatel']['trvale_bydliste'],
            'Telefon': client_data['doklady']['telefon'],
            'email': client_data['doklady']['email'],
            'Produkt': client_data['uver']['produkt'],
            'fill_21': client_data['uver']['vyse_uveru'],
            'fill_22': client_data['uver']['suma_zajisteni'],
            'LTV': client_data['uver']['ltv'],
            'fill_24': client_data['uver']['ucel'],
            'fill_25': client_data['uver']['mesicni_splatka'],
            'fill_26': client_data['uver']['datum_podpisu'],
            'V': client_data['podpis']['misto'],
            'dne': client_data['podpis']['datum']
        }
        
        # Vyplnění formuláře
        fields_filled = 0
        for page in reader.pages:
            # Pokus o vyplnění polí na stránce
            if '/Annots' in page:
                writer.add_page(page)
                try:
                    writer.update_page_form_field_values(writer.pages[-1], form_fields)
                    fields_filled += len(form_fields)
                    print(f"✓ Vyplněna pole na stránce")
                except Exception as e:
                    print(f"⚠ Varování při vyplňování stránky: {e}")
            else:
                writer.add_page(page)
        
        # Uložení vyplněného PDF
        print(f"Ukládám vyplněný formulář: {output_path}")
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        print(f"✅ ÚSPĚCH: PDF formulář byl úspěšně vyplněn a uložen jako '{output_path}'")
        return True
        
    except Exception as e:
        print(f"❌ CHYBA při vyplňování PDF: {e}")
        return False


def main_pypdf2():
    """
    Hlavní funkce pro PyPDF2 verzi.
    """
    print("PDF FORM FILLER - PyPDF2 verze")
    print("=" * 40)
    
    # Ukázková data
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
    
    # Vyplnění formuláře
    success = fill_pdf_form_pypdf2("template.pdf", "filled_form_pypdf2.pdf", client_data)
    
    if success:
        print("🎉 Formulář byl úspěšně vyplněn!")
    else:
        print("❌ Vyplňování se nezdařilo.")


if __name__ == "__main__":
    main_pypdf2()
