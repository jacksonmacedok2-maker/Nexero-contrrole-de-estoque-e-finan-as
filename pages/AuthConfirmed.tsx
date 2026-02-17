
import React from 'react';
import { CheckCircle2, ArrowRight, PartyPopper, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';

interface AuthConfirmedProps {
  setActiveTab: (tab: string) => void;
}

const AuthConfirmed: React.FC<AuthConfirmedProps> = ({ setActiveTab }) => {
  const handleGoToLogin = () => {
    setActiveTab('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-700">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-brand-500 animate-bounce delay-75"><Sparkles size={24} /></div>
        <div className="absolute bottom-20 right-10 text-brand-500 animate-bounce delay-300"><Sparkles size={32} /></div>
      </div>

      {/* Badge de Verificação */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full mb-8">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Identidade Validada</span>
      </div>

      {/* Icone Principal */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse scale-150" />
        <div className="relative w-32 h-32 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
          <div className="w-24 h-24 bg-emerald-500 rounded-[2.2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/40">
            <PartyPopper size={56} strokeWidth={2.5} />
          </div>
        </div>
      </div>
      
      {/* Mensagem de Sucesso */}
      <div className="space-y-4 mb-12 relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
          Parabéns! <br/> <span className="text-brand-600">Conta Ativada.</span>
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed italic text-base">
          Seu e-mail foi verificado com sucesso. Sua instância Nexero já está pronta para operar na nuvem.
        </p>
      </div>

      {/* Botão de Ação - Garantido visível no mobile */}
      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={handleGoToLogin}
          className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group"
        >
          Acessar Plataforma 
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
           <Smartphone size={16} className="opacity-50" />
           <p className="text-[9px] font-black uppercase tracking-[0.2em]">Otimizado para controle via Celular</p>
        </div>
      </div>

      {/* Rodapé de Segurança */}
      <div className="mt-auto pt-12">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Nexero Enterprise System</p>
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
};

export default AuthConfirmed;
