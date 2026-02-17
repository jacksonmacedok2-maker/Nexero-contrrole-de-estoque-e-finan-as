
import React from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface AuthErrorProps {
  setActiveTab: (tab: string) => void;
}

const AuthError: React.FC<AuthErrorProps> = ({ setActiveTab }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-rose-500/5">
        <AlertCircle size={40} />
      </div>
      
      <div className="space-y-3 mb-10">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Link Inválido</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto italic leading-relaxed">
          Este link de confirmação pode ter expirado ou já foi utilizado. Tente solicitar um novo acesso.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <button 
          onClick={() => setActiveTab('/login')}
          className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} /> Voltar ao Login
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
        >
          <RefreshCw size={16} /> Tentar Novamente
        </button>
      </div>
    </div>
  );
};

export default AuthError;
