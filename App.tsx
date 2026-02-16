
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import POS from './pages/POS';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Login from './pages/Login';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('/');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isAuthenticated, logout, user, hasPermission } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case '/':
        return <Dashboard />;
      case '/orders':
        return hasPermission('ORDERS') ? <Orders /> : <AccessDenied />;
      case '/clients':
        return hasPermission('CLIENTS') ? <Clients /> : <AccessDenied />;
      case '/pos':
        return hasPermission('POS') ? <POS /> : <AccessDenied />;
      case '/products':
        return hasPermission('PRODUCTS') ? <Products /> : <AccessDenied />;
      case '/inventory':
        return hasPermission('INVENTORY') ? <Inventory /> : <AccessDenied />;
      case '/finance':
        return hasPermission('FINANCE') ? <Finance /> : <AccessDenied />;
      case '/settings':
        return hasPermission('SETTINGS') ? <Settings /> : <AccessDenied />;
      default:
        return <NotFound setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} onLogout={logout}>
      {renderContent()}
    </Layout>
  );
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
      <span className="text-4xl">🚫</span>
    </div>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Acesso Negado</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Você não tem permissão para acessar este módulo. Entre em contato com o administrador.</p>
  </div>
);

const NotFound = ({ setActiveTab }: any) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
      <span className="text-4xl">🚧</span>
    </div>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Em Desenvolvimento</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Esta funcionalidade está sendo preparada para o próximo lançamento.</p>
    <button onClick={() => setActiveTab('/')} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Voltar ao Painel</button>
  </div>
);

const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppSettingsProvider>
  );
};

export default App;
