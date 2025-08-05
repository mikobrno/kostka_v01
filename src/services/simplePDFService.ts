import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatNumber } from '../utils/formatHelpers';

// Základní nastavení s vestavěnými fonty
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

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

export class SimplePDFService {
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

    const docDefinition = {
      content: [
        // Jednoduchá hlavička
        {
          text: `Klientsky profil - ${clientName || 'Novy klient'}`,
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: `Datum vytvoreni: ${today}`,
          fontSize: 10,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },

        // Žadatel
        {
          text: 'Zadatel',
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 8]
        },
        
        // Základní info o žadateli
        {
          columns: [
            {
              width: '50%',
              stack: [
                ...(client.applicant_title ? [{ text: `Titul: ${client.applicant_title}`, margin: [0, 2] }] : []),
                ...(client.applicant_first_name ? [{ text: `Jmeno: ${client.applicant_first_name}`, margin: [0, 2] }] : []),
                ...(client.applicant_last_name ? [{ text: `Prijmeni: ${client.applicant_last_name}`, margin: [0, 2] }] : []),
                ...(client.applicant_birth_number ? [{ text: `Rodne cislo: ${client.applicant_birth_number}`, margin: [0, 2] }] : []),
                ...(client.applicant_age ? [{ text: `Vek: ${client.applicant_age} let`, margin: [0, 2] }] : [])
              ]
            },
            {
              width: '50%',
              stack: [
                ...(client.applicant_marital_status ? [{ text: `Rodinny stav: ${client.applicant_marital_status}`, margin: [0, 2] }] : []),
                ...(client.applicant_housing_type ? [{ text: `Bydliste: ${client.applicant_housing_type}`, margin: [0, 2] }] : []),
                ...(client.applicant_phone ? [{ text: `Telefon: ${client.applicant_phone}`, margin: [0, 2] }] : []),
                ...(client.applicant_email ? [{ text: `E-mail: ${client.applicant_email}`, margin: [0, 2] }] : [])
              ]
            }
          ]
        },

        // Adresa
        ...(client.applicant_permanent_address ? [
          { text: `Trvala adresa: ${client.applicant_permanent_address}`, margin: [0, 5] }
        ] : []),

        // Spolužadatel pokud existuje
        ...(client.co_applicant_first_name ? [
          {
            text: 'Spoluzadatel',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 8]
          },
          {
            columns: [
              {
                width: '50%',
                stack: [
                  ...(client.co_applicant_first_name ? [{ text: `Jmeno: ${client.co_applicant_first_name}`, margin: [0, 2] }] : []),
                  ...(client.co_applicant_last_name ? [{ text: `Prijmeni: ${client.co_applicant_last_name}`, margin: [0, 2] }] : []),
                  ...(client.co_applicant_birth_number ? [{ text: `Rodne cislo: ${client.co_applicant_birth_number}`, margin: [0, 2] }] : [])
                ]
              },
              {
                width: '50%',
                stack: [
                  ...(client.co_applicant_age ? [{ text: `Vek: ${client.co_applicant_age} let`, margin: [0, 2] }] : []),
                  ...(client.co_applicant_marital_status ? [{ text: `Rodinny stav: ${client.co_applicant_marital_status}`, margin: [0, 2] }] : [])
                ]
              }
            ]
          }
        ] : []),

        // Zaměstnavatelé
        ...(employers.length > 0 ? [
          {
            text: 'Zamestnavatele',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 8]
          },
          ...employers.map(emp => ({
            stack: [
              { text: `${emp.employer_type === 'applicant' ? 'Zadatel' : 'Spoluzadatel'}:`, bold: true, margin: [0, 5] },
              ...(emp.company_name ? [{ text: `Firma: ${emp.company_name}`, margin: [0, 2] }] : []),
              ...(emp.job_position ? [{ text: `Pozice: ${emp.job_position}`, margin: [0, 2] }] : []),
              ...(emp.net_income ? [{ text: `Prijem: ${this.formatCurrency(emp.net_income)}`, margin: [0, 2] }] : []),
              ...(emp.contract_type ? [{ text: `Smlouva: ${emp.contract_type}`, margin: [0, 2] }] : [])
            ]
          }))
        ] : []),

        // Nemovitost
        ...(property.address || property.price ? [
          {
            text: 'Nemovitost',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 8]
          },
          ...(property.address ? [{ text: `Adresa: ${property.address}`, margin: [0, 2] }] : []),
          ...(property.price ? [
            { text: `Kupni cena: ${this.formatCurrency(property.price)}`, margin: [0, 2] },
            { text: `LTV 80%: ${this.formatCurrency(property.price * 0.8)}`, margin: [0, 2] },
            { text: `LTV 90%: ${this.formatCurrency(property.price * 0.9)}`, margin: [0, 2] }
          ] : [])
        ] : []),

        // Závazky jako jednoduchá tabulka
        ...(liabilities.length > 0 ? [
          {
            text: 'Zavazky',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 8],
            pageBreak: 'before'
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: 'c.', bold: true },
                  { text: 'Instituce', bold: true },
                  { text: 'Typ', bold: true },
                  { text: 'Vyse', bold: true },
                  { text: 'Splatka', bold: true },
                  { text: 'Poznamka', bold: true }
                ],
                ...liabilities.map((liability, index) => [
                  (index + 1).toString(),
                  liability.institution || '',
                  liability.type || '',
                  this.formatCurrency(liability.amount),
                  this.formatCurrency(liability.payment),
                  liability.notes || ''
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ] : [])
      ],
      
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3
      },
      
      pageMargins: [40, 60, 40, 60]
    };

    // Stažení
    const fileName = `klient_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  static async generateLiabilitiesPDF(liabilities: LiabilityData[]): Promise<void> {
    const today = new Date().toLocaleDateString('cs-CZ');

    const docDefinition = {
      content: [
        {
          text: 'Prehled zavazku',
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          text: `Datum vytvoreni: ${today}`,
          fontSize: 10,
          margin: [0, 0, 0, 20]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'c.', bold: true },
                { text: 'Instituce', bold: true },
                { text: 'Typ', bold: true },
                { text: 'Vyse uveru', bold: true },
                { text: 'Splatka', bold: true },
                { text: 'Zustatek', bold: true },
                { text: 'Poznamka', bold: true }
              ],
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
          layout: 'lightHorizontalLines'
        }
      ],
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3
      }
    };

    const fileName = `zavazky_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }
}
