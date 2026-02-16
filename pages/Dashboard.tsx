
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Users, AlertCircle, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { geminiService } from '../services/gemini';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<string>('Analisando seus dados...');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stats, setStats] = useState({
    dailySales: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    outOfStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardStats = await db.getDashboardStats();
        setStats(prev => ({ ...prev, ...dashboardStats }));
        
        const text = await geminiService.getSalesInsights(dashboardStats);
        setInsight(text || "Pronto para vender mais hoje?");
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSpeak = async () => {
    setIsSpeaking(true);
    await geminiService.speakInsight(insight);
    setIsSpeaking(false);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sincronizando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Boas-vindas, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 dark:text-slate-400">Resumo real extraído do seu banco Supabase.</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3 max-w-md shadow-sm">
          <Sparkles className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
              Insight IA
              <button 
                onClick={handleSpeak}
                disabled={isSpeaking}
                className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
              >
                <Volume2 size={16} />
              </button>
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed italic">"{insight}"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendas Hoje" value={formatCurrency(stats.dailySales)} change="+0%" isPositive={true} icon={<ShoppingBag className="text-indigo-600" />} />
        <StatCard title="Faturamento Mês" value={formatCurrency(stats.monthlyRevenue)} change="+0%" isPositive={true} icon={<TrendingUp className="text-emerald-600" />} />
        <StatCard title="Novos Clientes" value="--" change="0" isPositive={true} icon={<Users className="text-blue-600" />} />
        <StatCard title="Sem Estoque" value={`${stats.outOfStockItems}`} change="" isPositive={false} icon={<AlertCircle className="text-amber-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Volume de Vendas (Mock)</h3>
          <div className="h-80 w-full opacity-50 grayscale">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Area type="monotone" dataKey="vendas" stroke="#4f46e5" fill="#4f46e520" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-4 py-2 rounded-full border">Aguardando mais dados históricos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Últimos Pedidos</h3>
          <div className="space-y-6">
            <p className="text-xs text-center py-10 text-slate-400 font-medium">Os pedidos aparecerão aqui conforme as vendas forem realizadas no PDV.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode }> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-50 transition-colors">{icon}</div>
      {change && <div className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{change}</div>}
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
  </div>
);

export default Dashboard;
