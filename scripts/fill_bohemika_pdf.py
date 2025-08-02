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
        # Načteme šablonu PDF
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Zkopírujeme všechny stránky
        for page in reader.pages:
            writer.add_page(page)
        
        # Mapování polí z form_data na PDF pole (podle skutečných názvů v PDF)
        field_mapping = {
            # Klient sekce
            'fill_1': form_data.get('fill_1', ''),  # Jméno a příjmení
            'fill_2': form_data.get('fill_2', ''),  # Rodné číslo
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
            'V': form_data.get('misto', 'Brně'),
            'dne': form_data.get('datum', ''),
        }
        
        # Vyplníme pole
        if "/AcroForm" in reader.trailer["/Root"]:
            writer.update_page_form_field_values(
                writer.pages[0], field_mapping
            )
        
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
        print("Usage: python fill_bohemika_pdf.py <json_data>")
        sys.exit(1)
    
    try:
        # Načteme JSON data z argumentu
        json_data = sys.argv[1]
        form_data = json.loads(json_data)
        
        # Najdeme šablonu PDF (v public složce)
        script_dir = Path(__file__).parent
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
