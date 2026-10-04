export type TransactionType = 'Gasto recurrente' | 'Gasto único' | 'Ingreso';

export const CATEGORY_COLORS: Record<string, string> = {
  Amazon: '#f59e0b',
  Apple: '#a855f7',
  Care: '#ec4899',
  Coche: '#3b82f6',
  Comida: '#10b981',
  Disney: '#06b6d4',
  Efectivo: '#14b8a6',
  Gasolina: '#f97316',
  Google: '#ef4444',
  Netflix: '#e11d48',
  Nómina: '#10b981',
  iCloud: '#6366f1',
  Ocio: '#8b5cf6',
  Otros: '#64748b',
  Piso: '#0284c7',
  'Préstamo personal': '#d97706',
  Sanitas: '#059669',
  'Seguro coche': '#ea580c',
  Skyshowtime: '#a855f7',
  Teléfono: '#38bdf8',
  Télegram: '#0ea5e9',
  YouTube: '#dc2626',
};

export const CATEGORIES_LIST = [
  'Amazon',
  'Apple',
  'Care',
  'Coche',
  'Comida',
  'Disney',
  'Efectivo',
  'Gasolina',
  'Google',
  'Netflix',
  'Nómina',
  'iCloud',
  'Ocio',
  'Otros',
  'Piso',
  'Préstamo personal',
  'Sanitas',
  'Seguro coche',
  'Skyshowtime',
  'Teléfono',
  'Télegram',
  'YouTube',
] as const;

export type StandardCategory = (typeof CATEGORIES_LIST)[number];
export type Category = StandardCategory | (string & {});

export interface FinancialRecord {
  id: string;
  name: string;
  cantidad: number;
  categoria: Category;
  fecha: Date;
  fechaString: string;
  tipo: TransactionType;
  raw?: any;
}

export type TimeRangeFilter =
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'current_year'
  | 'all'
  | 'custom';

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface FinancialStats {
  totalIngresos: number;
  totalGastos: number;
  totalGastoRecurrente: number;
  totalGastoUnico: number;
  balanceNeto: number;
  tasaAhorro: number;
  recordCount: number;
  categoryBreakdown: CategorySummary[];
  monthlyBreakdown: {
    monthKey: string;
    label: string;
    ingresos: number;
    gastos: number;
    balance: number;
  }[];
}
