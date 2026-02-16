
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

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  date: string;
}

export interface Client {
  id: string;
  name: string;
  cnpj_cpf: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  totalSpent: number;
  type: 'PF' | 'PJ';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  date: string;
  salesperson: string;
  paymentMethod: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  status: 'PAID' | 'PENDING';
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  contact: string;
  fiscalRegime: string;
  timezone: string;
  currency: string;
}
