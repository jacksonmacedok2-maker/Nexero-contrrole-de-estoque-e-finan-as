
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, User, Phone, Building, Search, ArrowLeft, Landmark, ShieldCheck, Loader2, Sparkles, Inbox, RefreshCcw, ExternalLink, HelpCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { fetchCnpjData } from '../utils/helpers';
import { supabase } from '../services/supabase';

const Login: React.FC = () => {
  const { login, signUp, isVerifying, setIsVerifying, refreshSession } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CNPJ');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

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
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

      await signUp(signupData.email, signupData.password, metadata);
      setResendTimer(60);
    } catch (err: any) {
      if (err.message?.includes('rate limit')) {
        setError('Muitas tentativas de envio de e-mail em um curto período. Por favor, aguarde alguns minutos ou verifique sua pasta de spam.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente mais tarde.');
      }
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin || `${window.location.protocol}//${window.location.host}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupData.email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) throw error;
      setResendTimer(60);
      alert('Link enviado novamente! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setIsLoading(true);
    setError('');
    try {
      await refreshSession();
    } catch (err: any) {
      setError('Ainda não detectamos a confirmação. Por favor, clique no link do e-mail.');
    } finally {
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
      setError(err.message || 'CNPJ não encontrado na base da Receita Federal.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const isCnpjReady = documentType === 'CNPJ' && signupData.document.replace(/\D/g, '').length === 14;
  const passwordsMatch = signupData.password === signupData.confirmPassword;
  const showConfirmError = signupData.confirmPassword.length > 0 && !passwordsMatch;

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="relative inline-flex">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 rotate-3">
              <Mail size={48} className="-rotate-3" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={16} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Confirme seu E-mail</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Enviamos um link oficial para:<br/>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{signupData.email}</span>
            </p>
          </div>

          <div className="bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700/50 p-5 rounded-3xl text-left animate-pulse">
            <div className="flex gap-4">
              <div className="bg-amber-500 text-white p-2 rounded-xl h-fit">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Atenção ao Spam</h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                  Verifique obrigatoriamente sua pasta de <span className="underline decoration-2 underline-offset-2">Lixo Eletrônico ou Spam</span> caso o e-mail não apareça em instantes.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20">{error}</p>
            )}

            <button 
              onClick={handleManualCheck}
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><ExternalLink size={18} /> Já confirmei no e-mail</>}
            </button>

            <div className="flex flex-col items-center gap-2">
              {resendTimer > 0 ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aguarde {resendTimer}s para reenviar</p>
              ) : (
                <button 
                  onClick={handleResendEmail} 
                  disabled={isLoading}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-xs flex items-center gap-1"
                >
                  <RefreshCcw size={12} /> Não recebi, enviar novamente
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t dark:border-slate-800">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <HelpCircle size={12} /> Ainda com problemas?
            </p>
            <p className="text-[9px] text-slate-500 mt-1">Como você agora possui um plano profissional, considere configurar o SMTP personalizado no painel do Supabase para entregabilidade imediata.</p>
          </div>

          <button onClick={() => setIsVerifying(false)} className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Voltar para o cadastro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-600">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 opacity-90" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
              <span className="text-indigo-600 font-black text-3xl -rotate-3">V</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">VendaFlow <span className="text-indigo-300">Pro</span></h1>
          </div>
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
              <Sparkles size={14} className="text-indigo-300"/> Cloud Infrastructure
            </div>
            <h2 className="text-6xl font-black leading-[1.1] tracking-tight">Alta performance <br/><span className="text-indigo-300">Garantida.</span></h2>
            <p className="text-xl text-indigo-100/80 font-medium max-w-md leading-relaxed">Conectado diretamente ao seu banco de dados PostgreSQL seguro e escalável.</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-indigo-200/50 text-xs font-bold uppercase tracking-widest">© 2024 VendaFlow Pro</div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="text-center lg:text-left">
            {!isLogin && (
              <button onClick={() => setIsLogin(true)} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-6 hover:-translate-x-1 transition-all">
                <ArrowLeft size={18} /> Voltar ao Login
              </button>
            )}
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {isLogin ? 'Login Seguro' : 'Inicie seu Cadastro'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? 'Painel autenticado via Supabase Cloud.' : 'Cadastre sua empresa no ambiente de alta performance.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-600 animate-in shake duration-500">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Usuário / E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input type="email" required placeholder="exemplo@vflow.com" className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Senha de Acesso</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 uppercase tracking-widest">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> Entrar com Segurança</>}
              </button>
              <div className="pt-4 text-center">
                <p className="text-sm text-slate-500 font-medium">Não tem uma conta corporativa? <button type="button" onClick={() => setIsLogin(false)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Criar agora</button></p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5 animate-in slide-in-from-left-4 duration-500 pb-12">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-2">
                <button type="button" onClick={() => setDocumentType('CNPJ')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-lg' : 'text-slate-500'}`}>
                  <Building size={14} /> Pessoa Jurídica
                </button>
                <button type="button" onClick={() => setDocumentType('CPF')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CPF' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-lg' : 'text-slate-500'}`}>
                  <User size={14} /> Pessoa Física
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{documentType}</label>
                </div>
                <div className={`relative group transition-all duration-500 ${isCnpjReady ? 'ring-2 ring-indigo-500/30 rounded-2xl' : ''}`}>
                  <Landmark className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCnpjReady ? 'text-indigo-500' : 'text-slate-400'}`} size={20} />
                  <input 
                    type="text" 
                    required 
                    placeholder={documentType === 'CNPJ' ? "00.000.000/0001-00" : "000.000.000-00"} 
                    className="w-full pl-12 pr-[110px] py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 dark:text-white font-black tracking-tight" 
                    value={signupData.document} 
                    onChange={(e) => setSignupData({...signupData, document: e.target.value})} 
                  />
                  {documentType === 'CNPJ' && isCnpjReady && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-in slide-in-from-right-3 duration-300">
                      <button 
                        type="button" 
                        onClick={lookupCnpj} 
                        disabled={isSearchingCnpj} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-90 transition-all"
                      >
                        {isSearchingCnpj ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                        {isSearchingCnpj ? 'BUSCANDO...' : 'CONSULTAR'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{documentType === 'CNPJ' ? 'Empresa' : 'Nome'}</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input type="text" required placeholder="Razão Social ou Nome Completo" className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-bold text-slate-800 dark:text-white" value={signupData.companyName || signupData.name} onChange={(e) => setSignupData({...signupData, companyName: e.target.value, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">E-mail Principal</label>
                  <input type="email" required placeholder="admin@empresa.com" className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={signupData.email} onChange={(e) => setSignupData({...signupData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">WhatsApp</label>
                  <input type="text" required placeholder="(00) 0 0000-0000" className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={signupData.phone} onChange={(e) => setSignupData({...signupData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Senha Forte</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type={showSignupPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-9 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all" value={signupData.password} onChange={(e) => setSignupData({...signupData, password: e.target.value})} />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Repita a Senha</label>
                  <div className="relative group">
                    <ShieldCheck className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${showConfirmError ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                    <input 
                      type={showSignupConfirmPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      className={`w-full pl-9 pr-10 py-4 bg-white dark:bg-slate-900 border ${showConfirmError ? 'border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 transition-all`} 
                      value={signupData.confirmPassword} 
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})} 
                    />
                    <button type="button" onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showSignupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showConfirmError && (
                    <p className="text-[9px] font-bold text-rose-500 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <XCircle size={10} /> As senhas não coincidem
                    </p>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || isSearchingCnpj || showConfirmError} 
                className={`w-full py-5 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.98] uppercase tracking-widest mt-2 ${showConfirmError ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Confirmar Cadastro <ArrowRight size={20}/></>}
              </button>
            </form>
          )}

          <div className="text-center">
             <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-400 uppercase tracking-[0.25em] font-black">
                <ShieldCheck className="text-emerald-500" size={14} /> 
                Certificado de Segurança Supabase
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
