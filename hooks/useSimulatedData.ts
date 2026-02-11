import { useState, useMemo } from 'react';
import { Sale, DashboardKPIs, PeriodFilter, SaleStatus, PaymentMethod } from '../types';
import { TICKETS, TARGETS, FEE_RATE, TAX_RATE, ANNUAL_REVENUE_TARGET } from '../constants';
import { SeededRNG } from '../utils/rng';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  isWithinInterval,
  parseISO,
  isValid,
  format
} from 'date-fns';

import { saveSalesForDate, getSalesForDate, getAllStoredSales } from '../utils/persistence';

// Helper to create a stable seed from dates
const getSeedFromDate = (date: Date): number => {
  return parseInt(format(date, 'yyyyMMdd'), 10);
};

const generateSalesForAmount = (target: number, startDate: Date, endDate: Date, rng: SeededRNG): Sale[] => {
  const sales: Sale[] = [];
  let currentTotal = 0;

  if (target <= 0 || startDate >= endDate) return [];

  let iterations = 0;
  while (currentTotal < target && iterations < 5000) {
    iterations++;
    const value = rng.pick(TICKETS);

    if (currentTotal + value > target + (500 * rng.next())) break;

    const timeSpan = endDate.getTime() - startDate.getTime();
    const date = new Date(startDate.getTime() + rng.next() * timeSpan);

    const statusRand = rng.next();
    let status: SaleStatus = 'paid';
    if (statusRand > 0.95) status = 'pending';
    else if (statusRand > 0.98) status = 'refunded';

    const payRand = rng.next();
    let paymentMethod: PaymentMethod = 'Cartão de Crédito';
    if (payRand > 0.6) paymentMethod = 'Pix';
    else if (payRand > 0.9) paymentMethod = 'Boleto';

    sales.push({
      id: Math.floor(rng.next() * 1000000).toString(36),
      value,
      date,
      paymentMethod,
      adAccount: `Conta 0${rng.nextInt(1, 4)}`,
      platform: 'Orgânico',
      source: 'Orgânico',
      status,
    });
    currentTotal += value;
  }
  return sales;
};

const generateMasterSalesList = (): Sale[] => {
  const now = new Date();

  // Garantir que temos dados para os últimos 30 dias de forma persistente
  for (let i = 0; i < 30; i++) {
    const date = subDays(now, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    let dailySales = getSalesForDate(dateKey);

    if (!dailySales) {
      const seed = getSeedFromDate(date);
      const rng = new SeededRNG(seed);
      // Meta de ~500 EUR (3000 BRL)
      const target = TARGETS.revenueToday;
      dailySales = generateSalesForAmount(target, startOfDay(date), endOfDay(date), rng);
      saveSalesForDate(dateKey, dailySales);
    }
  }

  return getAllStoredSales().sort((a, b) => b.date.getTime() - a.date.getTime());
};

interface UseSimulatedDataProps {
  period: PeriodFilter;
  from?: string;
  to?: string;
}

export const useSimulatedData = ({ period, from, to }: UseSimulatedDataProps) => {
  // Master list generated ONCE. 
  // Since the logic inside generateMasterSalesList() is now deterministic based on dates,
  // this list will be identical on every refresh for the same calendar day.
  const [masterSalesList] = useState<Sale[]>(() => generateMasterSalesList());

  const { filteredSales } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (period) {
      case 'today':
        start = startOfDay(now);
        // Important: For "Today", we limit the end time to NOW.
        // This effectively "unlocks" the deterministic sales as the day progresses.
        end = now;
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'last-7-days':
        start = startOfDay(subDays(now, 6));
        break;
      case 'this-month':
        start = startOfMonth(now);
        // Ensure we don't show future sales for today in the month view either
        end = now;
        break;
      case 'last-month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'this-year':
        start = startOfYear(now);
        end = now;
        break;
      case 'all-time':
        start = subDays(now, 365);
        end = now;
        break;
      case 'custom':
        const customStart = from ? parseISO(from) : null;
        const customEnd = to ? parseISO(to) : null;
        start = customStart && isValid(customStart) ? startOfDay(customStart) : startOfMonth(now);
        end = customEnd && isValid(customEnd) ? endOfDay(customEnd) : endOfDay(now);
        break;
      default:
        start = startOfMonth(now);
    }

    return {
      filteredSales: masterSalesList.filter(s => isWithinInterval(s.date, { start, end }))
    };
  }, [period, from, to, masterSalesList]);

  const kpis = useMemo<DashboardKPIs>(() => {
    // KPI calculation based on filtered set
    const paidSales = filteredSales.filter(s => s.status === 'paid');
    const grossRevenue = paidSales.reduce((acc, s) => acc + s.value, 0);

    const fees = grossRevenue * FEE_RATE;
    const taxes = grossRevenue * TAX_RATE;
    const netRevenue = grossRevenue - fees - taxes;
    const adSpend = 0;
    const profit = netRevenue - adSpend;
    const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;
    const arpu = paidSales.length > 0 ? grossRevenue / paidSales.length : 0;

    // Use seeded RNG for pending values to ensure consistency on refresh
    const dateSeed = parseInt(format(new Date(), 'yyyyMMdd'), 10);
    const rng = new SeededRNG(dateSeed + period.length); // simple variant seed
    const variance = 0.8 + rng.next() * 0.4;

    let pendingValue = 0;
    if (period === 'today') pendingValue = 400 * variance;
    else if (period === 'yesterday') pendingValue = 600 * variance;
    else if (period === 'last-7-days') pendingValue = 1432.24 * variance;
    else if (period === 'this-month') pendingValue = 8653.65 * variance;
    else pendingValue = 12000 * variance;

    return {
      grossRevenue,
      netRevenue,
      profit,
      margin,
      fees,
      taxes,
      adSpend,
      pendingSales: pendingValue,
      arpu,
      chargebacks: 0,
      refunds: 0,
      refundPercentage: 0,
      chargebackPercentage: 0,
      count: paidSales.length
    };
  }, [filteredSales, period]);

  return { sales: filteredSales, kpis };
};