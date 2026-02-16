
import React, { useState } from 'react';
import { Plus, Search, Filter, Download, MoreHorizontal, FileText, Send, User } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { OrderStatus } from '../types';

const MOCK_ORDERS = [
  { id: 'PD-1029', customer: 'Restaurante Sabor & Arte', date: '2023-11-15T14:30:00', amount: 450.90, status: OrderStatus.COMPLETED, salesperson: 'Carlos Alberto' },
  { id: 'PD-1028', customer: 'Mercadinho do Bairro', date: '2023-11-15T11:20:00', amount: 1200.00, status: OrderStatus.PENDING, salesperson: 'Mariana Costa' },
  { id: 'PD-1027', customer: 'Auto Peças Central', date: '2023-11-14T16:45:00', amount: 89.90, status: OrderStatus.COMPLETED, salesperson: 'Ricardo Lopes' },
  { id: 'PD-1026', customer: 'Padaria Alfa', date: '2023-11-14T09:15:00', amount: 320.00, status: OrderStatus.CANCELLED, salesperson: 'Carlos Alberto' },
  { id: 'PD-1025', customer: 'Construtora Nova Era', date: '2023-11-13T15:00:00', amount: 7500.00, status: OrderStatus.COMPLETED, salesperson: 'Ana Paula' },
];

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pedidos de Venda</h2>
          <p className="text-slate-500">Gerencie suas vendas e acompanhe o status dos pedidos.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, vendedor ou código..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              <Filter size={18} />
              Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_ORDERS.filter(o => 
                o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.salesperson.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">#{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{order.customer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <User size={12} />
                      </div>
                      <p className="text-sm text-slate-600">{order.salesperson}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">{formatDate(order.date)}</span>
                      <span className="text-xs text-slate-400">{formatTime(order.date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{formatCurrency(order.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50" title="Compartilhar WhatsApp">
                        <Send size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50" title="Ver PDF">
                        <FileText size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-sm text-slate-500">Exibindo 5 de 125 pedidos</p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-white">Anterior</button>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case OrderStatus.PENDING:
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case OrderStatus.CANCELLED:
      return 'text-rose-600 bg-rose-50 border-rose-100';
    default:
      return 'text-slate-500 bg-slate-50 border-slate-200';
  }
};

export default Orders;
