
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, User, CreditCard, Banknote, QrCode, Loader2, Package, Printer, X, ShoppingBag, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { printService } from '../services/print';
import { Product, Order, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const POS: React.FC = () => {
  const { companyId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchProds = async () => {
      if (!companyId) return;
      try {
        const data = await db.products.getAll(companyId);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProds();
  }, [companyId]);

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
    if (cart.length === 0 || !companyId) return;
    setIsFinishing(true);
    try {
      const order: Partial<Order> = {
        client_id: null,
        total_amount: total,
        status: OrderStatus.COMPLETED,
        salesperson: 'Caixa Mobile',
        payment_method: method
      };

      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        discount: 0,
        total_price: item.product.price * item.qty,
        name: item.product.name 
      }));

      // Fix: Passed companyId as the third argument
      const savedOrder = await db.orders.create(order, items, companyId);
      setLastSale({ order: { ...order, id: savedOrder?.id || 'NO-ID' }, items });
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setIsFinishing(false);
    }
  };

  const handlePrint = async () => {
    if (!lastSale) return;
    await printService.printReceipt(lastSale.order, lastSale.items);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 relative animate-in fade-in duration-500">
      
      {/* Catálogo de Produtos */}
      <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar produtos Nexero..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600/20 text-xs text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="md:hidden ml-4 p-2 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20" onClick={() => setIsCartOpen(true)}>
             <ShoppingCart size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min custom-scrollbar">
          {loading ? (
            <div className="col-span-full py-10 text-center"><Loader2 className="animate-spin inline-block text-brand-600" /></div>
          ) : products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col text-left bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-600/40 transition-all active:scale-95 group dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="h-24 bg-slate-50 flex items-center justify-center border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Package className="text-slate-200 dark:text-slate-800" size={24} />}
              </div>
              <div className="p-3">
                <h4 className="text-[10px] font-black text-slate-700 group-hover:text-brand-600 transition-colors line-clamp-1 uppercase mb-1 dark:text-slate-300">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <p className="text-brand-600 font-black text-xs">{formatCurrency(product.price)}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Est: {product.stock}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Desktop (Lateral) */}
      <div className="hidden md:flex w-96 flex-col bg-white text-slate-900 rounded-[2rem] shadow-xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-800">
        <POSCartContent 
          cart={cart} 
          total={total} 
          removeFromCart={removeFromCart} 
          handleFinishSale={handleFinishSale} 
          isFinishing={isFinishing}
          lastSale={lastSale}
          setLastSale={setLastSale}
          handlePrint={handlePrint}
        />
      </div>

      {/* Cart Mobile (Bottom Sheet / Overlay) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800">
             <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 font-black uppercase tracking-widest flex items-center gap-2 dark:text-white"><ShoppingBag size={20} className="text-brand-600" /> Carrinho</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full dark:bg-slate-800 dark:text-slate-400"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto">
               <POSCartContent 
                cart={cart} 
                total={total} 
                removeFromCart={removeFromCart} 
                handleFinishSale={handleFinishSale} 
                isFinishing={isFinishing}
                lastSale={lastSale}
                setLastSale={setLastSale}
                handlePrint={handlePrint}
               />
             </div>
           </div>
        </div>
      )}

      {/* Botão Flutuante Mobile de Carrinho */}
      {!isCartOpen && cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 md:hidden z-50 bg-brand-600 text-white p-4 rounded-full shadow-2xl shadow-brand-600/40 flex items-center gap-2 animate-bounce"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-brand-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-600 dark:bg-slate-900">{cart.length}</span>
          </div>
          <span className="font-black text-xs mr-2">{formatCurrency(total)}</span>
        </button>
      )}

      {/* Modal de Venda Concluída Mobile */}
      {lastSale && !isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
           <div className="relative bg-white border border-slate-200 p-8 rounded-[3rem] w-full max-w-sm text-center space-y-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl">
                 <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic dark:text-white">Venda Concluída!</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Recibo gerado para #{lastSale.order.id.substring(0,8)}</p>
              </div>
              <button onClick={handlePrint} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20">
                 <Printer size={18} /> Imprimir
              </button>
              <button onClick={() => setLastSale(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                 Nova Venda
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const POSCartContent = ({ cart, total, removeFromCart, handleFinishSale, isFinishing, lastSale, setLastSale, handlePrint }: any) => (
  <>
    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
      {cart.map((item: any) => (
        <div key={item.product.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="flex-1 mr-4">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate w-32 dark:text-white">{item.product.name}</p>
            <p className="text-[10px] text-slate-400 font-bold">{item.qty}x {formatCurrency(item.product.price)}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-black text-xs text-brand-600">{formatCurrency(item.product.price * item.qty)}</span>
            <button onClick={() => removeFromCart(item.product.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      {cart.length === 0 && !lastSale && (
        <div className="h-40 flex flex-col items-center justify-center text-slate-300 opacity-50 italic">
           <ShoppingBag size={48} className="mb-4 text-slate-200 dark:text-slate-800" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">O carrinho está vazio</p>
        </div>
      )}
      {lastSale && cart.length === 0 && (
         <div className="hidden md:flex h-full flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"><CheckCircle size={32}/></div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Venda Sincronizada</p>
            <button onClick={handlePrint} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"><Printer size={16}/> Imprimir Recibo</button>
            <button onClick={() => setLastSale(null)} className="text-xs text-slate-400 font-bold hover:text-brand-600 transition-colors uppercase tracking-widest">Iniciar nova venda</button>
         </div>
      )}
    </div>

    {cart.length > 0 && (
      <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6 dark:bg-slate-800/50 dark:border-slate-800">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Líquido</span>
          <span className="text-3xl font-black text-brand-600 tracking-tighter leading-none">{formatCurrency(total)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => handleFinishSale('DINHEIRO')} className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
            <Banknote size={20} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Dinheiro</span>
          </button>
          <button onClick={() => handleFinishSale('CARTÃO')} className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
            <CreditCard size={20} className="text-sky-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Cartão</span>
          </button>
          <button onClick={() => handleFinishSale('PIX')} className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
            <QrCode size={20} className="text-brand-600" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">PIX</span>
          </button>
        </div>

        <button 
          disabled={isFinishing}
          onClick={() => handleFinishSale('PIX')}
          className="w-full py-5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-600/20 uppercase text-xs tracking-[0.1em]"
        >
          {isFinishing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
          Finalizar Pedido
        </button>
      </div>
    )}
  </>
);

export default POS;
