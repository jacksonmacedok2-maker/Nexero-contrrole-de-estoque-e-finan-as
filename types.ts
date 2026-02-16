
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DRAFT = 'DRAFT'
}

export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gerente',
  SELLER = 'Vendedor',
  CASHIER = 'Operador de Caixa'
}

export type Permission = 'FINANCE' | 'INVENTORY' | 'PRODUCTS' | 'ORDERS' | 'POS' | 'SETTINGS' | 'REPORTS' | 'CLIENTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissions: Permission[];
}

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  cnpj_cpf: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: number;
  total_spent: number;
  type: 'PF' | 'PJ';
  created_at?: string;
}

export interface Product {
  id: string;
  user_id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  image_url: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface Order {
  id: string;
  code: string;
  user_id?: string;
  client_id: string | null;
  total_amount: number;
  discount_total: number;
  subtotal: number;
  status: OrderStatus;
  salesperson: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  // Joins
  clients?: { name: string };
  order_items?: OrderItem[];
}

export interface Transaction {
  id: string;
  user_id?: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: 'PAID' | 'PENDING';
  date: string;
}
