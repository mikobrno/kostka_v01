import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from '../utils/formatHelpers';

interface ClientData {
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

export class HybridPDFService {
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

  // Funkce pro lepší handling českých znaků
  private static encodeText(text?: string): string {
    if (!text) return '';
    
    // Použijeme escape sekvence pro problematické znaky
    return text
      .replace(/ě/g, 'e')
      .replace(/š/g, 's')
      .replace(/č/g, 'c')
      .replace(/ř/g, 'r')
      .replace(/ž/g, 'z')
      .replace(/ý/g, 'y')
      .replace(/á/g, 'a')
      .replace(/í/g, 'i')
      .replace(/é/g, 'e')
      .replace(/ů/g, 'u')
      .replace(/ú/g, 'u')
      .replace(/ň/g, 'n')
      .replace(/ť/g, 't')
      .replace(/ď/g, 'd')
      .replace(/Ě/g, 'E')
      .replace(/Š/g, 'S')
      .replace(/Č/g, 'C')
      .replace(/Ř/g, 'R')
      .replace(/Ž/g, 'Z')
      .replace(/Ý/g, 'Y')
      .replace(/Á/g, 'A')
      .replace(/Í/g, 'I')
      .replace(/É/g, 'E')
      .replace(/Ů/g, 'U')
      .replace(/Ú/g, 'U')
      .replace(/Ň/g, 'N')
      .replace(/Ť/g, 'T')
      .replace(/Ď/g, 'D');
  }

  private static setupDoc(): jsPDF {
    const doc = new jsPDF();
    
    // Použijeme Courier font - má lepší podporu znaků
    doc.setFont('courier', 'normal');
    
    return doc;
  }

  static async generateClientPDF(
    client: ClientData,
    employers: EmployerData[] = [],
    liabilities: LiabilityData[] = [],
    property: PropertyData = {}
  ): Promise<void> {
    const doc = this.setupDoc();
    
    // Hlavička
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    const title = this.encodeText(`Klientsky profil - ${clientName || 'Novy klient'}`);
    
    doc.setFontSize(20);
    doc.setFont('courier', 'bold');
    doc.text(title, 105, 25, { align: 'center' });
    
    // Datum
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    const today = new Date().toLocaleDateString('cs-CZ');
    doc.text(this.encodeText(`Datum vytvoreni: ${today}`), 15, 35);
    
    // Linka
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);
    
    let currentY = 50;

    // Žadatel
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text(this.encodeText('Zadatel'), 15, currentY);
    currentY += 10;

    // Osobní údaje žadatele
    const applicantData = [
      ['Titul:', client.applicant_title],
      ['Jmeno:', client.applicant_first_name],
      ['Prijmeni:', client.applicant_last_name],
      ['Rodne prijmeni:', client.applicant_maiden_name],
      ['Rodne cislo:', client.applicant_birth_number],
      ['Datum narozeni:', this.formatDate(client.applicant_birth_date)],
      ['Vek:', client.applicant_age ? `${client.applicant_age} let` : ''],
      ['Rodinny stav:', client.applicant_marital_status],
      ['Bydliste:', client.applicant_housing_type],
    ].filter(([, value]) => value);

    // Kontaktní údaje žadatele
    const contactData = [
      ['Trvala adresa:', client.applicant_permanent_address],
      ['Korespodencni adresa:', client.applicant_contact_address],
      ['Telefon:', client.applicant_phone],
      ['E-mail:', client.applicant_email],
    ].filter(([, value]) => value);

    // Vykreslení osobních údajů
    doc.setFontSize(10);
    applicantData.forEach(([label, value]) => {
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText(label), 20, currentY);
      doc.setFont('courier', 'normal');
      doc.text(this.encodeText(value || ''), 70, currentY);
      currentY += 6;
    });

    // Kontaktní údaje
    if (contactData.length > 0) {
      currentY += 5;
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText('Kontaktni udaje:'), 20, currentY);
      currentY += 8;

      contactData.forEach(([label, value]) => {
        doc.setFont('courier', 'bold');
        doc.text(this.encodeText(label), 25, currentY);
        doc.setFont('courier', 'normal');
        const encodedValue = this.encodeText(value || '');
        const splitText = doc.splitTextToSize(encodedValue, 120);
        doc.text(splitText, 70, currentY);
        currentY += splitText.length * 6;
      });
    }

    // Spolužadatel
    if (client.co_applicant_first_name || client.co_applicant_last_name) {
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText('Spoluzadatel'), 15, currentY);
      currentY += 10;

      const coApplicantData = [
        ['Titul:', client.co_applicant_title],
        ['Jmeno:', client.co_applicant_first_name],
        ['Prijmeni:', client.co_applicant_last_name],
        ['Rodne prijmeni:', client.co_applicant_maiden_name],
        ['Rodne cislo:', client.co_applicant_birth_number],
        ['Datum narozeni:', this.formatDate(client.co_applicant_birth_date)],
        ['Vek:', client.co_applicant_age ? `${client.co_applicant_age} let` : ''],
        ['Rodinny stav:', client.co_applicant_marital_status],
      ].filter(([, value]) => value);

      doc.setFontSize(10);
      coApplicantData.forEach(([label, value]) => {
        doc.setFont('courier', 'bold');
        doc.text(this.encodeText(label), 20, currentY);
        doc.setFont('courier', 'normal');
        doc.text(this.encodeText(value || ''), 70, currentY);
        currentY += 6;
      });
    }

    // Zaměstnavatelé
    if (employers.length > 0) {
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText('Informace o zamestnavateli'), 15, currentY);
      currentY += 10;

      employers.forEach((employer) => {
        const employerTitle = employer.employer_type === 'applicant' ? 'Zadatel' : 'Spoluzadatel';
        
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.text(this.encodeText(`${employerTitle}:`), 20, currentY);
        currentY += 8;

        const employerData = [
          ['ICO:', employer.ico],
          ['Nazev firmy:', employer.company_name],
          ['Adresa firmy:', employer.company_address],
          ['Pozice:', employer.job_position],
          ['Typ smlouvy:', employer.contract_type],
          ['Zamestnan od:', this.formatDate(employer.employed_since)],
          ['Cisty prijem:', this.formatCurrency(employer.net_income)]
        ].filter(([, value]) => value);

        doc.setFontSize(10);
        employerData.forEach(([label, value]) => {
          doc.setFont('courier', 'bold');
          doc.text(this.encodeText(label), 25, currentY);
          doc.setFont('courier', 'normal');
          const encodedValue = this.encodeText(value || '');
          const splitText = doc.splitTextToSize(encodedValue, 120);
          doc.text(splitText, 70, currentY);
          currentY += splitText.length * 6;
        });
        currentY += 8;
      });
    }

    // Nemovitost
    if (property.address || property.price) {
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText('Informace o nemovitosti'), 15, currentY);
      currentY += 10;

      const propertyData = [
        ['Adresa:', property.address],
        ['Kupni cena:', this.formatCurrency(property.price)]
      ].filter(([, value]) => value);

      doc.setFontSize(10);
      propertyData.forEach(([label, value]) => {
        doc.setFont('courier', 'bold');
        doc.text(this.encodeText(label), 20, currentY);
        doc.setFont('courier', 'normal');
        const encodedValue = this.encodeText(value || '');
        const splitText = doc.splitTextToSize(encodedValue, 120);
        doc.text(splitText, 70, currentY);
        currentY += splitText.length * 6;
      });

      // LTV výpočet
      if (property.price) {
        currentY += 5;
        doc.setFont('courier', 'bold');
        doc.text(this.encodeText('Orientacni vypocet:'), 20, currentY);
        currentY += 8;

        const ltv80 = property.price * 0.8;
        const ltv90 = property.price * 0.9;

        doc.setFont('courier', 'normal');
        doc.text(this.encodeText(`LTV 80%: ${this.formatCurrency(ltv80)}`), 25, currentY);
        currentY += 6;
        doc.text(this.encodeText(`LTV 90%: ${this.formatCurrency(ltv90)}`), 25, currentY);
        currentY += 6;
      }
    }

    // Závazky
    if (liabilities.length > 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.text(this.encodeText('Zavazky'), 15, currentY);
      currentY += 10;

      // Tabulka závazků pomocí autoTable
      const tableData = liabilities.map((liability, index) => [
        (index + 1).toString(),
        this.encodeText(liability.institution || ''),
        this.encodeText(liability.type || ''),
        this.formatCurrency(liability.amount),
        this.formatCurrency(liability.payment),
        this.formatCurrency(liability.balance),
        this.encodeText(liability.notes || '')
      ]);

      const headers = [
        this.encodeText('c.'),
        this.encodeText('Instituce'),
        this.encodeText('Typ'),
        this.encodeText('Vyse uveru'),
        this.encodeText('Splatka'),
        this.encodeText('Zustatek'),
        this.encodeText('Poznamka')
      ];

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: 'courier'
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
        margin: { left: 15, right: 15 }
      });
    }

    // Stažení PDF
    const fileName = `klient_${this.encodeText(clientName).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  static async generateLiabilitiesPDF(liabilities: LiabilityData[]): Promise<void> {
    const doc = this.setupDoc();

    // Hlavička
    doc.setFontSize(20);
    doc.setFont('courier', 'bold');
    doc.text(this.encodeText('Prehled zavazku'), 105, 25, { align: 'center' });

    // Datum
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    const today = new Date().toLocaleDateString('cs-CZ');
    doc.text(this.encodeText(`Datum vytvoreni: ${today}`), 15, 35);

    // Tabulka
    const tableData = liabilities.map((liability, index) => [
      (index + 1).toString(),
      this.encodeText(liability.institution || ''),
      this.encodeText(liability.type || ''),
      this.formatCurrency(liability.amount),
      this.formatCurrency(liability.payment),
      this.formatCurrency(liability.balance),
      this.encodeText(liability.notes || '')
    ]);

    const headers = [
      this.encodeText('c.'),
      this.encodeText('Instituce'),
      this.encodeText('Typ'),
      this.encodeText('Vyse uveru'),
      this.encodeText('Splatka'),
      this.encodeText('Zustatek'),
      this.encodeText('Poznamka')
    ];

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'courier'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    const fileName = `zavazky_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
