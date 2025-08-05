#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test PDF knihoven - zkontroluje dostupnost knihoven pro práci s PDF
"""

def test_pdf_libraries():
    """
    Testuje dostupnost různých PDF knihoven.
    """
    print("🔍 Testování dostupnosti PDF knihoven")
    print("=" * 50)
    
    libraries = [
        ("pypdf", "from pypdf import PdfReader, PdfWriter"),
        ("PyPDF2", "from PyPDF2 import PdfReader, PdfWriter"),
        ("PyPDF4", "from PyPDF4 import PdfReader, PdfWriter"),
        ("reportlab", "from reportlab.pdfgen import canvas"),
        ("fpdf", "from fpdf import FPDF"),
    ]
    
    available_libs = []
    
    for lib_name, import_statement in libraries:
        try:
            exec(import_statement)
            print(f"✅ {lib_name:<12} - DOSTUPNÁ")
            available_libs.append(lib_name)
        except ImportError:
            print(f"❌ {lib_name:<12} - NENÍ NAINSTALOVÁNA")
    
    print("\n" + "=" * 50)
    
    if available_libs:
        print(f"📦 Dostupné knihovny: {', '.join(available_libs)}")
        
        # Doporučení na základě dostupných knihoven
        if "pypdf" in available_libs:
            print("💡 DOPORUČENÍ: Použijte fill_pdf.py (pypdf verze)")
        elif "PyPDF2" in available_libs:
            print("💡 DOPORUČENÍ: Použijte fill_pdf_pypdf2.py (PyPDF2 verze)")
        else:
            print("💡 DOPORUČENÍ: Nainstalujte pypdf nebo PyPDF2")
            print("   pip install pypdf")
            print("   # nebo")
            print("   pip install PyPDF2")
    else:
        print("❌ Žádná PDF knihovna není dostupná!")
        print("\n📦 Instalační příkazy:")
        print("   pip install pypdf")
        print("   pip install PyPDF2")
        print("   pip install reportlab")


def install_recommendations():
    """
    Zobrazí doporučení pro instalaci knihoven.
    """
    print("\n🚀 INSTALAČNÍ PŘÍKAZY")
    print("=" * 30)
    print("Hlavní knihovny pro práci s PDF:")
    print("")
    print("1. pypdf (doporučená):")
    print("   pip install pypdf")
    print("")
    print("2. PyPDF2 (alternativa):")
    print("   pip install PyPDF2")
    print("")
    print("3. reportlab (pro vytváření PDF):")
    print("   pip install reportlab")
    print("")
    print("4. Všechny najednou:")
    print("   pip install pypdf PyPDF2 reportlab")


if __name__ == "__main__":
    test_pdf_libraries()
    install_recommendations()
    
    print("\n" + "🔧 DALŠÍ KROKY" + "=" * 35)
    print("1. Nainstalujte požadované knihovny")
    print("2. Umístěte template.pdf do této složky")
    print("3. Spusťte fill_pdf.py nebo fill_pdf_pypdf2.py")
    print("=" * 50)
