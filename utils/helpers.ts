
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

export const formatTime = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

/**
 * Consulta dados de um CNPJ via BrasilAPI (Receita Federal)
 * Suporta limpeza automática de caracteres não numéricos.
 */
export const fetchCnpjData = async (cnpj: string) => {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) throw new Error('CNPJ deve ter 14 dígitos.');

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na base da Receita Federal.');
    }
    
    if (!response.ok) {
      throw new Error('Serviço de consulta temporariamente indisponível.');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao conectar com o serviço de consulta.');
  }
};
