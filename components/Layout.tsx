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
  Users2
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

  const visibleNavItems = NAVIGATION_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  );

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

  const BRAND_HEX = '#007FFF';
  const brandShadow = `${BRAND_HEX}33`;

  // ✅ Ativo no modo claro: azulzinho discreto (Bling-like)
  const activeBgLight = '#EAF4FF';     // azul bem claro
  const activeBorderLight = '#CFE6FF'; // borda azul clara

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Background clean */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
        <div
          className="absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full blur-3xl opacity-30"
          style={{ background: `radial-gradient(circle, ${BRAND_HEX}22, transparent 62%)` }}
        />
        <div
          className="absolute -bottom-56 -right-56 h-[640px] w-[640px] rounded-full blur-3xl opacity-25"
          style={{ background: `radial-gradient(circle, ${BRAND_HEX}18, transparent 62%)` }}
        />
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[70] transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
          ${isCompact ? 'md:w-[92px]' : 'md:w-[304px]'}
          flex flex-col
        `}
      >
        <div className="h-full mx-3 my-3 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div
            className={`h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 justify-between ${
              isCompact ? 'md:justify-center' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_HEX}, ${BRAND_HEX}CC)`,
                  boxShadow: `0 14px 36px -20px ${brandShadow}`
                }}
              >
                <BarChart size={18} className="text-white" />
              </div>
              {(!isCompact || isMobileMenuOpen) && (
                <div className="leading-tight">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight">NEXERO</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Enterprise</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="mt-3 px-2.5 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {visibleNavItems.map((item) => {
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => handleTabClick(item.key)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-sm font-semibold
                    ${isCompact && !isMobileMenuOpen ? 'md:justify-center' : ''}
                    ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'}
                  `}
                  style={
                    isActive
                      ? {
                          backgroundColor: activeBgLight,
                          border: `1px solid ${activeBorderLight}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className={`
                      h-10 w-10 rounded-2xl flex items-center justify-center border transition-all
                      ${isActive ? 'bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'}
                    `}
                    style={isActive ? { boxShadow: `0 16px 42px -28px ${brandShadow}` } : undefined}
                  >
                    <div style={isActive ? { color: BRAND_HEX } : undefined}>{item.icon}</div>
                  </div>

                  {(!isCompact || isMobileMenuOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{t(item.key as any)}</span>

                      {/* ✅ pill discreta */}
                      {isActive && (
                        <span
                          className="ml-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200"
                          style={{ color: BRAND_HEX }}
                        >
                          Ativo
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors
                text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10
                ${isCompact && !isMobileMenuOpen ? 'md:justify-center' : ''}
              `}
            >
              <LogOut size={18} />
              {(!isCompact || isMobileMenuOpen) && 'Sair'}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <header className="h-14 md:h-16 px-4 md:px-6 z-30">
          <div className="h-full mt-3 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Menu size={20} />
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 w-[360px]">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="bg-transparent border-none text-sm w-full focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <h1 className="md:hidden text-sm font-black text-slate-900 dark:text-white tracking-tight">Nexero</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {isOnline ? (
                  <span className="text-emerald-600 bg-emerald-50/80 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                    <Cloud size={16} />
                  </span>
                ) : (
                  <span className="text-amber-600 bg-amber-50/80 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-100 dark:border-amber-500/20">
                    <CloudOff size={16} />
                  </span>
                )}
              </div>

              <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-black"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_HEX}, ${BRAND_HEX}CC)`,
                    boxShadow: `0 14px 36px -20px ${brandShadow}`
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">{children}</main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 z-[60] md:hidden">
        <div className="mx-3 mb-3 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full flex items-center justify-around px-2">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center border transition-all ${
                    isActive ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-transparent border-transparent'
                  }`}
                  style={isActive ? { boxShadow: `0 16px 42px -28px ${brandShadow}` } : undefined}
                >
                  <div style={isActive ? { color: BRAND_HEX } : undefined}>{item.icon}</div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                  {t(item.key as any).substring(0, 8)}
                </span>
                {isActive && <div className="w-1 h-1 rounded-full absolute bottom-1" style={{ backgroundColor: BRAND_HEX }} />}
              </button>
            );
          })}
        </div>
      </div>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute top-16 right-4 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{user?.role}</p>
            </div>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <User size={16} /> Perfil
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;