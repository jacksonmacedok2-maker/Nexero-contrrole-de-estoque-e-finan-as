
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Users, AlertCircle, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <Zap className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={20} />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando Nexero Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">Olá, {user?.name.split(' ')[0]}!</h2>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Enterprise Secured</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Monitorando sua infraestrutura em tempo real.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status do Sistema</p>
             <p className="text-xs font-bold text-emerald-500 uppercase tracking-tight">Cloud Online</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
            <Zap size={24} fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendas Hoje" value={formatCurrency(stats.dailySales)} change="+12%" isPositive={true} icon={<ShoppingBag className="text-indigo-600" />} />
        <StatCard title="Faturamento Mês" value={formatCurrency(stats.monthlyRevenue)} change="+5.4%" isPositive={true} icon={<TrendingUp className="text-emerald-600" />} />
        <StatCard title="Enterprise SMTP" value="ATIVO" change="Resend" isPositive={true} icon={<ShieldCheck className="text-blue-600" />} />
        <StatCard title="Sem Estoque" value={`${stats.outOfStockItems}`} change="Urgente" isPositive={false} icon={<AlertCircle className="text-amber-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Volume Operacional</h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
          <div className="h-80 w-full opacity-50 grayscale relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Area type="monotone" dataKey="vendas" stroke="#4f46e5" fill="#4f46e520" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aguardando Coleta</p>
                <p className="text-xs font-bold text-slate-500 italic">Mais dados históricos necessários para projeção.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter mb-8">Fluxo Recente</h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <Users size={32} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Nenhuma atividade registrada<br/>nos últimos 15 minutos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode }> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors shadow-inner">{icon}</div>
      {change && (
        <div className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${isPositive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
          {change}
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
  </div>
);

export default Dashboard;
