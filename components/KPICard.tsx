import React from 'react';
import { Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { Currency } from '../types';

interface KPICardProps {
  label: string;
  value: string | number;
  isCurrency?: boolean;
  tooltip?: string;
  colorClass?: string;
  currency?: Currency;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  isCurrency = true,
  tooltip,
  colorClass = "text-green-500",
  currency = 'BRL'
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-500 font-medium text-sm">{label}</span>
        {tooltip && (
          <button className="text-gray-300 hover:text-gray-400">
            <Info size={16} />
          </button>
        )}
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {typeof value === 'number' && isCurrency ? formatCurrency(value, currency) : value}
      </div>
    </div>
  );
};
