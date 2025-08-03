import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface ClientData {
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_birth_number?: string;
  applicant_permanent_address?: string;
  applicant_phone?: string;
  applicant_email?: string;
}

interface LoanData {
  product?: string;
  amount?: number;
  ltv?: number;
  purpose?: string;
  monthly_payment?: number;
  contract_date?: string;
}

export class TestPDFService {
  private static formatCurrency(amount?: number): string {
    if (!amount) return '';
    return amount.toLocaleString('cs-CZ') + ' Kč';
  }

  static async testFillPDF(client: ClientData, loan: LoanData = {}): Promise<string> {
    try {
      // Připravíme data pro vyplnění PDF formuláře
      const formData = {
        'fill_11': `${client.applicant_first_name || ''} ${client.applicant_last_name || ''}`.trim(),
        'fill_12': client.applicant_birth_number || '',
        'Adresa': client.applicant_permanent_address || '',
        'Telefon': client.applicant_phone || '',
        'email': client.applicant_email || '',
        'fill_16': 'Ing. Milan Kost',
        'fill_17': '8680020061',
        'fill_10': '',
        'Produkt': loan.product || '',
        'fill_21': loan.amount ? this.formatCurrency(loan.amount) : '',
        'fill_22': loan.amount ? this.formatCurrency(loan.amount) : '',
        'LTV': loan.ltv ? `${loan.ltv}%` : '',
        'fill_24': loan.purpose || '',
        'fill_25': loan.monthly_payment ? this.formatCurrency(loan.monthly_payment) : '',
        'fill_26': loan.contract_date || '',
        'V': 'Brno',
        'dne': new Date().toLocaleDateString('cs-CZ')
      };

      console.log('Preparing form data:', formData);

      // Zapíšeme JSON do dočasného souboru
      const tempFile = path.join(process.cwd(), `temp_test_${Date.now()}.json`);
      fs.writeFileSync(tempFile, JSON.stringify(formData, null, 2));

      // Spustíme Python skript
      const scriptPath = path.join(process.cwd(), 'scripts', 'fill_bohemika_pdf_fitz.py');
      const command = `py "${scriptPath}" "${tempFile}"`;
      
      console.log('Executing command:', command);
      
      const { stdout, stderr } = await execAsync(command);
      
      // Vyčistíme temp soubor
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        console.error('Failed to clean temp file:', e);
      }

      if (stderr) {
        console.error('Python script stderr:', stderr);
      }

      const pdfBase64 = stdout.trim();
      console.log('PDF generated, base64 length:', pdfBase64.length);
      
      return pdfBase64;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
}
