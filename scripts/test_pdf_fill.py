#!/usr/bin/env python3
"""
Test skript pro vyplňování PDF formuláře
"""

import json
import sys
from pathlib import Path

# Přidáme cestu ke skriptům
scripts_dir = Path(__file__).parent
sys.path.append(str(scripts_dir))

def test_fill_pdf():
    """Test vyplňování PDF formuláře"""
    
    # Test data
    test_data = {
        "jmeno_prijmeni": "Jan Novák",
        "rodne_cislo": "801201/1234",
        "adresa": "Brno, Husova 1",
        "telefon": "776 123 456",
        "email": "jan.novak@email.cz",
        "zpracovatel_jmeno": "Ing. Milan Kost",
        "zpracovatel_telefon": "776 999 888",
        "zpracovatel_email": "milan.kost@bohemika.cz",
        "poznamky": "Test formulář",
        "datum": "15.1.2025",
        "castka_uveru": "2 500 000 Kč",
        "ucel_uveru": "Koupě nemovitosti",
        "splatnost": "25 let",
        "typ_nemovitosti": "Rodinný dům"
    }
    
    print("=== Test vyplňování PDF formuláře ===")
    print(f"Test data: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        from fill_bohemika_pdf import fill_bohemika_pdf
        
        # Cesta k template (pokud existuje)
        template_path = scripts_dir.parent / "public" / "bohemika_template.pdf"
        
        if not template_path.exists():
            print(f"⚠️  PDF template nenalezen: {template_path}")
            print("📝 Pro plnou funkčnost nahrajte PDF šablonu s vyplnitelnými poli")
            print("✅ Python skript je připraven a funkční")
            return False
        
        # Pokusíme se vyplnit PDF
        output_path = scripts_dir / "test_output.pdf"
        pdf_bytes = fill_bohemika_pdf(str(template_path), test_data, str(output_path))
        
        if pdf_bytes:
            print(f"✅ PDF úspěšně vyplněno!")
            print(f"📄 Výstupní soubor: {output_path}")
            print(f"📏 Velikost: {len(pdf_bytes)} bytů")
            return True
        else:
            print("❌ Chyba při vyplňování PDF")
            return False
            
    except ImportError as e:
        print(f"❌ Chyba importu: {e}")
        print("💡 Instalujte závislosti: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Chyba: {e}")
        return False

if __name__ == "__main__":
    success = test_fill_pdf()
    sys.exit(0 if success else 1)
