#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Form Analyzer - Analyzuje strukturu PDF formuláře
"""

import os
import sys
from typing import Dict, List, Any

try:
    from pypdf import PdfReader
except ImportError:
    print("CHYBA: Knihovna pypdf není nainstalována.")
    print("Nainstalujte ji pomocí: pip install pypdf")
    sys.exit(1)


def analyze_pdf_form(pdf_path: str) -> None:
    """
    Analyzuje PDF formulář a zobrazí dostupná pole.
    
    Args:
        pdf_path (str): Cesta k PDF souboru
    """
    try:
        if not os.path.exists(pdf_path):
            print(f"❌ CHYBA: Soubor '{pdf_path}' nebyl nalezen.")
            return
        
        print(f"🔍 Analyzuji PDF formulář: {pdf_path}")
        print("=" * 60)
        
        reader = PdfReader(pdf_path)
        
        # Základní informace o PDF
        print(f"📄 Počet stránek: {len(reader.pages)}")
        print(f"📊 Velikost souboru: {os.path.getsize(pdf_path):,} bytů")
        
        # Metadata
        if reader.metadata:
            print("\n📋 Metadata:")
            for key, value in reader.metadata.items():
                if value:
                    print(f"  {key}: {value}")
        
        # Kontrola formulářových polí
        print(f"\n🔧 Analýza formulářových polí:")
        
        # Zkontroluj AcroForm v document root
        has_acroform = False
        form_fields = []
        
        if "/AcroForm" in reader.trailer.get("/Root", {}):
            print("  ✅ PDF obsahuje AcroForm dictionary")
            has_acroform = True
            
            # Pokus o získání polí z AcroForm
            try:
                acroform = reader.trailer["/Root"]["/AcroForm"]
                if "/Fields" in acroform:
                    fields = acroform["/Fields"]
                    print(f"  📝 Nalezeno {len(fields)} formulářových polí v AcroForm")
                    
                    for i, field in enumerate(fields):
                        field_obj = field.get_object()
                        field_name = field_obj.get("/T", f"Pole_{i}")
                        field_type = field_obj.get("/FT", "Neznámý")
                        form_fields.append({
                            'name': str(field_name),
                            'type': str(field_type),
                            'object': field_obj
                        })
            except Exception as e:
                print(f"  ⚠ Chyba při čtení AcroForm polí: {e}")
        else:
            print("  ❌ PDF neobsahuje AcroForm dictionary")
        
        # Zkontroluj anotace na stránkách
        total_annotations = 0
        widget_annotations = 0
        
        for page_num, page in enumerate(reader.pages):
            page_annotations = []
            
            if "/Annots" in page:
                annotations = page["/Annots"]
                page_annotations = annotations
                total_annotations += len(annotations)
                
                for annot in annotations:
                    annot_obj = annot.get_object()
                    annot_type = annot_obj.get("/Subtype", "")
                    if annot_type == "/Widget":
                        widget_annotations += 1
                        
                        # Získej informace o poli
                        field_name = annot_obj.get("/T", "")
                        if not field_name and "/Parent" in annot_obj:
                            parent = annot_obj["/Parent"].get_object()
                            field_name = parent.get("/T", f"Widget_{widget_annotations}")
                        
                        if field_name and not any(f['name'] == str(field_name) for f in form_fields):
                            form_fields.append({
                                'name': str(field_name),
                                'type': 'Widget',
                                'page': page_num + 1,
                                'object': annot_obj
                            })
            
            if page_annotations:
                print(f"  📄 Stránka {page_num + 1}: {len(page_annotations)} anotací")
        
        print(f"  📊 Celkem anotací: {total_annotations}")
        print(f"  🎯 Widget anotací (formulářová pole): {widget_annotations}")
        
        # Výpis všech nalezených polí
        if form_fields:
            print(f"\n📝 NALEZENÁ FORMULÁŘOVÁ POLE ({len(form_fields)}):")
            print("-" * 60)
            
            for i, field in enumerate(form_fields, 1):
                print(f"{i:2d}. Název: '{field['name']}'")
                print(f"     Typ: {field['type']}")
                if 'page' in field:
                    print(f"     Stránka: {field['page']}")
                
                # Další detaily pole
                field_obj = field['object']
                if '/V' in field_obj:
                    current_value = field_obj['/V']
                    print(f"     Aktuální hodnota: '{current_value}'")
                if '/DV' in field_obj:
                    default_value = field_obj['/DV']
                    print(f"     Výchozí hodnota: '{default_value}'")
                
                print()
        else:
            print("\n❌ ŽÁDNÁ FORMULÁŘOVÁ POLE NEBYLA NALEZENA")
            print("   Možné příčiny:")
            print("   - PDF není formulář s vyplnitelnými poli")
            print("   - PDF má nestandardní strukturu")
            print("   - Pole jsou vytvořena jiným způsobem")
        
        # Doporučení
        print("\n💡 DOPORUČENÍ:")
        print("-" * 20)
        
        if form_fields:
            print("✅ PDF obsahuje formulářová pole - mělo by fungovat vyplňování")
            print("\n🔧 Pro použití v fill_pdf.py upravte mapování polí:")
            print("field_mapping = {")
            for field in form_fields[:10]:  # Zobraz jen prvních 10
                print(f"    'client_data_key': '{field['name']}',")
            if len(form_fields) > 10:
                print(f"    # ... a dalších {len(form_fields) - 10} polí")
            print("}")
        else:
            print("❌ PDF pravděpodobně není vyplnitelný formulář")
            print("   - Zkuste jiný PDF soubor s formulářovými poli")
            print("   - Použijte PDF editor k vytvoření formulářových polí")
            print("   - Zkontrolujte, zda PDF není chráněn heslem")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ CHYBA při analýze PDF: {e}")


def main():
    """
    Hlavní funkce analyzátoru.
    """
    print("🔍 PDF FORM ANALYZER")
    print("=" * 30)
    
    # Zkontroluj dostupné PDF soubory
    pdf_files = [f for f in os.listdir('.') if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("❌ Ve složce nejsou žádné PDF soubory.")
        print("   Umístěte PDF formulář do této složky a spusťte znovu.")
        return
    
    print(f"\n📁 Nalezené PDF soubory:")
    for i, pdf_file in enumerate(pdf_files, 1):
        size = os.path.getsize(pdf_file)
        print(f"  {i}. {pdf_file} ({size:,} bytů)")
    
    # Analýza template.pdf pokud existuje
    if "template.pdf" in pdf_files:
        print(f"\n🎯 Analyzuji template.pdf:")
        analyze_pdf_form("template.pdf")
    else:
        print(f"\n📝 template.pdf nebyl nalezen.")
        if pdf_files:
            print(f"   Analyzuji první dostupný PDF: {pdf_files[0]}")
            analyze_pdf_form(pdf_files[0])


if __name__ == "__main__":
    main()
