
import { PeriodFilter } from './types';

export const TICKETS = [180.00, 200.00, 220.00, 240.00]; // ~30-40 EUR (câmbio 6.0)
export const EXCHANGE_RATE_EUR = 6.00;
export const ANNUAL_REVENUE_TARGET = 1000000; // ~166k EUR
export const TARGETS = {
  revenueThisMonth: 90000, // ~15k EUR
  revenueLastMonth: 93000,
  revenueToday: 3000,      // ~500 EUR
  revenueYesterday: 3000,
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
