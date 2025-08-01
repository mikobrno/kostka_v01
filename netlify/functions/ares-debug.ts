import { Handler } from '@netlify/functions';

/**
 * Debug endpoint pro analýzu ARES XML odpovědí
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
    const ico = event.queryStringParameters?.ico || '27074358'; // Microsoft s.r.o.
    
    // Zkusíme načíst data z ARES
    const aresUrl = `https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${ico}`;
    
    const response = await fetch(aresUrl, {
      headers: {
        'User-Agent': 'ARES-Debug/1.0'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `ARES API error: ${response.status}`,
          ico: ico
        })
      };
    }

    const xmlText = await response.text();
    
    // Parsování pro debug účely
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Získání všech elementů pro analýzu
    const allElements = Array.from(xmlDoc.querySelectorAll('*')).map(el => ({
      tagName: el.tagName,
      localName: el.localName,
      textContent: el.textContent?.trim().substring(0, 100) || ''
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ico: ico,
        xmlLength: xmlText.length,
        rootElement: xmlDoc.documentElement?.tagName,
        sampleElements: allElements.slice(0, 20), // První 20 elementů
        rawXmlSample: xmlText.substring(0, 1000), // První 1000 znaků
        hasZaznam: !!xmlDoc.querySelector('Zaznam'),
        hasAreZaznam: !!xmlDoc.querySelector('are\\:Zaznam'),
        hasDZaznam: !!xmlDoc.querySelector('D\\:Zaznam'),
        timestamp: new Date().toISOString()
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
