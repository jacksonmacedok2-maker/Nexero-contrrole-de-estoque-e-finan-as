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
import Team from './pages/Team';
import Login from './pages/Login';
import Invite from './pages/Invite';
import AuthCallback from './pages/AuthCallback';
import AuthConfirmed from './pages/AuthConfirmed';
import AuthError from './pages/AuthError';
import CreateCompanyModal from './components/CreateCompanyModal';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/database';
import { Loader2, ShieldCheck, Cloud } from 'lucide-react';

const BRAND = '#007FFF';

const BrandOverrides: React.FC = () => {
  // Força azul mesmo sem tailwind.config / sem css global
  // (usa variables + overrides de classes mais usadas)
  const css = `
    :root{
      --brand: ${BRAND};
      --brand-50: ${BRAND}14;
      --brand-100: ${BRAND}1f;
      --brand-200: ${BRAND}2a;
      --brand-300: ${BRAND}3d;
      --brand-400: ${BRAND}66;
      --brand-500: ${BRAND}b3;
      --brand-600: ${BRAND};
      --brand-700: ${BRAND};
      --brand-800: ${BRAND};
      --brand-900: ${BRAND};
    }

    /* Overrides de utilitários "brand" comuns (com !important) */
    .bg-brand-600{ background-color:${BRAND} !important; }
    .text-brand-600{ color:${BRAND} !important; }
    .border-brand-600{ border-color:${BRAND} !important; }
    .ring-brand-600{ --tw-ring-color:${BRAND} !important; }
    .shadow-brand-600\\/30{ box-shadow: 0 18px 40px -22px ${BRAND}4d !important; }
    .shadow-brand-600\\/25{ box-shadow: 0 18px 40px -22px ${BRAND}40 !important; }
    .shadow-brand-600\\/20{ box-shadow: 0 18px 40px -22px ${BRAND}33 !important; }

    /* Alguns padrões de foco */
    .focus\\:ring-brand-600:focus{ --tw-ring-color:${BRAND} !important; }
    .focus\\:border-brand-600:focus{ border-color:${BRAND} !important; }

    /* ✅ Mobile: garante que o viewport use altura "real" e evita cortes/overlap com barra inferior */
    html, body, #root {
      height: 100%;
    }
  `;
  return <style>{css}</style>;
};

const AppContent: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isAuthenticated, logout, hasPermission, companyId, loadingCompany } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveKey(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (key: string) => {
    setActiveKey(key);
    window.location.hash = key;
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

  const renderContent = () => {
    const path = window.location.pathname;
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    if (path.includes('/auth/invite')) return <Invite />;
    if (queryParams.has('error') || hashParams.has('error')) return <AuthError setActiveTab={() => navigateTo('dashboard')} />;
    if (queryParams.has('code') || hashParams.has('access_token')) return <AuthCallback setActiveTab={() => navigateTo('dashboard')} />;
    if (path.includes('/auth/confirmed')) return <AuthConfirmed setActiveTab={() => navigateTo('dashboard')} />;

    if (!isAuthenticated) {
      return <Login />;
    }

    if (loadingCompany && !companyId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-brand-600/10 rounded-2xl flex items-center justify-center text-brand-600 animate-bounce">
              <Cloud size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
              Sincronizando Organização...
            </p>
          </div>
        </div>
      );
    }

    if (!companyId) {
      return <CreateCompanyModal onSuccess={() => {}} />;
    }

    switch (activeKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return hasPermission('ORDERS') ? <Orders /> : <AccessDenied />;
      case 'clients':
        return hasPermission('CLIENTS') ? <Clients /> : <AccessDenied />;
      case 'pos':
        return hasPermission('POS') ? <POS /> : <AccessDenied />;
      case 'team':
        return hasPermission('TEAM') ? <Team /> : <AccessDenied />;
      case 'products':
        return hasPermission('PRODUCTS') ? <Products /> : <AccessDenied />;
      case 'inventory':
        return hasPermission('INVENTORY') ? <Inventory /> : <AccessDenied />;
      case 'finance':
        return hasPermission('FINANCE') ? <Finance /> : <AccessDenied />;
      case 'reports':
        return hasPermission('REPORTS') ? <Reports /> : <AccessDenied />;
      case 'settings':
        return hasPermission('SETTINGS') ? <Settings /> : <AccessDenied />;
      default:
        return <Dashboard />;
    }
  };

  const isPlainPage = !isAuthenticated || window.location.pathname.includes('/auth/');

  if (isPlainPage) {
    return (
      <div className="min-h-screen bg-white">
        {renderContent()}
      </div>
    );
  }

  return (
    <Layout activeTab={activeKey} setActiveTab={navigateTo} isOnline={isOnline} onLogout={logout}>
      {isSyncing && (
        <div className="fixed bottom-20 right-4 z-[100] bg-brand-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cloud Sync...</span>
        </div>
      )}

      {/* ✅ FIX MOBILE: espaço correto para a bottom-bar do Layout + safe-area (iPhone) */}
      <div className="h-full pb-[96px] md:pb-0" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {renderContent()}
      </div>
    </Layout>
  );
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
      <ShieldCheck size={40} />
    </div>
    <h2 className="text-2xl font-black text-slate-900 uppercase italic">Acesso Restrito</h2>
    <p className="text-slate-500 max-w-xs mx-auto mt-2 italic font-medium">
      Você não possui as permissões necessárias para este módulo.
    </p>
  </div>
);

const App: React.FC = () => {
  return (
    <>
      <BrandOverrides />
      <AppSettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppSettingsProvider>
    </>
  );
};

export default App;