import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import ToastContainer from './components/ToastContainer';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthForm } from './components/AuthForm';
import { ClientForm } from './components/ClientForm';
import { ClientList } from './components/ClientList';
import { MortgageCalculator } from './components/MortgageCalculator';
import { AdminPanel } from './components/AdminPanel';
import { NotesApp } from './components/NotesApp';
import { FloatingSearch } from './components/FloatingSearch';
import { SearchToggleButton } from './components/SearchToggleButton';
import { PDFTestButton } from './components/PDFTestButton';
import BohemikaFormGenerator from './components/BohemikaFormGenerator';
import { FileText, Calculator, Settings, Users, LogOut, Plus } from 'lucide-react';

function App() {
  const { user, loading, signOut } = useAuth();
  const toast = useToast();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('clientList');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientListRefreshKey, setClientListRefreshKey] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Keyboard shortcut pro otevření search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setIsSearchVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const tabs = [
    { id: 'newClient', label: 'Nový klient', icon: FileText },
    { id: 'clientList', label: 'Seznam klientů', icon: Users },
    { id: 'calculator', label: 'Hypoteční kalkulačka', icon: Calculator },
    { id: 'bohemika', label: 'Bohemika formulář', icon: FileText },
    { id: 'notes', label: 'Poznámky', icon: FileText },
    { id: 'admin', label: 'Administrace', icon: Settings },
  ];

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setActiveTab('newClient');
    setShowClientForm(true);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'newClient') {
      setShowClientForm(true);
    } else {
      setShowClientForm(false);
      setSelectedClient(null);
    }
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setShowClientForm(true);
    setActiveTab('newClient');
  };

  const handleCloseClientForm = () => {
    setShowClientForm(false);
    setSelectedClient(null);
    setActiveTab('clientList');
  };

  const handleClientSaved = (updatedClient: any) => {
    setSelectedClient(updatedClient);
    handleClientListRefresh();
  };

  const handleClientListRefresh = () => {
    setClientListRefreshKey((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">KostKa Úvěry</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Systém pro evidenci klientů</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <PDFTestButton />
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Přihlášen: {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Odhlásit
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  console.log('Tab clicked:', id);
                  handleTabChange(id);
                }}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showClientForm ? (
          <ClientForm 
            selectedClient={selectedClient} 
            onClientSaved={handleClientSaved}
            onClose={handleCloseClientForm}
            toast={toast}
          />
        ) : (
          <>
            {activeTab === 'newClient' && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Vytvořit nového klienta
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Začněte vytvořením nového klientského záznamu
                  </p>
                  <button
                    onClick={handleNewClient}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nový klient
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'clientList' && !showClientForm && (
              <ClientList onSelectClient={handleSelectClient} toast={toast} refreshKey={clientListRefreshKey} />
            )}
            {activeTab === 'calculator' && !showClientForm && <MortgageCalculator />}
            {activeTab === 'bohemika' && !showClientForm && (
              <BohemikaFormGenerator 
                toast={{
                  success: (message: string) => toast.showSuccess('Úspěch', message),
                  error: (message: string) => toast.showError('Chyba', message)
                }}
                selectedClientId={selectedClient ? (selectedClient as any).id : undefined}
              />
            )}
            {activeTab === 'notes' && !showClientForm && <NotesApp />}
            {activeTab === 'admin' && !showClientForm && <AdminPanel toast={toast} />}
          </>
        )}

        {/* Search Toggle Button - temporarily disabled due to performance issues */}
        {/* <SearchToggleButton 
          onClick={() => setIsSearchVisible(!isSearchVisible)}
          isSearchVisible={isSearchVisible}
        />
        
        <FloatingSearch 
          isVisible={isSearchVisible}
          onToggle={() => setIsSearchVisible(!isSearchVisible)}
        /> */}
      </main>
    </div>
  );
}

export default App;