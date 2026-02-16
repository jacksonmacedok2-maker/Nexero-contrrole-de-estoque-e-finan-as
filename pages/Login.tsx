
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, User, Phone, Building, Search, ArrowLeft, Landmark, ShieldCheck, Loader2, Zap, Cpu, XCircle, Sparkles, MailQuestion, PartyPopper, Timer, ExternalLink, Info, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCnpjData } from '../utils/helpers';

const Login: React.FC = () => {
  const { login, signUp, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(false);
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
    if (isAuthenticated && isLoading) {
      setIsRedirecting(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSignupSuccess(false);
    setRateLimitError(false);
    
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
    setRateLimitError(false);
    
    try {
      const metadata = {
        name: signupData.name,
        companyName: signupData.companyName,
        phone: signupData.phone,
        document: signupData.document,
        documentType: documentType
      };

      await signUp(signupData.email, signupData.password, metadata);
      
      if (!isAuthenticated) {
        setIsLogin(true);
        setSignupSuccess(true);
        setEmail(signupData.email);
        setIsLoading(false);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit exceeded')) {
        setRateLimitError(true);
        setError('Muitas tentativas de cadastro seguidas. O Supabase bloqueou novos e-mails por segurança (limite de 3 por hora no plano free).');
      } else {
        setError(msg || 'Erro ao criar conta. Verifique os dados informados.');
      }
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
  const passwordsMatch = signupData.password === signupData.confirmPassword;
  const showConfirmError = signupData.confirmPassword.length > 0 && !passwordsMatch;

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 animate-bounce">
              <Zap size={48} className="fill-current" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Ambiente Pronto!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs italic">Sincronizando infraestrutura Nexero Pro.</p>
          </div>
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent_50%)] opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-20 w-full text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
              <Zap size={28} className="text-white fill-current" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">NEXERO</h1>
          </div>
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md text-indigo-400">
              <Cpu size={14} className="animate-pulse"/> Enterprise Infrastructure
            </div>
            <h2 className="text-7xl font-black leading-[0.9] tracking-tighter">
              Gestão <br/><span className="text-indigo-500">Inteligente.</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed italic border-l-4 border-indigo-600 pl-6">
              "A evolução do seu negócio começa com dados precisos e infraestrutura de elite."
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">© 2024 NEXERO CLOUD PLATFORM</div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start p-8 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-none">
        <div className="w-full max-md:max-w-md lg:max-w-lg space-y-10 py-12 relative z-10">
          <div className="text-center lg:text-left">
            {!isLogin && (
              <button onClick={() => { setIsLogin(true); setError(''); setRateLimitError(false); }} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:-translate-x-1 transition-all group">
                <ArrowLeft size={16} /> Voltar ao Login
              </button>
            )}
            <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter leading-tight uppercase">
              {isLogin ? 'Login Enterprise' : 'Ativar Instância'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold italic">
              {isLogin ? 'Acesse o seu painel de alta performance.' : 'Siga os passos abaixo para criar sua base de dados dedicada.'}
            </p>
          </div>

          {signupSuccess && (
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/20 p-8 rounded-[2.5rem] flex items-start gap-5 text-emerald-600 animate-in zoom-in-95 duration-500 shadow-2xl shadow-emerald-500/10">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Mail className="text-white" size={28} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Instância Enterprise Ativa!</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic">
                   Seu e-mail de confirmação foi disparado via **Resend SMTP**. Verifique sua caixa de entrada agora para liberar o acesso.
                </p>
              </div>
            </div>
          )}

          {rateLimitError && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/20 p-6 rounded-[2rem] space-y-4 animate-in fade-in duration-500 shadow-xl shadow-amber-500/10">
              <div className="flex items-start gap-4 text-amber-700 dark:text-amber-400">
                <Timer className="shrink-0 mt-0.5 text-amber-500" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-tight">Limite de E-mails do Provedor</p>
                  <p className="text-xs font-bold leading-relaxed opacity-90 italic">
                    O Supabase bloqueou novos cadastros temporariamente. Como você configurou o **Resend**, esse erro deixará de existir após a propagação.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-200 dark:border-amber-500/10 flex justify-end">
                <a 
                  href="https://supabase.com/dashboard/project/_/auth/providers" 
                  target="_blank" 
                  className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  Abrir Painel SMTP <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {error && !rateLimitError && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-100 p-5 rounded-[2rem] flex items-start gap-4 text-rose-600 animate-in shake duration-500 shadow-xl shadow-rose-500/10">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-black italic">{error}</p>
            </div>
          )}

          {isLogin ? (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">E-mail Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input type="email" required placeholder="admin@nexero.app" className="w-full pl-14 pr-5 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-black tracking-tight shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">Senha Segura</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-14 pr-14 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-black tracking-tight shadow-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-all">
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 uppercase tracking-[0.25em]">
                  {isLoading ? <Loader2 className="animate-spin" size={22} /> : <><Zap size={20} fill="currentColor" /> Acessar NEXERO PRO</>}
                </button>
              </form>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center space-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Ainda não tem conta?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Crie sua conta gratuitamente e comece agora.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(false); setSignupSuccess(false); setError(''); setRateLimitError(false); }} 
                  className="w-full py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
                >
                  Criar conta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              <div className="p-6 bg-indigo-600 rounded-[2rem] text-white space-y-3 shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-10" />
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-indigo-200" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Dica de Cadastro</p>
                </div>
                <p className="text-sm font-bold leading-relaxed">
                  Para empresas (CNPJ), o sistema preenche automaticamente sua razão social e dados de contato. Basta digitar o número abaixo.
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-6 pb-6">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[1.5rem]">
                  <button type="button" onClick={() => setDocumentType('CNPJ')} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'text-slate-500'}`}>
                    <Building size={16} /> Sou Empresa
                  </button>
                  <button type="button" onClick={() => setDocumentType('CPF')} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${documentType === 'CPF' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'text-slate-500'}`}>
                    <User size={16} /> Sou Autônomo
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{documentType} Principal</label>
                    {documentType === 'CNPJ' && <span className="text-[9px] font-bold text-indigo-500 italic">Preenchimento automático ativo</span>}
                  </div>
                  <div className={`relative group transition-all duration-300 ${isCnpjReady ? 'ring-4 ring-indigo-500/20 rounded-[1.5rem]' : ''}`}>
                    <Landmark className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isCnpjReady ? 'text-indigo-500' : 'text-slate-400'}`} size={20} />
                    <input 
                      type="text" 
                      required 
                      placeholder={documentType === 'CNPJ' ? "00.000.000/0001-00" : "000.000.000-00"} 
                      className="w-full pl-14 pr-[120px] py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/10 transition-all text-slate-800 dark:text-white font-black tracking-tight shadow-sm" 
                      value={signupData.document} 
                      onChange={(e) => setSignupData({...signupData, document: e.target.value})} 
                    />
                    {documentType === 'CNPJ' && isCnpjReady && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-in slide-in-from-right-3">
                        <button 
                          type="button" 
                          onClick={lookupCnpj} 
                          disabled={isSearchingCnpj} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all uppercase tracking-widest"
                        >
                          {isSearchingCnpj ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                          {isSearchingCnpj ? '...' : 'BUSCAR'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Nome Completo ou Razão Social</label>
                  <div className="relative group">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" required placeholder="Ex: Nexero Solutions Ltda" className="w-full pl-14 pr-5 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:border-indigo-500 transition-all text-sm font-black text-slate-800 dark:text-white shadow-sm" value={signupData.companyName || signupData.name} onChange={(e) => setSignupData({...signupData, companyName: e.target.value, name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">E-mail Corporativo</label>
                    <input type="email" required placeholder="admin@nexero.app" className="w-full px-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-black focus:outline-none focus:ring-8 focus:ring-indigo-500/10 transition-all shadow-sm" value={signupData.email} onChange={(e) => setSignupData({...signupData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">WhatsApp</label>
                    <input type="text" required placeholder="(00) 0 0000-0000" className="w-full px-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-black focus:outline-none focus:ring-8 focus:ring-indigo-500/10 transition-all shadow-sm" value={signupData.phone} onChange={(e) => setSignupData({...signupData, phone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type={showSignupPassword ? "text" : "password"} required placeholder="Mín. 6 caracteres" className="w-full pl-11 pr-10 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-black focus:outline-none focus:border-indigo-500 transition-all shadow-sm" value={signupData.password} onChange={(e) => setSignupData({...signupData, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Confirmação</label>
                    <div className="relative group">
                      <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showConfirmError ? 'text-rose-500' : 'text-slate-400'}`} size={16} />
                      <input 
                        type={showSignupConfirmPassword ? "text" : "password"} 
                        required 
                        placeholder="Repita a senha" 
                        className={`w-full pl-11 pr-10 py-5 bg-white dark:bg-slate-900 border-2 ${showConfirmError ? 'border-rose-500 focus:ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'} rounded-[1.5rem] text-sm font-black focus:outline-none transition-all shadow-sm`} 
                        value={signupData.confirmPassword} 
                        onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || isSearchingCnpj || showConfirmError} 
                  className={`w-full py-6 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] uppercase tracking-[0.2em] mt-6 ${showConfirmError ? 'bg-slate-400 cursor-not-allowed shadow-none opacity-50' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/40'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>Ativar Minha Empresa <ArrowRight size={22}/></>}
                </button>
              </form>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                <div className="text-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Nexero Enterprise Perks</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BenefitItem 
                    icon={<Shield className="text-emerald-500" size={20} />}
                    title="Dados Isolados"
                    description="Sua empresa possui uma partição de banco de dados exclusiva e protegida."
                  />
                  <BenefitItem 
                    icon={<Zap className="text-indigo-500" size={20} />}
                    title="Alta Performance"
                    description="Infraestrutura otimizada com IA para processamento de vendas em milissegundos."
                  />
                  <BenefitItem 
                    icon={<MailCheck className="text-blue-500" size={20} />}
                    title="SMTP Enterprise"
                    description="E-mails transacionais via Resend com 99.9% de entregabilidade."
                  />
                  <BenefitItem 
                    icon={<Cpu className="text-amber-500" size={20} />}
                    title="Inteligência Gemini"
                    description="Insights de negócios gerados automaticamente pelos modelos mais recentes do Google."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-center pt-10">
             <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-full text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="text-emerald-500" size={14} /> 
                Nexero Enterprise Secured Architecture
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all hover:border-indigo-500/20 group">
    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
        {description}
      </p>
    </div>
  </div>
);

const MailCheck = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
    <polyline points="22 7 12 13 2 7" />
    <polyline points="16 19 19 22 24 15" />
  </svg>
);

export default Login;
