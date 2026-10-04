import { Component, OnInit, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotionService } from '../../services/notion.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import {
  FinancialRecord,
  FinancialStats,
  TimeRangeFilter,
  CategorySummary,
  Category,
  TransactionType,
  CATEGORIES_LIST,
  CATEGORY_COLORS,
} from '../../models/financial-record.model';
import { ChartsComponent } from '../charts/charts.component';
import { ConfigModalComponent } from '../config-modal/config-modal.component';
import { EditModalComponent } from '../edit-modal/edit-modal.component';
import { CreateModalComponent } from '../create-modal/create-modal.component';

const STORAGE_KEY_FILTERS = 'finanzas_filters_state';

interface StoredFilters {
  timeRange?: TimeRangeFilter;
  selectedCategory?: string;
  selectedType?: string;
  searchQuery?: string;
  customStartDate?: string;
  customEndDate?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartsComponent,
    ConfigModalComponent,
    EditModalComponent,
    CreateModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  notionService = inject(NotionService);
  themeService = inject(ThemeService);
  toastService = inject(ToastService);

  private storedFilters = this.loadStoredFilters();

  allRecords = signal<FinancialRecord[]>([]);
  timeRange = signal<TimeRangeFilter>(this.storedFilters.timeRange || 'current_month');
  customStartDate = signal<string>(this.storedFilters.customStartDate || '');
  customEndDate = signal<string>(this.storedFilters.customEndDate || '');
  selectedCategory = signal<string>(this.storedFilters.selectedCategory || 'all');
  selectedType = signal<string>(this.storedFilters.selectedType || 'all');
  searchQuery = signal<string>(this.storedFilters.searchQuery || '');
  showConfigModal = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);
  selectedRecordForEdit = signal<FinancialRecord | null>(null);
  usingMockData = signal<boolean>(!this.notionService.hasConfiguredCredentials());

  constructor() {
    effect(() => {
      const state: StoredFilters = {
        timeRange: this.timeRange(),
        selectedCategory: this.selectedCategory(),
        selectedType: this.selectedType(),
        searchQuery: this.searchQuery(),
        customStartDate: this.customStartDate(),
        customEndDate: this.customEndDate(),
      };
      this.saveStoredFilters(state);
    });
  }

  private loadStoredFilters(): StoredFilters {
    if (this.isBrowser && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
        if (raw) {
          const parsed = JSON.parse(raw);
          const validRanges: TimeRangeFilter[] = [
            'current_month',
            'last_month',
            'last_3_months',
            'last_6_months',
            'last_12_months',
            'current_year',
            'all',
            'custom',
          ];
          return {
            timeRange: validRanges.includes(parsed.timeRange) ? parsed.timeRange : 'current_month',
            selectedCategory: typeof parsed.selectedCategory === 'string' ? parsed.selectedCategory : 'all',
            selectedType: typeof parsed.selectedType === 'string' ? parsed.selectedType : 'all',
            searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
            customStartDate: typeof parsed.customStartDate === 'string' ? parsed.customStartDate : '',
            customEndDate: typeof parsed.customEndDate === 'string' ? parsed.customEndDate : '',
          };
        }
      } catch (e) {
        console.warn('Error reading stored filters:', e);
      }
    }
    return {};
  }

  private saveStoredFilters(state: StoredFilters): void {
    if (this.isBrowser && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(state));
      } catch (e) {
        console.warn('Error saving stored filters:', e);
      }
    }
  }

  // Filtro reactivo de registros
  filteredRecords = computed(() => {
    const records = this.allRecords();
    const range = this.timeRange();
    const cat = this.selectedCategory();
    const type = this.selectedType();
    const query = this.searchQuery().toLowerCase().trim();
    const customStart = this.customStartDate();
    const customEnd = this.customEndDate();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return records.filter((rec) => {
      const recDate = new Date(rec.fecha);
      const recYear = recDate.getFullYear();
      const recMonth = recDate.getMonth();

      // Filtro Temporal
      if (range === 'current_month') {
        if (recYear !== currentYear || recMonth !== currentMonth) {
          return false;
        }
      } else if (range === 'last_month') {
        const diffMonths = (currentYear - recYear) * 12 + (currentMonth - recMonth);
        if (diffMonths !== 1) return false;
      } else if (range === 'last_3_months') {
        const diffMonths = (currentYear - recYear) * 12 + (currentMonth - recMonth);
        if (diffMonths < 0 || diffMonths >= 3) return false;
      } else if (range === 'last_6_months') {
        const diffMonths = (currentYear - recYear) * 12 + (currentMonth - recMonth);
        if (diffMonths < 0 || diffMonths >= 6) return false;
      } else if (range === 'last_12_months') {
        const diffMonths = (currentYear - recYear) * 12 + (currentMonth - recMonth);
        if (diffMonths < 0 || diffMonths >= 12) return false;
      } else if (range === 'current_year') {
        if (recYear !== currentYear) return false;
      } else if (range === 'custom') {
        const recTime = new Date(recDate.getFullYear(), recDate.getMonth(), recDate.getDate()).getTime();
        if (customStart) {
          const [sY, sM, sD] = customStart.split('-').map(Number);
          const startTime = new Date(sY, sM - 1, sD).getTime();
          if (recTime < startTime) return false;
        }
        if (customEnd) {
          const [eY, eM, eD] = customEnd.split('-').map(Number);
          const endTime = new Date(eY, eM - 1, eD).getTime();
          if (recTime > endTime) return false;
        }
      }

      // Filtro Categoría
      if (cat !== 'all' && rec.categoria.toLowerCase() !== cat.toLowerCase()) {
        return false;
      }

      // Filtro Tipo
      if (type !== 'all' && rec.tipo !== type) {
        return false;
      }

      // Búsqueda
      if (query) {
        const matchName = rec.name.toLowerCase().includes(query);
        const matchCat = rec.categoria.toLowerCase().includes(query);
        const matchDate = rec.fechaString.toLowerCase().includes(query);
        if (!matchName && !matchCat && !matchDate) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });

  // Estadísticas y Métricas
  stats = computed<FinancialStats>(() => {
    const list = this.filteredRecords();
    let totalIngresos = 0;
    let totalGastos = 0;
    let totalGastoRecurrente = 0;
    let totalGastoUnico = 0;

    const catMap = new Map<string, { total: number; count: number }>();
    const monthMap = new Map<string, { label: string; ingresos: number; gastos: number }>();

    for (const rec of list) {
      if (rec.tipo === 'Ingreso') {
        totalIngresos += rec.cantidad;
      } else {
        totalGastos += rec.cantidad;
        if (rec.tipo === 'Gasto recurrente') {
          totalGastoRecurrente += rec.cantidad;
        } else {
          totalGastoUnico += rec.cantidad;
        }

        // Acumular por categoría solo gastos
        const currentCat = catMap.get(rec.categoria) || { total: 0, count: 0 };
        currentCat.total += rec.cantidad;
        currentCat.count += 1;
        catMap.set(rec.categoria, currentCat);
      }

      // Acumular mensual para el intervalo seleccionado
      const recDate = new Date(rec.fecha);
      const monthKey = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = recDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      const currentMonthData = monthMap.get(monthKey) || { label: monthLabel, ingresos: 0, gastos: 0 };
      if (rec.tipo === 'Ingreso') {
        currentMonthData.ingresos += rec.cantidad;
      } else {
        currentMonthData.gastos += rec.cantidad;
      }
      monthMap.set(monthKey, currentMonthData);
    }

    const balanceNeto = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? (balanceNeto / totalIngresos) * 100 : 0;

    // Breakdown de categorías ordenado
    const categoryBreakdown: CategorySummary[] = Array.from(catMap.entries())
      .map(([category, data]) => {
        const percentage = totalGastos > 0 ? (data.total / totalGastos) * 100 : 0;
        const color = CATEGORY_COLORS[category] || '#94a3b8';
        return {
          category,
          total: data.total,
          count: data.count,
          percentage: Math.round(percentage * 10) / 10,
          color,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Breakdown mensual ordenado cronológicamente según los meses del intervalo seleccionado
    const monthlyBreakdown = Array.from(monthMap.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([monthKey, data]) => ({
        monthKey,
        label: data.label,
        ingresos: data.ingresos,
        gastos: data.gastos,
        balance: data.ingresos - data.gastos,
      }));

    return {
      totalIngresos,
      totalGastos,
      totalGastoRecurrente,
      totalGastoUnico,
      balanceNeto,
      tasaAhorro: Math.round(tasaAhorro * 10) / 10,
      recordCount: list.length,
      categoryBreakdown,
      monthlyBreakdown,
    };
  });

  // Lista de categorías para selector (unificada con CATEGORIES_LIST y cualquier categoría existente en registros)
  availableCategories = computed(() => {
    const set = new Set<string>(CATEGORIES_LIST);
    for (const r of this.allRecords()) {
      if (r.categoria) set.add(r.categoria);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  });

  ngOnInit() {
    this.loadData();
  }

  loadData(isUserAction = false) {
    if (this.notionService.hasConfiguredCredentials()) {
      this.usingMockData.set(false);
      this.notionService.fetchDatabaseRecords().subscribe({
        next: (records) => {
          this.allRecords.set(records);
          if (isUserAction) {
            this.toastService.success('Datos sincronizados correctamente con Notion');
          }
        },
        error: (err) => {
          console.warn('Fallback a datos de demostración tras error:', err);
          this.usingMockData.set(true);
          this.allRecords.set(this.notionService.getMockRecords());
          this.toastService.error(err?.message || 'Error al conectar con Notion. Mostrando demo');
        },
      });
    } else {
      this.usingMockData.set(true);
      this.allRecords.set(this.notionService.getMockRecords());
      if (isUserAction) {
        this.toastService.info('Modo Demo: usando datos de ejemplo');
      }
    }
  }

  onSaveConfig(event: { token: string; dbId: string }) {
    this.notionService.saveConfig(event.token, event.dbId);
    this.showConfigModal.set(false);
    this.toastService.success('Configuración guardada correctamente');
    this.loadData(true);
  }

  onCategorySelect(category: string) {
    if (this.selectedCategory().toLowerCase() === category.toLowerCase()) {
      this.selectedCategory.set('all');
    } else {
      this.selectedCategory.set(category);
    }
  }

  selectRecordForEdit(record: FinancialRecord) {
    this.selectedRecordForEdit.set({ ...record });
  }

  onSaveRecord(updatedRecord: FinancialRecord) {
    const previousRecords = this.allRecords();

    // 1. Actualización optimista local
    this.allRecords.update((records) =>
      records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    this.selectedRecordForEdit.set(null);

    // 2. Sincronización remota con Notion si no es mock
    if (this.notionService.hasConfiguredCredentials() && !this.usingMockData()) {
      this.notionService.updateRecord(updatedRecord).subscribe({
        next: (syncedRecord) => {
          this.toastService.success(`Movimiento "${updatedRecord.name}" actualizado en Notion`);
          this.loadData();
        },
        error: (err) => {
          console.error('Error al guardar en Notion:', err);
          // Rollback en caso de fallo
          this.allRecords.set(previousRecords);
          this.toastService.error(`No se pudo actualizar el movimiento: ${err?.message || 'Error de conexión'}`);
        },
      });
    } else {
      this.toastService.success(`Movimiento "${updatedRecord.name}" guardado (Modo local)`);
      this.loadData();
    }
  }

  onDeleteRecord(recordId: string) {
    const previousRecords = this.allRecords();
    const recordToDelete = previousRecords.find((r) => r.id === recordId);
    const recordName = recordToDelete?.name || 'Movimiento';

    // 1. Eliminación optimista local
    this.allRecords.update((records) =>
      records.filter((r) => r.id !== recordId)
    );
    this.selectedRecordForEdit.set(null);

    // 2. Sincronización remota con Notion (in_trash: true)
    if (this.notionService.hasConfiguredCredentials() && !this.usingMockData()) {
      this.notionService.deleteRecord(recordId).subscribe({
        next: () => {
          this.toastService.success(`"${recordName}" eliminado de Notion`);
          this.loadData();
        },
        error: (err) => {
          console.error('Error al eliminar en Notion:', err);
          // Rollback en caso de fallo
          this.allRecords.set(previousRecords);
          this.toastService.error(`No se pudo eliminar el movimiento: ${err?.message || 'Error de conexión'}`);
        },
      });
    } else {
      this.toastService.success(`"${recordName}" eliminado (Modo local)`);
      this.loadData();
    }
  }

  onCreateRecord(newRecordData: Omit<FinancialRecord, 'id' | 'raw'>) {
    const tempId = 'temp_' + Date.now();
    const tempRecord: FinancialRecord = {
      ...newRecordData,
      id: tempId,
    };

    // 1. Inserción optimista local al inicio de la lista
    this.allRecords.update((records) => [tempRecord, ...records]);
    this.showCreateModal.set(false);

    // 2. Sincronización remota con Notion si no es mock
    if (this.notionService.hasConfiguredCredentials() && !this.usingMockData()) {
      this.notionService.createRecord(newRecordData).subscribe({
        next: (createdRecord) => {
          this.allRecords.update((records) =>
            records.map((r) => (r.id === tempId ? createdRecord : r))
          );
          this.toastService.success(`Movimiento "${newRecordData.name}" creado en Notion`);
        },
        error: (err) => {
          console.error('Error al crear página en Notion:', err);
          // Rollback en caso de fallo
          this.allRecords.update((records) => records.filter((r) => r.id !== tempId));
          this.toastService.error(`Error al crear el movimiento en Notion: ${err?.message || 'Error de conexión'}`);
        },
      });
    } else {
      this.toastService.success(`Movimiento "${newRecordData.name}" creado (Modo local)`);
    }
  }

  setTimeRange(range: TimeRangeFilter) {
    this.timeRange.set(range);
  }

  setCustomStartDate(date: string) {
    if (this.customEndDate() && date && date > this.customEndDate()) {
      this.customStartDate.set(this.customEndDate());
    } else {
      this.customStartDate.set(date);
    }
  }

  setCustomEndDate(date: string) {
    if (this.customStartDate() && date && date < this.customStartDate()) {
      this.customEndDate.set(this.customStartDate());
    } else {
      this.customEndDate.set(date);
    }
  }

  getCategoryColor(cat: string): string {
    return CATEGORY_COLORS[cat] || '#94a3b8';
  }
}
