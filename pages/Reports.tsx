import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, ShoppingBag, Users, DollarSign, 
  Loader2, Filter, Download, ChevronRight, Package, UserCheck, AlertTriangle 
} from 'lucide-react';
import { biService, BIServiceData } from '../services/bi';
import { formatCurrency } from '../utils/helpers';

const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#0d9488'];

type Period = 'today' | '7days' | '30days' | 'month' | 'custom';

// Custom Premium Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mt-2 text-sm">
            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {entry.name}:
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('receita') || entry.name.toLowerCase().includes('vendas') && entry.value > 1000 ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BIServiceData | null>(null);

  const getDates = (p: Period) => {
    const end = new Date();
    const start = new Date();
    
    switch (p) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDates(period);
      const res = await biService.getDashboardData(start, end);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
           <Loader2 className="absolute animate-spin text-brand-600" size={40} />
           <div className="h-16 w-16 animate-pulse rounded-full bg-brand-100 dark:bg-brand-800/20"></div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 animate-pulse">
          Compilando Inteligência...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Top Bar with Filters */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Relatórios <span className="text-brand-600">&</span> BI
          </h2>
          <p className="mt-1 text-sm font-medium italic text-slate-500 dark:text-slate-400">
            Análise profunda do desempenho comercial Nexero.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60">
          {(['today', '7days', '30days', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                period === p 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7days' ? '7 Dias' : p === '30days' ? '30 Dias' : 'Este Mês'}
            </button>
          ))}
          <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <button className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard 
          label="Faturamento Total" 
          value={formatCurrency(data?.summary.totalRevenue || 0)} 
          growth={data?.summary.growth || 0}
          icon={<DollarSign size={22} />} 
          color="brand"
        />
        <KPICard 
          label="Total de Pedidos" 
          value={data?.summary.orderCount.toString() || '0'} 
          icon={<ShoppingBag size={22} />} 
          color="sky"
        />
        <KPICard 
          label="Ticket Médio" 
          value={formatCurrency(data?.summary.averageTicket || 0)} 
          icon={<TrendingUp size={22} />} 
          color="indigo"
        />
        <KPICard 
          label="Clientes Ativos" 
          value={data?.summary.activeClients.toString() || '0'} 
          icon={<UserCheck size={22} />} 
          color="pink"
        />
        <KPICard 
          label="Conversão" 
          value="84%" 
          icon={<TrendingUp size={22} />} 
          color="amber"
          isPercent
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Sales Evolution */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-lg dark:border-slate-800/50 dark:bg-slate-900/80 lg:col-span-2">
          {/* Subtle Glow Background */}
          <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-brand-500/10 blur-[80px] transition-opacity duration-700 group-hover:bg-brand-500/20 dark:bg-brand-500/5"></div>
          
          <div className="relative z-10 mb-8 flex items-center justify-between">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Evolução de Receita
            </h3>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <TrendingUp size={14} /> +12.5%
            </div>
          </div>
          
          <div className="relative z-10 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} fontWeight={600} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Receita" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-lg dark:border-slate-800/50 dark:bg-slate-900/80">
           {/* Subtle Glow Background */}
           <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px] transition-opacity duration-700 group-hover:bg-indigo-500/20 dark:bg-indigo-500/5"></div>
           
          <h3 className="relative z-10 mb-2 text-center text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
            Formas de Pagamento
          </h3>
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribuição Financeira</p>
          
          <div className="relative z-10 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={115}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {data?.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-sm outline-none hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  layout="horizontal" 
                  verticalAlign="bottom"
                  wrapperStyle={{fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', paddingTop: '20px', color: '#94a3b8'}} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rankings and Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-[2.5rem] border border-slate-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Top 5 Produtos <span className="text-slate-400">(Volume)</span>
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 dark:text-brand-400">Ver Todos</button>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} width={120} tick={{fill: '#64748b'}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" name="Vendas" fill="#0d9488" radius={[0, 12, 12, 0]} barSize={24}>
                   {data?.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0d9488' : '#14b8a6'} fillOpacity={index === 0 ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Person */}
        <div className="rounded-[2.5rem] border border-slate-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Vendas por Vendedor
            </h3>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              Performance
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.salesByPerson} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} fontWeight={600} tickFormatter={(v) => `R$ ${v/1000}k`} tick={{fill: '#64748b'}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                <Bar dataKey="value" name="Vendas" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40}>
                   {data?.salesByPerson.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#818cf8'} fillOpacity={index === 0 ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranking Clientes */}
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="border-b border-slate-100 p-8 dark:border-slate-800">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Top 10 Clientes Frequentes
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data?.topClients.map((c, i) => (
              <div key={i} className="group flex items-center justify-between p-6 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-[11px] font-black shadow-sm transition-transform group-hover:scale-110 ${i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : i === 1 ? 'bg-slate-200 text-slate-600 text-slate-400 dark:bg-slate-700 dark:text-slate-300' : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    #{i + 1}
                  </div>
                  <span className="text-[15px] font-bold text-slate-800 transition-colors group-hover:text-brand-600 dark:text-slate-200 dark:group-hover:text-brand-400">{c.name}</span>
                </div>
                <span className="text-[15px] font-black text-brand-600 dark:text-brand-400">{formatCurrency(c.total)}</span>
              </div>
            ))}
            {data?.topClients.length === 0 && (
              <div className="p-16 text-center">
                <p className="text-sm font-bold italic text-slate-400">Nenhuma venda identificada no período.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-slate-100 p-8 dark:border-slate-800">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Alertas de Estoque
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
               <AlertTriangle size={12} /> Crítico
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data?.lowStock.map((p, i) => (
              <div key={i} className="group flex items-center justify-between p-6 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-transform group-hover:scale-110 group-hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:group-hover:bg-rose-500/20">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{p.name}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU: {p.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-rose-600 dark:text-rose-500">{p.stock} un</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mín: {p.min_stock}</p>
                </div>
              </div>
            ))}
            {data?.lowStock.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 p-16 text-center text-emerald-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                  <UserCheck size={32} />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Estoque 100% em dia!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponente de KPI Repaginado
const KPICard = ({ label, value, growth, icon, color, isPercent }: any) => {
  const colorMap: any = {
    brand: {
      bg: 'bg-brand-50 dark:bg-brand-500/10',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-100 dark:border-brand-500/20',
      glow: 'bg-brand-400/20 dark:bg-brand-500/10',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-100 dark:border-sky-500/20',
      glow: 'bg-sky-400/20 dark:bg-sky-500/10',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-500/20',
      glow: 'bg-indigo-400/20 dark:bg-indigo-500/10',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-500/10',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-100 dark:border-pink-500/20',
      glow: 'bg-pink-400/20 dark:bg-pink-500/10',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-500/20',
      glow: 'bg-amber-400/20 dark:bg-amber-500/10',
    }
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800/60 dark:bg-slate-900/80 dark:hover:shadow-black/50 flex flex-col justify-between">
      {/* Subtle Glow Effect on Hover */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[40px] transition-all duration-500 ${scheme.glow} opacity-0 group-hover:opacity-100`}></div>
      
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className={`flex rounded-2xl border p-3.5 transition-transform duration-300 group-hover:scale-110 ${scheme.bg} ${scheme.text} ${scheme.border} shadow-sm`}>
          {icon}
        </div>
        
        {growth !== undefined && (
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${growth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
            {growth >= 0 ? <TrendingUp size={12} strokeWidth={3}/> : <TrendingDown size={12} strokeWidth={3}/>}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 filter drop-shadow-sm">{label}</p>
        <p className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white drop-shadow-sm">{value}</p>
      </div>
    </div>
  );
};

export default Reports;
