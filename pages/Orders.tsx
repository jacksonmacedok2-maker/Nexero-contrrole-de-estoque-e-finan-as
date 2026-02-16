
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, MoreHorizontal, FileText, Send, User, Loader2, ShoppingCart, Printer, X, ShoppingBag, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { OrderStatus, OrderItem, Product, Client } from '../types';
import { db } from '../services/database';
import { printService } from '../services/print';

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handlePrintOrder = async (order: any) => {
    try {
      const items = order.order_items || []; 
      await printService.printReceipt(order, items);
    } catch (e) {
      alert("Erro ao preparar impressão.");
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.salesperson || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pedidos de Venda</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie suas vendas sincronizadas no Supabase.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código, cliente ou vendedor..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 transition-colors">
              <Filter size={18} /> Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 transition-colors">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin inline-block text-brand-600" size={32} />
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Carregando histórico...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-800">
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
                    <td className="px-6 py-4 text-xs font-black text-brand-600">{order.code || `#${order.id.substring(0,8).toUpperCase()}`}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{order.clients?.name || 'Cliente Avulso'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <User size={12} />
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{order.salesperson || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{formatDate(order.created_at)}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{formatTime(order.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800 dark:text-white text-right">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(order.status as OrderStatus)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handlePrintOrder(order)}
                          className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg"
                        >
                          <Printer size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg">
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
              <ShoppingCart className="inline-block text-slate-200 mb-4" size={48} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum pedido processado</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && <OrderModal onClose={() => setIsModalOpen(false)} onRefresh={fetchOrders} />}
    </div>
  );
};

const OrderModal: React.FC<{ onClose: () => void, onRefresh: () => void }> = ({ onClose, onRefresh }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c, p] = await Promise.all([db.clients.getAll(), db.products.getAll()]);
        setClients(c);
        setProducts(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  const addItem = (product: Product) => {
    if (product.stock <= 0) return alert('Produto sem estoque!');
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price } : i));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        discount: 0,
        total_price: product.price
      }]);
    }
  };

  const removeItem = (id: string) => setCart(cart.filter(i => i.product_id !== id));

  const updateQty = (id: string, qty: number) => {
    setCart(cart.map(i => i.product_id === id ? { 
      ...i, 
      quantity: qty, 
      total_price: (qty * i.unit_price) - (i.discount || 0) 
    } : i));
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);
  const totalDiscount = cart.reduce((acc, i) => acc + (i.discount || 0), 0);
  const totalAmount = subtotal - totalDiscount;

  const handleSave = async (status: OrderStatus) => {
    if (cart.length === 0) return setError('Adicione ao menos um item.');
    setIsSaving(true);
    setError('');

    try {
      await db.orders.create({
        client_id: selectedClientId || null,
        total_amount: totalAmount,
        subtotal: subtotal,
        discount_total: totalDiscount,
        status: status,
        salesperson: 'Vendedor Nexero',
        payment_method: paymentMethod,
        notes: notes,
        created_at: new Date().toISOString()
      }, cart);
      
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg"><ShoppingBag size={24}/></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Novo Pedido de Venda</h3>
              <p className="text-xs text-slate-500 font-medium">Preencha os itens e selecione o cliente para finalizar.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Product Picker & Customer Selection */}
          <div className="flex-1 p-6 space-y-6 border-r dark:border-slate-800 overflow-y-auto">
            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-brand-600 transition-all outline-none"
              >
                <option value="">Cliente Avulso (Não Identificado)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.cnpj_cpf}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catálogo de Produtos</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input type="text" placeholder="Filtrar..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-[10px] focus:outline-none"/>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => addItem(p)}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-left hover:border-brand-500 transition-all group shadow-sm active:scale-95"
                  >
                    <p className="text-[10px] font-black text-brand-600 uppercase mb-1">{p.category || 'Geral'}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-brand-600">{p.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(p.price)}</span>
                      <span className="text-[9px] font-bold text-slate-400">Est: {p.stock}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Totals */}
          <div className="w-full md:w-[400px] bg-slate-50 dark:bg-slate-800/40 p-6 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShoppingCart size={14}/> Itens Selecionados ({cart.length})
            </h4>

            <div className="flex-1 overflow-y-auto space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.product_id} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-40">{item.name}</p>
                    <button onClick={() => removeItem(item.product_id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                       <button onClick={() => updateQty(item.product_id, Math.max(1, item.quantity - 1))} className="w-6 h-6 flex items-center justify-center text-slate-500">-</button>
                       <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                       <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-slate-500">+</button>
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.total_price)}</p>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic opacity-50">
                  <ShoppingBag size={32} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase">Nenhum item</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t dark:border-slate-800">
               <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>Subtotal</span>
                 <span>{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-emerald-600">
                 <span>Descontos</span>
                 <span>- {formatCurrency(totalDiscount)}</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                 <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Líquido</span>
                 <span className="text-2xl font-black text-brand-600">{formatCurrency(totalAmount)}</span>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-4">
                 <button 
                  disabled={isSaving}
                  onClick={() => handleSave(OrderStatus.DRAFT)}
                  className="py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                 >
                   Salvar Rascunho
                 </button>
                 <button 
                  disabled={isSaving || cart.length === 0}
                  onClick={() => handleSave(OrderStatus.COMPLETED)}
                  className="py-4 bg-brand-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                   Finalizar Pedido
                 </button>
               </div>
            </div>
          </div>
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
    case OrderStatus.DRAFT:
      return 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    case OrderStatus.CANCELLED:
      return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20';
    default:
      return '';
  }
};

export default Orders;
