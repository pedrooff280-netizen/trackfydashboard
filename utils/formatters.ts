
export const formatCurrency = (value: number, currency: 'BRL' | 'EUR' = 'BRL'): string => {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'de-DE', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};
