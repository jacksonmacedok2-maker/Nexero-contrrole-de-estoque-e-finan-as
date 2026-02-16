
import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserRound, Mail, Phone, MapPin, Landmark, ArrowRight, X, Building, CheckCircle2, AlertCircle, Loader2, Sparkles, User } from 'lucide-react';
import { formatCurrency, generateId, fetchCnpjData } from '../utils/helpers';
import { Client } from '../types';

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Supermercados BH Ltda', cnpj_cpf: '12.345.678/0001-90', email: 'compras@superbh.com.br', phone: '(31) 3344-5566', address: 'Av. Amazonas, 123 - Belo Horizonte/MG', creditLimit: 50000, totalSpent: 125400, type: 'PJ' },
  { id: '2', name: 'João Carlos Ferreira', cnpj_cpf: '123.456.789-00', email: 'joao.ferreira@gmail.com', phone: '(31) 98877-6655', address: 'Rua das Flores, 45 - Contagem/MG', creditLimit: 2000, totalSpent: 450, type: 'PF' },
];

const Clients: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestão de Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua carteira de clientes e limites de crédito.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, documento ou e-mail..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 transition-colors">
              <Filter size={18} /> Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="px-6 py-4">Cliente / Documento</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Crédito / Total</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {MOCK_CLIENTS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${client.type === 'PJ' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.cnpj_cpf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Mail size={12}/> {client.email}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Phone size={12}/> {client.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                      <MapPin size={12} className="shrink-0"/> {client.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Gasto: {formatCurrency(client.totalSpent)}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">LMT: {formatCurrency(client.creditLimit)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><MoreHorizontal size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <ClientModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

const ClientModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [docType, setDocType] = useState<'PF' | 'PJ'>('PJ');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    limit: '0'
  });

  const handleLookup = async () => {
    if (docType !== 'PJ') return;
    const clean = formData.document.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('CNPJ deve conter 14 dígitos.');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const data = await fetchCnpjData(clean);
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia,
        address: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : prev.address,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone
      }));
    } catch (err: any) {
      setError('Não conseguimos localizar este CNPJ. Verifique os números.');
    } finally {
      setIsSearching(false);
    }
  };

  const isCnpjReady = docType === 'PJ' && formData.document.replace(/\D/g, '').length >= 14;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20"><Plus size={24}/></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Novo Cadastro</h3>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados do cliente para faturamento.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in shake duration-300">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 block uppercase tracking-widest ml-1">Tipo de Perfil</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                <button onClick={() => setDocType('PJ')} className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${docType === 'PJ' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}>
                   <Building size={14}/> CNPJ
                </button>
                <button onClick={() => setDocType('PF')} className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${docType === 'PF' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}>
                   {/* // Fix: Use User icon from lucide-react (imported at the top) to resolve the 'Cannot find name User' error */}
                   <User size={14}/> CPF
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{docType}</label>
                {isCnpjReady && <span className="text-[10px] font-bold text-indigo-500 animate-pulse flex items-center gap-1"><Sparkles size={10}/> Auto-preencher</span>}
              </div>
              <div className={`relative group transition-all duration-300 ${isCnpjReady ? 'ring-2 ring-indigo-500/20 rounded-2xl' : ''}`}>
                <Landmark className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCnpjReady ? 'text-indigo-500' : 'text-slate-400'}`} size={18} />
                <input 
                  type="text" 
                  placeholder={docType === 'PJ' ? "00.000.000/0001-00" : "000.000.000-00"}
                  className="w-full pl-11 pr-[110px] py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                />
                {docType === 'PJ' && isCnpjReady && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button 
                      onClick={handleLookup} 
                      disabled={isSearching} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      {isSearching ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                      {isSearching ? 'CONSULTANDO...' : 'CONSULTAR'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{docType === 'PJ' ? 'Razão Social' : 'Nome do Cliente'}</label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Ex: Mercado Central" className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input type="email" placeholder="cliente@exemplo.com" className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Celular</label>
              <input type="text" placeholder="(00) 0 0000-0000" className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Endereço de Entrega/Cobrança</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Rua, Número, Bairro, Cidade - UF" className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
          <button className="flex-2 w-2/3 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
            <CheckCircle2 size={16}/> Confirmar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;
