#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Form Filler Script - Vylepšená verze
========================================

Vylepšená verze s lepším zpracováním formulářových polí v pypdf.
"""

import os
import sys
from typing import Dict, Any

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import TextStringObject
except ImportError:
    print("CHYBA: Knihovna pypdf není nainstalována.")
    print("Nainstalujte ji pomocí: pip install pypdf")
    sys.exit(1)


def get_sample_client_data() -> Dict[str, Any]:
    """
    Vrátí ukázková data klienta pro testování.
    """
    return {
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


def fill_pdf_form_advanced(template_path: str, output_path: str, client_data: Dict[str, Any]) -> bool:
    """
    Pokročilé vyplnění PDF formuláře s lepším zpracováním polí.
    """
    try:
        if not os.path.exists(template_path):
            print(f"❌ CHYBA: Soubor '{template_path}' nebyl nalezen.")
            return False
        
        print(f"📖 Načítám PDF: {template_path}")
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Příprava dat pro vyplnění
        full_name = f"{client_data['zadatel']['jmeno']} {client_data['zadatel']['prijmeni']}"
        
        form_data = {
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
        
        print(f"📝 Připraveno {len(form_data)} hodnot pro vyplnění")
        
        # Metoda 1: Klasické vyplnění přes writer
        print("\n🔧 Metoda 1: Standardní vyplnění...")
        fields_filled_method1 = 0
        
        for page in reader.pages:
            new_page = writer.add_page(page)
            
            try:
                writer.update_page_form_field_values(new_page, form_data)
                fields_filled_method1 = len(form_data)
                print(f"  ✅ Úspěšně vyplněno {fields_filled_method1} polí")
                break
            except Exception as e:
                print(f"  ❌ Chyba standardní metody: {e}")
        
        # Metoda 2: Pokud metoda 1 nefunguje, zkus přímou manipulaci
        if fields_filled_method1 == 0:
            print("\n🔧 Metoda 2: Přímá manipulace formulářových polí...")
            fields_filled_method2 = 0
            
            # Přístup přes annotations
            for page_num, page in enumerate(writer.pages):
                if "/Annots" in page:
                    annotations = page["/Annots"]
                    
                    for annot in annotations:
                        annot_obj = annot.get_object()
                        
                        if annot_obj.get("/Subtype") == "/Widget":
                            # Získej název pole
                            field_name = None
                            if "/T" in annot_obj:
                                field_name = str(annot_obj["/T"])
                            elif "/Parent" in annot_obj:
                                parent = annot_obj["/Parent"].get_object()
                                if "/T" in parent:
                                    field_name = str(parent["/T"])
                            
                            # Vyplň pole pokud máme data
                            if field_name and field_name in form_data:
                                value = form_data[field_name]
                                try:
                                    # Nastav hodnotu pole
                                    annot_obj["/V"] = TextStringObject(str(value))
                                    annot_obj["/AP"] = None  # Vymaž vzhled, aby se překreslil
                                    fields_filled_method2 += 1
                                    print(f"    ✅ {field_name}: {value}")
                                except Exception as field_error:
                                    print(f"    ❌ {field_name}: {field_error}")
            
            print(f"  📊 Vyplněno {fields_filled_method2} polí metodou 2")
        
        # Metoda 3: Pokud ani metoda 2 nefunguje, zkus clone + fill
        total_filled = fields_filled_method1 + fields_filled_method2
        if total_filled == 0:
            print("\n🔧 Metoda 3: Clone a fill...")
            
            # Vytvoř nový writer
            writer = PdfWriter()
            
            for page in reader.pages:
                writer.add_page(page)
            
            # Zkus fill na celém writer objektu
            try:
                writer.update_page_form_field_values(writer.pages[0], form_data)
                total_filled = len(form_data)
                print(f"  ✅ Metoda 3 úspěšná: {total_filled} polí")
            except Exception as e:
                print(f"  ❌ Metoda 3 selhala: {e}")
        
        # Uložení výsledku
        print(f"\n💾 Ukládám výsledek: {output_path}")
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        # Shrnutí
        if total_filled > 0:
            print(f"✅ ÚSPĚCH: Vyplněno {total_filled} z {len(form_data)} polí")
            print(f"📄 Soubor uložen: {output_path}")
        else:
            print(f"⚠️  VAROVÁNÍ: Žádná pole nebyla vyplněna")
            print(f"📄 Prázdná kopie uložena: {output_path}")
            print("   💡 Zkuste jiný PDF formulář nebo kontaktujte vývojáře")
        
        return True
        
    except Exception as e:
        print(f"❌ KRITICKÁ CHYBA: {e}")
        return False


def main():
    """
    Hlavní funkce vylepšené verze.
    """
    print("🚀 PDF FORM FILLER - Vylepšená verze")
    print("=" * 50)
    
    # Cesty k souborům
    template_path = "template.pdf"
    output_path = "filled_form_advanced.pdf"
    
    # Testovací data
    client_data = get_sample_client_data()
    
    print("\n📋 Používaná data:")
    print(f"  👤 Jméno: {client_data['zadatel']['jmeno']} {client_data['zadatel']['prijmeni']}")
    print(f"  🆔 Rodné číslo: {client_data['zadatel']['rodne_cislo']}")
    print(f"  📧 Email: {client_data['doklady']['email']}")
    print(f"  🏦 Produkt: {client_data['uver']['produkt']}")
    print(f"  💰 Výše úvěru: {client_data['uver']['vyse_uveru']}")
    
    # Spuštění vyplňování
    print(f"\n🔄 Spouštím vyplňování formuláře...")
    success = fill_pdf_form_advanced(template_path, output_path, client_data)
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 PROCES DOKONČEN!")
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"📊 Velikost výstupního souboru: {file_size:,} bytů")
    else:
        print("❌ PROCES SELHAL!")
    print("=" * 50)


if __name__ == "__main__":
    main()
