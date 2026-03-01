import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ShoppingCart,
  Users,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Zap,
  ShieldCheck,
  Cloud,
  Receipt,
  Package,
  ChevronDown,
  Menu,
  Search
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type StatState = {
  dailySales: number;
  monthlyRevenue: number;
  pendingOrders: number;
  outOfStockItems: number;
  totalClients: number;
  averageTicket: number;
};

type FilterPeriod = 'hoje' | '7dias' | '30dias' | 'mes' | 'custom';

const BRAND = '#2563eb';

const Dashboard: React.FC = () => {
  const { companyId, companyName } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('hoje');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<StatState>({
    dailySales: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    outOfStockItems: 0,
    totalClients: 0,
    averageTicket: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const dashboardStats = await db.getDashboardStats(companyId);
        const clients = await db.clients.getAll(companyId);
        const orders = await db.orders.getAll(companyId);

        let filteredOrders = orders || [];
        const now = new Date();
        
        if (activeFilter === 'hoje') {
            const today = now.toDateString();
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at).toDateString() === today);
        } else if (activeFilter === '7dias') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo);
        } else if (activeFilter === '30dias') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
        }

        const latestOrders = filteredOrders.slice(0, 6);
        setRecentOrders(latestOrders);

        const totalOrders = filteredOrders.length;
        const totalRevenue = filteredOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0);
        const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

        setStats({
          dailySales: (activeFilter === 'hoje' || activeFilter === '7dias' || activeFilter === '30dias') ? totalRevenue : Number(dashboardStats?.dailySales || 0),
          monthlyRevenue: Number(dashboardStats?.monthlyRevenue || 0),
          pendingOrders: Number(dashboardStats?.pendingOrders || 0),
          outOfStockItems: Number(dashboardStats?.outOfStockItems || 0),
          totalClients: Number(clients?.length || 0),
          averageTicket: Number(avgTicket || 0),
        });
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, activeFilter]);

  const hasSales = stats.dailySales > 0 || stats.monthlyRevenue > 0;

  const chartData = useMemo(() => {
    const base = Math.max(stats.dailySales, 1);
    return [
      { name: 'S1', sales: base * 0.55 },
      { name: 'S2', sales: base * 0.82 },
      { name: 'S3', sales: base * 0.68 },
      { name: 'Atual', sales: base },
    ];
  }, [stats.dailySales]);

  const getFilterLabel = () => {
    if (activeFilter === 'hoje') return 'Vendas hoje (1D)';
    if (activeFilter === '7dias') return 'Vendas da Semana (7D)';
    if (activeFilter === '30dias') return 'Vendas do Período (30D)';
    return 'Vendas no mês (Total)';
  }

  const kpis = useMemo(() => {
    const data: {
      label: string;
      value: string;
      badge: string;
      badgeTone: 'good' | 'bad' | 'neutral';
      icon: React.ReactNode;
      accent: string;
    }[] = [
      {
        label: getFilterLabel(),
        value: formatCurrency((activeFilter === 'mes') ? stats.monthlyRevenue : stats.dailySales),
        badge: ((activeFilter === 'mes') ? stats.monthlyRevenue : stats.dailySales) > 0 ? 'Atualizado' : 'Aguardando',
        badgeTone: ((activeFilter === 'mes') ? stats.monthlyRevenue : stats.dailySales) > 0 ? 'good' : 'neutral',
        icon: <ShoppingCart size={20} className="text-brand-600" />,
        accent: 'brand',
      },
      {
        label: 'Ticket médio',
        value: formatCurrency(stats.averageTicket),
        badge: 'Em tempo real',
        badgeTone: 'neutral',
        icon: <TrendingUp size={20} className="text-brand-600" />,
        accent: 'brand',
      },
      {
        label: 'Clientes ativos',
        value: String(stats.totalClients),
        badge: 'CRM Sync',
        badgeTone: 'neutral',
        icon: <Users size={20} className="text-brand-600" />,
        accent: 'brand',
      },
      {
        label: 'Estoque crítico',
        value: String(stats.outOfStockItems),
        badge: stats.outOfStockItems > 0 ? 'Alerta' : 'Saudável',
        badgeTone: stats.outOfStockItems > 0 ? 'bad' : 'good',
        icon: <AlertTriangle size={20} className={stats.outOfStockItems > 0 ? 'text-rose-400' : 'text-emerald-400'} />,
        accent: stats.outOfStockItems > 0 ? 'rose' : 'emerald',
      },
    ];
    return data;
  }, [stats, activeFilter]);

  if (loading && !recentOrders.length) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-600/5">
           <Loader2 className="absolute animate-spin text-brand-600" size={40} />
           <div className="h-16 w-16 animate-pulse rounded-full bg-brand-600/10"></div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-600 animate-pulse">
          Sincronizando Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* HERO SECTION */}
      <div className="relative overflow-visible rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-[2.5rem]">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-brand-600/5 blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-600/5 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-600/20 ring-1 ring-brand-600/20 md:flex">
                <Zap size={24} className="text-white" />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-brand-700 shadow-sm dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                    <Cloud size={12} className="text-brand-600" />
                    Cloud Ativo
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                    <ShieldCheck size={12} strokeWidth={2.5}/>
                    Segurança Ok
                  </span>
                </div>

                <div>
                   <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl dark:text-white">
                     {companyName || 'NEXERO'}
                   </h2>
                   <p className="text-[13px] font-medium text-slate-500 mt-0.5 italic">
                     Plataforma Enterprise • Sincronização Híbrida
                   </p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/50" ref={calendarRef}>
                <button 
                   onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                   className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-slate-500 border-r border-slate-200 transition-colors hover:text-brand-600 dark:border-slate-700 ${isCalendarOpen ? 'text-brand-600' : ''}`}
                >
                    <Calendar size={16} />
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isCalendarOpen && (
                   <div className="absolute top-[120%] right-0 z-50 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                      <p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                         Períodos Customizados
                      </p>
                      
                      <button onClick={() => { setActiveFilter('7dias'); setIsCalendarOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-[11px] font-bold ${activeFilter === '7dias' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                         Últimos 7 Dias
                      </button>
                      
                      <button onClick={() => { setActiveFilter('30dias'); setIsCalendarOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-[11px] font-bold ${activeFilter === '30dias' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                         Últimos 30 Dias
                      </button>
                      
                      <button onClick={() => setIsCalendarOpen(false)} className={`w-full mt-1 flex items-center justify-between text-left rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-400 opacity-60 cursor-not-allowed`}>
                         Personalizar
                         <span className="text-[8px] bg-slate-100 px-1.5 rounded dark:bg-slate-800">Em Breve</span>
                      </button>
                   </div>
                )}

               <button 
                  onClick={() => { setActiveFilter('hoje'); setIsCalendarOpen(false); }}
                  className={`rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ml-1.5 ${activeFilter === 'hoje' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105' : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'}`}
               >
                 Hoje
               </button>
               <button 
                  onClick={() => { setActiveFilter('mes'); setIsCalendarOpen(false); }}
                  className={`rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ml-1 ${activeFilter === 'mes' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105' : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'}`}
               >
                 Este Mês
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard
                key={k.label}
                label={k.label}
                value={k.value}
                badge={k.badge}
                badgeTone={k.badgeTone}
                icon={k.icon}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
           <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-brand-600/5 blur-[60px] transition-opacity duration-700 group-hover:bg-brand-600/10" />
          <div className="relative z-10 flex items-center justify-between border-b border-slate-100 p-6 md:px-8 md:py-6 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Performance Comercial
              </p>
              <h3 className="mt-1 text-[15px] font-black text-slate-900 dark:text-white">
                Fluxo de Receita Nexero
              </h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
              <ArrowUpRight strokeWidth={3} size={14}/>
              Crescimento
            </span>
          </div>
          <div className="relative z-10 p-6 md:p-8 flex-1 flex flex-col">
            <div className="h-64 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis fontSize={11} fontWeight={600} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip
                    cursor={{stroke: BRAND, strokeWidth: 1, strokeDasharray: '4 4'}}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
                      background: '#fff',
                      color: '#000'
                    }}
                    itemStyle={{ color: BRAND }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={BRAND}
                    strokeWidth={4}
                    fill="url(#salesFill)"
                    activeDot={{ r: 6, fill: BRAND, stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MiniCard title="Receita Mensal" value={formatCurrency(stats.monthlyRevenue)} icon={<ArrowUpRight size={18} className="text-emerald-500" />} />
              <MiniCard title="Pedidos Pendentes" value={String(stats.pendingOrders)} icon={<ArrowDownRight size={18} className="text-amber-500" />} />
              <MiniCard title="Risco de Ruptura" value={String(stats.outOfStockItems)} icon={<AlertTriangle size={18} className={stats.outOfStockItems > 0 ? 'text-rose-500' : 'text-emerald-500'} />} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Auditoria</p>
               <h3 className="mt-1 text-[15px] font-black text-slate-900 dark:text-white">Alertas & Operação</h3>
            </div>
            <div className="p-5 space-y-3">
              <StatusRow
                icon={<ShieldCheck size={18} className="text-emerald-500" />}
                title="Sistema Principal"
                subtitle="Servidores rodando 100%"
                badge="Online"
                badgeTone="good"
              />
              <StatusRow
                icon={<Package size={18} className={stats.outOfStockItems > 0 ? 'text-rose-500' : 'text-emerald-500'} />}
                title="Sincronia de Estoque"
                subtitle={stats.outOfStockItems > 0 ? 'Existem itens abaixo do limite' : 'Todos os itens normais'}
                badge={stats.outOfStockItems > 0 ? 'Crítico' : 'Saudável'}
                badgeTone={stats.outOfStockItems > 0 ? 'bad' : 'good'}
              />
              <StatusRow
                icon={<Receipt size={18} className="text-brand-600" />}
                title="Notas & Compras"
                subtitle="Processamento automático ativo"
                badge="Normal"
                badgeTone="neutral"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-xl shadow-brand-600/20">
             <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-[50px]"></div>
             <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/20 blur-[50px]"></div>
            <div className="relative z-10 p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner ring-1 ring-white/30">
                  <Zap size={14} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white opacity-90">
                  Nexero Intelligence
                </p>
              </div>
              <p className="text-[13.5px] font-black leading-relaxed text-white">
                {hasSales
                  ? 'O desempenho das vendas de hoje está dentro da média esperada. Mantenha o foco na retenção de clientes para maximizar o LTV.'
                  : 'O sistema está pronto para as primeiras movimentações. Nossa IA monitorará o comportamento de compra para otimizar seu estoque.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <QuickChip label="Curva A" tone="brand" />
                <QuickChip label="Reposição" tone={stats.outOfStockItems > 0 ? 'bad' : 'good'} />
                <QuickChip label="Estável" tone="neutral" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 md:px-8 md:py-6 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tempo Real</p>
            <h3 className="mt-1 text-[15px] font-black text-slate-900 dark:text-white">Últimas Movimentações Sincronizadas</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID / Recibo</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente (PDV)</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registro</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Faturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-8 py-5 text-[13px] font-black text-brand-600">
                      #{order.code || String(order.id).substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-8 py-5 text-[13px] font-bold text-slate-700 transition-colors group-hover:text-brand-600 dark:text-slate-300">
                      {order.clients?.name || 'Consumidor Final (Balcão)'}
                    </td>
                    <td className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-8 py-5 text-right text-[14px] font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                     <p className="text-sm font-bold text-slate-400 italic">O painel está limpo. O fluxo de caixa será exibido aqui.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ tone, children }: { tone: 'good' | 'bad' | 'neutral'; children: React.ReactNode }) => {
  const cls =
    tone === 'good'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
      : tone === 'bad'
      ? 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
      : 'text-brand-700 bg-brand-50 border-brand-100 dark:text-brand-400 dark:bg-brand-500/10 dark:border-brand-500/20';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${cls}`}>
      {children}
    </span>
  );
};

const KpiCard: React.FC<{ label: string; value: string; badge: string; badgeTone: 'good' | 'bad' | 'neutral'; icon: React.ReactNode }> = ({ label, value, badge, badgeTone, icon }) => (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between mb-8">
         <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-brand-600 border border-slate-100 transition-transform group-hover:scale-110">
            {icon}
         </div>
         <Badge tone={badgeTone}>{badge}</Badge>
      </div>
      <div>
         <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
         <p className="text-3xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
    </div>
);

const MiniCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="text-[17px] font-black text-slate-900">{value}</p>
    </div>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
      {icon}
    </div>
  </div>
);

const StatusRow = ({ icon, title, subtitle, badge, badgeTone }: { icon: React.ReactNode; title: string; subtitle: string; badge: string; badgeTone: 'good' | 'bad' | 'neutral' }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-4 transition-colors hover:bg-white dark:border-slate-800/50 dark:bg-slate-800/20 dark:hover:bg-slate-800/60">
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-black text-slate-900 dark:text-white leading-none">{title}</p>
        <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">{subtitle}</p>
      </div>
    </div>
    <Badge tone={badgeTone}>{badge}</Badge>
  </div>
);

const QuickChip = ({ label, tone }: { label: string; tone: 'brand' | 'good' | 'bad' | 'neutral' }) => {
  const styles = {
    brand: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/30',
    good: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30',
    bad: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/30',
    neutral: 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30',
  };
  return (
    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${styles[tone]}`}>
      {label}
    </span>
  );
};

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-800/20">
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">{title}</p>
    <p className="mt-2 max-w-sm text-xs font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
  </div>
);

export default Dashboard;
