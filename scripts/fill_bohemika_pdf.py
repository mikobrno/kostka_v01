#!/usr/bin/env python3
"""
Skript pro vyplňování Bohemika PDF formuláře
Používá pypdf knihovnu pro vyplnění vyplnitelných polí v PDF
"""

import sys
import json
import base64
from pathlib import Path
import tempfile
import os

try:
    import pypdf
    from pypdf import PdfWriter, PdfReader
except ImportError:
    print("Error: pypdf library not installed. Run: pip install pypdf")
    sys.exit(1)

def fill_bohemika_pdf(form_data, template_path, output_path):
    """
    Vyplní Bohemika PDF formulář s poskytnutými daty
    
    Args:
        form_data (dict): Data pro vyplnění formuláře
        template_path (str): Cesta k šabloně PDF
        output_path (str): Cesta k výstupnímu souboru
    """
    try:
        print(f"DEBUG: Reading template from: {template_path}", file=sys.stderr)
        # Načteme šablonu PDF
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        print(f"DEBUG: Template has {len(reader.pages)} pages", file=sys.stderr)
        
        # Zkopírujeme všechny stránky
        for page in reader.pages:
            writer.add_page(page)
        
        # Zjistíme dostupná pole v PDF
        if "/AcroForm" in reader.trailer["/Root"]:
            acro_form = reader.trailer["/Root"]["/AcroForm"]
            if "/Fields" in acro_form:
                fields = acro_form["/Fields"]
                print(f"DEBUG: Found {len(fields)} fields in PDF", file=sys.stderr)
                for field in fields:
                    field_obj = field.get_object()
                    if "/T" in field_obj:
                        field_name = field_obj["/T"]
                        print(f"DEBUG: Field name: {field_name}", file=sys.stderr)
        else:
            print("DEBUG: No AcroForm found in PDF", file=sys.stderr)
        
        # Mapování polí z form_data na PDF pole (podle skutečných názvů v PDF)
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
        
        # Vyplníme pole - zkusíme různé metody
        try:
            # Nejdříve zkopírujeme form data z readeru do writeru
            if "/AcroForm" in reader.trailer["/Root"]:
                writer.clone_reader_document_root(reader)
                # Nyní zkusíme vyplnit pole
                for page_num in range(len(writer.pages)):
                    page = writer.pages[page_num]
                    writer.update_page_form_field_values(page, field_mapping)
                print("DEBUG: Used update_page_form_field_values with cloned form", file=sys.stderr)
            else:
                print("DEBUG: No AcroForm found in PDF - cannot fill fields", file=sys.stderr)
                return False
        except Exception as e:
            print(f"DEBUG: Form filling failed: {e}", file=sys.stderr)
            print("DEBUG: Continuing without field filling - saving empty PDF", file=sys.stderr)
        
        # Uložíme výsledek
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
            
        return True
        
    except Exception as e:
        print(f"Error filling PDF: {e}")
        return False

def main():
    """Hlavní funkce pro CLI použití"""
    if len(sys.argv) < 2:
        print("Usage: python fill_bohemika_pdf.py <json_file_or_json_data>")
        sys.exit(1)
    
    try:
        # Načteme JSON data z argumentu (buď soubor nebo přímo JSON string)
        arg = sys.argv[1]
        if os.path.isfile(arg):
            # Je to soubor - načteme z něj
            with open(arg, 'r', encoding='utf-8') as f:
                form_data = json.load(f)
            print(f"DEBUG: Loaded data from file: {arg}", file=sys.stderr)
        else:
            # Je to JSON string
            form_data = json.loads(arg)
            print(f"DEBUG: Parsed JSON string", file=sys.stderr)
        
        print(f"DEBUG: Form data: {form_data}", file=sys.stderr)
        
        # Najdeme šablonu PDF (v public složce)
        script_dir = Path(__file__).parent
        template_path = script_dir.parent / "public" / "bohemika_template.pdf"
        print(f"DEBUG: Template path: {template_path}", file=sys.stderr)
        print(f"DEBUG: Template exists: {template_path.exists()}", file=sys.stderr)
        template_path = script_dir.parent / "public" / "bohemika_template.pdf"
        
        if not template_path.exists():
            print(f"Error: Template not found at {template_path}")
            sys.exit(1)
        
        # Vytvoříme dočasný výstupní soubor
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            output_path = temp_file.name
        
        # Vyplníme PDF
        success = fill_bohemika_pdf(form_data, str(template_path), output_path)
        
        if success:
            # Přečteme vyplněný PDF a vrátíme jako base64
            with open(output_path, 'rb') as f:
                pdf_content = f.read()
                pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                print(pdf_base64)
        else:
            print("Error: Failed to fill PDF")
            sys.exit(1)
            
        # Vyčistíme dočasný soubor
        os.unlink(output_path)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
