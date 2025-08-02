import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

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
    const scriptPath = path.join(process.cwd(), 'scripts', 'fill_bohemika_pdf.py');
    
    // Spustíme Python skript s daty
    const jsonData = JSON.stringify(formData);
    const command = `py "${scriptPath}" '${jsonData}'`;
    
    const { stdout, stderr } = await execAsync(command);
    
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
