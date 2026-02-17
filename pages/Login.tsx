
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, User, Building, Search, ArrowLeft, Landmark, Loader2, Zap, Cpu, Shield, Check, KeyRound, ArrowRight, Inbox, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCnpjData } from '../utils/helpers';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'WAITING_CONFIRMATION';

const Login: React.FC = () => {
  const { login, signUp, resendConfirmation, resetPassword, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CNPJ');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      setIsRedirecting(true);
    }
  }, [isAuthenticated]);

  const resetUIStates = () => {
    setIsLoading(false);
    setError('');
    setSuccessMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const metadata = {
        name: signupData.name,
        companyName: signupData.companyName,
        phone: signupData.phone,
        document: signupData.document,
        documentType: documentType
      };

      const needsConfirmation = await signUp(signupData.email, signupData.password, metadata);
      
      setIsLoading(false);
      
      if (needsConfirmation) {
        setMode('WAITING_CONFIRMATION');
      } else {
        setSuccessMessage('Instância configurada com sucesso! Redirecionando...');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    try {
      await resendConfirmation(signupData.email);
      setSuccessMessage('Novo link enviado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar e-mail.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await resetPassword(email);
      setSuccessMessage('Link de recuperação de acesso solicitado para o e-mail.');
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação.');
      setIsLoading(false);
    }
  };

  const lookupCnpj = async () => {
    const cleanCnpj = signupData.document.replace(/\D/g, '');
    setIsSearchingCnpj(true);
    setError('');

    try {
      const data = await fetchCnpjData(cleanCnpj);
      setSignupData(prev => ({
        ...prev,
        companyName: data.razao_social || data.nome_fantasia || '',
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone,
        email: data.email || prev.email
      }));
    } catch (err: any) {
      setError(err.message || 'CNPJ não encontrado.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const isCnpjReady = documentType === 'CNPJ' && signupData.document.replace(/\D/g, '').length === 14;
  const showConfirmError = signupData.confirmPassword.length > 0 && signupData.password !== signupData.confirmPassword;

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
          <div className="relative">
            <div className="w-32 h-32 bg-brand-600 rounded-[3rem] flex items-center justify-center text-white shadow-2xl shadow-brand-600/40 animate-bounce">
              <Zap size={64} className="fill-current" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-white shadow-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Ambiente Pronto!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs italic mx-auto">Sincronizando sua infraestrutura Nexero na nuvem.</p>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-brand-600" size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Estabelecendo Conexão Segura...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-slate-900 to-slate-900 z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#0d9488,transparent_50%)] opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-20 w-full text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-600/30">
              <Zap size={28} className="text-white fill-current" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">NEXERO</h1>
          </div>
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/20 rounded-full border border-brand-500/20 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md text-brand-400">
              <Cpu size={14} className="animate-pulse"/> Controle de Estoque e Vendas
            </div>
            <h2 className="text-7xl font-black leading-[0.9] tracking-tighter">
              Gestão <br/><span className="text-brand-500">Inteligente.</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed italic border-l-4 border-brand-600 pl-6">
              "A evolução do seu negócio começa com dados precisos e infraestrutura de elite."
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">© 2024 NEXERO CLOUD PLATFORM</div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start p-8 overflow-y-auto relative bg-white dark:bg-slate-950">
        <div className="w-full max-md:max-w-md lg:max-w-lg space-y-10 py-12 relative z-10">
          
          <div className="text-center lg:text-left">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter leading-tight uppercase">
                  {mode === 'LOGIN' ? 'Login' : mode === 'SIGNUP' ? 'Cadastro' : mode === 'WAITING_CONFIRMATION' ? 'Verificação' : 'Senha'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                  {mode === 'LOGIN' ? 'Acesse o seu painel de controle e vendas.' : mode === 'SIGNUP' ? 'Ative seu controle de estoque e vendas agora.' : mode === 'WAITING_CONFIRMATION' ? 'Falta pouco para ativar sua conta!' : 'Recupere o acesso à sua instância.'}
                </p>
              </div>
              {(mode !== 'LOGIN' && mode !== 'WAITING_CONFIRMATION') && (
                <button 
                  onClick={() => { setMode('LOGIN'); resetUIStates(); }} 
                  className="text-brand-600 dark:text-brand-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-all py-2"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-100 dark:border-emerald-500/10 p-6 rounded-[2rem] flex items-center gap-5 text-emerald-600 animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-500/5">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-white">
                <Check size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Sucesso!</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed italic">{successMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/5 border-2 border-rose-100 dark:border-rose-100/10 p-5 rounded-[2rem] flex items-start gap-4 text-rose-600 animate-in shake duration-500 shadow-lg shadow-rose-500/5">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-black italic">{error}</p>
            </div>
          )}

          {mode === 'LOGIN' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                    <input type="email" required placeholder="admin@nexero.app" className="w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-brand-500/5 transition-all text-slate-800 dark:text-white font-black tracking-tight" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Senha</label>
                    <button 
                      type="button" 
                      onClick={() => { setMode('FORGOT_PASSWORD'); resetUIStates(); }}
                      className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest hover:underline"
                    >
                      Recuperar acesso?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-14 pr-14 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-brand-500/5 transition-all text-slate-800 dark:text-white font-black tracking-tight" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-all">
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-6 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 shadow-2xl shadow-brand-600/40 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-70 uppercase tracking-[0.25em]">
                  {isLoading ? <Loader2 className="animate-spin" size={22} /> : <><Zap size={20} fill="currentColor" /> Acessar NEXERO</>}
                </button>
              </form>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center space-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">Ativar nova instância?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Configuração de infraestrutura gratuita e imediata.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setMode('SIGNUP'); resetUIStates(); }} 
                  className="w-full py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
                >
                  Ativar cadastro agora
                </button>
              </div>
            </div>
          )}

          {mode === 'SIGNUP' && (
            <div className="space-y-10 animate-in slide-in-from-left-4 duration-500">
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[1.5rem]">
                  <button type="button" onClick={() => setDocumentType('CNPJ')} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-xl' : 'text-slate-500'}`}>
                    <Building size={16} /> Empresa
                  </button>
                  <button type="button" onClick={() => setDocumentType('CPF')} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CPF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-xl' : 'text-slate-500'}`}>
                    <User size={16} /> Autônomo
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{documentType}</label>
                  </div>
                  <div className={`relative group transition-all duration-300 ${isCnpjReady ? 'ring-4 ring-brand-500/10 rounded-[1.5rem]' : ''}`}>
                    <Landmark className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isCnpjReady ? 'text-brand-500' : 'text-slate-400'}`} size={20} />
                    <input type="text" required placeholder={documentType === 'CNPJ' ? "00.000.000/0001-00" : "000.000.000-00"} className="w-full pl-14 pr-[120px] py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-brand-500/5 transition-all text-slate-800 dark:text-white font-black tracking-tight" value={signupData.document} onChange={(e) => setSignupData({...signupData, document: e.target.value})} />
                    {documentType === 'CNPJ' && isCnpjReady && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button type="button" onClick={lookupCnpj} disabled={isSearchingCnpj} className="bg-brand-600 text-white text-[9px] font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all uppercase tracking-widest">
                          {isSearchingCnpj ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                          {isSearchingCnpj ? '...' : 'BUSCAR'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Nome / Razão Social</label>
                  <div className="relative group">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" required placeholder="Ex: Nexero Solutions" className="w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] focus:outline-none text-sm font-black text-slate-800 dark:text-white" value={signupData.companyName || signupData.name} onChange={(e) => setSignupData({...signupData, companyName: e.target.value, name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">E-mail</label>
                    <input type="email" required placeholder="seu@email.com" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] text-sm font-black focus:outline-none" value={signupData.email} onChange={(e) => setSignupData({...signupData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">WhatsApp</label>
                    <input type="text" required placeholder="(00) 00000-0000" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] text-sm font-black focus:outline-none" value={signupData.phone} onChange={(e) => setSignupData({...signupData, phone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Senha</label>
                    <input type="password" required placeholder="Mín. 6 chars" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] text-sm font-black focus:outline-none" value={signupData.password} onChange={(e) => setSignupData({...signupData, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Confirmação</label>
                    <input type="password" required placeholder="Repita" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] text-sm font-black focus:outline-none" value={signupData.confirmPassword} onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})} />
                  </div>
                </div>

                <button type="submit" disabled={isLoading || isSearchingCnpj || showConfirmError} className={`w-full py-6 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] uppercase tracking-[0.2em] mt-6 ${showConfirmError ? 'bg-slate-400 opacity-50' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/40'}`}>
                  {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>Ativar minha plataforma</>}
                </button>
              </form>
            </div>
          )}

          {mode === 'WAITING_CONFIRMATION' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-brand-600/20 rounded-[2rem] animate-ping" />
                <div className="relative bg-brand-600 text-white w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl shadow-brand-600/30">
                  <Inbox size={40} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Confirme seu E-mail</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic max-w-sm mx-auto">
                  Enviamos um link de ativação para <span className="text-brand-600 font-black">{signupData.email}</span>.
                </p>
              </div>

              {/* Dica de Spam - IMPORTANTE */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-5 rounded-[2rem] flex items-start gap-4 text-left animate-in slide-in-from-bottom-2 duration-700">
                <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Não recebeu o e-mail?</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500/80 font-medium leading-relaxed italic">
                    Verifique sua pasta de <span className="font-black underline">Spam</span> ou <span className="font-black underline">Lixo Eletrônico</span>. Como você usa Hostinger/SMTP externo, o e-mail pode demorar até 2 minutos.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {/* Botão de Já Confirmei - Resolve o problema do PC ficar esperando */}
                <button 
                  onClick={() => {
                    setEmail(signupData.email);
                    setMode('LOGIN');
                    resetUIStates();
                  }}
                  className="w-full py-6 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 shadow-2xl shadow-brand-600/40 hover:bg-brand-700 active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
                >
                  Já confirmei meu e-mail
                </button>

                <div className="flex flex-col gap-3">
                   <button 
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] hover:underline disabled:opacity-50"
                  >
                    {isResending ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Reenviar link de ativação
                  </button>
                  
                  <button 
                    onClick={() => { setMode('SIGNUP'); resetUIStates(); }} 
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
                  >
                    Tentar outro e-mail
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'FORGOT_PASSWORD' && (
            <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-brand-50 dark:bg-brand-500/5 p-6 rounded-[2rem] border border-brand-100 dark:border-brand-500/10 flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-brand-600">
                   <KeyRound size={24} />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  Um link de redefinição de acesso imediato será enviado para sua conta.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">E-mail de Acesso</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                    <input type="email" required placeholder="seu@email.com" className="w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-brand-500/5 transition-all text-slate-800 dark:text-white font-black tracking-tight" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                {!successMessage && (
                  <button type="submit" disabled={isLoading} className="w-full py-6 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 shadow-2xl shadow-brand-600/40 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-70 uppercase tracking-[0.25em]">
                    {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>Recuperar Acesso <ArrowRight size={18} /></>}
                  </button>
                )}
              </form>
            </div>
          )}

          <div className="text-center pt-10">
             <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-full text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black border border-slate-200 dark:border-slate-700">
                <Shield size={14} className="text-emerald-500" /> 
                Nexero Cloud Secured
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
