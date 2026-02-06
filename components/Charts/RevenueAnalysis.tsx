import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale, PeriodFilter } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { startOfDay, startOfHour, startOfMonth, format, getHours, getDate, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueAnalysisProps {
  sales: Sale[];
  period: PeriodFilter;
}

export const RevenueAnalysis: React.FC<RevenueAnalysisProps> = ({ sales, period }) => {
  const chartData = React.useMemo(() => {
    // Determine granularity based on period
    let granularity: 'hour' | 'day' | 'month' = 'day';
    if (period === 'today' || period === 'yesterday') granularity = 'hour';
    if (period === 'this-year' || period === 'all-time') granularity = 'month';

    const groupedData: Record<string, { value: number; timestamp: number; label: string }> = {};

    sales.forEach(sale => {
      let key: string;
      let label: string;
      let timestamp: number;

      if (granularity === 'hour') {
        const hourStart = startOfHour(sale.date);
        key = format(hourStart, 'yyyy-MM-dd HH:00');
        label = format(hourStart, 'HH:mm');
        timestamp = hourStart.getTime();
      } else if (granularity === 'month') {
        const monthStart = startOfMonth(sale.date);
        key = format(monthStart, 'yyyy-MM');
        label = format(monthStart, 'MMM', { locale: ptBR });
        timestamp = monthStart.getTime();
      } else {
        // Default to day
        const dayStart = startOfDay(sale.date);
        key = format(dayStart, 'yyyy-MM-dd');
        label = format(dayStart, 'dd MMM', { locale: ptBR });
        timestamp = dayStart.getTime();
      }

      if (!groupedData[key]) {
        groupedData[key] = { value: 0, timestamp, label };
      }

      if (sale.status === 'paid') {
        groupedData[key].value += sale.value;
      }
    });

    // Fill in gaps if necessary (optional, but good for "Today" to show 0s)
    // For now, let's just sort existing data
    // Improvement: For "Today", we want 00 to 23.
    if (granularity === 'hour' && (period === 'today' || period === 'yesterday')) {
      // Logic to fill empty hours could go here, but keeping it simple for now as per "generated sales" logic
    }

    return Object.values(groupedData)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [sales, period]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Análise de Faturamento</h3>
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(val) => `R$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};