import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import { AuthForm } from './components/AuthForm';
import { ClientForm } from './components/ClientForm';
import { ClientList } from './components/ClientList';
import { MortgageCalculator } from './components/MortgageCalculator';
import { AdminPanel } from './components/AdminPanel';
import { FileText, Calculator, Settings, Users, LogOut, Plus } from 'lucide-react';

function App() {
  const { user, loading, signOut } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('clientList');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);

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
    { id: 'admin', label: 'Administrace', icon: Settings },
  ];

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setActiveTab('newClient');
    setShowClientForm(true);
  };

  const handleTabChange = (tabId) => {
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

  const handleClientSaved = () => {
    setShowClientForm(false);
    setSelectedClient(null);
    // Zůstaneme na aktuální záložce po uložení
  };

  const handleClientListRefresh = () => {
    if (activeTab === 'clientList') {
      // ClientList komponenta se sama obnoví díky useEffect
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">KostKa Úvěry</h1>
                <p className="text-sm text-gray-500">Systém pro evidenci klientů</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Přihlášen: {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Odhlásit
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
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
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Vytvořit nového klienta
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Začněte vytvořením nového klientského záznamu
                  </p>
                  <button
                    onClick={handleNewClient}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nový klient
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'clientList' && !showClientForm && (
              <ClientList onSelectClient={handleSelectClient} toast={toast} />
            )}
            {activeTab === 'calculator' && !showClientForm && <MortgageCalculator />}
            {activeTab === 'admin' && !showClientForm && <AdminPanel toast={toast} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;