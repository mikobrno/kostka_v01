import { Handler } from '@netlify/functions';

/**
 * Netlify Function pro CORS proxy k ARES API
 * Umožňuje volání ARES API z webové aplikace bez CORS problémů
 */
export const handler: Handler = async (event, context) => {
  // Povolení CORS pro všechny domény
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/xml; charset=utf-8'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Pouze GET requesty jsou povolené
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Získání IČO z query parametrů
    const ico = event.queryStringParameters?.ico;
    
    if (!ico) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'IČO parameter is required',
          usage: 'GET /.netlify/functions/ares-proxy?ico=12345678'
        })
      };
    }

    // Validace IČO formátu
    if (!/^\d{8}$/.test(ico)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'IČO must be exactly 8 digits',
          provided: ico
        })
      };
    }

    console.log(`🔍 ARES proxy: Hledám firmu s IČO ${ico}`);

    // Volání ARES API
    const aresUrl = `https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${ico}`;
    
    const response = await fetch(aresUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'KostKa-ARES-Proxy/1.0',
        'Accept': 'application/xml, text/xml, */*'
      },
      // Timeout po 10 sekundách
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`❌ ARES API error: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `ARES API returned status ${response.status}`,
          details: response.statusText
        })
      };
    }

    // Získání XML dat
    const xmlData = await response.text();
    
    // Kontrola zda obsahuje data
    if (!xmlData || xmlData.length < 100) {
      console.warn(`⚠️ ARES vrátil podezřele krátká data pro IČO ${ico}`);
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'No data found for this IČO',
          ico: ico
        })
      };
    }

    console.log(`✅ ARES proxy: Úspěšně načteno ${xmlData.length} znaků XML dat pro IČO ${ico}`);

    // Vrácení XML dat
    return {
      statusCode: 200,
      headers,
      body: xmlData
    };

  } catch (error) {
    console.error('❌ ARES proxy error:', error);
    
    // Rozpoznání typu chyby
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Timeout chyba
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        statusCode = 408;
        errorMessage = 'Request timeout - ARES API is not responding';
      }
      // Network chyba
      else if (error.message.includes('fetch')) {
        statusCode = 503;
        errorMessage = 'Network error - Cannot reach ARES API';
      }
    }

    return {
      statusCode,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
    };
  }
};
