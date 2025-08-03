import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
}

const handler = async (event: NetlifyEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const formData = JSON.parse(event.body || '{}');
    
    // Načteme template PDF
    const templatePath = path.join(process.cwd(), 'public', 'bohemika_template.pdf');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    
    const existingPdfBytes = fs.readFileSync(templatePath);
    
    // Načteme PDF dokument
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    
    // Mapování dat na pole formuláře
    const clientName = `${formData.applicant_first_name || ''} ${formData.applicant_last_name || ''}`.trim();
    
    const fieldMapping = {
      'fill_11': clientName,
      'fill_12': formData.applicant_birth_number || '',
      'Adresa': formData.applicant_permanent_address || '',
      'Telefon': formData.applicant_phone || '',
      'email': formData.applicant_email || '',
      'fill_16': 'Ing. Milan Kost',
      'fill_17': '8680020061',
      'Produkt': formData.product || 'Např. Hypoteční úvěr',
      'fill_21': formData.amount ? `${formData.amount} Kč` : '',
      'fill_22': formData.amount ? `${formData.amount} Kč` : '',
      'LTV': formData.ltv ? `${formData.ltv}%` : '',
      'fill_24': formData.purpose || 'Nákup nemovitosti',
      'fill_25': formData.monthly_payment ? `${formData.monthly_payment} Kč` : '',
      'V': 'Brno',
      'dne': formData.contract_date || new Date().toLocaleDateString('cs-CZ')
    };
    
    // Vyplníme pole formuláře
    let fieldsFilledCount = 0;
    for (const [fieldName, value] of Object.entries(fieldMapping)) {
      if (value) {
        try {
          const field = form.getField(fieldName);
          if (field) {
            // Zkusíme různé typy polí
            if ('setText' in field) {
              (field as any).setText(value);
              fieldsFilledCount++;
              console.log(`Filled field '${fieldName}' with value '${value}'`);
            }
          }
        } catch (error) {
          console.warn(`Could not fill field '${fieldName}':`, error);
        }
      }
    }
    
    console.log(`Successfully filled ${fieldsFilledCount} fields`);
    
    // Vygenerujeme PDF
    const pdfBytes = await pdfDoc.save();
    
    // Vrátíme jako base64
    const base64 = Buffer.from(pdfBytes).toString('base64');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bohemika_pruvodny_list.pdf"',
      },
      body: base64,
      isBase64Encoded: true,
    };
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
