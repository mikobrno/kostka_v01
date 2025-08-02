#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generátor ukázkového PDF formuláře pro testování
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfbase import pdfform
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

def create_sample_pdf_form():
    """
    Vytvoří ukázkový PDF formulář s vyplnitelnými poli.
    """
    filename = "template.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    # Nastavení základních vlastností
    c.setTitle("Formulář žádosti o úvěr")
    c.setAuthor("PDF Form Generator")
    
    # Hlavička
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "FORMULÁŘ ŽÁDOSTI O ÚVĚR")
    
    # Sekce - Osobní údaje
    y_pos = height - 100
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_pos, "OSOBNÍ ÚDAJE")
    
    y_pos -= 30
    c.setFont("Helvetica", 10)
    
    # Jméno a příjmení
    c.drawString(50, y_pos, "Jméno a příjmení:")
    c.acroForm.textfield(
        name='fill_11',
        tooltip='Celé jméno klienta',
        x=180, y=y_pos-5, borderStyle='inset',
        width=300, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Rodné číslo
    c.drawString(50, y_pos, "Rodné číslo:")
    c.acroForm.textfield(
        name='fill_12',
        tooltip='Rodné číslo',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Adresa
    c.drawString(50, y_pos, "Adresa:")
    c.acroForm.textfield(
        name='Adresa',
        tooltip='Trvalé bydliště',
        x=180, y=y_pos-5, borderStyle='inset',
        width=300, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Telefon
    c.drawString(50, y_pos, "Telefon:")
    c.acroForm.textfield(
        name='Telefon',
        tooltip='Telefonní číslo',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Email
    c.drawString(50, y_pos, "Email:")
    c.acroForm.textfield(
        name='email',
        tooltip='E-mailová adresa',
        x=180, y=y_pos-5, borderStyle='inset',
        width=250, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    # Sekce - Informace o úvěru
    y_pos -= 60
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_pos, "INFORMACE O ÚVĚRU")
    
    y_pos -= 30
    c.setFont("Helvetica", 10)
    
    # Produkt
    c.drawString(50, y_pos, "Produkt:")
    c.acroForm.textfield(
        name='Produkt',
        tooltip='Typ úvěru',
        x=180, y=y_pos-5, borderStyle='inset',
        width=200, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Výše úvěru
    c.drawString(50, y_pos, "Výše úvěru:")
    c.acroForm.textfield(
        name='fill_21',
        tooltip='Požadovaná suma',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Suma zajištění
    c.drawString(50, y_pos, "Suma zajištění:")
    c.acroForm.textfield(
        name='fill_22',
        tooltip='Zajištění úvěru',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # LTV
    c.drawString(50, y_pos, "LTV:")
    c.acroForm.textfield(
        name='LTV',
        tooltip='Loan to Value ratio',
        x=180, y=y_pos-5, borderStyle='inset',
        width=100, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Účel úvěru
    c.drawString(50, y_pos, "Účel úvěru:")
    c.acroForm.textfield(
        name='fill_24',
        tooltip='Účel použití úvěru',
        x=180, y=y_pos-5, borderStyle='inset',
        width=250, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Měsíční splátka
    c.drawString(50, y_pos, "Měsíční splátka:")
    c.acroForm.textfield(
        name='fill_25',
        tooltip='Očekávaná splátka',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    y_pos -= 30
    # Datum podpisu úvěru
    c.drawString(50, y_pos, "Datum podpisu úvěru:")
    c.acroForm.textfield(
        name='fill_26',
        tooltip='Datum podpisu smlouvy',
        x=180, y=y_pos-5, borderStyle='inset',
        width=150, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    # Sekce - Podpis
    y_pos -= 60
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_pos, "PODPIS")
    
    y_pos -= 30
    c.setFont("Helvetica", 10)
    
    # Místo
    c.drawString(50, y_pos, "V:")
    c.acroForm.textfield(
        name='V',
        tooltip='Místo podpisu',
        x=80, y=y_pos-5, borderStyle='inset',
        width=100, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    # Datum
    c.drawString(250, y_pos, "dne:")
    c.acroForm.textfield(
        name='dne',
        tooltip='Datum podpisu',
        x=280, y=y_pos-5, borderStyle='inset',
        width=100, height=20,
        textColor=colors.black,
        fillColor=colors.white,
        fontSize=10
    )
    
    # Místo pro podpis
    y_pos -= 50
    c.drawString(50, y_pos, "Podpis žadatele:")
    c.line(180, y_pos-5, 450, y_pos-5)
    
    # Patička
    c.setFont("Helvetica", 8)
    c.drawString(50, 50, "Tento formulář byl vygenerován automaticky pro testovací účely.")
    
    # Uložení PDF
    c.save()
    print(f"✅ Ukázkový PDF formulář byl vytvořen: {filename}")
    return filename

if __name__ == "__main__":
    create_sample_pdf_form()
