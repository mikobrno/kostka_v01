#!/usr/bin/env python3
"""
PDF formulář filler používající PyMuPDF (fitz) pro vyplňování Bohemika formulářů
"""

import sys
import json
import base64
import os
import fitz  # PyMuPDF

def fill_pdf_with_fitz(template_path, output_path, form_data):
    """
    Vyplní PDF formulář pomocí PyMuPDF
    
    Args:
        template_path (str): Cesta k šabloně PDF
        output_path (str): Cesta k výstupnímu souboru
        form_data (dict): Data pro vyplnění formuláře
    """
    try:
        print(f"DEBUG: Reading template from: {template_path}", file=sys.stderr)
        
        # Otevřeme PDF
        doc = fitz.open(template_path)
        print(f"DEBUG: Template has {len(doc)} pages", file=sys.stderr)
        
        # Najdeme všechna pole
        for page_num in range(len(doc)):
            page = doc[page_num]
            widgets = list(page.widgets())
            print(f"DEBUG: Page {page_num} has {len(widgets)} widgets", file=sys.stderr)
            
            for widget in widgets:
                print(f"DEBUG: Widget field name: '{widget.field_name}', type: {widget.field_type}", file=sys.stderr)
        
        # Mapování polí
        field_mapping = {
            # Klient sekce
            'fill_11': form_data.get('fill_11', ''),  # Jméno a příjmení
            'fill_12': form_data.get('fill_12', ''),  # Rodné číslo
            'Adresa': form_data.get('Adresa', ''),
            'Telefon': form_data.get('Telefon', ''),
            'email': form_data.get('email', ''),
            
            # Zpracovatel sekce
            'fill_16': form_data.get('fill_16', 'Ing. Milan Kost'),
            'fill_17': form_data.get('fill_17', '8680020061'),
            
            # Úvěr sekce
            'fill_10': form_data.get('fill_10', ''),  # Číslo smlouvy
            'Produkt': form_data.get('Produkt', ''),
            'fill_21': form_data.get('fill_21', ''),  # Výše úvěru
            'fill_22': form_data.get('fill_22', ''),  # Suma zajištění
            'LTV': form_data.get('LTV', ''),
            'fill_24': form_data.get('fill_24', ''),  # Účel úvěru
            'fill_25': form_data.get('fill_25', ''),  # Měsíční splátka
            'fill_26': form_data.get('fill_26', ''),  # Datum podpisu úvěru
            
            # Datum a místo
            'V': form_data.get('V', 'Brno'),
            'dne': form_data.get('dne', ''),
        }
        
        print(f"DEBUG: Trying to fill fields: {list(field_mapping.keys())}", file=sys.stderr)
        
        # Vyplníme pole
        filled_count = 0
        for page_num in range(len(doc)):
            page = doc[page_num]
            widgets = list(page.widgets())
            
            for widget in widgets:
                field_name = widget.field_name
                if field_name in field_mapping:
                    value = field_mapping[field_name]
                    if value:
                        try:
                            widget.field_value = str(value)
                            widget.update()
                            filled_count += 1
                            print(f"DEBUG: Filled field '{field_name}' with value '{value}'", file=sys.stderr)
                        except Exception as e:
                            print(f"DEBUG: Failed to fill field '{field_name}': {e}", file=sys.stderr)
        
        print(f"DEBUG: Successfully filled {filled_count} fields", file=sys.stderr)
        
        # Uložíme PDF
        doc.save(output_path)
        doc.close()
        
        print(f"DEBUG: PDF saved to: {output_path}", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return False

def main():
    """Hlavní funkce pro CLI použití"""
    if len(sys.argv) < 2:
        print("Usage: python fill_bohemika_pdf_fitz.py <json_file_or_json_data>")
        sys.exit(1)
    
    try:
        # Načteme JSON data z argumentu (buď soubor nebo přímo JSON string)
        json_input = sys.argv[1]
        
        if os.path.isfile(json_input):
            # Je to soubor
            with open(json_input, 'r', encoding='utf-8') as f:
                form_data = json.load(f)
        else:
            # Je to JSON string
            form_data = json.loads(json_input)
        
        print(f"DEBUG: Loaded form data: {form_data}", file=sys.stderr)
        
        # Cesty k souborům
        template_path = "public/bohemika_template.pdf"
        output_path = "temp_filled.pdf"
        
        # Vyplníme PDF
        success = fill_pdf_with_fitz(template_path, output_path, form_data)
        
        if success and os.path.exists(output_path):
            # Přečteme a zakódujeme do base64
            with open(output_path, "rb") as f:
                pdf_content = f.read()
                encoded = base64.b64encode(pdf_content).decode('utf-8')
                print(encoded)  # Výstup pro frontend
            
            # Smažeme dočasný soubor
            os.remove(output_path)
        else:
            print("ERROR: Failed to generate PDF", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
