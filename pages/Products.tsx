
import React from 'react';
import { Package, MoreVertical, TrendingDown, Layers, Search, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const PRODUCTS = [
  { id: '1', name: 'Óleo Motor 5W30 Sintético', sku: 'OL-530-S', price: 45.90, stock: 124, category: 'Lubrificantes', image: 'https://picsum.photos/seed/oil/100/100' },
  { id: '2', name: 'Filtro de Ar Master', sku: 'FA-1002', price: 28.50, stock: 12, category: 'Filtros', image: 'https://picsum.photos/seed/filter/100/100' },
  { id: '3', name: 'Pastilha de Freio Ceramic', sku: 'PF-CER-01', price: 115.00, stock: 45, category: 'Freios', image: 'https://picsum.photos/seed/brake/100/100' },
  { id: '4', name: 'Lâmpada H7 Night Breaker', sku: 'LM-H7-NB', price: 89.00, stock: 0, category: 'Iluminação', image: 'https://picsum.photos/seed/lamp/100/100' },
];

const Products: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Produtos</h2>
          <p className="text-slate-500">Controle seu estoque e preços em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
            <Layers size={20} />
            Categorias
          </button>
          <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="relative h-48 bg-slate-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Sem Estoque</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <button className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{product.category}</p>
              <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{product.name}</h4>
              <p className="text-xs text-slate-500 mb-4">SKU: {product.sku}</p>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Preço Venda</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(product.price)}</p>
                </div>
                <div className={`text-right ${product.stock < 20 ? 'text-amber-600' : 'text-slate-500'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-tighter">Estoque</p>
                  <p className="text-sm font-bold">{product.stock} un</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
