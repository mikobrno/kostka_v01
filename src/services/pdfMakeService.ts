import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatNumber } from '../utils/formatHelpers';

// Nastavení fontů pro pdfMake s lepší podporou českých znaků
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

// Explicitní registrace fontů s UTF-8 podporou
(pdfMake as any).fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

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

export class PDFMakeService {
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

  static async generateClientPDF(
    client: ClientData,
    employers: EmployerData[] = [],
    liabilities: LiabilityData[] = [],
    property: PropertyData = {}
  ): Promise<void> {
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    const today = new Date().toLocaleDateString('cs-CZ');

    // Vytvoření dokumentu
    const docDefinition = {
      content: [
        // Hlavička s lepším formátováním
        {
          text: `Klientský profil - ${clientName || 'Nový klient'}`,
          style: 'header',
          alignment: 'center' as const,
          margin: [0, 0, 0, 5] as [number, number, number, number]
        },
        {
          text: `Datum vytvoření: ${today}`,
          style: 'subheader',
          alignment: 'center' as const,
          margin: [0, 0, 0, 20] as [number, number, number, number]
        },

        // Žadatel s lepším layoutem
        {
          text: 'Žadatel',
          style: 'sectionHeader'
        },
        {
          table: {
            widths: ['25%', '75%'],
            body: [
              ...(client.applicant_title ? [['Titul:', { text: client.applicant_title, style: 'tableValue' }]] : []),
              ...(client.applicant_first_name ? [['Jméno:', { text: client.applicant_first_name, style: 'tableValue' }]] : []),
              ...(client.applicant_last_name ? [['Příjmení:', { text: client.applicant_last_name, style: 'tableValue' }]] : []),
              ...(client.applicant_maiden_name ? [['Rodné příjmení:', { text: client.applicant_maiden_name, style: 'tableValue' }]] : []),
              ...(client.applicant_birth_number ? [['Rodné číslo:', { text: client.applicant_birth_number, style: 'tableValue' }]] : []),
              ...(client.applicant_birth_date ? [['Datum narození:', { text: this.formatDate(client.applicant_birth_date), style: 'tableValue' }]] : []),
              ...(client.applicant_age ? [['Věk:', { text: `${client.applicant_age} let`, style: 'tableValue' }]] : []),
              ...(client.applicant_marital_status ? [['Rodinný stav:', { text: client.applicant_marital_status, style: 'tableValue' }]] : []),
              ...(client.applicant_housing_type ? [['Bydliště:', { text: client.applicant_housing_type, style: 'tableValue' }]] : []),
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 0 : 0.5;
            },
            vLineWidth: function() { return 0; },
            hLineColor: function() { return '#e2e8f0'; },
            paddingLeft: function() { return 8; },
            paddingRight: function() { return 8; },
            paddingTop: function() { return 4; },
            paddingBottom: function() { return 4; }
          },
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },

        // Kontaktní údaje
        ...(client.applicant_permanent_address || client.applicant_phone || client.applicant_email ? [
          {
            text: 'Kontaktní údaje:',
            style: 'subsectionHeader'
          },
          {
            table: {
              widths: ['30%', '70%'],
              body: [
                ...(client.applicant_permanent_address ? [['Trvalá adresa:', client.applicant_permanent_address]] : []),
                ...(client.applicant_contact_address ? [['Korespondenční adresa:', client.applicant_contact_address]] : []),
                ...(client.applicant_phone ? [['Telefon:', client.applicant_phone]] : []),
                ...(client.applicant_email ? [['E-mail:', client.applicant_email]] : []),
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          }
        ] : []),

        // Spolužadatel (pokud existuje)
        ...(client.co_applicant_first_name || client.co_applicant_last_name ? [
          {
            text: 'Spolužadatel',
            style: 'sectionHeader'
          },
          {
            table: {
              widths: ['30%', '70%'],
              body: [
                ...(client.co_applicant_title ? [['Titul:', client.co_applicant_title]] : []),
                ...(client.co_applicant_first_name ? [['Jméno:', client.co_applicant_first_name]] : []),
                ...(client.co_applicant_last_name ? [['Příjmení:', client.co_applicant_last_name]] : []),
                ...(client.co_applicant_maiden_name ? [['Rodné příjmení:', client.co_applicant_maiden_name]] : []),
                ...(client.co_applicant_birth_number ? [['Rodné číslo:', client.co_applicant_birth_number]] : []),
                ...(client.co_applicant_birth_date ? [['Datum narození:', this.formatDate(client.co_applicant_birth_date)]] : []),
                ...(client.co_applicant_age ? [['Věk:', `${client.co_applicant_age} let`]] : []),
                ...(client.co_applicant_marital_status ? [['Rodinný stav:', client.co_applicant_marital_status]] : []),
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          }
        ] : []),

        // Zaměstnavatelé
        ...(employers.length > 0 ? [
          {
            text: 'Informace o zaměstnavateli',
            style: 'sectionHeader'
          },
          ...employers.map(emp => ({
            table: {
              widths: ['30%', '70%'],
              body: [
                ['Typ:', emp.employer_type === 'applicant' ? 'Žadatel' : 'Spolužadatel'],
                ...(emp.ico ? [['IČO:', emp.ico]] : []),
                ...(emp.company_name ? [['Název firmy:', emp.company_name]] : []),
                ...(emp.company_address ? [['Adresa firmy:', emp.company_address]] : []),
                ...(emp.job_position ? [['Pozice:', emp.job_position]] : []),
                ...(emp.contract_type ? [['Typ smlouvy:', emp.contract_type]] : []),
                ...(emp.employed_since ? [['Zaměstnán od:', this.formatDate(emp.employed_since)]] : []),
                ...(emp.net_income ? [['Čistý příjem:', this.formatCurrency(emp.net_income)]] : []),
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 15] as [number, number, number, number]
          }))
        ] : []),

        // Nemovitost
        ...(property.address || property.price ? [
          {
            text: 'Informace o nemovitosti',
            style: 'sectionHeader'
          },
          {
            table: {
              widths: ['30%', '70%'],
              body: [
                ...(property.address ? [['Adresa:', property.address]] : []),
                ...(property.price ? [['Kupní cena:', this.formatCurrency(property.price)]] : []),
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 15] as [number, number, number, number]
          },

          // LTV výpočet
          ...(property.price ? [
            {
              text: 'Orientační výpočet:',
              style: 'subsectionHeader'
            },
            {
              table: {
                widths: ['30%', '70%'],
                body: [
                  ['LTV 80%:', this.formatCurrency(property.price * 0.8)],
                  ['LTV 90%:', this.formatCurrency(property.price * 0.9)],
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 20] as [number, number, number, number]
            }
          ] : [])
        ] : []),

        // Závazky
        ...(liabilities.length > 0 ? [
          {
            text: 'Závazky',
            style: 'sectionHeader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', '*'],
              body: [
                ['č.', 'Instituce', 'Typ', 'Výše úvěru', 'Splátka', 'Zůstatek', 'Poznámka'],
                ...liabilities.map((liability, index) => [
                  (index + 1).toString(),
                  liability.institution || '',
                  liability.type || '',
                  this.formatCurrency(liability.amount),
                  this.formatCurrency(liability.payment),
                  this.formatCurrency(liability.balance),
                  liability.notes || ''
                ])
              ]
            },
            layout: {
              fillColor: function(rowIndex: number) {
                return (rowIndex === 0) ? '#CCE5FF' : null;
              }
            }
          }
        ] : [])
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10] as [number, number, number, number],
          color: '#1a365d'
        },
        subheader: {
          fontSize: 10,
          italics: true,
          color: '#4a5568'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 8] as [number, number, number, number],
          color: '#2d3748',
          fillColor: '#edf2f7',
          decoration: 'underline' as const
        },
        subsectionHeader: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5] as [number, number, number, number],
          color: '#4a5568'
        },
        tableLabel: {
          bold: true,
          color: '#2d3748'
        },
        tableValue: {
          color: '#4a5568'
        }
      },
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.4,
        font: 'Roboto'
      },
      pageMargins: [40, 60, 40, 60] as [number, number, number, number]
    };

    // Vygenerování a stažení PDF
    const fileName = `klient_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  static async generateLiabilitiesPDF(liabilities: LiabilityData[]): Promise<void> {
    const today = new Date().toLocaleDateString('cs-CZ');

    const docDefinition = {
      content: [
        {
          text: 'Přehled závazků',
          style: 'header',
          alignment: 'center' as const
        },
        {
          text: `Datum vytvoření: ${today}`,
          style: 'subheader',
          margin: [0, 10, 0, 20] as [number, number, number, number]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              ['č.', 'Instituce', 'Typ', 'Výše úvěru', 'Splátka', 'Zůstatek', 'Poznámka'],
              ...liabilities.map((liability, index) => [
                (index + 1).toString(),
                liability.institution || '',
                liability.type || '',
                this.formatCurrency(liability.amount),
                this.formatCurrency(liability.payment),
                this.formatCurrency(liability.balance),
                liability.notes || ''
              ])
            ]
          },
          layout: {
            fillColor: function(rowIndex: number) {
              return (rowIndex === 0) ? '#CCE5FF' : null;
            }
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10] as [number, number, number, number]
        },
        subheader: {
          fontSize: 10,
          italics: true
        }
      },
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3
      }
    };

    const fileName = `zavazky_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }
}
