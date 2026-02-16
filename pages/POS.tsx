
import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, User, CreditCard, Banknote, QrCode } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const PRODUCTS = [
  { id: '1', name: 'Óleo Motor 5W30 Sintético', price: 45.90, image: 'https://picsum.photos/seed/oil/100/100' },
  { id: '2', name: 'Filtro de Ar Master', price: 28.50, image: 'https://picsum.photos/seed/filter/100/100' },
  { id: '3', name: 'Pastilha de Freio Ceramic', price: 115.00, image: 'https://picsum.photos/seed/brake/100/100' },
  { id: '4', name: 'Lâmpada H7 Night Breaker', price: 89.00, image: 'https://picsum.photos/seed/lamp/100/100' },
  { id: '5', name: 'Líquido de Arrefecimento', price: 22.90, image: 'https://picsum.photos/seed/coolant/100/100' },
];

const POS: React.FC = () => {
  const [cart, setCart] = useState<{product: any, qty: number}[]>([]);
  const [search, setSearch] = useState('');

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? {...c, qty: c.qty + 1} : c));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.product.id !== id));
  
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código de barras (F2)..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
          {PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col text-left group hover:ring-2 hover:ring-indigo-500 rounded-xl transition-all"
            >
              <div className="h-32 bg-slate-100 rounded-t-xl overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-3 bg-white border border-t-0 border-slate-100 rounded-b-xl flex-1 flex flex-col justify-between">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-2">{product.name}</h4>
                <p className="text-indigo-600 font-bold">{formatCurrency(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-96 flex flex-col bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-indigo-400" />
            <h3 className="font-bold text-xl tracking-tight">Carrinho</h3>
          </div>
          <span className="bg-indigo-500 text-xs font-bold px-2 py-1 rounded-full">{cart.length} itens</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center opacity-50">
              <ShoppingCart size={48} className="mb-4" />
              <p className="font-medium">O carrinho está vazio</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between group">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-bold line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-slate-400">{item.qty}x {formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">{formatCurrency(item.product.price * item.qty)}</span>
                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-800/50 space-y-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total</span>
            <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center gap-1.5 p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
              <Banknote size={18} />
              <span className="text-[10px] font-bold">Dinheiro</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
              <CreditCard size={18} />
              <span className="text-[10px] font-bold">Cartão</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors">
              <QrCode size={18} />
              <span className="text-[10px] font-bold">PIX</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <CheckCircle size={20} />
            Finalizar Venda (F5)
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
