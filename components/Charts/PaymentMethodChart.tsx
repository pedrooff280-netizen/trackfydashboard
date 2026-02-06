import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sale } from '../../types';

interface PaymentMethodChartProps {
  sales: Sale[];
}

const COLORS = ['#6366f1', '#4b5563', '#94a3b8', '#e2e8f0'];

export const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ sales }) => {
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(s => {
      counts[s.paymentMethod] = (counts[s.paymentMethod] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sales]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Vendas por Pagamento</h3>
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              cx="50%"
              cy="50%"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};