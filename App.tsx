
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
import Reports from './pages/Reports';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthConfirmed from './pages/AuthConfirmed';
import AuthError from './pages/AuthError';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/database';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState(window.location.pathname);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isAuthenticated, logout, hasPermission } = useAuth();

  // Sincronizar activeTab com o pathname da URL para suportar links diretos/callbacks
  useEffect(() => {
    const handleLocationChange = () => {
      setActiveTab(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Tratamento inicial para rotas de auth
    if (window.location.pathname.startsWith('/auth/')) {
      setActiveTab(window.location.pathname);
    } else if (!isAuthenticated && window.location.pathname !== '/login') {
       // Opcional: Se não estiver logado e não for rota de auth, força '/' que renderizará Login
    }

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [isAuthenticated]);

  // Atualizar a URL sem recarregar a página (Fake Router)
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setActiveTab(path);
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await db.syncPendingData();
      setIsSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      db.syncPendingData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Rotas que não exigem Layout (Auth Fullscreen)
  if (!isAuthenticated && !activeTab.startsWith('/auth/')) {
    return <Login />;
  }

  const renderContent = () => {
    // Rotas de Autenticação (Públicas/Callback)
    if (activeTab.startsWith('/auth/callback')) return <AuthCallback setActiveTab={navigateTo} />;
    if (activeTab.startsWith('/auth/confirmed')) return <AuthConfirmed setActiveTab={navigateTo} />;
    if (activeTab.startsWith('/auth/error')) return <AuthError setActiveTab={navigateTo} />;

    // Rotas do App
    switch (activeTab) {
      case '/':
      case '/dashboard':
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
      case '/reports':
        return hasPermission('REPORTS') ? <Reports /> : <AccessDenied />;
      case '/settings':
        return hasPermission('SETTINGS') ? <Settings /> : <AccessDenied />;
      case '/login':
        return <Login />;
      default:
        return <NotFound setActiveTab={navigateTo} />;
    }
  };

  // Se for uma página de auth, não renderiza o Layout lateral
  if (activeTab.startsWith('/auth/')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-16">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={navigateTo} isOnline={isOnline} onLogout={logout}>
      {isSyncing && (
        <div className="fixed bottom-8 right-8 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Dados...</span>
        </div>
      )}
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
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Página não encontrada</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">O endereço solicitado não existe ou ainda está em construção.</p>
    <button onClick={() => setActiveTab('/')} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Voltar ao Início</button>
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
