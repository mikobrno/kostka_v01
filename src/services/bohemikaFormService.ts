import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatNumber } from '../utils/formatHelpers';

// Nastavení fontů pro pdfMake - upraveno pro TypeScript
const pdfMakeWithFonts = pdfMake as any;
pdfMakeWithFonts.vfs = (pdfFonts as any).pdfMake.vfs;

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

interface LoanData {
  product?: string;
  amount?: number;
  ltv?: number;
  purpose?: string;
  monthly_payment?: number;
  contract_date?: string;
}

export class BohemikaFormService {
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

  static async generateBohemikaForm(
    client: ClientData,
    loan: LoanData = {}
  ): Promise<void> {
    const clientName = `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim();
    const today = new Date().toLocaleDateString('cs-CZ');

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header s logem a názvem
        {
          columns: [
            {
              width: 150,
              stack: [
                {
                  text: 'bohemika',
                  style: 'logo',
                  color: '#4A90E2'
                },
                {
                  text: 'FINANČNÍ PORADENSTVÍ',
                  style: 'logoSubtext',
                  color: '#666666'
                }
              ]
            },
            {
              width: '*',
              text: ''
            },
            {
              width: 200,
              text: 'PRŮVODNÍ LIST K ÚVĚRU',
              style: 'headerTitle',
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Číslo smlouvy
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: 'ČÍSLO SMLOUVY',
                style: 'sectionHeader',
                fillColor: '#E8E8E8',
                border: [true, true, true, true]
              }],
              [{
                text: '',
                style: 'tableContent',
                margin: [5, 10, 5, 10]
              }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        // Klient sekce
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: 'KLIENT',
                style: 'sectionHeader',
                fillColor: '#E8E8E8'
              }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 5]
        },

        // Klient tabulka
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Jméno a příjmení', clientName || ''],
              ['Rodné číslo', client.applicant_birth_number || ''],
              ['Adresa', client.applicant_permanent_address || ''],
              ['Telefon', client.applicant_phone || ''],
              ['Email', client.applicant_email || '']
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        // Zpracovatel sekce
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: 'ZPRACOVATEL',
                style: 'sectionHeader',
                fillColor: '#E8E8E8'
              }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 5]
        },

        // Zpracovatel tabulka
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Jméno a příjmení', 'Ing. Milan Kost'],
              ['Agenturní číslo', '8680020061']
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        // Tipar sekce
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: 'TIPAR',
                style: 'sectionHeader',
                fillColor: '#E8E8E8'
              }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 5]
        },

        // Tipar tabulka s checkboxy
        {
          table: {
            widths: ['30%', '35%', '35%'],
            body: [
              ['Jméno a příjmení', '', ''],
              [
                'Agenturní číslo',
                {
                  stack: [
                    '☐ Tipar PROFESIONÁL'
                  ]
                },
                {
                  stack: [
                    '☐ Tipar NEPROFESIONÁL'
                  ]
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        // Úvěr sekce
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: 'ÚVĚR',
                style: 'sectionHeader',
                fillColor: '#E8E8E8'
              }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 5]
        },

        // Úvěr tabulka
        {
          table: {
            widths: ['25%', '75%'],
            body: [
              ['Produkt', loan.product || ''],
              ['Výše úvěru', this.formatCurrency(loan.amount)],
              ['Suma zajištění', ''],
              ['LTV', loan.ltv ? `${loan.ltv}%` : '']
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10]
        },

        // Sazba - speciální tabulka s 3 sloupci
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                'Sazba',
                {
                  text: 'hypotečního úvěru',
                  fillColor: '#F0F0F0'
                },
                {
                  text: 'překlenocího úvěru',
                  fillColor: '#F0F0F0'
                },
                {
                  text: 'řádného úvěru',
                  fillColor: '#F0F0F0'
                }
              ],
              [
                'Datum',
                {
                  text: 'konce fixace HÚ',
                  fillColor: '#F0F0F0'
                },
                {
                  text: 'přidělení úvěru ze SS',
                  fillColor: '#F0F0F0'
                },
                {
                  text: 'úplného splacení úvěru',
                  fillColor: '#F0F0F0'
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10]
        },

        // Zbývající pole úvěru
        {
          table: {
            widths: ['25%', '75%'],
            body: [
              ['Účel úvěru', loan.purpose || ''],
              ['Měsíční splátka', this.formatCurrency(loan.monthly_payment)],
              ['Datum podpisu úvěru', this.formatDate(loan.contract_date)]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 30]
        },

        // Spodní část s checkboxy a podpisem
        {
          columns: [
            {
              width: '50%',
              stack: [
                'Bankovní pojištění    ☐ ANO    ☐ NE',
                'Běžný účet            ☐ ANO    ☐ NE',
                'Smlouva stavebního spoření ☐ ANO    ☐ NE'
              ]
            },
            {
              width: '50%',
              stack: [
                'Nárok na provizi      ☐ ANO    ☐ NE',
                'Nárok na provizi      ☐ ANO    ☐ NE',
                'Nárok na provizi      ☐ ANO    ☐ NE'
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Podpis sekce
        {
          columns: [
            {
              width: '40%',
              text: 'V Brně',
              style: 'signatureText'
            },
            {
              width: '30%',
              text: `dne ${today}`,
              style: 'signatureText'
            },
            {
              width: '30%',
              stack: [
                {
                  text: 'podpis ZPRACOVATELE',
                  style: 'signatureText'
                },
                {
                  canvas: [{
                    type: 'line',
                    x1: 0, y1: 10,
                    x2: 150, y2: 10,
                    lineWidth: 1
                  }]
                }
              ]
            }
          ],
          margin: [0, 20, 0, 30]
        },

        // Číslo dokumentu
        {
          text: 'BOHEMIKA_PLU 230720-10',
          style: 'documentNumber',
          alignment: 'right'
        }
      ],

      styles: {
        logo: {
          fontSize: 18,
          bold: true
        },
        logoSubtext: {
          fontSize: 8
        },
        headerTitle: {
          fontSize: 14,
          bold: true
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          margin: [5, 5, 5, 5]
        },
        tableContent: {
          fontSize: 10
        },
        signatureText: {
          fontSize: 9
        },
        documentNumber: {
          fontSize: 8,
          color: '#666666'
        }
      },

      defaultStyle: {
        fontSize: 10,
        font: 'Helvetica'
      }
    };

    const fileName = `pruvodní_list_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    (pdfMake as any).createPdf(docDefinition as any).download(fileName);
  }
}
