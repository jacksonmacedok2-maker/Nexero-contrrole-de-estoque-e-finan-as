
import React from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

const TRANSACTIONS = [
  { id: '1', desc: 'Venda - Pedido #PD-1029', type: 'INCOME', amount: 450.90, date: '2023-11-15', category: 'Vendas' },
  { id: '2', desc: 'Aluguel Galpão', type: 'EXPENSE', amount: 2500.00, date: '2023-11-15', category: 'Infraestrutura' },
  { id: '3', desc: 'Fornecedor - Distribuidora X', type: 'EXPENSE', amount: 1200.00, date: '2023-11-14', category: 'Estoque' },
  { id: '4', desc: 'Venda - Pedido #PD-1028', type: 'INCOME', amount: 1200.00, date: '2023-11-14', category: 'Vendas' },
];

const Finance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-slate-500">Fluxo de caixa e gestão de contas.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
          Novo Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800 opacity-80">Receitas (Mês)</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(45800.00)}</p>
          </div>
          <ArrowUpCircle className="text-emerald-500" size={32} />
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-800 opacity-80">Despesas (Mês)</p>
            <p className="text-2xl font-bold text-rose-900 mt-1">{formatCurrency(12450.00)}</p>
          </div>
          <ArrowDownCircle className="text-rose-500" size={32} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(33350.00)}</p>
          </div>
          <DollarSign className="text-indigo-600" size={32} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Últimas Transações</h3>
          <div className="flex gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600"><Search size={18} /></button>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600"><Filter size={18} /></button>
          </div>
        </div>
        <table className="w-full">
          <tbody className="divide-y">
            {TRANSACTIONS.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'INCOME' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.desc}</p>
                      <p className="text-xs text-slate-500">{t.category} • {formatDate(t.date)}</p>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Finance;
