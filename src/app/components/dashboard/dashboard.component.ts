import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '../../models/financial-record.model';
import { ChartsComponent } from '../charts/charts.component';
import { ConfigModalComponent } from '../config-modal/config-modal.component';
import { EditModalComponent } from '../edit-modal/edit-modal.component';
import { CreateModalComponent } from '../create-modal/create-modal.component';

const CATEGORY_COLORS: Record<string, string> = {
  Amazon: '#f59e0b',
  Care: '#ec4899',
  Coche: '#3b82f6',
  Comida: '#10b981',
  Disney: '#06b6d4',
  Gasolina: '#f97316',
  Netflix: '#e11d48',
  Nómina: '#14b8a6',
  iCloud: '#6366f1',
  Ocio: '#8b5cf6',
  Otros: '#64748b',
  Piso: '#0284c7',
  Sanitas: '#059669',
  'Seguro coche': '#ea580c',
  Skyshowtime: '#a855f7',
  Teléfono: '#38bdf8',
  Télegram: '#0ea5e9',
};

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
  notionService = inject(NotionService);
  themeService = inject(ThemeService);
  toastService = inject(ToastService);

  allRecords = signal<FinancialRecord[]>([]);
  timeRange = signal<TimeRangeFilter>('current_month');
  selectedCategory = signal<string>('all');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');
  showConfigModal = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);
  selectedRecordForEdit = signal<FinancialRecord | null>(null);
  usingMockData = signal<boolean>(false);

  // Filtro reactivo de registros
  filteredRecords = computed(() => {
    const records = this.allRecords();
    const range = this.timeRange();
    const cat = this.selectedCategory();
    const type = this.selectedType();
    const query = this.searchQuery().toLowerCase().trim();

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
    });
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

      // Acumular mensual
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

    // Breakdown mensual ordenado cronológicamente
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

  // Lista de categorías únicas para selector
  availableCategories = computed(() => {
    const list = this.allRecords();
    const set = new Set<string>();
    for (const r of list) {
      if (r.categoria) set.add(r.categoria);
    }
    return Array.from(set).sort();
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
          this.allRecords.update((records) =>
            records.map((r) => (r.id === syncedRecord.id ? syncedRecord : r))
          );
          this.toastService.success(`Movimiento "${updatedRecord.name}" actualizado en Notion`);
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

  getCategoryColor(cat: string): string {
    return CATEGORY_COLORS[cat] || '#94a3b8';
  }
}
