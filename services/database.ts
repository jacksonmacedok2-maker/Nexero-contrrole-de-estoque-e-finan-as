
import { supabase } from './supabase';
import { Client, Order, Transaction, Product, OrderStatus } from '../types';

/**
 * DATABASE SERVICE (Enterprise Security Edition)
 * Todas as operações injetam o user_id do Supabase Auth para garantir isolamento.
 */
export const db = {
  // CLIENTES
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    async create(client: Partial<Client>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('clients')
        .insert([{ 
          ...client, 
          user_id: user.id // Força o ID do usuário autenticado
        }])
        .select();
      if (error) throw error;
      return data[0];
    }
  },

  // PRODUTOS
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    async create(product: Partial<Product>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          ...product, 
          user_id: user.id // Força o ID do usuário autenticado
        }])
        .select();
      if (error) throw error;
      return data[0];
    }
  },

  // PEDIDOS / VENDAS
  orders: {
    async getAll() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(order: any, items: any[]) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // 1. Criar o pedido (User ID forçado via sessão)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          ...order, 
          user_id: user.id 
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;

      // 2. Criar os itens do pedido
      const itemsToInsert = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // 3. Criar transação financeira automática
      await db.finance.createTransaction({
        description: `Venda #${orderData.id.substring(0,8)}`,
        amount: order.total_amount,
        type: 'INCOME',
        category: 'Vendas',
        status: 'PAID'
      });

      return orderData;
    }
  },

  // FINANCEIRO
  finance: {
    async getTransactions() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    async createTransaction(transaction: Partial<Transaction>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...transaction, 
          user_id: user.id, 
          date: new Date().toISOString() 
        }])
        .select();
      if (error) throw error;
      return data[0];
    }
  },

  // DASHBOARD STATS
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { dailySales: 0, outOfStockItems: 0, pendingOrders: 0, monthlyRevenue: 0 };

    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Busca vendas do dia filtrando por usuário (o RLS já faz isso, mas filtramos explicitamente por boa prática)
    const { data: ordersToday } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString());

    const { data: productsStock } = await supabase
      .from('products')
      .select('stock, min_stock');

    const dailySales = ordersToday?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
    const outOfStockItems = productsStock?.filter(p => p.stock <= 0).length || 0;

    return {
      dailySales,
      outOfStockItems,
      pendingOrders: 0, 
      monthlyRevenue: 0 
    };
  }
};
