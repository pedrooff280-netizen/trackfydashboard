import { useState, useMemo } from 'react';
import { Sale, DashboardKPIs, PeriodFilter, SaleStatus, PaymentMethod } from '../types';
import { TICKETS, TARGETS, FEE_RATE, TAX_RATE, ANNUAL_REVENUE_TARGET } from '../constants';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  startOfYear,
  parseISO,
  isValid
} from 'date-fns';

const generateSalesForAmount = (target: number, startDate: Date, endDate: Date): Sale[] => {
  const sales: Sale[] = [];
  let currentTotal = 0;

  if (target <= 0 || startDate >= endDate) return [];

  let iterations = 0;
  // Safety cap to prevent infinite loops or performance hits
  while (currentTotal < target && iterations < 2000) {
    iterations++;
    const value = TICKETS[Math.floor(Math.random() * TICKETS.length)];
    // Allow a very small random overshoot for realism
    if (currentTotal + value > target + 1500) break;

    const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

    const statusRand = Math.random();
    let status: SaleStatus = 'paid';
    // 5% pending/refunded/chargeback for realism
    if (statusRand > 0.95) status = 'pending';
    else if (statusRand > 0.98) status = 'refunded';

    const payRand = Math.random();
    let paymentMethod: PaymentMethod = 'Cartão de Crédito';
    if (payRand > 0.6) paymentMethod = 'Pix';
    else if (payRand > 0.9) paymentMethod = 'Boleto';

    sales.push({
      id: Math.random().toString(36).substring(2, 11),
      value,
      date,
      paymentMethod,
      adAccount: `Conta 0${Math.floor(Math.random() * 3) + 1}`,
      platform: 'Orgânico',
      source: 'Orgânico',
      status,
    });
    currentTotal += value;
  }
  return sales;
};

const generateMasterSalesList = (): Sale[] => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const thisMonthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  const yearStart = startOfYear(today);

  // 1. TODAY: Fixed Target 1800
  // Using endOfDay to allow full day simulation as requested ("Last second of today")
  const salesToday = generateSalesForAmount(TARGETS.revenueToday, startOfDay(today), endOfDay(today));

  // 2. YESTERDAY: Fixed Target 2400
  const salesYesterday = generateSalesForAmount(TARGETS.revenueYesterday, startOfDay(yesterday), endOfDay(yesterday));

  // 3. THIS MONTH: Target 38550 (minus today and yesterday)
  const monthAccumulated = TARGETS.revenueToday + TARGETS.revenueYesterday;
  const remainingThisMonth = Math.max(0, TARGETS.revenueThisMonth - monthAccumulated);
  const salesRemainingMonth = generateSalesForAmount(remainingThisMonth, thisMonthStart, subDays(yesterday, 1));

  // 4. LAST MONTH: Fixed Target 36700
  const salesLastMonth = generateSalesForAmount(TARGETS.revenueLastMonth, lastMonthStart, lastMonthEnd);

  // 5. REMAINING YEAR: Target to reach 250000 total
  const yearAccumulated = TARGETS.revenueThisMonth + TARGETS.revenueLastMonth;
  const remainingYearTarget = Math.max(0, ANNUAL_REVENUE_TARGET - yearAccumulated);
  // Spread across the rest of the year (start of year up to 2 months ago)
  const salesRestOfYear = generateSalesForAmount(remainingYearTarget, yearStart, subDays(lastMonthStart, 1));

  return [
    ...salesToday,
    ...salesYesterday,
    ...salesRemainingMonth,
    ...salesLastMonth,
    ...salesRestOfYear
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
};

interface UseSimulatedDataProps {
  period: PeriodFilter;
  from?: string;
  to?: string;
}

export const useSimulatedData = ({ period, from, to }: UseSimulatedDataProps) => {
  // Master list generated once and persistent
  const [masterSalesList] = useState<Sale[]>(() => generateMasterSalesList());

  const { filteredSales } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (period) {
      case 'today':
        start = startOfDay(now);
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
        break;
      case 'last-month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'this-year':
        start = startOfYear(now);
        break;
      case 'all-time':
        start = subDays(now, 365); // "Todo o Tempo" in this context is 1 year
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

    // Logic: 2.5% fee and 6% taxes
    const fees = grossRevenue * FEE_RATE;
    const taxes = grossRevenue * TAX_RATE;
    const netRevenue = grossRevenue - fees - taxes;
    const adSpend = 0; // Simulated organic only
    const profit = netRevenue - adSpend;
    const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;
    const arpu = paidSales.length > 0 ? grossRevenue / paidSales.length : 0;

    // Simulated dynamic pending values based on filter
    let pendingValue = 0;
    const variance = () => 0.8 + Math.random() * 0.4; // +/- 20%
    if (period === 'today') pendingValue = 400 * variance();
    else if (period === 'yesterday') pendingValue = 600 * variance();
    else if (period === 'last-7-days') pendingValue = 1432.24 * variance();
    else if (period === 'this-month') pendingValue = 8653.65 * variance();
    else pendingValue = 12000 * variance();

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