/**
 * ARES API Service pro načítání údajů o firmách podle IČO
 * Administrativní registr ekonomických subjektů - Ministerstvo financí ČR
 */

export interface AresCompanyData {
  ico: string;
  dic?: string;
  companyName: string;
  legalForm?: string;
  address: string;
  isActive: boolean;
  registrationDate?: string;
}

export class AresService {
  private static readonly ARES_BASE_URL = 'https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi';

  /**
   * Vyhledá firmu podle IČO v ARES registru
   * @param ico - 8místné IČO firmy
   * @returns Promise s údaji o firmě nebo chybou
   */
  static async searchByIco(ico: string): Promise<{ data: AresCompanyData | null; error: string | null }> {
    try {
      // Validace IČO
      if (!ico || ico.length !== 8 || !/^\d{8}$/.test(ico)) {
        return {
          data: null,
          error: 'IČO musí být 8-místné číslo'
        };
      }

      // Sestavení URL pro ARES API
      const url = `${this.ARES_BASE_URL}?ico=${ico}`;
      
      console.log('🔍 Vyhledávám firmu v ARES:', ico);
      
      // Volání ARES API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml',
          'User-Agent': 'KostKa-Uvery-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`ARES API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // Parsování XML odpovědi
      const companyData = this.parseAresXmlResponse(xmlText, ico);
      
      if (!companyData) {
        return {
          data: null,
          error: 'Firma s tímto IČO nebyla nalezena v ARES registru'
        };
      }

      console.log('✅ Firma nalezena v ARES:', companyData.companyName);
      
      return {
        data: companyData,
        error: null
      };

    } catch (error) {
      console.error('❌ Chyba při volání ARES API:', error);
      
      return {
        data: null,
        error: `Chyba při načítání dat z ARES: ${error.message}`
      };
    }
  }

  /**
   * Parsuje XML odpověď z ARES API
   * @param xmlText - XML odpověď z ARES
   * @param ico - IČO pro které byla data načtena
   * @returns Parsovaná data o firmě nebo null
   */
  private static parseAresXmlResponse(xmlText: string, ico: string): AresCompanyData | null {
    try {
      // Vytvoření DOM parseru pro XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Kontrola chyb v XML
      const errorElement = xmlDoc.querySelector('parsererror');
      if (errorElement) {
        throw new Error('Chyba při parsování XML odpovědi z ARES');
      }

      // Hledání elementu s údaji o firmě
      const zaznamElement = xmlDoc.querySelector('Zaznam');
      if (!zaznamElement) {
        return null; // Firma nenalezena
      }

      // Extrakce údajů z XML
      const companyName = this.getXmlElementText(zaznamElement, 'OF') || 
                         this.getXmlElementText(zaznamElement, 'ObchodniFirma') || 
                         'Název nenalezen';

      const dic = this.getXmlElementText(zaznamElement, 'DIC');
      const legalForm = this.getXmlElementText(zaznamElement, 'PF');
      
      // Sestavení adresy
      const address = this.buildAddressFromXml(zaznamElement);
      
      // Kontrola stavu firmy
      const isActive = !this.getXmlElementText(zaznamElement, 'DZ'); // DZ = datum zániku
      
      const registrationDate = this.getXmlElementText(zaznamElement, 'DV'); // DV = datum vzniku

      return {
        ico,
        dic: dic || undefined,
        companyName,
        legalForm: legalForm || undefined,
        address,
        isActive,
        registrationDate: registrationDate || undefined
      };

    } catch (error) {
      console.error('Chyba při parsování ARES XML:', error);
      return null;
    }
  }

  /**
   * Získá text z XML elementu
   * @param parent - Rodičovský element
   * @param tagName - Název tagu
   * @returns Text obsah elementu nebo null
   */
  private static getXmlElementText(parent: Element, tagName: string): string | null {
    const element = parent.querySelector(tagName);
    return element ? element.textContent?.trim() || null : null;
  }

  /**
   * Sestaví adresu z XML elementů
   * @param zaznamElement - Element s údaji o firmě
   * @returns Sestavená adresa
   */
  private static buildAddressFromXml(zaznamElement: Element): string {
    const addressParts: string[] = [];

    // Ulice a číslo
    const street = this.getXmlElementText(zaznamElement, 'NU');
    const houseNumber = this.getXmlElementText(zaznamElement, 'CD') || 
                       this.getXmlElementText(zaznamElement, 'CO');
    
    if (street) {
      addressParts.push(houseNumber ? `${street} ${houseNumber}` : street);
    }

    // Město
    const city = this.getXmlElementText(zaznamElement, 'N');
    if (city) {
      addressParts.push(city);
    }

    // PSČ
    const postalCode = this.getXmlElementText(zaznamElement, 'PSC');
    if (postalCode) {
      // Formátování PSČ na XXX XX
      const formattedPostalCode = postalCode.replace(/(\d{3})(\d{2})/, '$1 $2');
      addressParts.push(formattedPostalCode);
    }

    return addressParts.join(', ') || 'Adresa nenalezena';
  }

  /**
   * Mock funkce pro testování (použije se když ARES API není dostupné)
   * @param ico - IČO firmy
   * @returns Mock data pro testování
   */
  static async getMockData(ico: string): Promise<{ data: AresCompanyData | null; error: string | null }> {
    // Simulace API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockCompanies: Record<string, AresCompanyData> = {
      '12345678': {
        ico: '12345678',
        dic: 'CZ12345678',
        companyName: 'Vzorová společnost s.r.o.',
        legalForm: 'Společnost s ručením omezeným',
        address: 'Václavské náměstí 1, 110 00 Praha 1',
        isActive: true,
        registrationDate: '2020-01-15'
      },
      '87654321': {
        ico: '87654321',
        dic: 'CZ87654321',
        companyName: 'Testovací firma a.s.',
        legalForm: 'Akciová společnost',
        address: 'Náměstí Svobody 8, 602 00 Brno',
        isActive: true,
        registrationDate: '2018-05-20'
      }
    };

    const company = mockCompanies[ico];
    
    if (company) {
      return { data: company, error: null };
    } else {
      return { 
        data: null, 
        error: 'Firma s tímto IČO nebyla nalezena (mock data)' 
      };
    }
  }
}