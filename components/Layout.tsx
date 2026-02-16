
import React, { useState } from 'react';
import { Menu, Bell, User, Cloud, CloudOff, LogOut, ChevronDown, Zap } from 'lucide-react';
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCompact ? 'w-20' : 'w-64'}
        border-r border-slate-800
      `}>
        <div className={`p-6 flex items-center gap-3 ${isCompact ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <Zap size={22} className="text-white fill-current" />
          </div>
          {!isCompact && (
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter leading-none text-white">NEXERO</h1>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1">Enterprise</span>
            </div>
          )}
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setActiveTab(item.path);
                setIsMobileMenuOpen(false);
              }}
              title={isCompact ? t(item.key as any) : undefined}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${activeTab === item.path 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                ${isCompact ? 'justify-center px-0' : ''}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCompact && <span className="font-bold text-sm tracking-tight whitespace-nowrap">{t(item.key as any)}</span>}
            </button>
          ))}
        </nav>

        <div className={`absolute bottom-0 w-full p-4 border-t border-slate-800 ${isCompact ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCompact ? 'px-0' : 'px-4'} py-2`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 font-bold text-indigo-400 shadow-inner">
              {user?.name.charAt(0)}
            </div>
            {!isCompact && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 transition-colors z-30 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-600 dark:text-slate-400" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              {isOnline ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
                  <Cloud size={14} /> {t('synchronized')}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">
                  <CloudOff size={14} /> {t('offline_mode')}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 transition-colors group">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs uppercase shadow-lg shadow-indigo-600/10">{user?.name.charAt(0)}</div>
                <span className="text-sm font-black hidden sm:block tracking-tight text-slate-800 dark:text-white">{user?.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Acesso Enterprise</p>
                    <p className="text-sm font-bold truncate text-slate-800 dark:text-white">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setIsProfileOpen(false); onLogout(); }} className="w-full flex items-center gap-2 p-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                      <LogOut size={16} />Encerrar Sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-100/30 dark:from-indigo-600/5 to-transparent pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
