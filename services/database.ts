
import { supabase } from './supabase';
import { Client, Order, Transaction, Product } from '../types';

// Chaves para o LocalStorage
const STORAGE_KEYS = {
  CLIENTS: 'nexero_cache_clients',
  PRODUCTS: 'nexero_cache_products',
  ORDERS: 'nexero_cache_orders',
  FINANCE: 'nexero_cache_finance',
  SYNC_QUEUE: 'nexero_sync_queue'
};

/**
 * Utilitários de Cache Local
 */
const localStore = {
  get: (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  set: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  addToQueue: (type: string, payload: any) => {
    const queue = localStore.get(STORAGE_KEYS.SYNC_QUEUE);
    queue.push({ id: Math.random().toString(36).substr(2, 9), type, payload, timestamp: Date.now() });
    localStore.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }
};

export const db = {
  // SINCRONIZAÇÃO
  async syncPendingData() {
    if (!navigator.onLine) return;
    
    const queue = localStore.get(STORAGE_KEYS.SYNC_QUEUE);
    if (queue.length === 0) return;

    console.log(`[Sync] Iniciando sincronização de ${queue.length} itens...`);
    
    const remainingQueue = [];
    
    for (const item of queue) {
      try {
        if (item.type === 'CLIENT') await this.clients.create(item.payload, true);
        if (item.type === 'PRODUCT') await this.products.create(item.payload, true);
        if (item.type === 'ORDER') await this.orders.create(item.payload.order, item.payload.items, true);
      } catch (err) {
        console.error(`[Sync] Falha ao sincronizar item ${item.id}:`, err);
        remainingQueue.push(item);
      }
    }
    
    localStore.set(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
    console.log(`[Sync] Sincronização concluída. ${remainingQueue.length} pendentes.`);
  },

  // CLIENTES
  clients: {
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.CLIENTS, data);
          return data as Client[];
        }
      } catch (e) {
        console.warn("Offline: Carregando clientes do cache.");
      }
      return localStore.get(STORAGE_KEYS.CLIENTS);
    },
    async create(client: Partial<Client>, isSyncing = false) {
      if (!isSyncing) {
        // Salva no cache imediato para UX instantânea
        const current = localStore.get(STORAGE_KEYS.CLIENTS);
        localStore.set(STORAGE_KEYS.CLIENTS, [...current, { ...client, id: 'temp_' + Date.now() }]);
      }

      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");
        const { data, error } = await supabase.from('clients').insert([{ ...client, user_id: user.id }]).select();
        if (error) throw error;
        return data[0];
      } else if (!isSyncing) {
        localStore.addToQueue('CLIENT', client);
      }
    }
  },

  // PRODUTOS
  products: {
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.PRODUCTS, data);
          return data as Product[];
        }
      } catch (e) {
        console.warn("Offline: Carregando produtos do cache.");
      }
      return localStore.get(STORAGE_KEYS.PRODUCTS);
    },
    async create(product: Partial<Product>, isSyncing = false) {
      if (!isSyncing) {
        const current = localStore.get(STORAGE_KEYS.PRODUCTS);
        localStore.set(STORAGE_KEYS.PRODUCTS, [...current, { ...product, id: 'temp_' + Date.now() }]);
      }

      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");
        const { data, error } = await supabase.from('products').insert([{ ...product, user_id: user.id }]).select();
        if (error) throw error;
        return data[0];
      } else if (!isSyncing) {
        localStore.addToQueue('PRODUCT', product);
      }
    }
  },

  // PEDIDOS
  orders: {
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('orders').select('*, clients(name)').order('created_at', { ascending: false });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.ORDERS, data);
          return data;
        }
      } catch (e) {
        console.warn("Offline: Carregando pedidos do cache.");
      }
      return localStore.get(STORAGE_KEYS.ORDERS);
    },
    async create(order: any, items: any[], isSyncing = false) {
      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");
        const { data: orderData, error: orderError } = await supabase.from('orders').insert([{ ...order, user_id: user.id }]).select().single();
        if (orderError) throw orderError;

        const itemsToInsert = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        await supabase.from('order_items').insert(itemsToInsert);
        await db.finance.createTransaction({
          description: `Venda #${orderData.id.substring(0,8)}`,
          amount: order.total_amount,
          type: 'INCOME',
          category: 'Vendas',
          status: 'PAID'
        });
        return orderData;
      } else if (!isSyncing) {
        localStore.addToQueue('ORDER', { order, items });
      }
    }
  },

  // FINANCEIRO
  finance: {
    async getTransactions() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.FINANCE, data);
          return data as Transaction[];
        }
      } catch (e) {}
      return localStore.get(STORAGE_KEYS.FINANCE);
    },
    async createTransaction(transaction: Partial<Transaction>) {
      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");
        const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: user.id, date: new Date().toISOString() }]).select();
        if (error) throw error;
        return data[0];
      }
      // Transações financeiras costumam ser geradas por ordens, simplificado aqui.
    }
  },

  async getDashboardStats() {
    try {
      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { dailySales: 0, outOfStockItems: 0, pendingOrders: 0, monthlyRevenue: 0 };
        const today = new Date();
        today.setHours(0,0,0,0);
        const { data: ordersToday } = await supabase.from('orders').select('total_amount').gte('created_at', today.toISOString());
        const { data: productsStock } = await supabase.from('products').select('stock, min_stock');
        const stats = {
          dailySales: ordersToday?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0,
          outOfStockItems: productsStock?.filter(p => p.stock <= 0).length || 0,
          pendingOrders: 0,
          monthlyRevenue: 0
        };
        return stats;
      }
    } catch (e) {}
    
    // Fallback básico offline para o dashboard
    const cachedOrders = localStore.get(STORAGE_KEYS.ORDERS);
    const cachedProducts = localStore.get(STORAGE_KEYS.PRODUCTS);
    return {
      dailySales: cachedOrders.length > 0 ? 1500 : 0, // Mock simplificado
      outOfStockItems: cachedProducts.filter((p: any) => p.stock <= 0).length || 0,
      pendingOrders: 0,
      monthlyRevenue: 0
    };
  }
};
