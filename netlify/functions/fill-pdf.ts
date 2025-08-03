import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

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
    
    // Cesta k Python skriptu
    const scriptPath = path.join(process.cwd(), 'scripts', 'fill_bohemika_pdf_fitz.py');
    
    // Spustíme Python skript s daty - použijeme temp soubor pro bezpečné předání JSON
    // Používáme systémovou temp složku (cross-platform)
    const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.json`);
    
    // Zapíšeme JSON do dočasného souboru
    fs.writeFileSync(tempFile, JSON.stringify(formData, null, 2));
    
    // Spustíme Python skript s cestou k temp souboru
    const command = `py "${scriptPath}" "${tempFile}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Vyčistíme temp soubor
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      console.error('Failed to clean temp file:', e);
    }
    
    if (stderr) {
      console.error('Python script error:', stderr);
      throw new Error(stderr);
    }
    
    // Python skript vrátí base64 obsah PDF
    const pdfBase64 = stdout.trim();
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bohemika_pruvodny_list.pdf"',
      },
      body: pdfBase64,
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
