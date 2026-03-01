import React, { useState } from 'react';
import {
  Menu,
  Bell,
  User,
  Cloud,
  CloudOff,
  LogOut,
  BarChart,
  Search,
  LayoutDashboard,
  ShoppingCart,
  Store,
  Settings as SettingsIcon,
  X,
  Users2,
  Zap
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (key: string) => void;
  isOnline: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isOnline, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings, t } = useAppSettings();
  const { user, hasPermission } = useAuth();
  const isCompact = settings.sidebarCompact;

  const baseNavItems = NAVIGATION_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  const visibleNavItems = (() => {
    const items = [...baseNavItems];
    const hasSettingsItem = items.some((i) => i.key === 'settings');

    if (!hasSettingsItem && hasPermission('SETTINGS' as any)) {
      items.push({
        key: 'settings',
        icon: <SettingsIcon size={20} />,
        requiredPermission: 'SETTINGS'
      } as any);
    }

    return items;
  })();

  const bottomNavItems = [
    { key: 'dashboard', icon: <LayoutDashboard size={20} /> },
    { key: 'pos', icon: <Store size={20} />, permission: 'POS' },
    { key: 'orders', icon: <ShoppingCart size={20} />, permission: 'ORDERS' },
    { key: 'team', icon: <Users2 size={20} />, permission: 'TEAM' },
    { key: 'settings', icon: <SettingsIcon size={20} />, permission: 'SETTINGS' }
  ].filter((item) => !item.permission || hasPermission(item.permission as any));

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    setIsMobileMenuOpen(false);
  };

  const BRAND_HEX = '#2563eb';

  // Classe para sumir com a scrollbar
  const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-800 bg-slate-50 dark:text-slate-100 dark:bg-slate-950">
      
      {/* Background Radial (Suave) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-600/5 dark:bg-brand-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-600/5 dark:bg-brand-600/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'w-80 translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCompact ? 'md:w-[88px]' : 'md:w-[280px]'} 
          border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900
        `}
      >
        {/* Logomarca */}
        <div className={`flex h-20 shrink-0 items-center px-6 ${isCompact ? 'md:justify-center px-0' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-600/20">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
            </div>
            {(!isCompact || isMobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="text-[14px] font-black tracking-wider text-slate-900 leading-tight dark:text-white">NEXERO</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-600 leading-tight">Cloud Platform</span>
              </div>
            )}
          </div>

          {!isCompact && (
             <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navegação */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-1 ${scrollbarHiddenClass}`}>
          {visibleNavItems.map((item: any) => {
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-[14px] px-3 py-3 transition-all duration-200 ${isCompact && !isMobileMenuOpen ? 'md:justify-center' : ''}`}
              >
                {/* Linha Lateral Esquerda */}
                {isActive && (!isCompact || isMobileMenuOpen) && (
                  <div className="absolute left-[-16px] top-1/2 h-8 w-[4px] -translate-y-1/2 rounded-r-full bg-brand-600 shadow-[0_0_12px_rgba(13,148,136,0.6)] z-20"></div>
                )}
                
                {/* Fundo do item */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-[14px] bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-800"></div>
                )}

                {/* Fundo do item quando Ativo */}
                {isActive && (
                  <div className="absolute inset-0 rounded-[14px] bg-brand-50 border border-brand-100 shadow-sm dark:bg-brand-500/10 dark:border-brand-500/20"></div>
                )}

                {/* Ícone */}
                <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-all duration-300
                  ${isActive 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 drop-shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-white group-hover:text-brand-600 dark:bg-slate-800 dark:border-slate-700 dark:group-hover:bg-slate-700'}
                `}>
                  {item.icon}
                </div>

                {/* Texto */}
                {(!isCompact || isMobileMenuOpen) && (
                  <div className="relative z-10 flex flex-1 items-center justify-between text-left overflow-hidden">
                    <span className={`truncate text-[13px] font-bold tracking-wide transition-colors 
                      ${isActive 
                        ? 'text-brand-700 dark:text-brand-400' 
                        : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white'}
                    `}>
                      {typeof t === 'function' ? t(item.key as any) : item.key}
                    </span>
                    
                    {/* Badge Ativo */}
                    {isActive && (
                       <span className="ml-2 rounded-md bg-brand-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                         Ativo
                       </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onLogout}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 ${isCompact && !isMobileMenuOpen ? 'justify-center' : ''}`}
          >
             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-50 text-slate-400 border border-slate-100 group-hover:border-rose-200 group-hover:bg-white group-hover:text-rose-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:group-hover:bg-rose-500/10 dark:group-hover:text-rose-400">
                <LogOut size={16} strokeWidth={2.5} />
             </div>
            {(!isCompact || isMobileMenuOpen) && (
              <span className="text-[13px] font-bold text-slate-500 group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400">
                Encerrar Sessão
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pb-16 md:pb-0 relative">
        <header className="z-30 h-20 px-4 md:px-8 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                <Menu size={20} />
              </button>

              <div className="hidden w-80 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/30 md:flex dark:border-slate-800 dark:bg-slate-900">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Busca global (Atalhos, configs...)"
                  className="w-full border-none bg-transparent text-[13px] font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
               {/* Status Connection */}
              <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Online</span>
              </div>

              <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <Bell size={18} strokeWidth={2} />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-slate-900"></span>
              </button>

              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-black text-white shadow-lg shadow-brand-600/20 transition-transform hover:scale-105 ml-1"
              >
                {user?.name?.charAt(0) || 'U'}
              </button>
            </div>
        </header>

        <main className={`flex-1 overflow-y-auto px-4 py-8 md:px-8 relative z-10 ${scrollbarHiddenClass}`}>
            {children}
        </main>
      </div>

      {/* Profile menu */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute right-6 top-24 w-64 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl animate-in zoom-in-95 origin-top-right duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/50">
            
            <div className="flex items-center gap-3 px-4 py-4">
               <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-inner flex items-center justify-center text-white font-black">
                  {user?.name?.charAt(0) || 'U'}
               </div>
               <div className="overflow-hidden">
                  <p className="truncate text-sm font-black text-slate-800 dark:text-white leading-tight">{user?.name || "Administrador"}</p>
                  <p className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{user?.role || "admin@nexero.com"}</p>
               </div>
            </div>

            <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

            <div className="p-1 space-y-1">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                  <User size={16} /> Meu Perfil
                </button>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                  <SettingsIcon size={16} /> Configurações
                </button>
                <button
                  onClick={onLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl bg-rose-50/50 px-3 py-2.5 text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-100/80 dark:bg-rose-500/5 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={16} /> Sair da Conta
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
