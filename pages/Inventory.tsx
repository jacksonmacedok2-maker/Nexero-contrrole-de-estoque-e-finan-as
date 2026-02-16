
import React from 'react';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const MOCK_STOCK = [
  { id: '1', name: 'Óleo Motor 5W30', sku: 'OL-530', stock: 124, min: 20, value: 45.90 },
  { id: '2', name: 'Filtro de Ar Master', sku: 'FA-1002', stock: 12, min: 15, value: 28.50 },
  { id: '3', name: 'Pastilha de Freio', sku: 'PF-CER', stock: 45, min: 10, value: 115.00 },
  { id: '4', name: 'Lâmpada H7', sku: 'LM-H7', stock: 0, min: 5, value: 89.00 },
];

const Inventory: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle de Estoque</h2>
          <p className="text-slate-500">Monitore níveis de estoque e movimentações.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 transition-all">
            <ArrowUpRight size={18} /> Entrada
          </button>
          <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 transition-all">
            <ArrowDownLeft size={18} /> Saída
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Valor Total em Estoque</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(154200.50)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Itens Abaixo do Mínimo</p>
          <div className="flex items-center gap-2 text-amber-600 mt-1">
            <AlertTriangle size={20} />
            <p className="text-2xl font-bold">12 itens</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total de SKUs</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">458 produtos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto por nome ou SKU..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b">
              <th className="px-6 py-4 text-left">Produto</th>
              <th className="px-6 py-4 text-left">SKU</th>
              <th className="px-6 py-4 text-center">Nível</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Valor Unit.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MOCK_STOCK.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.sku}</td>
                <td className="px-6 py-4 text-center font-bold text-slate-700">{item.stock} un</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {item.stock <= 0 ? (
                      <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase border border-rose-100">Zerado</span>
                    ) : item.stock <= item.min ? (
                      <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase border border-amber-100">Baixo</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-100">Ok</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">{formatCurrency(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
