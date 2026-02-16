
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Users, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { geminiService } from '../services/gemini';

const MOCK_DATA = [
  { name: 'Seg', vendas: 4000 },
  { name: 'Ter', vendas: 3000 },
  { name: 'Qua', vendas: 2000 },
  { name: 'Qui', vendas: 2780 },
  { name: 'Sex', vendas: 1890 },
  { name: 'Sab', vendas: 2390 },
  { name: 'Dom', vendas: 3490 },
];

const Dashboard: React.FC = () => {
  const [insight, setInsight] = useState<string>('Analisando seus dados...');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stats = {
    dailySales: 12450.50,
    monthlyRevenue: 158300.00,
    pendingOrders: 12,
    outOfStockItems: 5
  };

  useEffect(() => {
    const fetchInsight = async () => {
      const text = await geminiService.getSalesInsights(stats);
      setInsight(text || "Pronto para vender mais hoje?");
    };
    fetchInsight();
  }, []);

  const handleSpeak = async () => {
    setIsSpeaking(true);
    await geminiService.speakInsight(insight);
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Boas-vindas, Silva!</h2>
          <p className="text-slate-500 dark:text-slate-400">Confira o resumo das suas operações hoje.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendas Hoje" 
          value={formatCurrency(stats.dailySales)} 
          change="+12.5%" 
          isPositive={true} 
          icon={<ShoppingBag className="text-indigo-600 dark:text-indigo-400" />} 
        />
        <StatCard 
          title="Faturamento Mês" 
          value={formatCurrency(stats.monthlyRevenue)} 
          change="+5.2%" 
          isPositive={true} 
          icon={<TrendingUp className="text-emerald-600 dark:text-emerald-400" />} 
        />
        <StatCard 
          title="Novos Clientes" 
          value="24" 
          change="-2.1%" 
          isPositive={false} 
          icon={<Users className="text-blue-600 dark:text-blue-400" />} 
        />
        <StatCard 
          title="Pendências" 
          value={`${stats.pendingOrders}`} 
          change="+2" 
          isPositive={false} 
          icon={<AlertCircle className="text-amber-600 dark:text-amber-400" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Desempenho de Vendas</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: 'var(--tw-bg-opacity)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area type="monotone" dataKey="vendas" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Pedidos Recentes</h3>
          <div className="space-y-6">
            <ActivityItem 
              customer="Mercado Central Ltda" 
              amount={1250.00} 
              status="Concluído" 
              time="10 min atrás" 
            />
            <ActivityItem 
              customer="Drogarias Pague Menos" 
              amount={450.20} 
              status="Pendente" 
              time="45 min atrás" 
            />
            <ActivityItem 
              customer="João da Silva ME" 
              amount={98.00} 
              status="Draft" 
              time="2 horas atrás" 
            />
            <ActivityItem 
              customer="Supermercados BH" 
              amount={5400.00} 
              status="Concluído" 
              time="3 horas atrás" 
            />
          </div>
          <button className="w-full mt-8 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
            Ver Todos os Pedidos
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode }> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
  </div>
);

const ActivityItem: React.FC<{ customer: string, amount: number, status: string, time: string }> = ({ customer, amount, status, time }) => (
  <div className="flex items-start justify-between">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 shrink-0">
        {customer.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{customer}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(amount)}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${
        status === 'Concluído' ? 'text-emerald-600' : 
        status === 'Pendente' ? 'text-amber-600' : 'text-slate-400'
      }`}>{status}</p>
    </div>
  </div>
);

export default Dashboard;
