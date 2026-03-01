
import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Search, Filter, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { db } from '../services/database';
import { Transaction } from '../types';

const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const data = await db.finance.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Erro ao carregar financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'INCOME') acc.income += Number(t.amount);
    else acc.expense += Number(t.amount);
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fluxo de Caixa Cloud</h2>
          <p className="text-slate-500 dark:text-slate-400">Dados consolidados do seu banco de dados.</p>
        </div>
        <button className="bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-700 shadow-lg shadow-brand-600/20">
          Novo Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/5 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Total Receitas</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{formatCurrency(totals.income)}</p>
          </div>
          <ArrowUpCircle className="text-emerald-500" size={32} />
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/5 p-6 rounded-2xl border border-rose-100 dark:border-rose-500/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-800 dark:text-rose-400">Total Despesas</p>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">{formatCurrency(totals.expense)}</p>
          </div>
          <ArrowDownCircle className="text-rose-500" size={32} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Saldo Disponível</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatCurrency(totals.income - totals.expense)}</p>
          </div>
          <DollarSign className="text-brand-600" size={32} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-widest">Últimas Transações Sincronizadas</h3>
        </div>
        
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="animate-spin inline-block text-brand-600" /></div>
        ) : (
          <table className="w-full">
            <tbody className="divide-y dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === 'INCOME' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category} • {formatDate(t.date)}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={2} className="p-10 text-center text-slate-400 italic">Nenhuma transação financeira registrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Finance;
