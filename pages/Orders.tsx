
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, MoreHorizontal, FileText, Send, User, Loader2, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { OrderStatus } from '../types';
import { db } from '../services/database';

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await db.orders.getAll();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    (o.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.salesperson || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pedidos de Venda</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie suas vendas sincronizadas no Supabase.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, vendedor ou código..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 transition-colors">
              <Filter size={18} /> Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 transition-colors">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin inline-block text-indigo-600" size={32} />
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Carregando histórico...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b dark:border-slate-800">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">#{order.id.substring(0,8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{order.clients?.name || 'Cliente Avulso'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <User size={12} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{order.salesperson || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{formatDate(order.created_at)}</span>
                        <span className="text-xs text-slate-400">{formatTime(order.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white text-right">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status as OrderStatus)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10" title="Compartilhar WhatsApp">
                          <Send size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10" title="Ver PDF">
                          <FileText size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredOrders.length === 0 && (
            <div className="p-20 text-center">
              <ShoppingCart className="inline-block text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">Nenhum pedido encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    case OrderStatus.PENDING:
      return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20';
    case OrderStatus.CANCELLED:
      return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20';
    default:
      return 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
  }
};

export default Orders;
