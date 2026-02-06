
export type PaymentMethod = 'Cartão de Crédito' | 'Pix' | 'Boleto' | 'Débito';
export type Currency = 'BRL' | 'EUR';
export type Platform = 'Facebook' | 'Instagram' | 'Google' | 'Orgânico';
export type SaleStatus = 'paid' | 'pending' | 'refunded' | 'chargeback';

export interface Sale {
  id: string;
  value: number;
  date: Date;
  paymentMethod: PaymentMethod;
  adAccount: string;
  platform: Platform;
  source: string;
  status: SaleStatus;
}

export interface AdSpend {
  id: string;
  amount: number;
  date: Date;
  adAccount: string;
  platform: string;
}

export interface DashboardKPIs {
  grossRevenue: number;
  netRevenue: number;
  profit: number;
  margin: number;
  fees: number;
  taxes: number;
  adSpend: number;
  pendingSales: number;
  arpu: number;
  chargebacks: number;
  refunds: number;
  refundPercentage: number;
  chargebackPercentage: number;
  count: number;
}

export type PeriodFilter = 'today' | 'yesterday' | 'last-7-days' | 'this-month' | 'last-month' | 'this-year' | 'all-time' | 'custom';

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'viewer';
}
