
import React from 'react';
import { CheckCircle2, XCircle, LogIn, Monitor, Smartphone } from 'lucide-react';

interface AuthConfirmedProps {
  setActiveTab: (tab: string) => void;
}

const AuthConfirmed: React.FC<AuthConfirmedProps> = ({ setActiveTab }) => {
  const handleCloseTab = () => {
    // Tenta fechar a janela/aba
    window.close();
    
    // Fallback caso o navegador bloqueie o fechamento (comum se não aberta via script)
    alert("Para sua segurança, por favor feche esta aba manualmente e retorne ao seu computador.");
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-700">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-[3rem] blur-3xl animate-pulse" />
        <div className="relative w-32 h-32 bg-emerald-500 text-white rounded-[3.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white dark:border-slate-900">
          <CheckCircle2 size={64} strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="space-y-6 mb-12">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-full">
           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
           <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Identidade Confirmada</span>
        </div>
        
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[0.85]">
          Acesso <br/> <span className="text-emerald-500">Liberado.</span>
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed italic text-lg">
          O e-mail foi validado com sucesso. Por segurança, <span className="text-slate-900 dark:text-white underline decoration-brand-500 decoration-2">esta aba não realiza o login automático</span>.
        </p>
      </div>

      <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6">
        <div className="flex items-center gap-4 text-left">
           <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shrink-0">
             <Monitor size={24} />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Próximo Passo</p>
             <p className="text-xs font-bold text-white dark:text-slate-900 italic">Retorne ao seu computador e clique no botão para entrar.</p>
           </div>
        </div>

        <button 
          onClick={handleCloseTab}
          className="w-full flex items-center justify-center gap-4 bg-brand-600 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-brand-700 transition-all active:scale-[0.97]"
        >
          <XCircle size={20} />
          Fechar esta Aba
        </button>

        <div className="pt-2">
          <button 
            onClick={() => setActiveTab('/login')}
            className="text-[10px] font-black text-slate-500 hover:text-brand-500 transition-colors uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto"
          >
            <LogIn size={14} /> Fazer login neste dispositivo
          </button>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2 text-slate-400">
         <Smartphone size={16} className="opacity-50" />
         <p className="text-[9px] font-black uppercase tracking-widest">Segurança Nexero Enterprise</p>
      </div>
    </div>
  );
};

export default AuthConfirmed;
