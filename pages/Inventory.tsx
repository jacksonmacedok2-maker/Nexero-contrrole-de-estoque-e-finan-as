import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Package,
  Loader2,
  X,
  CheckCircle2,
  History,
  FileText,
  Plus,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

type StockMode = 'IN' | 'OUT';

type InventoryMovement = {
  id: string;
  company_id: string;
  user_id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  prev_stock: number;
  new_stock: number;
  note: string | null;
  created_at: string;
};

type PurchaseItemDraft = {
  product_id: string;
  quantity: string;
  unit_cost: string;
};

const Inventory: React.FC = () => {
  const { companyId } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Movimentações
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Modal Entrada/Saída (manual)
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockMode, setStockMode] = useState<StockMode>('IN');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [qty, setQty] = useState<string>('1');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Entrada por Nota/Compra
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [purchaseBanner, setPurchaseBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [docType, setDocType] = useState<'NF' | 'PEDIDO' | 'COMPRA'>('NF');
  const [docNumber, setDocNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [issuedAt, setIssuedAt] = useState<string>(''); // yyyy-mm-dd
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemDraft[]>([
    { product_id: '', quantity: '1', unit_cost: '0' }
  ]);

  // ✅ Anexo da nota
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);

  const supabase = (db as any)?.supabase;

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, [products]);

  const movementsByProductId = useMemo(() => {
    const map = new Map<string, InventoryMovement>();
    for (const m of movements) {
      const key = String(m.product_id);
      if (!map.has(key)) map.set(key, m);
    }
    return map;
  }, [movements]);

  const fetchInventory = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.products.getAll(companyId);
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    if (!companyId) return;
    if (!supabase?.from) return;

    try {
      setMovementsLoading(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      setMovements((data || []) as InventoryMovement[]);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const totalValue = useMemo(
    () => products.reduce((acc, p) => acc + Number(p.price) * Number(p.stock), 0),
    [products]
  );
  const itemsBelowMin = useMemo(
    () => products.filter((p) => Number(p.stock) <= Number(p.min_stock)).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const openStockModal = (mode: StockMode) => {
    setBanner(null);
    setStockMode(mode);
    setStockModalOpen(true);

    const first = products?.[0];
    setSelectedProductId(first?.id ? String(first.id) : '');
    setQty('1');
    setNote('');
  };

  const closeStockModal = () => {
    if (saving) return;
    setStockModalOpen(false);
  };

  const openPurchaseModal = () => {
    setPurchaseBanner(null);
    setPurchaseOpen(true);

    setDocType('NF');
    setDocNumber('');
    setSupplierName('');
    setIssuedAt('');
    setPurchaseNotes('');
    setPurchaseFile(null);

    const first = products?.[0];
    setPurchaseItems([
      { product_id: first?.id ? String(first.id) : '', quantity: '1', unit_cost: '0' }
    ]);
  };

  const closePurchaseModal = () => {
    if (purchaseSaving) return;
    setPurchaseOpen(false);
  };

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatLastMove = (m?: InventoryMovement) => {
    if (!m) return '—';
    const sign = m.movement_type === 'IN' ? '+' : '-';
    return `${sign}${m.quantity} • ${formatDateTime(m.created_at)}`;
  };

  const applyStockChange = async () => {
    if (!companyId) return;

    const q = Number(qty);
    if (!selectedProductId) {
      setBanner({ type: 'error', message: 'Selecione um produto.' });
      return;
    }
    if (!Number.isFinite(q) || q <= 0) {
      setBanner({ type: 'error', message: 'Informe uma quantidade válida (maior que 0).' });
      return;
    }

    const product = products.find((p) => String(p.id) === String(selectedProductId));
    if (!product) {
      setBanner({ type: 'error', message: 'Produto não encontrado.' });
      return;
    }

    if (!supabase?.from || !supabase?.auth) {
      setBanner({
        type: 'error',
        message: 'Supabase client não encontrado em db.supabase.'
      });
      return;
    }

    const prevStock = Number(product.stock);
    if (stockMode === 'OUT' && prevStock < q) {
      setBanner({
        type: 'error',
        message: `Saída maior que o estoque atual. Estoque: ${product.stock} un.`
      });
      return;
    }

    const delta = stockMode === 'IN' ? q : -q;
    const newStock = prevStock + delta;

    try {
      setSaving(true);
      setBanner(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado.');

      const { error: updError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id)
        .eq('company_id', companyId);

      if (updError) throw updError;

      const { error: movError } = await supabase
        .from('inventory_movements')
        .insert({
          company_id: companyId,
          user_id: userId,
          product_id: product.id,
          movement_type: stockMode,
          quantity: q,
          prev_stock: prevStock,
          new_stock: newStock,
          note: (note || '').trim() ? (note || '').trim() : null
        });

      if (movError) console.error('Falha ao registrar movimentação (estoque já atualizado):', movError);

      await fetchInventory();
      await fetchMovements();

      setBanner({
        type: 'success',
        message:
          stockMode === 'IN'
            ? `Entrada registrada: +${q} un em "${product.name}".`
            : `Saída registrada: -${q} un de "${product.name}".`
      });

      setTimeout(() => setStockModalOpen(false), 650);
    } catch (err: any) {
      console.error('Erro ao aplicar movimentação de estoque:', err);
      setBanner({
        type: 'error',
        message: err?.message || 'Não foi possível atualizar o estoque.'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePurchaseItem = (idx: number, patch: Partial<PurchaseItemDraft>) => {
    setPurchaseItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addPurchaseItem = () => {
    const first = products?.[0];
    setPurchaseItems((prev) => [
      ...prev,
      { product_id: first?.id ? String(first.id) : '', quantity: '1', unit_cost: '0' }
    ]);
  };

  const removePurchaseItem = (idx: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce((acc, it) => {
      const q = Number(it.quantity);
      const c = Number(it.unit_cost);
      if (!Number.isFinite(q) || q <= 0) return acc;
      if (!Number.isFinite(c) || c < 0) return acc;
      return acc + q * c;
    }, 0);
  }, [purchaseItems]);

  const safeFileName = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);
  };

  const submitPurchaseReceipt = async () => {
    if (!companyId) return;

    if (!supabase?.rpc || !supabase?.auth || !supabase?.from) {
      setPurchaseBanner({ type: 'error', message: 'Supabase client não encontrado em db.supabase.' });
      return;
    }

    const normalizedItems = purchaseItems
      .map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_cost: Number(it.unit_cost)
      }))
      .filter((it) => it.product_id && Number.isFinite(it.quantity) && it.quantity > 0 && Number.isFinite(it.unit_cost) && it.unit_cost >= 0);

    if (normalizedItems.length === 0) {
      setPurchaseBanner({ type: 'error', message: 'Adicione ao menos 1 item válido (produto + quantidade + custo).' });
      return;
    }

    try {
      setPurchaseSaving(true);
      setPurchaseBanner(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado.');

      // 1) cria a Nota/Compra + dá entrada no estoque (RPC)
      const { data: receiptId, error } = await supabase.rpc('create_purchase_receipt_with_stock', {
        p_company_id: companyId,
        p_doc_type: docType,
        p_doc_number: docNumber || null,
        p_supplier_name: supplierName || null,
        p_issued_at: issuedAt ? issuedAt : null,
        p_received_at: null,
        p_notes: purchaseNotes || null,
        p_items: normalizedItems
      });

      if (error) throw error;

      // 2) se tiver arquivo, faz upload e grava os metadados na purchase_receipts
      if (purchaseFile) {
        const bucket = 'purchase-documents';
        const ts = Date.now();
        const path = `${companyId}/${String(receiptId)}/${ts}-${safeFileName(purchaseFile.name)}`;

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, purchaseFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: purchaseFile.type || undefined
          });

        if (upErr) {
          console.error('Upload falhou (nota já registrada):', upErr);
          setPurchaseBanner({
            type: 'success',
            message: 'Entrada registrada, mas o anexo falhou. Verifique as policies do bucket e tente anexar novamente.'
          });
        } else {
          const { error: updErr } = await supabase
            .from('purchase_receipts')
            .update({
              document_path: path,
              document_mime: purchaseFile.type || null,
              document_size: purchaseFile.size || null,
              extraction_status: 'PENDING',
              extraction_error: null
            })
            .eq('id', receiptId)
            .eq('company_id', companyId);

          if (updErr) {
            console.error('Falha ao salvar metadados do anexo (nota já registrada):', updErr);
            setPurchaseBanner({
              type: 'success',
              message: 'Entrada registrada, mas não consegui vincular o anexo na nota. Falta policy de UPDATE em purchase_receipts.'
            });
          }
        }
      }

      await fetchInventory();
      await fetchMovements();

      if (!purchaseFile) {
        setPurchaseBanner({ type: 'success', message: 'Entrada por Nota/Compra registrada com sucesso.' });
      }

      setTimeout(() => setPurchaseOpen(false), 900);
    } catch (err: any) {
      console.error('Erro ao registrar entrada por Nota/Compra:', err);
      setPurchaseBanner({
        type: 'error',
        message: err?.message || 'Não foi possível registrar a entrada por Nota/Compra.'
      });
    } finally {
      setPurchaseSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Controle de Estoque</h2>
          <p className="text-slate-500 dark:text-slate-400">Operação de estoque com auditoria de entradas e saídas.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openPurchaseModal}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            title="Entrada por Nota/Compra (lote)"
          >
            <FileText size={18} /> Entrada por Nota
          </button>

          <button
            onClick={() => openStockModal('IN')}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowUpRight size={18} /> Entrada
          </button>

          <button
            onClick={() => openStockModal('OUT')}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
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
                  <th className="px-6 py-4 text-center">Estoque</th>
                  <th className="px-6 py-4 text-center">Mínimo</th>
                  <th className="px-6 py-4 text-center">Dif.</th>
                  <th className="px-6 py-4 text-right">Valor em Estoque</th>
                  <th className="px-6 py-4 text-center">Última mov.</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredProducts.map((item) => {
                  const min = Number(item.min_stock || 0);
                  const stock = Number(item.stock || 0);
                  const diff = stock - min;
                  const rowValue = Number(item.price || 0) * stock;
                  const lastMove = movementsByProductId.get(String(item.id));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 uppercase">{item.sku || 'N/A'}</td>

                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">{stock} un</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-300">{min} un</td>

                      <td className="px-6 py-4 text-center">
                        {diff < 0 ? (
                          <span className="px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase border border-rose-100 dark:border-rose-500/20">
                            {diff} un
                          </span>
                        ) : diff === 0 ? (
                          <span className="px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase border border-amber-100 dark:border-amber-500/20">
                            {diff} un
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase border border-emerald-100 dark:border-emerald-500/20">
                            +{diff} un
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(rowValue)}</td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-slate-600 dark:text-slate-300">{formatLastMove(lastMove)}</span>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Histórico (últimas 20) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Últimas movimentações</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entradas e saídas registradas com data e hora.</p>
            </div>
          </div>

          <button
            onClick={fetchMovements}
            disabled={movementsLoading}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
          >
            {movementsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="p-5">
          {movementsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin inline-block text-indigo-600" size={28} />
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Carregando movimentações...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">Nenhuma movimentação registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 20).map((m) => {
                const p = productById.get(String(m.product_id));
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          m.movement_type === 'IN'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {m.movement_type === 'IN' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {p?.name || 'Produto'}{' '}
                          <span className="text-xs font-bold text-slate-400">{p?.sku ? `• ${p.sku}` : ''}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              m.movement_type === 'IN'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-500/20'
                            }`}
                          >
                            {m.movement_type === 'IN' ? 'Entrada' : 'Saída'}
                          </span>

                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">
                              {m.movement_type === 'IN' ? '+' : '-'}
                              {m.quantity}
                            </span>{' '}
                            un
                          </span>

                          <span className="text-xs text-slate-400">
                            {m.prev_stock} → <span className="font-semibold text-slate-600 dark:text-slate-200">{m.new_stock}</span> un
                          </span>

                          {m.note ? <span className="text-xs text-slate-500 dark:text-slate-400">• {m.note}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{formatDateTime(m.created_at)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Data/hora</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Entrada/Saída (manual) */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeStockModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      stockMode === 'IN'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {stockMode === 'IN' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {stockMode === 'IN' ? 'Registrar Entrada' : 'Registrar Saída'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajuste o estoque do produto selecionado.</p>
                  </div>
                </div>
                <button
                  onClick={closeStockModal}
                  disabled={saving}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
                  aria-label="Fechar"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {banner && (
                  <div
                    className={`rounded-xl border px-4 py-3 flex items-start gap-2 ${
                      banner.type === 'success'
                        ? 'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50/60 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {banner.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertTriangle size={18} className="mt-0.5" />}
                    <div className="text-sm font-medium">{banner.message}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Produto</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} — Estoque: {p.stock} un
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: 10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observação (opcional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: reposição / perda / ajuste"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={closeStockModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyStockChange}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-60 flex items-center gap-2 ${
                    stockMode === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {stockMode === 'IN' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrada por Nota/Compra */}
      {purchaseOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePurchaseModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Entrada por Nota/Compra</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lance itens em lote e anexe a nota (PDF/Imagem).</p>
                  </div>
                </div>
                <button
                  onClick={closePurchaseModal}
                  disabled={purchaseSaving}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
                  aria-label="Fechar"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
                {purchaseBanner && (
                  <div
                    className={`rounded-xl border px-4 py-3 flex items-start gap-2 ${
                      purchaseBanner.type === 'success'
                        ? 'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50/60 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {purchaseBanner.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertTriangle size={18} className="mt-0.5" />}
                    <div className="text-sm font-medium">{purchaseBanner.message}</div>
                  </div>
                )}

                {/* ✅ Anexo */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-slate-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Anexar Nota (PDF/Imagem)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Esse arquivo será salvo no Supabase Storage.</p>
                      </div>
                    </div>

                    <label className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                      Escolher arquivo
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setPurchaseFile(f);
                          // reset para permitir escolher o mesmo arquivo de novo
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {purchaseFile ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{purchaseFile.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(purchaseFile.size / 1024 / 1024).toFixed(2)} MB • {purchaseFile.type || 'arquivo'}
                        </p>
                      </div>
                      <button
                        onClick={() => setPurchaseFile(null)}
                        disabled={purchaseSaving}
                        className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-60"
                        title="Remover anexo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Nenhum arquivo selecionado.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="NF">NF</option>
                      <option value="PEDIDO">Pedido</option>
                      <option value="COMPRA">Compra</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Número</label>
                    <input
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: 12345"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fornecedor</label>
                    <input
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: Distribuidora X"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data de emissão (opcional)</label>
                    <input
                      type="date"
                      value={issuedAt}
                      onChange={(e) => setIssuedAt(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações</label>
                    <input
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotes(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: compra do mês / reposição"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Itens</p>
                    <button
                      onClick={addPurchaseItem}
                      disabled={purchaseSaving}
                      className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60 flex items-center gap-2"
                    >
                      <Plus size={14} /> Adicionar item
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {purchaseItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Produto</label>
                          <select
                            value={it.product_id}
                            onChange={(e) => updatePurchaseItem(idx, { product_id: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">Selecione...</option>
                            {products.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.name} {p.sku ? `• ${p.sku}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Qtd</label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={it.quantity}
                            onChange={(e) => updatePurchaseItem(idx, { quantity: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custo unit.</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={it.unit_cost}
                            onChange={(e) => updatePurchaseItem(idx, { unit_cost: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <button
                            onClick={() => removePurchaseItem(idx)}
                            disabled={purchaseSaving || purchaseItems.length <= 1}
                            className="h-10 w-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-60"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="md:col-span-12">
                          {(() => {
                            const p = productById.get(String(it.product_id));
                            const q = Number(it.quantity);
                            const c = Number(it.unit_cost);
                            if (!p || !Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) return null;
                            return (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Estoque atual: <span className="font-semibold">{Number(p.stock)}</span> un •
                                Após entrada: <span className="font-semibold">{Number(p.stock) + q}</span> un •
                                Subtotal: <span className="font-semibold">{formatCurrency(q * c)}</span>
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(purchaseTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={closePurchaseModal}
                  disabled={purchaseSaving}
                  className="px-4 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitPurchaseReceipt}
                  disabled={purchaseSaving}
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {purchaseSaving && <Loader2 className="animate-spin" size={16} />}
                  Confirmar Entrada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;