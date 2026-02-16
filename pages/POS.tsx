
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, User, CreditCard, Banknote, QrCode, Loader2, Package, Printer } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { printService } from '../services/print';
// Fix: Added Order and OrderStatus to imports for strict typing
import { Product, Order, OrderStatus } from '../types';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    const fetchProds = async () => {
      try {
        const data = await db.products.getAll();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProds();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert('Produto sem estoque!');
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? {...c, qty: c.qty + 1} : c));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.product.id !== id));
  
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const handleFinishSale = async (method: string) => {
    if (cart.length === 0) return;
    setIsFinishing(true);
    try {
      // Fix: Explicitly type 'order' and use OrderStatus enum to resolve Type 'string' is not assignable to type 'OrderStatus'
      const order: Partial<Order> = {
        client_id: null,
        total_amount: total,
        status: OrderStatus.COMPLETED,
        salesperson: 'Caixa 01',
        payment_method: method
      };

      // Fix: Added 'discount: 0' to the object to satisfy OrderItem interface requirements
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        discount: 0,
        total_price: item.product.price * item.qty,
        name: item.product.name 
      }));

      const savedOrder = await db.orders.create(order, items);
      
      setLastSale({ order: { ...order, id: savedOrder?.id || 'NO-ID' }, items });
      setCart([]);
    } catch (err: any) {
      alert('Erro ao salvar venda: ' + err.message);
    } finally {
      setIsFinishing(false);
    }
  };

  const handlePrint = async () => {
    if (!lastSale) return;
    await printService.printReceipt(lastSale.order, lastSale.items);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produtos reais no banco (F2)..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
          {loading ? (
            <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline-block text-indigo-600" /></div>
          ) : products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col text-left group hover:ring-2 hover:ring-indigo-500 rounded-xl transition-all relative overflow-hidden"
            >
              <div className="h-28 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Package className="text-slate-300" size={32} />}
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-t-0 border-slate-100 dark:border-slate-800 rounded-b-xl flex-1 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{product.name}</h4>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{formatCurrency(product.price)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Est: {product.stock}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 flex flex-col bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
        {lastSale && cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Venda Concluída!</h3>
              <p className="text-slate-400 text-sm mt-1">Deseja imprimir o recibo para o cliente?</p>
            </div>
            <div className="w-full space-y-3">
              <button 
                onClick={handlePrint}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Printer size={20} /> Imprimir Recibo
              </button>
              <button 
                onClick={() => setLastSale(null)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
              >
                Nova Venda
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} className="text-indigo-400" />
                <h3 className="font-bold text-xl tracking-tight">Venda Atual</h3>
              </div>
              <span className="bg-indigo-500 text-xs font-bold px-2 py-1 rounded-full">{cart.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <p className="text-sm font-bold truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400">{item.qty}x {formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatCurrency(item.product.price * item.qty)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 py-20">
                   <Package size={48} className="mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">Carrinho Vazio</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-800/50 space-y-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-xs">Total a Receber</span>
                <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleFinishSale('DINHEIRO')} className="flex flex-col items-center gap-1.5 p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">
                  <Banknote size={20} />
                  <span className="text-[10px] font-bold uppercase">Dinheiro</span>
                </button>
                <button onClick={() => handleFinishSale('CARTÃO')} className="flex flex-col items-center gap-1.5 p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">
                  <CreditCard size={20} />
                  <span className="text-[10px] font-bold uppercase">Cartão</span>
                </button>
                <button onClick={() => handleFinishSale('PIX')} className="flex flex-col items-center gap-1.5 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all">
                  <QrCode size={20} />
                  <span className="text-[10px] font-bold uppercase">PIX</span>
                </button>
              </div>

              <button 
                disabled={cart.length === 0 || isFinishing}
                onClick={() => handleFinishSale('PIX')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {isFinishing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                Finalizar Venda
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default POS;
