import React, { useMemo, useEffect, useState } from 'react';
import {
  Package,
  MoreVertical,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Tag,
  Layers,
  Edit3,
  Save,
  PlusCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type ProductRow = any;

type CategoryRow = {
  id: string;
  company_id: string;
  name: string;
  created_at?: string;
};

type ToastState = { type: 'success' | 'error'; message: string } | null;

type MenuState =
  | null
  | {
      product: ProductRow;
      x: number;
      y: number;
      placement: 'bottom' | 'top';
    };

const MENU_WIDTH = 240;
const MENU_HEIGHT_EST = 190;

const BUCKET_PRODUCTS = 'product-images';

const normalizeCat = (s: any) => (s ?? '').toString().trim();
const safeLower = (v: any) => (v ?? '').toString().toLowerCase();

const Products: React.FC = () => {
  const { companyId } = useAuth();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const [globalError, setGlobalError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const [menu, setMenu] = useState<MenuState>(null);

  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<ProductRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2600);
  };

  const friendlyError = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('row-level security') || m.includes('rls') || m.includes('permission denied') || m.includes('insufficient privilege')) {
      return 'Sem permissão para concluir essa ação (RLS/permissão).';
    }
    if (m.includes('jwt') || m.includes('token') || m.includes('not authenticated') || m.includes('auth')) {
      return 'Sua sessão expirou. Faça login novamente.';
    }
    if (m.includes('duplicate key') || m.includes('already exists')) return 'Já existe um registro com esse identificador.';
    if (m.includes('violates foreign key') || m.includes('foreign key')) return 'Não dá para excluir: existe vínculo com vendas/pedidos.';
    if (m.includes('column') && m.includes('does not exist')) return 'Falta uma coluna no Supabase (ajuste a tabela e tente novamente).';
    if (m.includes('relation') && m.includes('does not exist')) return 'Falta criar a tabela no Supabase (product_categories).';
    return msg ? `Erro: ${msg}` : 'Ocorreu um erro. Tente novamente.';
  };

  const fetchCategories = async () => {
    if (!companyId) return;
    setCategoriesLoading(true);
    setGlobalError('');
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, company_id, name, created_at')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      setCategories((data || []) as CategoryRow[]);
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setGlobalError(msg);
      showToast('error', msg);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setGlobalError('');
      const data = await db.products.getAll(companyId);
      setProducts(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setGlobalError(friendlyError(err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [companyId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null);
        setIsCategoriesOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const filtered = useMemo(() => {
    const q = safeLower(searchTerm).trim();

    return products.filter((p) => {
      const matchSearch = !q || safeLower(p.name).includes(q) || safeLower(p.sku).includes(q);
      if (!matchSearch) return false;

      if (selectedCategory !== 'ALL') {
        const c = normalizeCat(p.category);
        if (c !== selectedCategory) return false;
      }

      return true;
    });
  }, [products, searchTerm, selectedCategory]);

  const openFloatingMenu = (e: React.MouseEvent, product: ProductRow) => {
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const preferX = rect.right - MENU_WIDTH;
    const x = Math.max(12, Math.min(preferX, window.innerWidth - MENU_WIDTH - 12));

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'bottom' | 'top' = spaceBelow > MENU_HEIGHT_EST ? 'bottom' : 'top';

    const y = placement === 'bottom' ? Math.min(rect.bottom + 8, window.innerHeight - 12) : Math.max(12, rect.top - 8);

    setMenu({ product, x, y, placement });
  };

  const onActionEdit = (p: ProductRow) => {
    setEditingProduct(p);
    setIsModalOpen(true);
    setMenu(null);
  };

  const onActionDelete = (p: ProductRow) => {
    setMenu(null);
    setConfirmDeleteProduct(p);
  };

  const runDeleteProduct = async (id: string) => {
    if (!companyId) throw new Error('Company não definida.');
    setGlobalError('');

    let q = supabase.from('products').delete().eq('id', id);
    q = q.eq('company_id', companyId);

    const { error } = await q;
    if (error) throw new Error(error.message || error.details || 'Falha ao excluir produto.');
  };

  const confirmDelete = async () => {
    if (!confirmDeleteProduct) return;
    setIsDeleting(true);
    setGlobalError('');
    try {
      await runDeleteProduct(confirmDeleteProduct.id);
      showToast('success', 'Produto excluído com sucesso.');
      setConfirmDeleteProduct(null);
      await fetchProducts();
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setGlobalError(msg);
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[99999]">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Modal Gerenciar Categorias */}
      {isCategoriesOpen && companyId && (
        <CategoriesModal
          companyId={companyId}
          categories={categories}
          loading={categoriesLoading}
          onClose={() => setIsCategoriesOpen(false)}
          onRefresh={async () => {
            await fetchCategories();
            await fetchProducts(); // ✅ para refletir rename nos cards imediatamente
          }}
          onToast={showToast}
          friendlyError={friendlyError}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Produtos & Catálogo</h2>
          <p className="text-slate-500 italic text-sm">Gestão profissional de estoque e catálogo Nexero.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoriesOpen(true)}
            className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
            type="button"
          >
            <Layers size={18} />
            Categorias
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-600 text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
            type="button"
          >
            <Plus size={20} strokeWidth={3} />
            Novo Produto
          </button>
        </div>
      </div>

      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
          <AlertCircle size={16} /> {globalError}
        </div>
      )}

      {/* Categories Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-brand-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} itens</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
            >
              Todas
            </button>

            {categoryNames.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  selectedCategory === c
                    ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative group max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filtrar por nome ou SKU..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all text-sm font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-50 h-64 rounded-2xl animate-pulse border border-slate-100 dark:bg-slate-800 dark:border-slate-700" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="inline-block text-slate-200 dark:text-slate-800 mb-4" size={56} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((product) => {
                const recPct = Number(product?.recommended_discount_pct || 0) || 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-600/30 transition-all group dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="relative h-48 bg-slate-50 dark:bg-slate-800">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                          <Package size={48} />
                        </div>
                      )}

                      {Number(product.stock || 0) <= 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center dark:bg-slate-900/60">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-600/20">Sem Estoque</span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => openFloatingMenu(e, product)}
                          className="p-2 bg-white/80 backdrop-blur border border-slate-200 shadow-sm rounded-lg text-slate-500 hover:bg-brand-600 hover:text-white dark:bg-slate-900/80 dark:border-slate-700 transition-all"
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">
                        {product.category || 'Sem Categoria'}
                      </p>

                      {/* ✅ mini badge do desconto recomendado */}
                      {recPct > 0 && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest dark:text-emerald-400">
                            Desc. rec: {recPct}%
                          </span>
                        </div>
                      )}

                      <h4 className="font-bold text-slate-900 mb-1 line-clamp-1 dark:text-white">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 mb-4 uppercase font-mono">SKU: {product.sku || 'N/A'}</p>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Preço Venda</p>
                          <p className="text-lg font-black text-brand-600 tracking-tighter">{formatCurrency(product.price)}</p>
                        </div>
                        <div className={`text-right ${Number(product.stock || 0) < Number(product.min_stock || 0) ? 'text-rose-500' : 'text-slate-400'}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest">Estoque</p>
                          <p className="text-sm font-black">{product.stock} un</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* menu flutuante */}
      {menu && (
        <div className="fixed inset-0 z-[99990]" onClick={() => setMenu(null)}>
          <div
            className="fixed"
            style={{
              left: menu.x,
              top: menu.placement === 'bottom' ? menu.y : undefined,
              bottom: menu.placement === 'top' ? window.innerHeight - menu.y : undefined,
              width: MENU_WIDTH
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{menu.product.name}</p>
              </div>

              <div className="p-2">
                <MenuItem icon={<Pencil size={16} />} label="Editar" onClick={() => onActionEdit(menu.product)} />
                <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
                <MenuItemDanger icon={<Trash2 size={16} />} label="Excluir (permanente)" onClick={() => onActionDelete(menu.product)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* confirmar delete */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setConfirmDeleteProduct(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Ação perigosa</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Excluir produto</h3>
              </div>
              <button onClick={() => !isDeleting && setConfirmDeleteProduct(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" type="button">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Você tem certeza que quer excluir <span className="font-black">{confirmDeleteProduct.name}</span>?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Essa ação é <b>permanente</b>.
              </p>
            </div>

            <div className="p-5 border-t dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <button
                onClick={() => setConfirmDeleteProduct(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white disabled:opacity-60"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-[1.3] py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
                type="button"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Produto */}
      {isModalOpen && companyId && (
        <ProductModal
          companyId={companyId}
          product={editingProduct}
          categoryNames={categoryNames}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onRefresh={async () => {
            await fetchProducts();
            await fetchCategories();
          }}
          onToast={showToast}
          friendlyError={friendlyError}
        />
      )}
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-brand-600 hover:text-white flex items-center gap-2 transition-all dark:text-slate-400"
    type="button"
  >
    <span className="opacity-70">{icon}</span>
    <span className="flex-1 text-left uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);

const MenuItemDanger: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-3 py-2 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-600 hover:text-white flex items-center gap-2 transition-all"
    type="button"
  >
    <span>{icon}</span>
    <span className="flex-1 text-left uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);

const CategoriesModal: React.FC<{
  companyId: string;
  categories: CategoryRow[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
  onToast: (type: 'success' | 'error', message: string) => void;
  friendlyError: (msg: string) => string;
}> = ({ companyId, categories, loading, onClose, onRefresh, onToast, friendlyError }) => {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingOldName, setEditingOldName] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<CategoryRow | null>(null);

  const createCategory = async () => {
    const name = normalizeCat(newName);
    if (!name) return;

    setBusy(true);
    try {
      const { error } = await supabase.from('product_categories').insert({ company_id: companyId, name });
      if (error) throw new Error(error.message);
      setNewName('');
      onToast('success', 'Categoria criada.');
      await onRefresh();
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      onToast('error', msg);
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async () => {
    if (!editingId) return;
    const nextName = normalizeCat(editingName);
    const oldName = normalizeCat(editingOldName);

    if (!nextName) return;

    setBusy(true);
    try {
      const { error } = await supabase.from('product_categories').update({ name: nextName }).eq('id', editingId).eq('company_id', companyId);
      if (error) throw new Error(error.message);

      if (oldName && oldName !== nextName) {
        const { error: prodErr } = await supabase
          .from('products')
          .update({ category: nextName })
          .eq('company_id', companyId)
          .eq('category', oldName);

        if (prodErr) throw new Error(prodErr.message);
      }

      setEditingId(null);
      setEditingName('');
      setEditingOldName('');
      onToast('success', 'Categoria renomeada (produtos atualizados).');
      await onRefresh();
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      onToast('error', msg);
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('product_categories').delete().eq('id', confirmDelete.id).eq('company_id', companyId);
      if (error) throw new Error(error.message);
      onToast('success', 'Categoria excluída.');
      setConfirmDelete(null);
      await onRefresh();
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      onToast('error', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Categorias</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Gerenciar categorias</h3>
          </div>
          <button onClick={() => !busy && onClose()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 text-sm font-bold text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              placeholder="Nova categoria (ex: Lubrificantes)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={busy}
            />
            <button
              onClick={createCategory}
              disabled={busy || !normalizeCat(newName)}
              className="px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 transition-all"
              type="button"
            >
              <PlusCircle size={16} />
              Criar
            </button>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/20">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista</p>
              <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{categories.length}</p>
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-5 text-center">
                  <Loader2 className="animate-spin inline-block text-brand-600 mb-2" size={22} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-6 text-center">
                  <Tag className="inline-block text-slate-200 dark:text-slate-800 mb-3" size={40} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma categoria criada</p>
                </div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    {editingId === c.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={busy}
                        />
                        <button
                          onClick={saveRename}
                          disabled={busy || !normalizeCat(editingName)}
                          className="px-3 py-2 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                          type="button"
                        >
                          <Save size={16} />
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            if (busy) return;
                            setEditingId(null);
                            setEditingName('');
                            setEditingOldName('');
                          }}
                          className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{c.name}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingName(c.name);
                              setEditingOldName(c.name);
                            }}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-brand-600 dark:hover:bg-slate-800 transition-all"
                            type="button"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(c)}
                            className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-all"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {confirmDelete && (
          <div className="p-5 border-t border-slate-100 bg-rose-50 dark:border-slate-800 dark:bg-rose-500/5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Excluir categoria <span className="font-black text-slate-900 dark:text-white">{confirmDelete.name}</span>?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-50"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  onClick={doDelete}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20"
                  type="button"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 italic">
              Observação: os produtos que já têm essa categoria continuarão com o texto salvo no produto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductModal: React.FC<{
  companyId: string;
  product: ProductRow | null;
  categoryNames: string[];
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
  onToast: (type: 'success' | 'error', message: string) => void;
  friendlyError: (msg: string) => string;
}> = ({ companyId, product, categoryNames, onClose, onRefresh, onToast, friendlyError }) => {
  const editing = !!product?.id;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price?.toString?.() ?? '',
    stock: product?.stock?.toString?.() ?? '',
    min_stock: product?.min_stock?.toString?.() ?? '5',
    category: normalizeCat(product?.category || ''),
    image_url: product?.image_url || '',
    // ✅ NOVO
    recommended_discount_pct: (product?.recommended_discount_pct ?? 0)?.toString?.() ?? '0'
  });

  useEffect(() => {
    setError('');
    setImageFile(null);
    setImagePreview(product?.image_url || '');
    setCreatingCategory(false);
    setNewCategoryName('');
    setFormData({
      name: product?.name || '',
      sku: product?.sku || '',
      price: product?.price?.toString?.() ?? '',
      stock: product?.stock?.toString?.() ?? '',
      min_stock: product?.min_stock?.toString?.() ?? '5',
      category: normalizeCat(product?.category || ''),
      image_url: product?.image_url || '',
      recommended_discount_pct: (product?.recommended_discount_pct ?? 0)?.toString?.() ?? '0'
    });
  }, [product]);

  const pickFile = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreview(formData.image_url || '');
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const random =
      (typeof crypto !== 'undefined' && (crypto as any).randomUUID && (crypto as any).randomUUID()) ||
      `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${companyId}/${random}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET_PRODUCTS).upload(path, imageFile, {
      cacheControl: '3600',
      upsert: true
    });

    if (upErr) throw new Error(upErr.message || 'Falha ao enviar imagem.');

    const { data } = supabase.storage.from(BUCKET_PRODUCTS).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const createCategoryInline = async () => {
    const name = normalizeCat(newCategoryName);
    if (!name) return;

    setIsSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('product_categories').insert({ company_id: companyId, name });
      if (error) throw new Error(error.message);
      setFormData((p) => ({ ...p, category: name }));
      setCreatingCategory(false);
      setNewCategoryName('');
      onToast('success', 'Categoria criada e selecionada.');
      await onRefresh();
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setError(msg);
      onToast('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Nome, preço e estoque inicial são obrigatórios.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const uploadedUrl = await uploadImageIfNeeded();

      const rawPct = parseFloat((formData.recommended_discount_pct || '').toString().replace(',', '.'));
      const pctSafe = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;

      const payload = {
        name: formData.name,
        sku: (formData.sku || '').toUpperCase(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock || '0'),
        category: normalizeCat(formData.category) || null,
        image_url: (uploadedUrl || formData.image_url || '').trim() || null,
        // ✅ NOVO
        recommended_discount_pct: pctSafe
      };

      if (editing && product?.id) {
        let q = supabase.from('products').update(payload).eq('id', product.id).eq('company_id', companyId);
        const { error: upErr } = await q;
        if (upErr) throw new Error(upErr.message);
        onToast('success', 'Produto atualizado.');
      } else {
        await db.products.create(payload as any, companyId);
        onToast('success', 'Produto cadastrado.');
      }

      await onRefresh();
      onClose();
    } catch (err: any) {
      const msg = friendlyError(err?.message || '');
      setError(msg);
      onToast('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !isSaving && onClose()} />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Package size={24} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase dark:text-white">{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
              <p className="text-xs text-slate-500 font-medium italic">{editing ? 'Atualize dados, foto e categoria.' : 'Disponível imediatamente para venda no PDV.'}</p>
            </div>
          </div>
          <button onClick={() => !isSaving && onClose()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Foto */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto do Produto</label>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                <div className="h-44 bg-white flex items-center justify-center dark:bg-slate-900">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-slate-200 dark:text-slate-700 flex flex-col items-center gap-2">
                      <ImageIcon size={40} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sem imagem</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <input type="file" accept="image/*" onChange={(e) => pickFile(e.target.files?.[0] || null)} className="text-xs text-slate-400" disabled={isSaving} />

                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Ou cole uma URL da imagem (opcional)"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all placeholder:text-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        if (!imageFile) setImagePreview(e.target.value);
                      }}
                      disabled={isSaving}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic">Preferência: enviar arquivo (Storage). URL fica como alternativa.</p>
                </div>
              </div>
            </div>

            {/* Dados */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Código</label>
                  <input
                    type="text"
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all uppercase font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* Categoria: select + criar nova */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Tag size={14} className="text-brand-600" /> Categoria
                  </label>

                  <select
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all appearance-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={isSaving || creatingCategory}
                  >
                    <option value="" className="bg-white dark:bg-slate-900">Sem categoria</option>
                    {categoryNames.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>

                  {!creatingCategory ? (
                    <button
                      onClick={() => setCreatingCategory(true)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-brand-600 text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all flex items-center justify-center gap-2 dark:bg-slate-800 dark:border-slate-700"
                      type="button"
                      disabled={isSaving}
                    >
                      <PlusCircle size={16} />
                      Criar nova categoria
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder="Nome da nova categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        disabled={isSaving}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={createCategoryInline}
                          className="flex-1 px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                          type="button"
                          disabled={isSaving || !normalizeCat(newCategoryName)}
                        >
                          <CheckCircle2 size={16} />
                          Criar e selecionar
                        </button>
                        <button
                          onClick={() => {
                            if (isSaving) return;
                            setCreatingCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors dark:bg-slate-800 dark:border-slate-700"
                          type="button"
                          disabled={isSaving}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-brand-400"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* ✅ NOVO: desconto recomendado */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Desconto recomendado (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400"
                    value={formData.recommended_discount_pct}
                    onChange={(e) => setFormData({ ...formData, recommended_discount_pct: e.target.value })}
                    disabled={isSaving}
                    placeholder="Ex: 5"
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    Esse % aparece sugerido na hora da venda.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque</label>
                  <input
                    type="number"
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mínimo de Segurança</label>
                  <input
                    type="number"
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={() => !isSaving && onClose()}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
            disabled={isSaving}
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 w-2/3 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50"
            type="button"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : editing ? <Pencil size={16} /> : <CheckCircle2 size={16} />}
            {isSaving ? 'SALVANDO...' : editing ? 'Salvar alterações' : 'Confirmar Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;