import React from 'react';

/**
 * Globální správce pro načítání Google Maps API
 * Zajišťuje, že se API načte pouze jednou
 */

interface GoogleMapsLoaderState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  promise: Promise<void> | null;
}

class GoogleMapsLoader {
  private state: GoogleMapsLoaderState = {
    isLoaded: false,
    isLoading: false,
    error: null,
    promise: null
  };

  private callbacks: Array<(loaded: boolean, error?: string) => void> = [];

  /**
   * Načte Google Maps API pokud ještě není načteno
   */
  async loadGoogleMapsApi(): Promise<void> {
    // Pokud je už načteno, vrati úspěch
    if (this.state.isLoaded) {
      console.log('✅ Google Maps API je již načteno');
      return Promise.resolve();
    }

    // Pokud se zrovna načítá, vrati existující promise
    if (this.state.isLoading && this.state.promise) {
      console.log('⏳ Google Maps API se již načítá, čekám...');
      return this.state.promise;
    }

    // Zkontroluj, jestli už není načteno z jiného zdroje
    if (window.google?.maps?.places) {
      console.log('✅ Google Maps API už bylo načteno z jiného zdroje');
      this.state.isLoaded = true;
      this.notifyCallbacks(true);
      return Promise.resolve();
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key not found in environment';
      console.error('❌', error);
      this.state.error = error;
      this.notifyCallbacks(false, error);
      throw new Error(error);
    }

    // Odstranit existující skripty (pokud existují)
    this.removeExistingScripts();

    this.state.isLoading = true;
    this.state.error = null;

    console.log('📝 Načítám Google Maps API...');

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=3.55`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-api-script';
      
      script.onload = () => {
        console.log('✅ Google Maps API bylo úspěšně načteno');
        this.state.isLoaded = true;
        this.state.isLoading = false;
        this.state.promise = null;
        this.notifyCallbacks(true);
        resolve();
      };
      
      script.onerror = (error) => {
        const errorMsg = 'Failed to load Google Maps API';
        console.error('❌', errorMsg, error);
        this.state.error = errorMsg;
        this.state.isLoading = false;
        this.state.promise = null;
        this.notifyCallbacks(false, errorMsg);
        reject(new Error(errorMsg));
      };
      
      document.head.appendChild(script);
    });

    this.state.promise = promise;
    return promise;
  }

  /**
   * Odstraní existující Google Maps skripty
   */
  private removeExistingScripts(): void {
    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) {
      console.log('🗑️ Odstraňuji existující Google Maps skript');
      existingScript.remove();
    }

    // Odstranit také všechny skripty obsahující maps.googleapis.com
    const allScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    allScripts.forEach(script => {
      if (script.id !== 'google-maps-api-script') {
        console.log('🗑️ Odstraňuji duplicitní Google Maps skript');
        script.remove();
      }
    });
  }

  /**
   * Přidá callback pro oznámení o načtení
   */
  onLoadChange(callback: (loaded: boolean, error?: string) => void): () => void {
    this.callbacks.push(callback);
    
    // Pokud je už načteno, zavolej callback okamžitě
    if (this.state.isLoaded) {
      callback(true);
    } else if (this.state.error) {
      callback(false, this.state.error);
    }

    // Vrátí funkci pro odregistrování
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Oznámí všem callbackům změnu stavu
   */
  private notifyCallbacks(loaded: boolean, error?: string): void {
    this.callbacks.forEach(callback => {
      try {
        callback(loaded, error);
      } catch (err) {
        console.error('Chyba v Google Maps loader callback:', err);
      }
    });
  }

  /**
   * Vrátí aktuální stav
   */
  getState(): Readonly<GoogleMapsLoaderState> {
    return { ...this.state };
  }

  /**
   * Kontrola zda je API dostupné
   */
  isAvailable(): boolean {
    return this.state.isLoaded && !!window.google?.maps?.places;
  }
}

// Singleton instance
export const googleMapsLoader = new GoogleMapsLoader();

// Hook pro React komponenty
export const useGoogleMapsLoader = () => {
  const [isLoaded, setIsLoaded] = React.useState(googleMapsLoader.getState().isLoaded);
  const [error, setError] = React.useState(googleMapsLoader.getState().error);

  React.useEffect(() => {
    const unsubscribe = googleMapsLoader.onLoadChange((loaded, errorMsg) => {
      setIsLoaded(loaded);
      setError(errorMsg || null);
    });

    return unsubscribe;
  }, []);

  const loadApi = React.useCallback(() => {
    return googleMapsLoader.loadGoogleMapsApi();
  }, []);

  return {
    isLoaded,
    error,
    loadApi,
    isAvailable: googleMapsLoader.isAvailable()
  };
};

// Pro komponenty které potřebují pouze načíst API
export { googleMapsLoader as default };
