
import { PeriodFilter } from './types';

export const TICKETS = [600, 900, 1200, 1500];
export const EXCHANGE_RATE_EUR = 6.00;
export const ANNUAL_REVENUE_TARGET = 250000;
export const TARGETS = {
  revenueThisMonth: 38550,
  revenueLastMonth: 36700,
  revenueToday: 1800,
  revenueYesterday: 2400,
};

export const FEE_RATE = 0.025; // 2.5%
export const TAX_RATE = 0.06;  // 6%

export const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: 'Últimos 7 dias', value: 'last-7-days' },
  { label: 'Este mês', value: 'this-month' },
  { label: 'Mês passado', value: 'last-month' },
  { label: 'Este ano', value: 'this-year' },
  { label: 'Todo o Tempo', value: 'all-time' },
  { label: 'Personalizado', value: 'custom' },
];

export const PLATFORM_OPTIONS = ['Todas', 'Facebook', 'Instagram', 'Google', 'Orgânico'];
export const ACCOUNT_OPTIONS = ['Todas', 'Conta 01', 'Conta 02', 'Conta 03'];
export const PRODUCT_OPTIONS = ['Qualquer', 'Produto A', 'Produto B', 'Serviço Premium'];
