import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
  ShoppingCart,
  Printer,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Minus
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { OrderStatus, OrderItem, Product, Client, Order } from '../types';
import { db } from '../services/database';
import { printService } from '../services/print';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const Orders: React.FC = () => {
  const { companyId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ modal de detalhes
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.orders.getAll(companyId);
      setOrders(data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [companyId]);

  const handlePrintOrder = async (order: any) => {
    const items = order.order_items || [];
    await printService.printReceipt(order, items);
  };

  const filteredOrders = orders.filter((o) =>
    (o.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
            Vendas Realizadas
          </h2>
          <p className="text-xs text-slate-500 font-medium italic">
            Histórico de transações sincronizado em tempo real.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-brand-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          <Plus size={18} /> Novo Pedido
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Pesquisar por cliente ou código..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-xs font-bold transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin inline-block text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isCancelled = String(order?.status || '').toUpperCase() === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 font-black text-[10px] shadow-inner border border-slate-100 dark:border-slate-700">
                      {order.clients?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                        #{order.code || order.id.substring(0, 8).toUpperCase()}
                      </p>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight uppercase truncate w-40">
                        {order.clients?.name || 'Cliente Avulso'}
                      </h4>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(
                      order.status as OrderStatus
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Venda</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isCancelled) handlePrintOrder(order);
                    }}
                    disabled={isCancelled}
                    title={isCancelled ? 'Venda cancelada — recibo indisponível' : 'Imprimir recibo'}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                      isCancelled
                        ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                    }`}
                    type="button"
                  >
                    <Printer size={16} />
                    <span className="text-[9px] font-black uppercase">
                      {isCancelled ? 'Recibo (Cancelada)' : 'Recibo'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    type="button"
                  >
                    <MoreHorizontal size={16} /> <span className="text-[9px] font-black uppercase">Detalhes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma venda encontrada</p>
        </div>
      )}

      {isModalOpen && companyId && (
        <OrderModal companyId={companyId} onClose={() => setIsModalOpen(false)} onRefresh={fetchOrders} />
      )}

      {selectedOrder && companyId && (
        <OrderDetailsModal
          companyId={companyId}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
};

const getStatusStyle = (status: OrderStatus) => {
  const s = String(status || '').toUpperCase();

  if (s === 'CANCELLED') {
    return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20';
  }

  switch (status) {
    case OrderStatus.COMPLETED:
      return 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    case OrderStatus.DRAFT:
      return 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700';
    default:
      return 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20';
  }
};

type CartItem = { product: Product; qty: number; discountPct: number };

const clampPct = (v: any) => {
  const raw = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, raw));
};

const parseMoneyInput = (v: any) => {
  const s = (v ?? '').toString().trim().replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const getRecommendedPct = (p: any) => {
  const v = Number(p?.recommended_discount_pct || 0);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
};

const formatPaymentMethod = (raw: any) => {
  const s = String(raw || '').toUpperCase().trim();

  if (!s) return '—';

  if (s === 'DINHEIRO') return 'Dinheiro';
  if (s === 'PIX') return 'Pix';
  if (s === 'TRANSFERENCIA') return 'Transferência';
  if (s === 'BOLETO') return 'Boleto';
  if (s === 'FIADO') return 'Fiado / À prazo';

  if (s === 'CARTAO') return 'Cartão';
  if (s === 'CARTAO_DEBITO') return 'Cartão débito';

  if (s.startsWith('CARTAO_CREDITO_')) {
    const part = s.replace('CARTAO_CREDITO_', '');
    return `Cartão crédito (${part.toLowerCase()})`;
  }

  return raw;
};

const PAYMENT_OPTIONS = [
  { value: 'DINHEIRO', label: 'Dinheiro (à vista)' },
  { value: 'CARTAO', label: 'Cartão' },
  { value: 'PIX', label: 'Pix' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'FIADO', label: 'Fiado / À prazo' }
];

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const OrderModal: React.FC<{ companyId: string; onClose: () => void; onRefresh: () => void }> = ({
  companyId,
  onClose,
  onRefresh
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [rightTab, setRightTab] = useState<'CART' | 'DISCOUNT'>('CART');

  const [paymentMethod, setPaymentMethod] = useState<string>('DINHEIRO');
  const [cardType, setCardType] = useState<'CREDITO' | 'DEBITO'>('DEBITO');
  const [installments, setInstallments] = useState<number>(1);

  const [cashReceived, setCashReceived] = useState<string>('');

  const [globalDiscountPct, setGlobalDiscountPct] = useState<string>('');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<string>('');

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c, p] = await Promise.all([db.clients.getAll(companyId), db.products.getAll(companyId)]);
        setClients(c);
        setProducts(p);
      } catch (err) {
        console.error('Erro ao carregar dados do modal:', err);
      }
    };
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (paymentMethod === 'CARTAO' && cardType === 'DEBITO') {
      setInstallments(1);
    }
  }, [paymentMethod, cardType]);

  useEffect(() => {
    setError('');
    if (paymentMethod !== 'DINHEIRO') setCashReceived('');
  }, [paymentMethod]);

  const getProductStock = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    return typeof (p as any)?.stock === 'number' ? (p as any).stock : 0;
  };

  const getLineSubtotal = (item: CartItem) => item.product.price * item.qty;
  const getLineItemDiscount = (item: CartItem) => getLineSubtotal(item) * (clampPct(item.discountPct) / 100);
  const getLineNetAfterItemDiscount = (item: CartItem) => Math.max(0, getLineSubtotal(item) - getLineItemDiscount(item));

  const itemsSubtotal = cart.reduce((sum, item) => sum + getLineSubtotal(item), 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + getLineItemDiscount(item), 0);

  const baseNet = cart.reduce((sum, item) => sum + getLineNetAfterItemDiscount(item), 0);

  const globalPctNum = clampPct(globalDiscountPct);
  const globalValueNumInput = parseMoneyInput(globalDiscountValue);

  let computedGlobalDiscount = 0;
  if (globalDiscountPct.trim() !== '') {
    computedGlobalDiscount = round2(baseNet * (globalPctNum / 100));
  } else if (globalDiscountValue.trim() !== '') {
    computedGlobalDiscount = round2(globalValueNumInput);
  }
  computedGlobalDiscount = Math.max(0, Math.min(baseNet, computedGlobalDiscount));

  const totalDiscount = round2(itemsDiscount + computedGlobalDiscount);
  const total = round2(Math.max(0, baseNet - computedGlobalDiscount));

  const cashReceivedNum = parseMoneyInput(cashReceived);
  const change = Math.max(0, cashReceivedNum - total);
  const missing = Math.max(0, total - cashReceivedNum);

  const addToCart = (p: Product) => {
    setError('');
    const available = typeof (p as any)?.stock === 'number' ? (p as any).stock : 0;
    if (available <= 0) {
      setError(`Sem estoque para "${p.name}".`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === p.id);
      if (existing) {
        if (existing.qty >= available) {
          setError(`Estoque insuficiente para "${p.name}". Disponível: ${available} un.`);
          return prev;
        }
        return prev.map((c) => (c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      }

      const rec = getRecommendedPct(p as any);
      return [...prev, { product: p, qty: 1, discountPct: rec }];
    });
  };

  const incQty = (productId: string) => {
    setError('');
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === productId);
      if (!existing) return prev;

      const available = getProductStock(productId);
      if (existing.qty >= available) {
        setError(`Estoque insuficiente para "${existing.product.name}". Disponível: ${available} un.`);
        return prev;
      }

      return prev.map((c) => (c.product.id === productId ? { ...c, qty: c.qty + 1 } : c));
    });
  };

  const decQty = (productId: string) => {
    setError('');
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setError('');
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const setDiscountPct = (productId: string, pct: any) => {
    setCart((prev) => prev.map((c) => (c.product.id === productId ? { ...c, discountPct: clampPct(pct) } : c)));
  };

  const applyRecommended = (productId: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const rec = getRecommendedPct(c.product as any);
        return { ...c, discountPct: rec };
      })
    );
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      setError('Digite o nome do cliente.');
      return;
    }

    setIsCreatingClient(true);
    setError('');
    try {
      const created = await db.clients.create(
        {
          name: newClientName.trim(),
          cnpj_cpf: newClientDoc.trim() || undefined,
          phone: newClientPhone.trim() || undefined
        } as Partial<Client>,
        companyId
      );

      if (!created?.id) {
        const refreshed = await db.clients.getAll(companyId);
        setClients(refreshed);
        setIsNewClientOpen(false);
        setNewClientName('');
        setNewClientDoc('');
        setNewClientPhone('');
        return;
      }

      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);

      setIsNewClientOpen(false);
      setNewClientName('');
      setNewClientDoc('');
      setNewClientPhone('');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar cliente.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const getFinalPaymentMethod = () => {
    if (paymentMethod !== 'CARTAO') return paymentMethod;

    if (cardType === 'DEBITO') return 'CARTAO_DEBITO';

    const p = Math.max(1, Math.min(12, Number(installments || 1)));
    return `CARTAO_CREDITO_${p}X`;
  };

  const distributeGlobalDiscount = () => {
    const lineNets = cart.map((c) => ({
      id: c.product.id,
      net: round2(getLineNetAfterItemDiscount(c))
    }));

    const totalNet = round2(lineNets.reduce((acc, cur) => acc + cur.net, 0));
    const gd = round2(computedGlobalDiscount);

    const map: Record<string, number> = {};
    if (gd <= 0 || totalNet <= 0) {
      for (const ln of lineNets) map[ln.id] = 0;
      return map;
    }

    let allocated = 0;
    for (let i = 0; i < lineNets.length; i++) {
      const ln = lineNets[i];

      if (i === lineNets.length - 1) {
        const last = round2(Math.max(0, gd - allocated));
        map[ln.id] = last;
        allocated = round2(allocated + last);
        break;
      }

      const share = round2((ln.net / totalNet) * gd);
      map[ln.id] = share;
      allocated = round2(allocated + share);
    }

    return map;
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    if (!paymentMethod) {
      setError('Selecione a forma de pagamento.');
      return;
    }

    if (paymentMethod === 'CARTAO' && !cardType) {
      setError('Selecione Crédito ou Débito.');
      return;
    }

    if (paymentMethod === 'DINHEIRO') {
      if (cashReceived.trim() === '') {
        setError('Informe o valor recebido no dinheiro.');
        return;
      }
      if (cashReceivedNum + 0.000001 < total) {
        setError(`Valor recebido insuficiente. Falta ${formatCurrency(missing)}.`);
        return;
      }
    }

    setIsSaving(true);
    setError('');
    try {
      const finalPaymentMethod = getFinalPaymentMethod();

      const order: Partial<Order> = {
        client_id: selectedClientId,
        total_amount: total,
        status: OrderStatus.COMPLETED,
        salesperson: 'Administrador',
        payment_method: finalPaymentMethod
      };

      const globalMap = distributeGlobalDiscount();

      const items: Partial<OrderItem>[] = cart.map((item) => {
        const lineSubtotal = round2(getLineSubtotal(item));
        const itemDisc = round2(getLineItemDiscount(item));
        const lineNet = round2(Math.max(0, lineSubtotal - itemDisc));

        const shareGlobal = round2(globalMap[item.product.id] || 0);

        const finalLineTotal = round2(Math.max(0, lineNet - shareGlobal));
        const finalLineDiscount = round2(itemDisc + shareGlobal);

        return {
          product_id: item.product.id,
          quantity: item.qty,
          unit_price: item.product.price,
          discount: finalLineDiscount,
          total_price: finalLineTotal,
          name: item.product.name
        };
      });

      await db.orders.create(order, items as OrderItem[], companyId);

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar o pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  const disableFinalize =
    isSaving ||
    cart.length === 0 ||
    (paymentMethod === 'DINHEIRO' && cashReceived.trim() !== '' && cashReceivedNum + 0.000001 < total);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Nova Venda (PDV)</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Carrinho • Desconto • Pagamento
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ESQUERDA */}
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Selecionar Cliente
                </label>

                <button
                  onClick={() => setIsNewClientOpen((v) => !v)}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  type="button"
                >
                  <Plus size={14} /> Novo Cliente
                </button>
              </div>

              <select
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-500/20 outline-none"
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value || null)}
              >
                <option value="">Consumidor Final (Avulso)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {isNewClientOpen && (
                <div className="mt-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                        Nome *
                      </label>
                      <input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                        placeholder="Ex: João Silva"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                          CPF/CNPJ (opcional)
                        </label>
                        <input
                          value={newClientDoc}
                          onChange={(e) => setNewClientDoc(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                          placeholder="Somente números"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                          Telefone (opcional)
                        </label>
                        <input
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCreateClient}
                      disabled={isCreatingClient}
                      className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-600/20 hover:bg-brand-700 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                      type="button"
                    >
                      {isCreatingClient ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      {isCreatingClient ? 'SALVANDO...' : 'CRIAR CLIENTE'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                Catálogo de Produtos
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[48vh] overflow-y-auto pr-2 custom-scrollbar">
                {products.map((p) => {
                  const rec = getRecommendedPct(p as any);

                  return (
                    <button
                      key={p.id}
                      disabled={(p as any).stock <= 0}
                      onClick={() => addToCart(p)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        (p as any).stock <= 0
                          ? 'opacity-50 grayscale cursor-not-allowed border-transparent'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-brand-500/50 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">
                          Estoque: {(p as any).stock} un
                          {rec > 0 ? <span className="ml-2 text-emerald-600 font-black">• Rec: {rec}%</span> : null}
                        </p>
                      </div>
                      <span className="text-sm font-black text-brand-600">{formatCurrency(p.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DIREITA */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[2rem] flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Venda Premium</h4>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRightTab('CART')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    rightTab === 'CART'
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800/70'
                  }`}
                >
                  Carrinho
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('DISCOUNT')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    rightTab === 'DISCOUNT'
                      ? 'bg-emerald-500 text-slate-900 border-emerald-500'
                      : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800/70'
                  }`}
                >
                  Desconto
                </button>
              </div>
            </div>

            {rightTab === 'CART' && (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto mb-8 pr-2 custom-scrollbar min-h-[200px]">
                  {cart.map((item) => {
                    const lineSubtotal = round2(getLineSubtotal(item));
                    const itemDisc = round2(getLineItemDiscount(item));
                    const lineNet = round2(getLineNetAfterItemDiscount(item));

                    return (
                      <div key={item.product.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase truncate">{item.product.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold">{formatCurrency(item.product.price)} cada</p>
                          </div>

                          <div className="text-right">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Líquido</p>
                            <span className="text-xs font-black">{formatCurrency(lineNet)}</span>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-500 hover:text-rose-500 transition-colors"
                            title="Remover"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => decQty(item.product.id)}
                                className="w-9 h-9 rounded-xl bg-slate-700/40 hover:bg-slate-700/70 transition-colors flex items-center justify-center"
                                title="Diminuir"
                                type="button"
                              >
                                <Minus size={16} />
                              </button>

                              <div className="min-w-[52px] text-center text-xs font-black">{item.qty}x</div>

                              <button
                                onClick={() => incQty(item.product.id)}
                                className="w-9 h-9 rounded-xl bg-slate-700/40 hover:bg-slate-700/70 transition-colors flex items-center justify-center"
                                title="Aumentar"
                                type="button"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-700/30 rounded-xl px-3 py-2">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">%</span>
                              <input
                                value={String(item.discountPct ?? 0)}
                                onChange={(e) => setDiscountPct(item.product.id, e.target.value)}
                                className="w-14 bg-transparent outline-none text-xs font-black text-white text-right"
                                inputMode="decimal"
                              />
                            </div>

                            <button
                              onClick={() => applyRecommended(item.product.id)}
                              className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all"
                              type="button"
                              title="Aplicar desconto recomendado do produto"
                            >
                              REC
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Sub: {formatCurrency(lineSubtotal)}</span>
                          <span>Desc item: {formatCurrency(itemDisc)}</span>
                          <span>Líquido: {formatCurrency(lineNet)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center opacity-30 italic py-10">
                      <ShoppingBag size={40} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {rightTab === 'DISCOUNT' && (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">
                    Descontos
                  </p>
                  <p className="text-xs text-emerald-200/80 font-bold">
                    Item por item + desconto geral (no total da venda).
                  </p>
                </div>

                <div className="mb-5 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Desconto geral (opcional)
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        %
                      </label>
                      <input
                        value={globalDiscountPct}
                        onChange={(e) => {
                          setGlobalDiscountPct(e.target.value);
                          if (e.target.value.trim() !== '') setGlobalDiscountValue('');
                        }}
                        className="w-full p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Ex: 5"
                        inputMode="decimal"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        R$
                      </label>
                      <input
                        value={globalDiscountValue}
                        onChange={(e) => {
                          setGlobalDiscountValue(e.target.value);
                          if (e.target.value.trim() !== '') setGlobalDiscountPct('');
                        }}
                        className="w-full p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Ex: 10,00"
                        inputMode="decimal"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950/30 border border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Líquido base</p>
                      <p className="text-sm font-black text-slate-200">{formatCurrency(baseNet)}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Desc geral</p>
                      <p className="text-sm font-black text-emerald-200">{formatCurrency(computedGlobalDiscount)}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total final</p>
                      <p className="text-sm font-black text-white">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  {(globalDiscountPct.trim() !== '' || globalDiscountValue.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalDiscountPct('');
                        setGlobalDiscountValue('');
                      }}
                      className="mt-4 w-full py-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                      disabled={isSaving}
                    >
                      Limpar desconto geral
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800">
              <div className="mb-6 p-4 rounded-2xl bg-slate-950/30 border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Forma de pagamento</p>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-brand-500/10"
                  disabled={isSaving}
                >
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {paymentMethod === 'DINHEIRO' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        Valor recebido (R$)
                      </label>
                      <input
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Ex: 100,00"
                        inputMode="decimal"
                        disabled={isSaving}
                      />
                      <p className="mt-2 text-[10px] font-bold text-slate-500">
                        Total a pagar: <span className="text-white font-black">{formatCurrency(total)}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Troco</p>
                        <p className="text-sm font-black text-emerald-200">
                          {cashReceived.trim() ? formatCurrency(change) : formatCurrency(0)}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          cashReceived.trim() && missing > 0
                            ? 'bg-rose-500/10 border-rose-500/20'
                            : 'bg-slate-950/30 border-slate-800'
                        }`}
                      >
                        <p
                          className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                            cashReceived.trim() && missing > 0 ? 'text-rose-300' : 'text-slate-500'
                          }`}
                        >
                          Falta
                        </p>
                        <p
                          className={`text-sm font-black ${
                            cashReceived.trim() && missing > 0 ? 'text-rose-200' : 'text-slate-200'
                          }`}
                        >
                          {cashReceived.trim() ? formatCurrency(missing) : formatCurrency(0)}
                        </p>
                      </div>
                    </div>

                    {cashReceived.trim() !== '' && missing > 0 && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                        Valor insuficiente para finalizar.
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'CARTAO' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCardType('DEBITO')}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                          cardType === 'DEBITO'
                            ? 'bg-white text-slate-900 border-white'
                            : 'bg-slate-900/50 text-slate-300 border-slate-700/40 hover:bg-slate-900/70'
                        }`}
                        disabled={isSaving}
                      >
                        Débito
                      </button>

                      <button
                        type="button"
                        onClick={() => setCardType('CREDITO')}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                          cardType === 'CREDITO'
                            ? 'bg-emerald-500 text-slate-900 border-emerald-500'
                            : 'bg-slate-900/50 text-slate-300 border-slate-700/40 hover:bg-slate-900/70'
                        }`}
                        disabled={isSaving}
                      >
                        Crédito
                      </button>
                    </div>

                    {cardType === 'CREDITO' ? (
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                          Parcelas
                        </label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-full p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10"
                          disabled={isSaving}
                        >
                          {INSTALLMENT_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}x
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-[10px] font-bold text-slate-500">
                          Será salvo como:{' '}
                          <span className="text-slate-200 font-black">
                            CARTAO_CREDITO_{Math.max(1, Math.min(12, installments))}X
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-500">
                        Débito será salvo como: <span className="text-slate-200 font-black">CARTAO_DEBITO</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-slate-950/30 border border-slate-800">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Subtotal</p>
                  <p className="text-sm font-black">{formatCurrency(itemsSubtotal)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Descontos</p>
                  <p className="text-sm font-black text-emerald-200">{formatCurrency(totalDiscount)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total líquido</p>
                  <p className="text-sm font-black text-white">{formatCurrency(total)}</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={disableFinalize}
                className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                type="button"
                title={paymentMethod === 'DINHEIRO' && cashReceived.trim() !== '' && missing > 0 ? 'Valor recebido insuficiente' : 'Finalizar venda'}
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {isSaving ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsModal: React.FC<{
  companyId: string;
  order: any;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ companyId, order, onClose, onRefresh }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ✅ devoluções (perfeito: total + por item)
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsError, setReturnsError] = useState('');
  const [orderReturns, setOrderReturns] = useState<any[]>([]);
  const [returnItemMap, setReturnItemMap] = useState<Record<string, { qty: number; amount: number }>>({});

  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const isCancelled = String(order?.status || '').toUpperCase() === 'CANCELLED';
  const paymentLabel = formatPaymentMethod(order?.payment_method);

  const safeNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const currentTotal = safeNum(order?.total_amount);

  const refundedTotal = orderReturns.reduce((acc: number, r: any) => acc + safeNum(r?.amount), 0);

  // ✅ como a RPC abateu do orders.total_amount, o "original" é: atual + devolvido
  const originalTotal = round2(currentTotal + refundedTotal);

  const fetchReturns = async () => {
    if (!companyId || !order?.id) return;

    setReturnsLoading(true);
    setReturnsError('');
    try {
      // 1) retorna devoluções do pedido
      const { data, error: err } = await supabase
        .from('order_returns')
        .select('id, amount, reason, created_at')
        .eq('company_id', companyId)
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);

      const returns = data || [];
      setOrderReturns(returns);

      // 2) retorna itens devolvidos (por return_id)
      const ids = returns.map((r: any) => r.id).filter(Boolean);
      if (ids.length === 0) {
        setReturnItemMap({});
        return;
      }

      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_return_items')
        .select('order_item_id, quantity, total_refund')
        .in('return_id', ids);

      if (itemsErr) throw new Error(itemsErr.message);

      const map: Record<string, { qty: number; amount: number }> = {};
      for (const ri of itemsData || []) {
        const key = String((ri as any).order_item_id || '');
        if (!key) continue;
        const q = safeNum((ri as any).quantity);
        const a = safeNum((ri as any).total_refund);
        if (!map[key]) map[key] = { qty: 0, amount: 0 };
        map[key] = { qty: map[key].qty + q, amount: round2(map[key].amount + a) };
      }
      setReturnItemMap(map);
    } catch (e: any) {
      setReturnsError(e?.message || 'Erro ao carregar devoluções.');
    } finally {
      setReturnsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, order?.id]);

  const handleCancel = async () => {
    setIsCancelling(true);
    setError('');
    try {
      await db.orders.cancel(order.id, companyId, reason || null);
      await onRefresh();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cancelar o pedido.');
    } finally {
      setIsCancelling(false);
      setConfirmOpen(false);
    }
  };

  const handleRemove = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await db.orders.remove(order.id, companyId);
      await onRefresh();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover do histórico.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
              #{order.code || order.id.substring(0, 8).toUpperCase()}
            </p>
            <h3 className="text-xl font-black uppercase tracking-tight">
              {order.clients?.name || 'Cliente Avulso'}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {formatDate(order.created_at)} • Pagamento: <span className="font-black">{paymentLabel}</span> • Status:{' '}
              <span className={`font-black ${isCancelled ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                {order.status}
              </span>
            </p>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* ✅ PERFEITO: Totais claros (original / devolvido / atual) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total original</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(originalTotal)}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Devolvido</p>
              <p className={`text-lg font-black ${refundedTotal > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                {formatCurrency(refundedTotal)}
              </p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Registros: {orderReturns.length}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total atual</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(currentTotal)}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{items.length}</p>
            </div>
          </div>

          {/* ✅ selo de segurança */}
          {returnsLoading ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando devoluções...</p>
            </div>
          ) : refundedTotal > 0 ? (
            <div className="bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 mb-1">
                Venda parcialmente devolvida
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 font-bold">
                Este pedido tem devolução registrada — confira abaixo os itens afetados.
              </p>
            </div>
          ) : returnsError ? (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300 mb-1">
                Erro ao carregar devoluções
              </p>
              <p className="text-xs text-rose-700/80 dark:text-rose-200/80 font-bold">{returnsError}</p>
            </div>
          ) : null}

          {/* ✅ Itens (perfeito): mostra original / devolvido / atual por item */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens do pedido</p>
              <button
                onClick={fetchReturns}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                type="button"
                disabled={returnsLoading}
              >
                {returnsLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum item encontrado.</p>
              ) : (
                items.map((it: any, idx: number) => {
                  const key = String(it.id || '');
                  const ret = returnItemMap[key] || { qty: 0, amount: 0 };

                  const originalLine = safeNum(it.total_price);
                  const refundedLine = Math.max(0, Math.min(originalLine, safeNum(ret.amount)));
                  const currentLine = round2(Math.max(0, originalLine - refundedLine));

                  const originalQty = safeNum(it.quantity);
                  const refundedQty = Math.max(0, Math.min(originalQty, safeNum(ret.qty)));
                  const remainingQty = Math.max(0, originalQty - refundedQty);

                  return (
                    <div
                      key={it.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase truncate">{it.name || 'Item'}</p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {it.quantity}x • {formatCurrency(it.unit_price)}
                            {Number(it.discount || 0) > 0 ? (
                              <span className="ml-2 text-emerald-600 font-black">• Desc: {formatCurrency(it.discount)}</span>
                            ) : null}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atual</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(currentLine)}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Original</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">{formatCurrency(originalLine)}</p>
                        </div>

                        <div className={`p-3 rounded-xl border ${refundedLine > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Devolvido</p>
                          <p className={`text-xs font-black ${refundedLine > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                            {formatCurrency(refundedLine)}
                          </p>
                          {refundedQty > 0 && (
                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                              Qtd: <span className="font-black">{refundedQty}</span> • Restante: <span className="font-black">{remainingQty}</span>
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/30 dark:border-slate-800">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Líquido atual</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(currentLine)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ✅ Lista de devoluções (auditável) */}
          {!returnsLoading && orderReturns.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Devoluções registradas</p>
              <div className="space-y-2">
                {orderReturns.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(r.amount)}</p>
                      <p className="text-[10px] font-bold text-slate-500">{formatDate(r.created_at)}</p>
                    </div>
                    {r.reason ? (
                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                        Motivo: <span className="text-slate-700 dark:text-slate-200">{r.reason}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] font-bold text-slate-400 italic">Sem motivo</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isCancelled && (
            <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                Troca / Devolução
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-3">
                Cancelar a venda irá <span className="font-black">estornar o estoque automaticamente</span>.
              </p>

              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <Trash2 size={18} /> Cancelar / Devolver Total
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="bg-rose-50/70 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-1">
                Este pedido está CANCELLED.
              </p>
              {order.cancelled_reason && (
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mb-3">
                  Motivo: <span className="font-bold">{order.cancelled_reason}</span>
                </p>
              )}

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-950 active:scale-95 transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <Trash2 size={18} /> Remover do Histórico
              </button>

              <p className="mt-3 text-[10px] font-bold text-rose-700/70 dark:text-rose-300/70 uppercase tracking-widest">
                Ação irreversível
              </p>
            </div>
          )}
        </div>

        {/* confirmar cancelamento */}
        {confirmOpen && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-black uppercase tracking-tight">Confirmar cancelamento</h4>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Isso vai marcar a venda como <span className="font-black">CANCELLED</span> e devolver o estoque dos itens.
              </p>

              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                Motivo (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[90px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder="Ex: cliente desistiu / erro na cobrança / item indisponível..."
              />

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  type="button"
                  disabled={isCancelling}
                >
                  Voltar
                </button>

                <button
                  onClick={handleCancel}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  type="button"
                  disabled={isCancelling}
                >
                  {isCancelling ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  {isCancelling ? 'CANCELANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* confirmar delete */}
        {deleteConfirmOpen && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-black uppercase tracking-tight">Remover do histórico</h4>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Isso vai apagar o pedido e seus itens do banco. <span className="font-black">Não dá para desfazer.</span>
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  type="button"
                  disabled={isDeleting}
                >
                  Voltar
                </button>

                <button
                  onClick={handleRemove}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-950 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  type="button"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  {isDeleting ? 'REMOVENDO...' : 'REMOVER'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;