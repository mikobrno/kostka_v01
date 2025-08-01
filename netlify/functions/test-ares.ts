import { Handler } from '@netlify/functions';

/**
 * Test endpoint pro ověření funkčnosti ARES proxy
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Test známého IČO
    const testIco = '27074358'; // Microsoft s.r.o.
    
    const response = await fetch(`https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${testIco}`);
    const isAresAvailable = response.ok;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'ARES proxy test endpoint',
        timestamp: new Date().toISOString(),
        aresApiStatus: isAresAvailable ? 'available' : 'unavailable',
        testEndpoints: {
          aresProxy: `/.netlify/functions/ares-proxy?ico=${testIco}`,
          testProxy: '/.netlify/functions/test-ares'
        },
        usage: 'GET /.netlify/functions/ares-proxy?ico=27074358'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
