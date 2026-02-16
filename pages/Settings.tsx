
import React, { useState, useEffect } from 'react';
import { Building2, Receipt, Users, ShoppingBag, Box, Store, Wallet, Bell, Link2, Monitor, ChevronRight, Save, CheckCircle2, UserPlus, Trash2, Edit2, X, Lock, MailCheck, ShieldCheck, ExternalLink, Info, Copy, Globe } from 'lucide-react';
import { useAppSettings, ThemeMode } from '../contexts/AppSettingsContext';
import { Language } from '../i18n/translations';
import { User, UserRole, Permission } from '../types';
import { generateId } from '../utils/helpers';

type SectionType = 'company' | 'fiscal' | 'users' | 'commercial' | 'inventory' | 'pos' | 'finance' | 'notifications' | 'integrations' | 'appearance' | 'email_delivery';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('appearance');
  const { settings, updateSettings, t } = useAppSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const changed = 
      localSettings.theme !== settings.theme || 
      localSettings.language !== settings.language || 
      localSettings.sidebarCompact !== settings.sidebarCompact;
    setIsDirty(changed);
  }, [localSettings, settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setIsDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const menuItems = [
    { id: 'company', label: 'Empresa', icon: <Building2 size={18} /> },
    { id: 'fiscal', label: 'Fiscal & NF-e', icon: <Receipt size={18} /> },
    { id: 'users', label: t('users_permissions'), icon: <Users size={18} /> },
    { id: 'email_delivery', label: t('email_delivery'), icon: <MailCheck size={18} /> },
    { id: 'commercial', label: 'Comercial & Vendas', icon: <ShoppingBag size={18} /> },
    { id: 'inventory', label: 'Estoque & Produtos', icon: <Box size={18} /> },
    { id: 'pos', label: 'Ponto de Venda (PDV)', icon: <Store size={18} /> },
    { id: 'finance', label: 'Financeiro', icon: <Wallet size={18} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
    { id: 'integrations', label: 'Integrações & API', icon: <Link2 size={18} /> },
    { id: 'appearance', label: t('system_interface'), icon: <Monitor size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} /> {t('saved_success')}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">{t('settings')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Personalize o comportamento do ERP.</p>
        </div>
        {activeSection === 'appearance' && (
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all
              ${isDirty 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
            `}
          >
            <Save size={18} /> {t('save_changes')}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        <div className="w-full md:w-72 space-y-1 shrink-0 overflow-y-auto pb-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SectionType)}
              className={`
                w-full flex items-center justify-between p-3 rounded-xl transition-all
                ${activeSection === item.id 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </div>
              {activeSection === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto p-4 md:p-8 transition-colors">
          {activeSection === 'appearance' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title={t('system_interface')} subtitle={t('system_interface_sub')} />
              <div className="space-y-6">
                <SelectField 
                  label={t('theme_visual')} 
                  options={[
                    { label: t('theme_auto'), value: 'system' },
                    { label: t('theme_light'), value: 'light' },
                    { label: t('theme_dark'), value: 'dark' }
                  ]}
                  value={localSettings.theme}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setLocalSettings(prev => ({ ...prev, theme: e.target.value as ThemeMode }))
                  }
                />
                <SelectField 
                  label={t('language')} 
                  options={[
                    { label: 'Português (Brasil)', value: 'pt-BR' },
                    { label: 'English (US)', value: 'en' }
                  ]}
                  value={localSettings.language}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setLocalSettings(prev => ({ ...prev, language: e.target.value as Language }))
                  }
                />
                <ToggleField 
                  label={t('compact_sidebar')} 
                  description={t('compact_sidebar_sub')} 
                  checked={localSettings.sidebarCompact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLocalSettings(prev => ({ ...prev, sidebarCompact: e.target.checked }))
                  }
                />
              </div>
            </div>
          )}
          
          {activeSection === 'email_delivery' && <EmailDeliveryGuide />}
          
          {activeSection === 'users' && <UsersSettingsForm />}

          {!['appearance', 'users', 'email_delivery'].includes(activeSection) && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p className="text-sm font-medium">As configurações de {activeSection} estarão disponíveis em breve.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmailDeliveryGuide: React.FC = () => {
  const currentUrl = window.location.origin;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <SectionHeader 
        title="Configuração de E-mail & Autenticação" 
        subtitle="Siga estes passos para garantir que o link de confirmação funcione no seu celular." 
      />

      <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Globe size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white">URL de Redirecionamento</h4>
            <p className="text-xs text-slate-500">Copie esta URL e cole no painel do Supabase.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-slate-900 border dark:border-slate-700 p-3 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
            {currentUrl}
          </div>
          <button 
            onClick={handleCopy}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado!' : 'Copiar URL'}
          </button>
        </div>

        <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700 space-y-3">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onde colar no Supabase?</h5>
          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal pl-4">
            <li>Vá em <strong>Authentication > URL Configuration</strong>.</li>
            <li>No campo <strong>Site URL</strong>, cole o link acima.</li>
            <li>No campo <strong>Redirect URLs</strong>, adicione também este mesmo link.</li>
          </ol>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-6 rounded-3xl flex gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
          <Info size={24} />
        </div>
        <div>
          <h4 className="text-amber-900 dark:text-amber-400 font-black uppercase text-xs tracking-widest mb-1">Por que cai no spam?</h4>
          <p className="text-sm text-amber-800 dark:text-amber-300/80 leading-relaxed">
            O Supabase usa um servidor compartilhado por padrão. Para resolver definitivamente, você deve usar seu próprio servidor SMTP (Resend ou SendGrid).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
            <h4 className="font-bold text-slate-800 dark:text-white">Configure um SMTP Próprio</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No painel do Supabase, habilite <strong>Custom SMTP</strong> e insira as credenciais do <strong>Resend</strong>.
          </p>
        </div>

        <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} />
              <h4 className="font-bold">Dica de Especialista</h4>
            </div>
            <a href="https://supabase.com/docs/guides/auth/auth-smtp" target="_blank" className="text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
              Docs Supabase <ExternalLink size={14} />
            </a>
          </div>
          <p className="text-sm text-indigo-100 leading-relaxed">
            Após configurar o SMTP e as URLs de redirecionamento, os e-mails chegarão instantaneamente e o link funcionará em qualquer dispositivo (PC ou Celular).
          </p>
        </div>
      </div>
    </div>
  );
};

const DnsRecordCard = ({ type, description }: { type: string, description: string }) => (
  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 p-1.5 rounded-lg">
      <ShieldCheck size={16} />
    </div>
    <div>
      <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{type}</p>
      <p className="text-[10px] text-slate-500">{description}</p>
    </div>
  </div>
);

const UsersSettingsForm: React.FC = () => {
  const { t } = useAppSettings();
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vendaflow_users_v1');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: '1', 
        name: 'Administrador Principal', 
        email: 'admin@vendaflow.com', 
        role: UserRole.ADMIN, 
        active: true, 
        permissions: ['FINANCE', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'POS', 'SETTINGS', 'REPORTS'] 
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem('vendaflow_users_v1', JSON.stringify(users));
  }, [users]);

  const handleDelete = (id: string) => {
    if (id === '1') return alert('O administrador principal não pode ser removido.');
    if (confirm('Deseja realmente remover este usuário?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSaveUser = (user: User) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      setUsers([...users, { ...user, id: generateId() }]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <SectionHeader 
          title={t('users_permissions')} 
          subtitle="Gerencie sua equipe e controle quem pode acessar cada módulo do sistema." 
        />
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
        >
          <UserPlus size={18} /> {t('add_user')}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('name')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('role')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${user.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {user.active ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === '1'}
                      className={`p-2 transition-colors ${user.id === '1' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
};

const UserModal: React.FC<{ user: User | null, onClose: () => void, onSave: (user: User) => void }> = ({ user, onClose, onSave }) => {
  const { t } = useAppSettings();
  const [formData, setFormData] = useState<User>(user || {
    id: '',
    name: '',
    email: '',
    role: UserRole.SELLER,
    active: true,
    permissions: ['ORDERS', 'POS']
  });

  const permissionList: { key: Permission, label: string }[] = [
    { key: 'FINANCE', label: t('access_finance') },
    { key: 'INVENTORY', label: t('access_inventory') },
    { key: 'PRODUCTS', label: t('access_products') },
    { key: 'ORDERS', label: t('access_orders') },
    { key: 'POS', label: t('access_pos') },
    { key: 'SETTINGS', label: t('access_settings') },
    { key: 'REPORTS', label: t('access_reports') },
  ];

  const togglePermission = (perm: Permission) => {
    const has = formData.permissions.includes(perm);
    if (has) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, perm] });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user ? t('edit_user') : t('add_user')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <InputField 
              label={t('name')} 
              placeholder="Ex: João Silva" 
              value={formData.name} 
              onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
            />
            <InputField 
              label={t('email')} 
              placeholder="Ex: joao@email.com" 
              value={formData.email} 
              onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              label={t('role')} 
              options={Object.values(UserRole).map(role => ({ label: role, value: role }))}
              value={formData.role}
              onChange={(e: any) => setFormData({...formData, role: e.target.value as UserRole})}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('status')}</label>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
                <button 
                  onClick={() => setFormData({...formData, active: true})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.active ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {t('active')}
                </button>
                <button 
                  onClick={() => setFormData({...formData, active: false})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!formData.active ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {t('inactive')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> {t('permissions')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionList.map(perm => (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    formData.permissions.includes(perm.key)
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold">{perm.label}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.permissions.includes(perm.key) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                    {formData.permissions.includes(perm.key) && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50">Cancelar</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
          >
            {user ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-8 border-b dark:border-slate-800 pb-6">
    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>
  </div>
);

const InputField = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100 transition-all"
    />
  </div>
);

const SelectField = ({ label, options, value, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
    <select 
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100 cursor-pointer transition-all appearance-none"
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const ToggleField = ({ label, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
    <div className="pr-4">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
  </div>
);

export default Settings;
