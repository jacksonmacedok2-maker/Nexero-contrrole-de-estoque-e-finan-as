
import React, { useState } from 'react';
import { Menu, Bell, User, Cloud, CloudOff, LogOut, ChevronDown, BarChart, Search } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isOnline, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { settings, t } = useAppSettings();
  const { user, hasPermission } = useAuth();
  const isCompact = settings.sidebarCompact;

  const visibleNavItems = NAVIGATION_ITEMS.filter(item => 
    !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Professional SaaS Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface-900 text-slate-300 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCompact ? 'w-20' : 'w-64'}
        border-r border-slate-800 shadow-xl
      `}>
        <div className={`h-16 flex items-center px-6 border-b border-slate-800 ${isCompact ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/20">
              <BarChart size={18} className="text-white" />
            </div>
            {!isCompact && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-tight">Nexero</span>
                <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest leading-none">Estoque & Vendas</span>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setActiveTab(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                ${activeTab === item.path 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'}
                ${isCompact ? 'justify-center' : ''}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCompact && <span>{t(item.key as any)}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
           <div className={`flex items-center gap-3 ${isCompact ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                {user?.name.charAt(0)}
              </div>
              {!isCompact && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase truncate">{user?.role}</p>
                </div>
              )}
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Clean Interface */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Search size={16} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Buscar no sistema..." className="bg-transparent border-none text-xs w-full focus:outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center mr-4">
               {isOnline ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Cloud size={14} /> {t('synchronized')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <CloudOff size={14} /> {t('offline_mode')}
                  </span>
                )}
            </div>

            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name.charAt(0)}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-[60] py-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{user?.role}</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <User size={14} /> Meu Perfil
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); onLogout(); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors">
                    <LogOut size={14} /> Sair do Sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;