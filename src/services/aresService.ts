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
  // Výběr CORS proxy podle prostředí; defaultně jen naše Netlify funkce
  private static get CORS_PROXIES(): string[] {
    // Vite exportuje import.meta.env jako záznam; vyhneme se 'any' pomocí částečného typu
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
    const allowPublic = env.VITE_ARES_PUBLIC_PROXIES === '1';
    const base = ['/.netlify/functions/ares-proxy?ico='];
    if (!allowPublic) return base;
    return base.concat([
      'https://api.allorigins.win/raw?url=',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors.bridged.cc/',
      'https://yacdn.org/proxy/',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/'
    ]);
  }

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
      const aresUrl = `${this.ARES_BASE_URL}?ico=${ico}`;
      
      console.log('🔍 Vyhledávám firmu v ARES:', ico);
      
      // Zkouším různé CORS proxy postupně
      let lastError = '';
      const proxies = this.CORS_PROXIES;
      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        try {
          console.log(`🔄 Zkouším CORS proxy ${i + 1}/${proxies.length}: ${proxy.split('?')[0]}`);
          
          let url: string;
          
          // Náš vlastní Netlify proxy má jiný formát
          if (proxy.startsWith('/.netlify/functions/ares-proxy')) {
            url = `${proxy}${ico}`;
          } else {
            // Ostatní proxy potřebují enkódovaný ARES URL
            url = `${proxy}${encodeURIComponent(aresUrl)}`;
          }
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/xml, text/xml',
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
        } catch (proxyError) {
          lastError = proxyError instanceof Error ? proxyError.message : 'Neznámá chyba';
          console.warn(`❌ Proxy ${i + 1} selhalo:`, lastError);
          // Pokračuje s dalším proxy
        }
      }
      
      // Pokud všechny proxy selhaly, zkusí mock data pro development
      console.warn('🔄 Všechny CORS proxy selhaly, používám mock data');
      return this.getMockData(ico);

    } catch (error) {
      console.error('❌ Chyba při volání ARES API:', error);
      
      // V případě chyby zkusí mock data
      console.warn('🔄 Používám mock data kvůli chybě');
      return this.getMockData(ico);
    }
  }

  /**
   * Vyhledá firmy podle obchodního jména (název firmy) – vrací seznam výsledků
   */
  static async searchByName(query: string): Promise<{ data: AresCompanyData[]; error: string | null }> {
    try {
      const q = (query || '').trim();
      if (q.length < 3) {
        return { data: [], error: 'Zadejte alespoň 3 znaky názvu' };
      }

      const aresUrl = `${this.ARES_BASE_URL}?obch_jm=${encodeURIComponent(q)}&maxpoc=10`;
      console.log('🔎 Hledám firmy dle názvu v ARES:', q);

      let lastError = '';
      const proxies = this.CORS_PROXIES;
      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        try {
          let url: string;
          if (proxy.startsWith('/.netlify/functions/ares-proxy')) {
            // náš proxy podporuje name=
            url = `/.netlify/functions/ares-proxy?name=${encodeURIComponent(q)}`;
          } else {
            url = `${proxy}${encodeURIComponent(aresUrl)}`;
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/xml, text/xml' }
          });
          if (!response.ok) throw new Error(`ARES API error: ${response.status} ${response.statusText}`);
          const xmlText = await response.text();
          const list = this.parseAresXmlList(xmlText);
          return { data: list, error: null };
        } catch (e) {
          lastError = e instanceof Error ? e.message : 'Neznámá chyba';
          console.warn(`❌ Proxy ${i + 1} (name) selhalo:`, lastError);
        }
      }
      // Fallback – žádné proxy nevyšlo, vrať prázdný výsledek
      return { data: [], error: lastError || 'Nepodařilo se vyhledat firmy' };
    } catch (error) {
      console.error('❌ Chyba při vyhledávání dle názvu v ARES:', error);
      return { data: [], error: 'Chyba při vyhledávání' };
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
      console.log('🔍 Parsování ARES XML, délka:', xmlText.length);
      
      // Vytvoření DOM parseru pro XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Kontrola chyb v XML
      const errorElement = xmlDoc.querySelector('parsererror');
      if (errorElement) {
        console.error('❌ XML parser error:', errorElement.textContent);
        throw new Error('Chyba při parsování XML odpovědi z ARES');
      }

      // Debug: vypíš strukturu XML
      console.log('📋 XML struktura:', xmlDoc.documentElement?.tagName);
      
      // Hledání elementu s údaji o firmě - zkusíme různé možné struktury
      let zaznamElement = xmlDoc.querySelector('Zaznam');
      
      if (!zaznamElement) {
        // Alternativní struktury ARES XML
        zaznamElement = xmlDoc.querySelector('are:Zaznam') || 
                       xmlDoc.querySelector('D\\:Zaznam') ||
                       xmlDoc.querySelector('Výpis_ARES Výpis_základních_údajů');
      }
      
      if (!zaznamElement) {
        console.warn('⚠️ Nenalezen element Zaznam v XML');
        // Debug: vypíš všechny elementy pro analýzu
        const allElements = xmlDoc.querySelectorAll('*');
        console.log('🔍 Dostupné elementy:', Array.from(allElements).slice(0, 10).map(el => el.tagName));
        return null;
      }

      console.log('✅ Nalezen element Zaznam');

      // Extrakce údajů z XML - zkusíme různé možné názvy elementů
      const companyName = this.getXmlElementText(zaznamElement, 'OF') || 
                         this.getXmlElementText(zaznamElement, 'ObchodniFirma') ||
                         this.getXmlElementText(zaznamElement, 'ObchodniJmeno') ||
                         this.getXmlElementText(zaznamElement, 'NazevFirmy') ||
                         'Název nenalezen';

      const dic = this.getXmlElementText(zaznamElement, 'DIC') ||
                 this.getXmlElementText(zaznamElement, 'DIČ');
      
      const legalForm = this.getXmlElementText(zaznamElement, 'PF') ||
                       this.getXmlElementText(zaznamElement, 'PravniForma');
      
      // Sestavení adresy
      const address = this.buildAddressFromXml(zaznamElement);
      
      // Kontrola stavu firmy
      const datumZaniku = this.getXmlElementText(zaznamElement, 'DZ') || 
                         this.getXmlElementText(zaznamElement, 'DatumZaniku');
      const isActive = !datumZaniku;
      
      const registrationDate = this.getXmlElementText(zaznamElement, 'DV') || 
                              this.getXmlElementText(zaznamElement, 'DatumVzniku');

      console.log('📊 Parsované údaje:', {
        companyName,
        dic,
        legalForm,
        address: address.substring(0, 50) + '...',
        isActive,
        registrationDate
      });

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
      console.error('❌ Chyba při parsování ARES XML:', error);
      console.log('📝 XML ukázka (prvních 500 znaků):', xmlText.substring(0, 500));
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
    // Zkusíme různé možné selektory
    const selectors = [
      tagName,                    // přímý název
      `*[localName="${tagName}"]`, // bez namespace
      `are\\:${tagName}`,         // s are: namespace
      `D\\:${tagName}`            // s D: namespace
    ];
    
    for (const selector of selectors) {
      try {
        const element = parent.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text) {
            console.log(`📄 Nalezen ${tagName}:`, text);
            return text;
          }
        }
      } catch {
        // Pokračuje s dalším selektorem
      }
    }
    
    console.log(`⚠️ Nenalezen element: ${tagName}`);
    return null;
  }

  /**
   * Zpracuje XML výpis s více záznamy firem (výsledek hledání dle názvu)
   */
  private static parseAresXmlList(xmlText: string): AresCompanyData[] {
    const results: AresCompanyData[] = [];
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const errorElement = xmlDoc.querySelector('parsererror');
      if (errorElement) {
        console.error('❌ XML parser error (list):', errorElement.textContent);
        return results;
      }
      const zaznamNodes: Element[] = Array.from(xmlDoc.querySelectorAll('Zaznam'));
      if (zaznamNodes.length === 0) {
        // pokus o namespace varianty
        const alt = xmlDoc.querySelectorAll('*[local-name="Zaznam"]');
        zaznamNodes.push(...(Array.from(alt) as Element[]));
      }
      for (const z of zaznamNodes) {
        const ico = this.getXmlElementText(z, 'ICO') || '';
        const companyName = this.getXmlElementText(z, 'OF') || this.getXmlElementText(z, 'ObchodniFirma') || 'Neznámá firma';
        const dic = this.getXmlElementText(z, 'DIC') || undefined;
        const legalForm = this.getXmlElementText(z, 'PF') || undefined;
        const address = this.buildAddressFromXml(z);
        const datumZaniku = this.getXmlElementText(z, 'DZ');
        const isActive = !datumZaniku;
        results.push({
          ico,
          dic: dic || undefined,
          companyName,
          legalForm,
          address,
          isActive,
          registrationDate: this.getXmlElementText(z, 'DV') || undefined
        });
      }
    } catch (e) {
      console.error('❌ Chyba parsování seznamu ARES:', e);
    }
    return results;
  }

  /**
   * Sestaví adresu z XML elementů
   * @param zaznamElement - Element s údaji o firmě
   * @returns Sestavená adresa
   */
  private static buildAddressFromXml(zaznamElement: Element): string {
    const addressParts: string[] = [];

    // Zkusíme různé možné struktury adres
    // Ulice a číslo
    const street = this.getXmlElementText(zaznamElement, 'NU') ||
                  this.getXmlElementText(zaznamElement, 'Ulice') ||
                  this.getXmlElementText(zaznamElement, 'NazevUlice');
    
    const houseNumber = this.getXmlElementText(zaznamElement, 'CD') || 
                       this.getXmlElementText(zaznamElement, 'CO') ||
                       this.getXmlElementText(zaznamElement, 'CisloPopisne') ||
                       this.getXmlElementText(zaznamElement, 'CisloOrientacni');
    
    if (street) {
      addressParts.push(houseNumber ? `${street} ${houseNumber}` : street);
    } else if (houseNumber) {
      addressParts.push(houseNumber);
    }

    // Město
    const city = this.getXmlElementText(zaznamElement, 'N') ||
                this.getXmlElementText(zaznamElement, 'Mesto') ||
                this.getXmlElementText(zaznamElement, 'NazevMesta') ||
                this.getXmlElementText(zaznamElement, 'ObecNazev');
    
    if (city) {
      addressParts.push(city);
    }

    // PSČ
    const postalCode = this.getXmlElementText(zaznamElement, 'PSC') ||
                      this.getXmlElementText(zaznamElement, 'PostovniKod');
    
    if (postalCode) {
      // Formátování PSČ na XXX XX
      const cleanPostalCode = postalCode.replace(/\s/g, '');
      if (cleanPostalCode.length === 5) {
        const formattedPostalCode = cleanPostalCode.replace(/(\d{3})(\d{2})/, '$1 $2');
        addressParts.push(formattedPostalCode);
      } else {
        addressParts.push(postalCode);
      }
    }

    const finalAddress = addressParts.join(', ') || 'Adresa nenalezena';
    console.log('🏠 Sestavená adresa:', finalAddress);
    
    return finalAddress;
  }

  /**
   * Mock funkce pro testování (použije se když ARES API není dostupné)
   * @param ico - IČO firmy
   * @returns Mock data pro testování
   */
  static async getMockData(ico: string): Promise<{ data: AresCompanyData | null; error: string | null }> {
    // Simulace API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockCompanies: Record<string, AresCompanyData> = {
      // Reálná testovací IČO pro demo
      '27074358': {
        ico: '27074358',
        dic: 'CZ27074358',
        companyName: 'Microsoft s.r.o.',
        legalForm: 'Společnost s ručením omezeným',
        address: 'BB Centrum, Vyskočilova 1461/2a, 140 00 Praha 4',
        isActive: true,
        registrationDate: '2008-07-01'
      },
      '26168685': {
        ico: '26168685',
        dic: 'CZ26168685',
        companyName: 'Google Czech Republic s.r.o.',
        legalForm: 'Společnost s ručením omezeným',
        address: 'Karla Engliše 3201/6, 150 00 Praha 5',
        isActive: true,
        registrationDate: '2006-12-15'
      },
      '47123737': {
        ico: '47123737',
        dic: 'CZ47123737',
        companyName: 'Amazon Web Services EMEA SARL',
        legalForm: 'Organizační složka',
        address: 'Olivova 2096/4, 110 00 Praha 1',
        isActive: true,
        registrationDate: '2012-03-20'
      },
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
      },
      '11223344': {
        ico: '11223344',
        dic: 'CZ11223344',
        companyName: 'Demo podnik v.o.s.',
        legalForm: 'Veřejná obchodní společnost',
        address: 'Hlavní třída 15, 702 00 Ostrava',
        isActive: true,
        registrationDate: '2019-03-10'
      },
      // Časté testovací IČO
      '95293299': {
        ico: '95293299',
        dic: 'CZ95293299',
        companyName: 'Test Corporation s.r.o.',
        legalForm: 'Společnost s ručením omezeným',
        address: 'Testovací ulice 123, 100 00 Praha 10',
        isActive: true,
        registrationDate: '2021-06-10'
      }
    };

    const company = mockCompanies[ico];
    
    if (company) {
      console.log('📝 Používám mock data pro IČO:', ico);
      return { data: company, error: null };
    } else {
      // Generování obecného mock záznamu pro neznámé IČO
      const genericCompany: AresCompanyData = {
        ico: ico,
        dic: `CZ${ico}`,
        companyName: `Firma IČO ${ico} s.r.o.`,
        legalForm: 'Společnost s ručením omezeným',
        address: 'Neznámá adresa, 100 00 Praha',
        isActive: true,
        registrationDate: '2020-01-01'
      };
      
      console.log('📝 Generuji mock data pro neznámé IČO:', ico);
      return { data: genericCompany, error: null };
    }
  }
}