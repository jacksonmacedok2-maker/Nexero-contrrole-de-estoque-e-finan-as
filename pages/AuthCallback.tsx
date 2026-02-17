
import React, { useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthCallbackProps {
  setActiveTab: (tab: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ setActiveTab }) => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const code = queryParams.get('code') || hashParams.get('code');

      if (code) {
        try {
          // 1. Troca o código pela sessão (valida o e-mail no Supabase)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          // 2. FORÇA O LOGOUT IMEDIATO
          // Isso impede que o celular entre no app.
          await supabase.auth.signOut({ scope: 'local' });
          
          // 3. Limpa qualquer rastro local
          localStorage.clear(); 
          
          // 4. Redireciona para a tela de confirmação visual
          setActiveTab('/auth/confirmed');
        } catch (err) {
          console.error('Erro crítico no callback:', err);
          setActiveTab('/auth/error');
        }
      } else {
        // Fallback: se não houver código, verifica se há sessão para limpar
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
        setActiveTab('/auth/error');
      }
    };

    handleAuthCallback();
  }, [setActiveTab]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-24 h-24 bg-brand-600/10 rounded-[2.5rem] flex items-center justify-center text-brand-600">
          <ShieldCheck size={48} className="animate-pulse" />
        </div>
        <div className="absolute inset-0 border-4 border-brand-600 border-t-transparent rounded-[2.5rem] animate-spin"></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
           <Loader2 size={16} className="animate-spin text-brand-600" />
           <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Validando Acesso</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold italic max-w-xs mx-auto leading-relaxed">
          Processando sua chave de segurança Nexero...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
