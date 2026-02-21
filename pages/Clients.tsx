import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  UserRound,
  Mail,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  ShieldOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  ReceiptText,
  Eye,
  ArrowUpDown,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { formatCurrency, fetchCnpjData, isValidCpf } from '../utils/helpers';
import { Client as ClientType } from '../types';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type ClientRow = any;
type ToastState = { type: 'success' | 'error'; message: string } | null;

type MenuState =
  | null
  | {
      client: ClientRow;
      x: number;
      y: number;
      placement: 'bottom' | 'top';
    };

type SortMode = 'NAME_ASC' | 'NAME_DESC' | 'CREDIT_DESC' | 'CREDIT_ASC';

type Filters = {
  statuses: Set<string>; // ACTIVE, BLOCKED, ARCHIVED
  types: Set<string>; // PJ, PF
  categories: Set<string>; // VIP, ATACADO, VAREJO (ou outras)
  sort: SortMode;
};

const MENU_WIDTH = 260;
const MENU_HEIGHT_EST = 260;

const CATEGORY_OPTIONS = [
  { value: 'VIP', label: 'VIP' },
  { value: 'ATACADO', label: 'Atacado' },
  { value: 'VAREJO', label: 'Varejo' }
] as const;

const defaultFilters = (): Filters => ({
  statuses: new Set<string>(),
  types: new Set<string>(),
  categories: new Set<string>(),
  sort: 'NAME_ASC'
});

const Clients: React.FC = () => {
  const { companyId } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [detailsClient, setDetailsClient] = useState<ClientRow | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<ToastState>(null);
  const [globalError, setGlobalError] = useState<string>('');

  const [menu, setMenu] = useState<MenuState>(null);

  const [confirmDeleteClient, setConfirmDeleteClient] = useState<ClientRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ filtros avançados (FUNCIONA)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters());

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2600);
  };

  const friendlyError = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('row-level security') || m.includes('rls')) return 'Sem permissão para concluir essa ação (RLS).';
    if (m.includes('duplicate key') || m.includes('already exists')) return 'Já existe um registro com esse identificador.';
    if (m.includes('violates foreign key') || m.includes('foreign key')) return 'Não dá para excluir: existe vínculo com pedidos/vendas.';
    if (m.includes('column') && m.includes('does not exist')) return 'Falta uma coluna no Supabase (ajuste a tabela e tente novamente).';
    return 'Ocorreu um erro. Tente novamente.';
  };

  const fetchClients = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.clients.getAll(companyId);
      setClients(data as any[]);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setGlobalError(friendlyError(err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [companyId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null);
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const safeLower = (v: any) => (v ?? '').toString().toLowerCase();
  const safeUpper = (v: any) => (v ?? '').toString().toUpperCase();

  const getClientStatus = (c: ClientRow): string => (c.status || 'ACTIVE').toString().toUpperCase();
  const getClientType = (c: ClientRow): string => (c.type || '').toString().toUpperCase(); // PJ/PF
  const getClientCredit = (c: ClientRow): number => Number(c.credit_limit || 0);

  // 🔎 Categoria: tenta achar em campos comuns sem quebrar nada.
  // Se o seu campo for um nome específico, me diga e eu deixo direto nele.
  const getClientCategory = (c: ClientRow): string => {
    const raw =
      c.category ??
      c.category_name ??
      c.segment ??
      c.customer_category ??
      c.client_category ??
      c.tag ??
      c.tags ??
      '';
    // se vier array, junta
    if (Array.isArray(raw)) return safeUpper(raw.join(' ')).trim();
    return safeUpper(raw).trim();
  };

  // ✅ Search + Filtro + Ordenação (FUNCIONA)
  const filtered = useMemo(() => {
    const q = safeLower(searchTerm).trim();

    const statusFilterActive = filters.statuses.size > 0;
    const typeFilterActive = filters.types.size > 0;
    const categoryFilterActive = filters.categories.size > 0;

    let list = clients.filter((c) => {
      const matchSearch =
        !q ||
        safeLower(c.name).includes(q) ||
        safeLower(c.cnpj_cpf).includes(q) ||
        safeLower(c.email).includes(q) ||
        safeLower(c.phone).includes(q);

      if (!matchSearch) return false;

      if (statusFilterActive) {
        const st = getClientStatus(c);
        if (!filters.statuses.has(st)) return false;
      }

      if (typeFilterActive) {
        const tp = getClientType(c);
        if (!filters.types.has(tp)) return false;
      }

      if (categoryFilterActive) {
        const cat = getClientCategory(c);
        // regra: se o campo vier vazio, não passa quando houver filtro ativo
        if (!cat) return false;

        // tenta match simples por conter (bom pra casos tipo "VIP;VAREJO")
        const hasAny = Array.from(filters.categories).some((wanted) => cat.includes(wanted));
        if (!hasAny) return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      const na = (a.name || '').toString().toLowerCase();
      const nb = (b.name || '').toString().toLowerCase();

      switch (filters.sort) {
        case 'NAME_ASC':
          return na.localeCompare(nb);
        case 'NAME_DESC':
          return nb.localeCompare(na);
        case 'CREDIT_DESC':
          return getClientCredit(b) - getClientCredit(a);
        case 'CREDIT_ASC':
          return getClientCredit(a) - getClientCredit(b);
        default:
          return na.localeCompare(nb);
      }
    });

    return list;
  }, [clients, searchTerm, filters]);

  const filtersCount = useMemo(() => {
    let count = 0;
    if (filters.statuses.size > 0) count++;
    if (filters.types.size > 0) count++;
    if (filters.categories.size > 0) count++;
    if (filters.sort !== 'NAME_ASC') count++;
    return count;
  }, [filters]);

  const runUpdateClient = async (id: string, patch: Record<string, any>) => {
    setGlobalError('');
    const { error } = await supabase.from('clients').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchClients();
  };

  const runDeleteClient = async (id: string) => {
    setGlobalError('');
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchClients();
  };

  const onActionView = (c: ClientRow) => {
    setDetailsClient(c);
    setMenu(null);
  };

  const onActionEdit = (c: ClientRow) => {
    setEditingClient(c);
    setIsModalOpen(true);
    setMenu(null);
  };

  const onActionNewOrder = (c: ClientRow) => {
    showToast('error', 'Em breve: abrir novo pedido já com cliente selecionado.');
    setMenu(null);
  };

  const onActionBlockToggle = async (c: ClientRow) => {
    try {
      const status = getClientStatus(c);
      if (status === 'BLOCKED') {
        await runUpdateClient(c.id, { status: 'ACTIVE', blocked_reason: null });
        showToast('success', 'Cliente desbloqueado.');
      } else {
        const reason = prompt('Motivo do bloqueio (opcional):', '') || null;
        await runUpdateClient(c.id, { status: 'BLOCKED', blocked_reason: reason });
        showToast('success', 'Cliente bloqueado.');
      }
      setMenu(null);
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setGlobalError(msg);
      showToast('error', msg);
    }
  };

  const onActionArchiveToggle = async (c: ClientRow) => {
    try {
      const status = getClientStatus(c);
      if (status === 'ARCHIVED') {
        await runUpdateClient(c.id, { status: 'ACTIVE' });
        showToast('success', 'Cliente reativado.');
      } else {
        await runUpdateClient(c.id, { status: 'ARCHIVED' });
        showToast('success', 'Cliente arquivado.');
      }
      setMenu(null);
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setGlobalError(msg);
      showToast('error', msg);
    }
  };

  const onActionDelete = (c: ClientRow) => {
    setMenu(null);
    setConfirmDeleteClient(c);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteClient) return;
    setIsDeleting(true);
    setGlobalError('');
    try {
      await runDeleteClient(confirmDeleteClient.id);
      showToast('success', 'Cliente excluído com sucesso.');
      setConfirmDeleteClient(null);
    } catch (e: any) {
      const msg = friendlyError(e?.message || '');
      setGlobalError(msg);
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const openFloatingMenu = (e: React.MouseEvent, client: ClientRow) => {
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const preferX = rect.right - MENU_WIDTH;
    const x = Math.max(12, Math.min(preferX, window.innerWidth - MENU_WIDTH - 12));

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'bottom' | 'top' = spaceBelow > MENU_HEIGHT_EST ? 'bottom' : 'top';

    const y =
      placement === 'bottom'
        ? Math.min(rect.bottom + 8, window.innerHeight - 12)
        : Math.max(12, rect.top - 8);

    setMenu({ client, x, y, placement });
  };

  const StatusPill = ({ c }: { c: ClientRow }) => {
    const s = getClientStatus(c);
    if (s === 'BLOCKED') {
      return <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-500/10">BLOQUEADO</span>;
    }
    if (s === 'ARCHIVED') {
      return <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800">ARQUIVADO</span>;
    }
    return <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10">ATIVO</span>;
  };

  const Avatar = ({ name, type }: { name: string; type?: string }) => {
    const letter = (name || '?').charAt(0).toUpperCase();
    const isPJ = (type || '').toUpperCase() === 'PJ';
    return (
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border shadow-sm ${
          isPJ
            ? 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-200 dark:border-brand-500/20'
            : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20'
        }`}
      >
        {letter}
      </div>
    );
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

      {/* Drawer filtros */}
      {isFilterOpen && (
        <FilterDrawer
          value={filters}
          activeCount={filtersCount}
          onClose={() => setIsFilterOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setIsFilterOpen(false);
          }}
          onClear={() => setFilters(defaultFilters())}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Gestão de Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400">Sua base de dados comercial centralizada.</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="bg-brand-600 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
          <AlertCircle size={16} /> {globalError}
        </div>
      )}

      {/* Search + filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Nome, CPF/CNPJ ou e-mail..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm font-semibold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filtros Avançados
            {filtersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200 text-[10px] font-black">
                {filtersCount}
              </span>
            )}
          </button>
        </div>

        {/* Cards */}
        <div className="p-4">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin inline-block text-brand-600 mb-2" size={32} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando clientes...</p>
            </div>
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <UserRound className="inline-block text-slate-200 mb-4" size={48} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((client) => (
                    <div key={client.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.6rem] shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                      <div className="p-5 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-800/30 dark:to-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <Avatar name={client.name} type={client.type} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{client.name}</p>
                                <StatusPill c={client} />
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">{client.cnpj_cpf || 'Sem documento'}</p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => openFloatingMenu(e, client)}
                            className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <Mail size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{client.email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{client.phone || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{client.address || 'Endereço não cadastrado'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédito</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(client.credit_limit || 0)}</p>
                        </div>

                        <button
                          onClick={() => onActionView(client)}
                          className="px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{menu.client.name}</p>
              </div>

              <div className="p-2">
                <MenuItem icon={<Eye size={16} />} label="Ver detalhes" onClick={() => onActionView(menu.client)} />
                <MenuItem icon={<Pencil size={16} />} label="Editar" onClick={() => onActionEdit(menu.client)} />
                <MenuItem icon={<ReceiptText size={16} />} label="Novo pedido" onClick={() => onActionNewOrder(menu.client)} />

                <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

                <MenuItem
                  icon={getClientStatus(menu.client) === 'BLOCKED' ? <ShieldOff size={16} /> : <Shield size={16} />}
                  label={getClientStatus(menu.client) === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                  onClick={() => onActionBlockToggle(menu.client)}
                />
                <MenuItem
                  icon={getClientStatus(menu.client) === 'ARCHIVED' ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                  label={getClientStatus(menu.client) === 'ARCHIVED' ? 'Reativar' : 'Arquivar'}
                  onClick={() => onActionArchiveToggle(menu.client)}
                />

                <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

                <MenuItemDanger icon={<Trash2 size={16} />} label="Excluir (permanente)" onClick={() => onActionDelete(menu.client)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* confirmar delete */}
      {confirmDeleteClient && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setConfirmDeleteClient(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Ação perigosa</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Excluir cliente</h3>
              </div>
              <button onClick={() => !isDeleting && setConfirmDeleteClient(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Você tem certeza que quer excluir <span className="font-black">{confirmDeleteClient.name}</span>?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recomendado: use <b>Arquivar</b> em vez de excluir, para manter histórico.
              </p>
            </div>

            <div className="p-5 border-t dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <button onClick={() => setConfirmDeleteClient(null)} disabled={isDeleting} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-[1.3] py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais existentes */}
      {isModalOpen && companyId && (
        <ClientModal
          companyId={companyId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          onRefresh={fetchClients}
          editingClient={editingClient}
        />
      )}

      {detailsClient && (
        <ClientDetailsDrawer
          client={detailsClient}
          onClose={() => setDetailsClient(null)}
          onEdit={() => {
            setEditingClient(detailsClient);
            setDetailsClient(null);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
    <span className="text-slate-500">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
  </button>
);

const MenuItemDanger: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full px-3 py-2 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2">
    <span className="text-rose-500">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
  </button>
);

const PillToggle: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
      active
        ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/20'
        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
    }`}
    type="button"
  >
    {active && <Check size={14} />}
    {label}
  </button>
);

const FilterDrawer: React.FC<{
  value: Filters;
  activeCount: number;
  onClose: () => void;
  onApply: (v: Filters) => void;
  onClear: () => void;
}> = ({ value, activeCount, onClose, onApply, onClear }) => {
  const [draft, setDraft] = useState<Filters>(() => ({
    statuses: new Set(value.statuses),
    types: new Set(value.types),
    categories: new Set(value.categories),
    sort: value.sort
  }));

  const toggleSet = (setKey: 'statuses' | 'types' | 'categories', item: string) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        statuses: new Set(prev.statuses),
        types: new Set(prev.types),
        categories: new Set(prev.categories)
      };
      const s = next[setKey];
      if (s.has(item)) s.delete(item);
      else s.add(item);
      return next;
    });
  };

  const isActive = (setKey: 'statuses' | 'types' | 'categories', item: string) => draft[setKey].has(item);

  const sortLabel = (s: SortMode) => {
    switch (s) {
      case 'NAME_ASC':
        return 'Nome (A–Z)';
      case 'NAME_DESC':
        return 'Nome (Z–A)';
      case 'CREDIT_DESC':
        return 'Crédito (Maior)';
      case 'CREDIT_ASC':
        return 'Crédito (Menor)';
      default:
        return 'Nome (A–Z)';
    }
  };

  const title = activeCount > 0 ? `Filtros avançados (${activeCount})` : 'Filtros avançados';

  return (
    <div className="fixed inset-0 z-[99997]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Filtros</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Dica: se você não selecionar nada em um grupo, ele não filtra esse campo.
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              <PillToggle active={isActive('statuses', 'ACTIVE')} label="Ativo" onClick={() => toggleSet('statuses', 'ACTIVE')} />
              <PillToggle active={isActive('statuses', 'BLOCKED')} label="Bloqueado" onClick={() => toggleSet('statuses', 'BLOCKED')} />
              <PillToggle active={isActive('statuses', 'ARCHIVED')} label="Arquivado" onClick={() => toggleSet('statuses', 'ARCHIVED')} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tipo</p>
            <div className="flex flex-wrap gap-2">
              <PillToggle active={isActive('types', 'PJ')} label="PJ" onClick={() => toggleSet('types', 'PJ')} />
              <PillToggle active={isActive('types', 'PF')} label="PF" onClick={() => toggleSet('types', 'PF')} />
            </div>
          </div>

          {/* ✅ NOVO: Categorias */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categorias</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => (
                <PillToggle key={c.value} active={isActive('categories', c.value)} label={c.label} onClick={() => toggleSet('categories', c.value)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ordenação</p>
            <div className="grid grid-cols-1 gap-2">
              {(['NAME_ASC', 'NAME_DESC', 'CREDIT_DESC', 'CREDIT_ASC'] as SortMode[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft((prev) => ({ ...prev, sort: s }))}
                  className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    draft.sort === s
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200 dark:border-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className={draft.sort === s ? 'text-brand-600' : 'text-slate-400'} />
                    <span className="text-sm font-black">{sortLabel(s)}</span>
                  </div>
                  {draft.sort === s && <CheckCircle2 size={18} className="text-brand-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ Rodapé sticky (sempre visível) */}
        <div className="sticky bottom-0 p-6 border-t dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30 backdrop-blur flex gap-3">
          <button
            onClick={() => {
              if (activeCount === 0) {
                onClose();
                return;
              }
              onClear();
              setDraft(defaultFilters());
            }}
            className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            type="button"
          >
            {activeCount === 0 ? 'Fechar' : 'Limpar'}
          </button>

          <button
            onClick={() =>
              onApply({
                statuses: new Set(draft.statuses),
                types: new Set(draft.types),
                categories: new Set(draft.categories),
                sort: draft.sort
              })
            }
            className="flex-[1.4] py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-600/20"
            type="button"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

// ==== seus modais (mantidos) ====
const ClientDetailsDrawer: React.FC<{ client: any; onClose: () => void; onEdit: () => void }> = ({ client, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{client.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Documento</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{client.cnpj_cpf || '-'}</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contato</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{client.email || '-'}</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{client.phone || '-'}</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{client.address || '-'}</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Crédito</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(client.credit_limit || 0)}</p>
          </div>

          {client.blocked_reason && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Motivo do bloqueio</p>
              <p className="font-bold text-rose-700 dark:text-rose-200">{client.blocked_reason}</p>
            </div>
          )}

          <button onClick={onEdit} className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all">
            Editar cliente
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientModal: React.FC<{ companyId: string; onClose: () => void; onRefresh: () => void; editingClient?: any | null }> = ({
  companyId,
  onClose,
  onRefresh,
  editingClient
}) => {
  const [docType, setDocType] = useState<'PF' | 'PJ'>(editingClient?.type === 'PF' ? 'PF' : 'PJ');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    cnpj_cpf: editingClient?.cnpj_cpf || '',
    email: editingClient?.email || '',
    phone: editingClient?.phone || '',
    address: editingClient?.address || '',
    credit_limit: (editingClient?.credit_limit ?? 0).toString()
  });

  useEffect(() => {
    if (editingClient) {
      setDocType(editingClient?.type === 'PF' ? 'PF' : 'PJ');
      setFormData({
        name: editingClient?.name || '',
        cnpj_cpf: editingClient?.cnpj_cpf || '',
        email: editingClient?.email || '',
        phone: editingClient?.phone || '',
        address: editingClient?.address || '',
        credit_limit: (editingClient?.credit_limit ?? 0).toString()
      });
    }
  }, [editingClient]);

  const handleLookup = async () => {
    if (docType !== 'PJ') return;
    const clean = formData.cnpj_cpf.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('CNPJ inválido.');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const data = await fetchCnpjData(clean);
      setFormData((prev) => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia,
        address: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : prev.address,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone
      }));
    } catch {
      setError('CNPJ não localizado.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nome é obrigatório.');
      return;
    }
    if (docType === 'PF' && formData.cnpj_cpf && !isValidCpf(formData.cnpj_cpf)) {
      setError('CPF inválido.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingClient?.id) {
        const { error: upErr } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            cnpj_cpf: formData.cnpj_cpf,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            type: docType,
            credit_limit: parseFloat(formData.credit_limit) || 0
          })
          .eq('id', editingClient.id);
        if (upErr) throw new Error(upErr.message);
      } else {
        await db.clients.create(
          {
            name: formData.name,
            cnpj_cpf: formData.cnpj_cpf,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            type: docType,
            credit_limit: parseFloat(formData.credit_limit) || 0
          } as Partial<ClientType>,
          companyId
        );
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha na conexão com o banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{editingClient ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-lg flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setDocType('PJ')}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                docType === 'PJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
              type="button"
            >
              Pessoa Jurídica
            </button>
            <button
              onClick={() => setDocType('PF')}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                docType === 'PF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
              type="button"
            >
              Pessoa Física
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {docType === 'PJ' ? 'Razão Social' : 'Nome Completo'}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{docType}</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                />
                {docType === 'PJ' && formData.cnpj_cpf.replace(/\D/g, '').length === 14 && (
                  <button
                    onClick={handleLookup}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-700"
                    type="button"
                  >
                    {isSearching ? '...' : 'BUSCAR'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Crédito</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest" type="button">
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 w-2/3 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
            type="button"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            {isSaving ? 'Processando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;