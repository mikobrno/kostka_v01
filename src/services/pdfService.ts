import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from '../utils/formatHelpers';

// Funkce pro převod českých znaků
const czechToAscii = (text: string): string => {
  const map: { [key: string]: string } = {
    'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e', 'í': 'i', 'ň': 'n',
    'ó': 'o', 'ř': 'r', 'š': 's', 'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z',
    'Á': 'A', 'Č': 'C', 'Ď': 'D', 'É': 'E', 'Ě': 'E', 'Í': 'I', 'Ň': 'N',
    'Ó': 'O', 'Ř': 'R', 'Š': 'S', 'Ť': 'T', 'Ú': 'U', 'Ů': 'U', 'Ý': 'Y', 'Ž': 'Z'
  };
  return text.replace(/[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, (match) => map[match] || match);
};

interface ClientData {
  // Žadatel
  applicant_title?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_maiden_name?: string;
  applicant_birth_number?: string;
  applicant_birth_date?: string;
  applicant_age?: number;
  applicant_marital_status?: string;
  applicant_permanent_address?: string;
  applicant_contact_address?: string;
  applicant_phone?: string;
  applicant_email?: string;
  applicant_housing_type?: string;
  
  // Spolužadatel
  co_applicant_title?: string;
  co_applicant_first_name?: string;
  co_applicant_last_name?: string;
  co_applicant_maiden_name?: string;
  co_applicant_birth_number?: string;
  co_applicant_birth_date?: string;
  co_applicant_age?: number;
  co_applicant_marital_status?: string;
  co_applicant_permanent_address?: string;
  co_applicant_contact_address?: string;
  co_applicant_phone?: string;
  co_applicant_email?: string;
  
  // Další data
  created_at?: string;
  id?: string;
}

interface EmployerData {
  id: string;
  ico?: string;
  company_name?: string;
  company_address?: string;
  net_income?: number;
  job_position?: string;
  employed_since?: string;
  contract_type?: string;
  employer_type: 'applicant' | 'co_applicant';
}

interface LiabilityData {
  id: string;
  institution?: string;
  type?: string;
  amount?: number;
  payment?: number;
  balance?: number;
  notes?: string;
}

interface PropertyData {
  address?: string;
  price?: number;
}

export class PDFService {
  private static setupFont(doc: jsPDF) {
    // Nastavení UTF-8 kódování pro správné zobrazení českých znaků
    doc.setFont('helvetica', 'normal');
    // Explicitly set the encoding to support Czech characters
    doc.setCharSpace(0);
  }

  private static formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ');
    } catch {
      return dateString;
    }
  }

  private static formatCurrency(amount?: number): string {
    if (!amount) return '';
    return formatNumber(amount) + ' Kč';
  }

  private static addHeader(doc: jsPDF, title: string) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(czechToAscii(title), 105, 25, { align: 'center' });
    
    // Datum vytvoření
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('cs-CZ');
    doc.text(czechToAscii(`Datum vytvoreni: ${today}`), 15, 35);
    
    // Linka pod hlavičkou
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);
  }

  private static addSection(doc: jsPDF, title: string, startY: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(czechToAscii(title), 15, startY);
    
    // Linka pod nadpisem sekce
    doc.setLineWidth(0.2);
    doc.line(15, startY + 2, 195, startY + 2);
    
    return startY + 10;
  }

  private static addPersonalInfo(doc: jsPDF, client: ClientData, startY: number, isCoApplicant = false): number {
    const prefix = isCoApplicant ? 'co_applicant_' : 'applicant_';
    const sectionTitle = isCoApplicant ? 'Spoluza datel' : 'Za datel';
    
    let currentY = this.addSection(doc, sectionTitle, startY);
    
    // Osobní údaje
    const personalData = [
      ['Titul:', (client as any)[`${prefix}title`] || ''],
      ['Jmeno:', (client as any)[`${prefix}first_name`] || ''],
      ['Pri jmeni:', (client as any)[`${prefix}last_name`] || ''],
      ['Rodne pri jmeni:', (client as any)[`${prefix}maiden_name`] || ''],
      ['Rodne ci slo:', (client as any)[`${prefix}birth_number`] || ''],
      ['Datum narozeni:', this.formatDate((client as any)[`${prefix}birth_date`])],
      ['Ve k:', (client as any)[`${prefix}age`] ? `${(client as any)[`${prefix}age`]} let` : ''],
      ['Rodinny stav:', (client as any)[`${prefix}marital_status`] || ''],
      ['Bydli ste:', (client as any)[`${prefix}housing_type`] || '']
    ].filter(([, value]) => value); // Filtruje prázdné hodnoty

    // Kontaktní údaje
    const contactData = [
      ['Trvala adresa:', (client as any)[`${prefix}permanent_address`] || ''],
      ['Koresponden ni adresa:', (client as any)[`${prefix}contact_address`] || ''],
      ['Telefon:', (client as any)[`${prefix}phone`] || ''],
      ['E-mail:', (client as any)[`${prefix}email`] || '']
    ].filter(([, value]) => value);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Vykreslení osobních údajů
    personalData.forEach(([, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(czechToAscii(personalData[index][0]), 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(czechToAscii(value), 70, currentY);
      currentY += 6;
    });

    if (contactData.length > 0) {
      currentY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(czechToAscii('Kontaktni udaje:'), 20, currentY);
      currentY += 8;

      contactData.forEach(([, value], idx) => {
        doc.setFont('helvetica', 'bold');
        doc.text(czechToAscii(contactData[idx][0]), 25, currentY);
        doc.setFont('helvetica', 'normal');
        // Rozdělení dlouhého textu na více řádků
        const splitText = doc.splitTextToSize(czechToAscii(value), 120);
        doc.text(splitText, 70, currentY);
        currentY += splitText.length * 6;
      });
    }

    return currentY + 10;
  }

  private static addEmployerInfo(doc: jsPDF, employers: EmployerData[], startY: number): number {
    if (!employers || employers.length === 0) return startY;

    let currentY = this.addSection(doc, 'Informace o zamestnavateli', startY);
    
    employers.forEach((employer) => {
      const employerTitle = employer.employer_type === 'applicant' ? 'Za datel' : 'Spoluza datel';
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(czechToAscii(`${employerTitle}:`), 20, currentY);
      currentY += 8;

      const employerData = [
        ['ICO:', employer.ico || ''],
        ['Nazev firmy:', employer.company_name || ''],
        ['Adresa firmy:', employer.company_address || ''],
        ['Pozice:', employer.job_position || ''],
        ['Typ smlouvy:', employer.contract_type || ''],
        ['Zamestnan od:', this.formatDate(employer.employed_since)],
        ['Ci sty pri jem:', this.formatCurrency(employer.net_income)]
      ].filter(([, value]) => value);

      doc.setFontSize(10);
      employerData.forEach(([, value], idx) => {
        doc.setFont('helvetica', 'bold');
        doc.text(czechToAscii(employerData[idx][0]), 25, currentY);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(czechToAscii(value), 120);
        doc.text(splitText, 70, currentY);
        currentY += splitText.length * 6;
      });

      currentY += 8;
    });

    return currentY + 5;
  }

  private static addPropertyInfo(doc: jsPDF, property: PropertyData, startY: number): number {
    if (!property || (!property.address && !property.price)) return startY;

    let currentY = this.addSection(doc, 'Informace o nemovitosti', startY);
    
    const propertyData = [
      ['Adresa:', property.address || ''],
      ['Kupni cena:', this.formatCurrency(property.price)]
    ].filter(([, value]) => value);

    doc.setFontSize(10);
    propertyData.forEach(([, value], idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(czechToAscii(propertyData[idx][0]), 20, currentY);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(czechToAscii(value), 120);
      doc.text(splitText, 70, currentY);
      currentY += splitText.length * 6;
    });

    // Orientační výpočet LTV
    if (property.price) {
      currentY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(czechToAscii('Orientacni vypocet:'), 20, currentY);
      currentY += 8;

      const ltv80 = property.price * 0.8;
      const ltv90 = property.price * 0.9;

      doc.setFont('helvetica', 'normal');
      doc.text(czechToAscii(`LTV 80%: ${this.formatCurrency(ltv80)}`), 25, currentY);
      currentY += 6;
      doc.text(czechToAscii(`LTV 90%: ${this.formatCurrency(ltv90)}`), 25, currentY);
      currentY += 6;
    }

    return currentY + 10;
  }

  private static addLiabilitiesInfo(doc: jsPDF, liabilities: LiabilityData[], startY: number): number {
    if (!liabilities || liabilities.length === 0) return startY;

    let currentY = this.addSection(doc, 'Zavazky', startY);

    // Tabulka závazků
    const tableData = liabilities.map((liability, index) => [
      (index + 1).toString(),
      czechToAscii(liability.institution || ''),
      czechToAscii(liability.type || ''),
      this.formatCurrency(liability.amount),
      this.formatCurrency(liability.payment),
      this.formatCurrency(liability.balance),
      czechToAscii(liability.notes || '')
    ]);

    const headers = [
      'c.',
      'Instituce',
      'Typ',
      'Vyse uveru',
      'Splatka',
      'Zustatek',
      'Poznamka'
    ];

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 50 }
      },
      margin: { left: 15, right: 15 },
      didDrawPage: function(data) {
        // Aktualizace currentY po vykreslení tabulky
        currentY = data.cursor?.y || currentY;
      }
    });

    // Součty závazků
    const totalAmount = liabilities.reduce((sum, liability) => sum + (liability.amount || 0), 0);
    const totalPayment = liabilities.reduce((sum, liability) => sum + (liability.payment || 0), 0);
    const totalBalance = liabilities.reduce((sum, liability) => sum + (liability.balance || 0), 0);

    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text(czechToAscii('Celkem:'), 120, currentY);
    doc.text(czechToAscii(this.formatCurrency(totalAmount)), 140, currentY);
    doc.text(czechToAscii(this.formatCurrency(totalPayment)), 165, currentY);
    doc.text(czechToAscii(this.formatCurrency(totalBalance)), 185, currentY);

    return currentY + 15;
  }

  static async generateClientPDF(
    client: ClientData,
    employers: EmployerData[] = [],
    liabilities: LiabilityData[] = [],
    property: PropertyData = {}
  ): Promise<void> {
    const doc = new jsPDF();
    this.setupFont(doc);

    // Hlavička
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    const title = `Klientsky profil - ${clientName || 'Novy klient'}`;
    this.addHeader(doc, title);

    let currentY = 50;

    // Žadatel
    currentY = this.addPersonalInfo(doc, client, currentY, false);

    // Kontrola, zda je potřeba nová stránka
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Spolužadatel (pokud existuje)
    if (client.co_applicant_first_name || client.co_applicant_last_name) {
      currentY = this.addPersonalInfo(doc, client, currentY, true);
    }

    // Kontrola, zda je potřeba nová stránka
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // Zaměstnavatel
    currentY = this.addEmployerInfo(doc, employers, currentY);

    // Kontrola, zda je potřeba nová stránka
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // Nemovitost
    currentY = this.addPropertyInfo(doc, property, currentY);

    // Kontrola, zda je potřeba nová stránka pro závazky
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }

    // Závazky
    this.addLiabilitiesInfo(doc, liabilities, currentY);

    // Stažení PDF
    const fileName = `klient_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  static async generateLiabilitiesPDF(liabilities: LiabilityData[]): Promise<void> {
    const doc = new jsPDF();
    this.setupFont(doc);

    this.addHeader(doc, 'Prehled zavazku');

    const currentY = this.addLiabilitiesInfo(doc, liabilities, 50);

    const fileName = `zavazky_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
