import { Handler } from '@netlify/functions';

/**
 * Netlify Function pro CORS proxy k ARES API
 * Umožňuje volání ARES API z webové aplikace bez CORS problémů
 */
export const handler: Handler = async (event) => {
  // Povolení CORS pro všechny domény
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'no-store'
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
    // Získání parametrů z query
    const ico = event.queryStringParameters?.ico;
    const name = event.queryStringParameters?.name; // vyhledávání podle názvu firmy

    if (!ico && !name) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
      error: 'Either ico=8digits or name=query is required',
      usage: 'GET /.netlify/functions/ares-proxy?ico=12345678 OR /.netlify/functions/ares-proxy?name=Seznam%20s.r.o.'
        })
      };
    }

    // Validace IČO formátu (pokud je poskytováno)
    if (ico && !/^\d{8}$/.test(ico)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'IČO must be exactly 8 digits',
      provided: ico || null
        })
      };
    }

    const target = ico
      ? `?ico=${ico}`
      : `?obch_jm=${encodeURIComponent(name!)}&maxpoc=10`;

    const baseUrls = [
      `https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi${target}`,
      // Některé proxy jako nouzový server-side fallback (mimo prohlížečové CORS limity)
      `https://api.allorigins.win/raw?url=${encodeURIComponent('https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi' + target)}`,
      `https://cors.isomorphic-git.org/https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi${target}`,
      `https://yacdn.org/proxy/https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi${target}`
    ];

    const makeRequest = async (url: string, attempt: number) => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 KostKa-ARES-Proxy/1.0';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': ua,
          'Accept': 'application/xml, text/xml, */*',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) {
        throw new Error(`ARES HTTP ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      if (!text || text.length < 100) {
        throw new Error('Empty or too short XML');
      }
      return text;
    };

    let lastErr: unknown = null;
    for (let i = 0; i < baseUrls.length; i++) {
      const url = baseUrls[i];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔗 ARES try ${i + 1}/${baseUrls.length} (attempt ${attempt}): ${url.substring(0, 120)}`);
          const xmlData = await makeRequest(url, attempt);
          console.log(`✅ ARES OK (${xmlData.length} chars)`);
          return { statusCode: 200, headers, body: xmlData };
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(`⚠️ ARES fetch failed [source ${i + 1}, attempt ${attempt}]: ${msg}`);
          // krátký backoff
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }
    }

    console.error('❌ ARES proxy: all attempts failed', lastErr);
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Network error - Cannot reach ARES API',
        details: lastErr instanceof Error ? lastErr.message : String(lastErr || 'unknown'),
        timestamp: new Date().toISOString()
      })
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
