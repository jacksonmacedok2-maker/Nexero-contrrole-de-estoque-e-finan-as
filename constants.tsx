
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Package, DollarSign, Settings, Store, Megaphone, ClipboardList, UserRound } from 'lucide-react';
import { Permission } from './types';

export interface NavItem {
  key: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: Permission;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { key: 'orders', path: '/orders', icon: <ShoppingCart size={20} />, requiredPermission: 'ORDERS' },
  { key: 'clients', path: '/clients', icon: <UserRound size={20} />, requiredPermission: 'CLIENTS' },
  { key: 'pos', path: '/pos', icon: <Store size={20} />, requiredPermission: 'POS' },
  { key: 'products', path: '/products', icon: <Package size={20} />, requiredPermission: 'PRODUCTS' },
  { key: 'inventory', path: '/inventory', icon: <ClipboardList size={20} />, requiredPermission: 'INVENTORY' },
  { key: 'finance', path: '/finance', icon: <DollarSign size={20} />, requiredPermission: 'FINANCE' },
  { key: 'reports', path: '/reports', icon: <Megaphone size={20} />, requiredPermission: 'REPORTS' },
  { key: 'settings', path: '/settings', icon: <Settings size={20} />, requiredPermission: 'SETTINGS' },
];

export const APP_THEME = {
  primary: 'indigo-600',
  primaryHover: 'indigo-700',
  secondary: 'slate-600',
  success: 'emerald-500',
  danger: 'rose-500',
  warning: 'amber-500',
};
