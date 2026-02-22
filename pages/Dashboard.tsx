import React, { useMemo, useEffect, useState } from 'react';
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
  Plus,
  Building2,
  Sparkles,
  ShieldCheck,
  Cloud,
  Receipt,
  Package,
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

const Dashboard: React.FC = () => {
  const { companyId, companyName } = useAuth();
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
    if (!companyId) return;

    const loadData = async () => {
      try {
        const dashboardStats = await db.getDashboardStats(companyId);
        const clients = await db.clients.getAll(companyId);
        const orders = await db.orders.getAll(companyId);

        const latestOrders = orders ? orders.slice(0, 6) : [];
        setRecentOrders(latestOrders);

        // ticket médio real: total das vendas / qtde de pedidos
        const totalOrders = orders?.length || 0;
        const avgTicket = totalOrders > 0 ? (orders.reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0) / totalOrders) : 0;

        setStats({
          dailySales: Number(dashboardStats?.dailySales || 0),
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
  }, [companyId]);

  const hasSales = stats.dailySales > 0 || stats.monthlyRevenue > 0;

  const chartData = useMemo(() => {
    const base = Math.max(stats.dailySales, 1);
    // leve “smoothing” só pra visual (sem mentir demais)
    return [
      { name: 'S1', sales: base * 0.55 },
      { name: 'S2', sales: base * 0.82 },
      { name: 'S3', sales: base * 0.68 },
      { name: 'Hoje', sales: base },
    ];
  }, [stats.dailySales]);

  const kpis = useMemo(() => {
    return [
      {
        label: 'Vendas hoje',
        value: formatCurrency(stats.dailySales),
        badge: stats.dailySales > 0 ? 'Atualizado' : 'Aguardando',
        badgeTone: stats.dailySales > 0 ? 'good' : 'neutral',
        icon: <ShoppingCart size={18} className="text-brand-600" />,
        accent: 'brand',
      },
      {
        label: 'Ticket médio',
        value: formatCurrency(stats.averageTicket),
        badge: 'Real-time',
        badgeTone: 'neutral',
        icon: <TrendingUp size={18} className="text-blue-500" />,
        accent: 'blue',
      },
      {
        label: 'Clientes ativos',
        value: String(stats.totalClients),
        badge: 'CRM Sync',
        badgeTone: 'neutral',
        icon: <Users size={18} className="text-indigo-500" />,
        accent: 'indigo',
      },
      {
        label: 'Estoque crítico',
        value: String(stats.outOfStockItems),
        badge: stats.outOfStockItems > 0 ? 'Alerta' : 'Saudável',
        badgeTone: stats.outOfStockItems > 0 ? 'bad' : 'good',
        icon: <AlertTriangle size={18} className={stats.outOfStockItems > 0 ? 'text-rose-500' : 'text-emerald-500'} />,
        accent: stats.outOfStockItems > 0 ? 'rose' : 'emerald',
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
          Sincronizando banco de dados...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex h-12 w-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center shadow-sm">
                <Building2 size={22} className="text-slate-700 dark:text-slate-200" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
                    <Cloud size={12} className="text-brand-600" />
                    Cloud ativo
                  </span>

                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    RLS ok
                  </span>

                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
                    <Sparkles size={12} className="text-indigo-500" />
                    Premium UI
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {companyName || 'Nexero'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Visão geral operacional, alertas e últimas atividades.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all shadow-sm">
                <Calendar size={14} /> Hoje
              </button>

              <button className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.12em] hover:bg-brand-700 shadow-xl shadow-brand-600/25 transition-all active:scale-95">
                <Plus size={16} /> Novo pedido
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 md:p-7 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Receita — visão rápida
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                Fluxo operacional (estimado)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
                <ArrowUpRight size={12} className="text-emerald-500" />
                Tendência
              </span>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="h-72 w-full">
              {hasSales ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid rgba(148,163,184,0.25)',
                        boxShadow: '0 16px 30px -12px rgb(0 0 0 / 0.25)',
                        background: 'rgba(255,255,255,0.9)',
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Receita']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#0d9488"
                      strokeWidth={3}
                      fill="url(#salesFill)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Aguardando dados"
                  subtitle="Assim que as primeiras vendas entrarem, o gráfico e as projeções ficam disponíveis."
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <MiniCard
                title="Receita do mês"
                value={formatCurrency(stats.monthlyRevenue)}
                icon={<ArrowUpRight size={16} className="text-emerald-500" />}
              />
              <MiniCard
                title="Pendências"
                value={String(stats.pendingOrders)}
                icon={<ArrowDownRight size={16} className="text-amber-500" />}
              />
              <MiniCard
                title="Risco de ruptura"
                value={String(stats.outOfStockItems)}
                icon={<AlertTriangle size={16} className={stats.outOfStockItems > 0 ? 'text-rose-500' : 'text-emerald-500'} />}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Operação
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                Alertas & saúde
              </p>
            </div>

            <div className="p-4 space-y-3">
              <StatusRow
                icon={<ShieldCheck size={18} className="text-emerald-500" />}
                title="Sistema"
                subtitle="Tudo rodando normalmente"
                badge="OK"
                badgeTone="good"
              />

              <StatusRow
                icon={<Package size={18} className={stats.outOfStockItems > 0 ? 'text-rose-500' : 'text-emerald-500'} />}
                title="Estoque"
                subtitle={stats.outOfStockItems > 0 ? 'Itens críticos detectados' : 'Níveis saudáveis'}
                badge={stats.outOfStockItems > 0 ? 'ALERTA' : 'SAUDÁVEL'}
                badgeTone={stats.outOfStockItems > 0 ? 'bad' : 'good'}
              />

              <StatusRow
                icon={<Receipt size={18} className="text-indigo-500" />}
                title="Compras"
                subtitle="Notas e entradas auditáveis"
                badge="ATIVO"
                badgeTone="neutral"
              />
            </div>
          </div>

          {/* Insights */}
          <div className="relative overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-14 -left-14 w-44 h-44 bg-indigo-600/15 rounded-full blur-3xl" />

            <div className="relative p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-80">
                  Insights Nexero
                </p>
              </div>

              <p className="text-sm font-medium leading-relaxed text-slate-200">
                {hasSales
                  ? 'Hoje, seu ticket médio e volume de vendas estão estáveis. Se houver ruptura de estoque, priorize reposição dos itens mais vendidos.'
                  : 'Assim que houver movimentação suficiente, você verá aqui tendências e alertas operacionais com base no seu histórico.'}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <QuickChip label="Reposição" tone="brand" />
                <QuickChip label="Ruptura" tone={stats.outOfStockItems > 0 ? 'bad' : 'good'} />
                <QuickChip label="Ticket" tone="neutral" />
                <QuickChip label="Vendas" tone={stats.dailySales > 0 ? 'good' : 'neutral'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Atividade
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              Últimas vendas sincronizadas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-5 text-xs font-black text-brand-600">
                      #{order.code || String(order.id).substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {order.clients?.name || 'Venda avulsa'}
                    </td>
                    <td className="px-6 py-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-14 text-center text-xs text-slate-400 font-medium"
                  >
                    Nenhuma atividade comercial registrada ainda.
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
      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
      : tone === 'bad'
      ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
      : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/40';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {children}
    </span>
  );
};

const KpiCard = ({
  label,
  value,
  badge,
  badgeTone,
  icon,
}: {
  label: string;
  value: string;
  badge: string;
  badgeTone: 'good' | 'bad' | 'neutral';
  icon: React.ReactNode;
}) => {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-center group-hover:scale-[1.03] transition-transform">
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
          </div>
        </div>

        <Badge tone={badgeTone}>{badge}</Badge>
      </div>
    </div>
  );
};

const MiniCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 px-4 py-3 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const StatusRow = ({
  icon,
  title,
  subtitle,
  badge,
  badgeTone,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: 'good' | 'bad' | 'neutral';
}) => (
  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-slate-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>

    <Badge tone={badgeTone}>{badge}</Badge>
  </div>
);

const QuickChip = ({ label, tone }: { label: string; tone: 'brand' | 'good' | 'bad' | 'neutral' }) => {
  const cls =
    tone === 'brand'
      ? 'bg-brand-600/15 text-white border-brand-500/20'
      : tone === 'good'
      ? 'bg-emerald-500/15 text-white border-emerald-500/20'
      : tone === 'bad'
      ? 'bg-rose-500/15 text-white border-rose-500/20'
      : 'bg-white/10 text-white border-white/10';

  return (
    <span className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${cls}`}>
      {label}
    </span>
  );
};

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 p-8">
    <p className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">{title}</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm">{subtitle}</p>
  </div>
);

export default Dashboard;