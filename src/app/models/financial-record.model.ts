export type TransactionType = 'Gasto recurrente' | 'Gasto único' | 'Ingreso';

export const CATEGORIES_LIST: string[] = [
  'Amazon',
  'Care',
  'Coche',
  'Comida',
  'Disney',
  'Gasolina',
  'Netflix',
  'Nómina',
  'iCloud',
  'Ocio',
  'Otros',
  'Piso',
  'Sanitas',
  'Seguro coche',
  'Skyshowtime',
  'Teléfono',
  'Télegram',
];

export type Category =
  | 'Amazon'
  | 'Care'
  | 'Coche'
  | 'Comida'
  | 'Disney'
  | 'Gasolina'
  | 'Netflix'
  | 'Nómina'
  | 'iCloud'
  | 'Ocio'
  | 'Otros'
  | 'Piso'
  | 'Sanitas'
  | 'Seguro coche'
  | 'Skyshowtime'
  | 'Teléfono'
  | 'Télegram'
  | string;

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
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'current_year'
  | 'all';

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
