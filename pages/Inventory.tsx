import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Inventory: React.FC = () => {
  const { companyId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.products.getAll(companyId);
      setProducts(data);
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [companyId]);

  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0);
  const itemsBelowMin = products.filter(p => p.stock <= p.min_stock).length;
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Controle de Estoque</h2>
          <p className="text-slate-500 dark:text-slate-400">Monitore níveis de estoque reais sincronizados via Supabase.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <ArrowUpRight size={18} /> Entrada
          </button>
          <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <ArrowDownLeft size={18} /> Saída
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">Valor Total em Estoque</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">Itens Abaixo do Mínimo</p>
          <div className="flex items-center gap-2 text-amber-600 mt-1">
            <AlertTriangle size={20} />
            <p className="text-2xl font-bold">{itemsBelowMin} itens</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500">Total de SKUs</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{products.length} produtos</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar produto por nome ou SKU..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin inline-block text-indigo-600" size={32} />
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Sincronizando inventário...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b dark:border-slate-800">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4 text-center">Nível</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Valor Unit.</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 uppercase">{item.sku || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{item.stock} un</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {item.stock <= 0 ? (
                          <span className="px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase border border-rose-100 dark:border-rose-500/20">Zerado</span>
                        ) : item.stock <= item.min_stock ? (
                          <span className="px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase border border-amber-100 dark:border-amber-500/20">Baixo</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase border border-emerald-100 dark:border-emerald-500/20">Ok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredProducts.length === 0 && (
            <div className="p-20 text-center">
              <Package className="inline-block text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">Nenhum item no inventário.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;