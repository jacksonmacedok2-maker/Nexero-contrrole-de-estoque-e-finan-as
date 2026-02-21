import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
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
  Eye
} from 'lucide-react';
import { formatCurrency, fetchCnpjData, isValidCpf } from '../utils/helpers';
import { Client as ClientType } from '../types';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type ClientRow = any;

const Clients: React.FC = () => {
  const { companyId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [detailsClient, setDetailsClient] = useState<ClientRow | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string>('');

  const fetchClients = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.clients.getAll(companyId);
      setClients(data as any[]);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setGlobalError(err?.message || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [companyId]);

  const safeLower = (v: any) => (v ?? '').toString().toLowerCase();

  const filtered = clients.filter((c) => {
    const q = safeLower(searchTerm).trim();
    if (!q) return true;
    return (
      safeLower(c.name).includes(q) ||
      safeLower(c.cnpj_cpf).includes(q) ||
      safeLower(c.email).includes(q) ||
      safeLower(c.phone).includes(q)
    );
  });

  const getClientStatus = (c: ClientRow): string => (c.status || 'ACTIVE').toString().toUpperCase();

  const runUpdateClient = async (id: string, patch: Record<string, any>) => {
    setGlobalError('');
    const { error } = await supabase.from('clients').update(patch).eq('id', id);
    if (error) {
      if ((error.message || '').toLowerCase().includes('column') && (error.message || '').toLowerCase().includes('does not exist')) {
        throw new Error('Falta coluna na tabela clients. Crie as colunas (ex: status e blocked_reason) no Supabase e tente de novo.');
      }
      throw new Error(error.message);
    }
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
    setOpenMenuForId(null);
  };

  const onActionEdit = (c: ClientRow) => {
    setEditingClient(c);
    setIsModalOpen(true);
    setOpenMenuForId(null);
  };

  const onActionNewOrder = (c: ClientRow) => {
    alert(`TODO: abrir "Novo Pedido" já selecionando o cliente: ${c.name}`);
    setOpenMenuForId(null);
  };

  const onActionBlockToggle = async (c: ClientRow) => {
    try {
      const status = getClientStatus(c);
      if (status === 'BLOCKED') {
        await runUpdateClient(c.id, { status: 'ACTIVE', blocked_reason: null });
      } else {
        const reason = prompt('Motivo do bloqueio (opcional):', '') || null;
        await runUpdateClient(c.id, { status: 'BLOCKED', blocked_reason: reason });
      }
      setOpenMenuForId(null);
    } catch (e: any) {
      setGlobalError(e?.message || 'Erro ao bloquear/desbloquear.');
    }
  };

  const onActionArchiveToggle = async (c: ClientRow) => {
    try {
      const status = getClientStatus(c);
      if (status === 'ARCHIVED') {
        await runUpdateClient(c.id, { status: 'ACTIVE' });
      } else {
        await runUpdateClient(c.id, { status: 'ARCHIVED' });
      }
      setOpenMenuForId(null);
    } catch (e: any) {
      setGlobalError(e?.message || 'Erro ao arquivar/reativar.');
    }
  };

  const onActionDelete = async (c: ClientRow) => {
    try {
      const ok = confirm(`Excluir PERMANENTEMENTE o cliente "${c.name}"?\n\nRecomendado: use "Arquivar" em vez de excluir, pra não perder histórico.`);
      if (!ok) return;
      await runDeleteClient(c.id);
      setOpenMenuForId(null);
    } catch (e: any) {
      setGlobalError(e?.message || 'Erro ao excluir cliente.');
    }
  };

  const StatusPill = ({ c }: { c: ClientRow }) => {
    const s = getClientStatus(c);
    if (s === 'BLOCKED') {
      return <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-500/10">BLOQUEADO</span>;
    }
    if (s === 'ARCHIVED') {
      return <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800">ARQUIVADO</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" onClick={() => setOpenMenuForId(null)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestão de Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400">Sua base de dados comercial centralizada.</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setEditingClient(null); setIsModalOpen(true); }}
          className="bg-brand-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-lg flex items-center gap-3 text-rose-600 text-xs font-bold">
          <AlertCircle size={16} /> {globalError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Nome, CPF/CNPJ ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filtros Avançados
          </button>
        </div>

        {/* ✅ AQUI ESTÁ A CORREÇÃO: overflow-y-visible */}
        <div className="overflow-x-auto overflow-y-visible">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin inline-block text-brand-600 mb-2" size={32} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando clientes...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b dark:border-slate-800">
                  <th className="px-6 py-4">Nome / Documento</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Endereço</th>
                  <th className="px-6 py-4 text-right">Crédito</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y dark:divide-slate-800">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${client.type === 'PJ' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'}`}>
                          {(client.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                            {client.name}
                            <StatusPill c={client} />
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">{client.cnpj_cpf || 'S/ Doc'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"><Mail size={12} /> {client.email || '-'}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"><Phone size={12} /> {client.phone || '-'}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 max-w-[220px] truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400" /> {client.address || 'Não cadastrado'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(client.credit_limit || 0)}</p>
                    </td>

                    <td className="px-6 py-4 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuForId(openMenuForId === client.id ? null : client.id);
                        }}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuForId === client.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-6 top-14 z-[9999] w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden text-left"
                        >
                          <button className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => onActionView(client)}>
                            <Eye size={16} /> Ver detalhes
                          </button>

                          <button className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => onActionEdit(client)}>
                            <Pencil size={16} /> Editar
                          </button>

                          <button className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => onActionNewOrder(client)}>
                            <ReceiptText size={16} /> Novo pedido
                          </button>

                          <div className="h-px bg-slate-100 dark:bg-slate-800" />

                          <button className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => onActionBlockToggle(client)}>
                            {getClientStatus(client) === 'BLOCKED' ? <ShieldOff size={16} /> : <Shield size={16} />}
                            {getClientStatus(client) === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                          </button>

                          <button className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => onActionArchiveToggle(client)}>
                            {getClientStatus(client) === 'ARCHIVED' ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                            {getClientStatus(client) === 'ARCHIVED' ? 'Reativar' : 'Arquivar'}
                          </button>

                          <div className="h-px bg-slate-100 dark:bg-slate-800" />

                          <button className="w-full px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2" onClick={() => onActionDelete(client)}>
                            <Trash2 size={16} /> Excluir (permanente)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && clients.length === 0 && (
            <div className="p-20 text-center">
              <UserRound className="inline-block text-slate-200 mb-4" size={48} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente na base</p>
            </div>
          )}
        </div>
      </div>

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

const ClientModal: React.FC<{ companyId: string; onClose: () => void; onRefresh: () => void; editingClient?: any | null }> = ({ companyId, onClose, onRefresh, editingClient }) => {
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
            <button onClick={() => setDocType('PJ')} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${docType === 'PJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`} type="button">
              Pessoa Jurídica
            </button>
            <button onClick={() => setDocType('PF')} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${docType === 'PF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`} type="button">
              Pessoa Física
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{docType === 'PJ' ? 'Razão Social' : 'Nome Completo'}</label>
              <input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{docType}</label>
              <div className="relative">
                <input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all" value={formData.cnpj_cpf} onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })} />
                {docType === 'PJ' && formData.cnpj_cpf.replace(/\D/g, '').length === 14 && (
                  <button onClick={handleLookup} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-700" type="button">
                    {isSearching ? '...' : 'BUSCAR'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
              <input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input type="email" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
              <input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Crédito</label>
              <input type="number" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest" type="button">
            Descartar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-2 w-2/3 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50" type="button">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            {isSaving ? 'Processando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;