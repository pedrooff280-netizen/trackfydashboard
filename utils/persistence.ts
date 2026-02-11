import { Sale } from '../types';

const STORAGE_KEY_PREFIX = 'trackfy_sales_';

export const saveSalesForDate = (dateKey: string, sales: Sale[]): void => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${dateKey}`, JSON.stringify(sales));
};

export const getSalesForDate = (dateKey: string): Sale[] | null => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${dateKey}`);
    if (!stored) return null;

    try {
        const sales = JSON.parse(stored) as Sale[];
        // Restore Date objects
        return sales.map(s => ({
            ...s,
            date: new Date(s.date)
        }));
    } catch (e) {
        console.error('Error parsing stored sales:', e);
        return null;
    }
};

export const getAllStoredSales = (): Sale[] => {
    const allSales: Sale[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const sales = JSON.parse(stored) as Sale[];
                    allSales.push(...sales.map(s => ({ ...s, date: new Date(s.date) })));
                } catch (e) {
                    console.error('Error parsing stored sales:', e);
                }
            }
        }
    }
    return allSales;
};
