import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { NotionService } from '../../services/notion.service';
import { FinancialRecord } from '../../models/financial-record.model';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let notionService: NotionService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    notionService = TestBed.inject(NotionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and load mock data initially when no credentials', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.usingMockData()).toBe(true);
    expect(component.allRecords().length).toBeGreaterThan(0);
  });

  it('should not show demo mode initially when credentials exist', () => {
    notionService.apiKey.set('test-token');
    notionService.databaseId.set('test-db');

    const credFixture = TestBed.createComponent(DashboardComponent);
    const credComponent = credFixture.componentInstance;
    expect(credComponent.usingMockData()).toBe(false);
  });

  it('should render skeleton loading state when notionService.isLoading is true', () => {
    notionService.isLoading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should compute stats accurately for income, expenses, balance and savings rate', () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const testRecords: FinancialRecord[] = [
      {
        id: '1',
        name: 'Nómina',
        cantidad: 2000,
        categoria: 'Nómina',
        fecha: new Date(currentYear, currentMonth, 1),
        fechaString: `1/${currentMonth + 1}/${currentYear}`,
        tipo: 'Ingreso',
      },
      {
        id: '2',
        name: 'Piso',
        cantidad: 800,
        categoria: 'Piso',
        fecha: new Date(currentYear, currentMonth, 2),
        fechaString: `2/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '3',
        name: 'Cena',
        cantidad: 200,
        categoria: 'Ocio',
        fecha: new Date(currentYear, currentMonth, 5),
        fechaString: `5/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
    ];

    component.allRecords.set(testRecords);
    component.timeRange.set('current_month');

    const stats = component.stats();
    expect(stats.totalIngresos).toBe(2000);
    expect(stats.totalGastos).toBe(1000);
    expect(stats.totalGastoRecurrente).toBe(800);
    expect(stats.totalGastoUnico).toBe(200);
    expect(stats.balanceNeto).toBe(1000);
    expect(stats.tasaAhorro).toBe(50);
    expect(stats.categoryBreakdown.length).toBe(2);
    expect(stats.monthlyBreakdown.length).toBe(1);
    expect(stats.monthlyBreakdown[0].ingresos).toBe(2000);
    expect(stats.monthlyBreakdown[0].gastos).toBe(1000);
  });

  it('should filter records by time interval, category, and search query', () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const testRecords: FinancialRecord[] = [
      {
        id: '1',
        name: 'Compra Mercadona',
        cantidad: 50,
        categoria: 'Comida',
        fecha: new Date(currentYear, currentMonth, 1),
        fechaString: `1/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '2',
        name: 'Gasolina Repsol',
        cantidad: 60,
        categoria: 'Gasolina',
        fecha: new Date(currentYear, currentMonth, 2),
        fechaString: `2/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '3',
        name: 'Gasto Pasado',
        cantidad: 100,
        categoria: 'Otros',
        fecha: new Date(currentYear - 2, 1, 1),
        fechaString: '1/2/' + (currentYear - 2),
        tipo: 'Gasto único',
      },
    ];

    component.allRecords.set(testRecords);

    // Filtro mes actual
    component.timeRange.set('current_month');
    expect(component.filteredRecords().length).toBe(2);

    // Filtro mes pasado
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 15);
    component.allRecords.update((records) => [
      ...records,
      {
        id: '4',
        name: 'Gasto Mes Pasado',
        cantidad: 45,
        categoria: 'Comida',
        fecha: lastMonthDate,
        fechaString: `15/${lastMonthDate.getMonth() + 1}/${lastMonthDate.getFullYear()}`,
        tipo: 'Gasto único',
      },
    ]);
    component.timeRange.set('last_month');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].name).toBe('Gasto Mes Pasado');

    // Filtro por categoría individual y múltiple
    component.timeRange.set('all');
    component.selectedCategories.set(['Comida']);
    expect(component.filteredRecords().length).toBe(2);
    expect(component.filteredRecords()[0].categoria).toBe('Comida');

    // Filtro con múltiples categorías simultáneas
    component.toggleCategory('Gasolina');
    expect(component.selectedCategories()).toEqual(['Comida', 'Gasolina']);
    expect(component.filteredRecords().length).toBe(3);

    // Deseleccionar categoría al hacer toggle de nuevo
    component.toggleCategory('Comida');
    expect(component.selectedCategories()).toEqual(['Gasolina']);
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].name).toBe('Gasolina Repsol');

    // Limpiar categorías
    component.clearSelectedCategories();
    expect(component.selectedCategories()).toEqual([]);
    expect(component.filteredRecords().length).toBe(4);

    // Filtro por búsqueda
    component.searchQuery.set('repsol');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].name).toBe('Gasolina Repsol');
    expect(component.hasActiveFilters()).toBe(true);

    // Borrar filtros
    component.clearFilters();
    expect(component.timeRange()).toBe('current_month');
    expect(component.selectedCategories()).toEqual([]);
    expect(component.selectedType()).toBe('all');
    expect(component.searchQuery()).toBe('');
    expect(component.customStartDate()).toBe('');
    expect(component.customEndDate()).toBe('');
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should update config and reload on onSaveConfig', () => {
    const saveSpy = vi.spyOn(notionService, 'saveConfig');
    component.onSaveConfig({ token: 'secret_123', dbId: 'db_456' });

    expect(saveSpy).toHaveBeenCalledWith('secret_123', 'db_456');
    expect(component.showConfigModal()).toBe(false);
  });

  it('should select record for edit, reload data, and update it on save', () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const initialRecord: FinancialRecord = {
      id: 'item-1',
      name: 'Compra Inicial',
      cantidad: 20,
      categoria: 'Comida',
      tipo: 'Gasto único',
      fecha: new Date(2026, 7, 26),
      fechaString: '26/8/2026',
    };

    component.allRecords.set([initialRecord]);
    component.selectRecordForEdit(initialRecord);
    expect(component.selectedRecordForEdit()).toEqual(initialRecord);

    const modifiedRecord: FinancialRecord = {
      ...initialRecord,
      name: 'Compra Editada',
      cantidad: 35.5,
    };

    component.onSaveRecord(modifiedRecord);

    expect(component.selectedRecordForEdit()).toBeNull();
    expect(loadDataSpy).toHaveBeenCalled();
  });

  it('should remove record and reload data on onDeleteRecord', () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const itemToDelete: FinancialRecord = {
      id: 'item-delete',
      name: 'Gasto a Eliminar',
      cantidad: 50,
      categoria: 'Otros',
      tipo: 'Gasto único',
      fecha: new Date(2026, 7, 26),
      fechaString: '26/8/2026',
    };

    component.allRecords.set([itemToDelete]);
    component.selectRecordForEdit(itemToDelete);

    component.onDeleteRecord('item-delete');

    expect(component.selectedRecordForEdit()).toBeNull();
    expect(loadDataSpy).toHaveBeenCalled();
  });

  it('should sort filteredRecords from newest to oldest by date', () => {
    component.timeRange.set('all');
    component.selectedCategories.set([]);
    component.selectedType.set('all');
    component.searchQuery.set('');

    const olderRecord: FinancialRecord = {
      id: 'old-1',
      name: 'Viejo',
      cantidad: 10,
      categoria: 'Otros',
      tipo: 'Gasto único',
      fecha: new Date(2026, 0, 10),
      fechaString: '10/01/2026',
    };
    const newerRecord: FinancialRecord = {
      id: 'new-1',
      name: 'Nuevo',
      cantidad: 20,
      categoria: 'Otros',
      tipo: 'Gasto único',
      fecha: new Date(2026, 5, 20),
      fechaString: '20/06/2026',
    };

    // Set records in arbitrary/old-first order
    component.allRecords.set([olderRecord, newerRecord]);

    const sorted = component.filteredRecords();
    expect(sorted.length).toBe(2);
    expect(sorted[0].id).toBe('new-1');
    expect(sorted[1].id).toBe('old-1');
  });

  it('should prepend new record locally on onCreateRecord', () => {
    component.allRecords.set([]);
    component.showCreateModal.set(true);

    const newRecordData = {
      name: 'Nuevo Test',
      cantidad: 120,
      categoria: 'Ocio',
      tipo: 'Gasto único' as const,
      fecha: new Date(2026, 7, 26),
      fechaString: '26/8/2026',
    };

    component.onCreateRecord(newRecordData);

    expect(component.showCreateModal()).toBe(false);
    expect(component.allRecords().length).toBe(1);
    expect(component.allRecords()[0].name).toBe('Nuevo Test');
    expect(component.allRecords()[0].cantidad).toBe(120);
  });

  it('should trigger toast notification on user loadData and handle backend rollback on update failure', () => {
    const toastInfoSpy = vi.spyOn(component.toastService, 'info');
    const toastErrorSpy = vi.spyOn(component.toastService, 'error');

    component.loadData(true);
    expect(toastInfoSpy).toHaveBeenCalledWith('Modo Demo: usando datos de ejemplo');

    // Simulate backend update failure
    const originalRecord: FinancialRecord = {
      id: 'rec-test-fail',
      name: 'Gasto Original',
      cantidad: 10,
      categoria: 'Comida',
      tipo: 'Gasto único',
      fecha: new Date(),
      fechaString: '26/8/2026',
    };
    component.allRecords.set([originalRecord]);
    component.usingMockData.set(false);
    vi.spyOn(notionService, 'hasConfiguredCredentials').mockReturnValue(true);
    vi.spyOn(notionService, 'updateRecord').mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    vi.spyOn(console, 'error').mockImplementation(() => {});
    component.onSaveRecord({ ...originalRecord, name: 'Gasto Modificado Invalido' });

    expect(toastErrorSpy).toHaveBeenCalled();
    // Rollback check: original record should be restored
    expect(component.allRecords()[0].name).toBe('Gasto Original');
  });

  it('should toggle selectedCategories on onCategorySelect and toggleCategory', () => {
    component.selectedCategories.set([]);
    component.onCategorySelect('Comida');
    expect(component.selectedCategories()).toEqual(['Comida']);
    expect(component.isCategorySelected('Comida')).toBe(true);

    // Selecting another category adds it to the list
    component.onCategorySelect('Gasolina');
    expect(component.selectedCategories()).toEqual(['Comida', 'Gasolina']);
    expect(component.isCategorySelected('Gasolina')).toBe(true);

    // Clicking again should toggle off and remove it
    component.onCategorySelect('Comida');
    expect(component.selectedCategories()).toEqual(['Gasolina']);
    expect(component.isCategorySelected('Comida')).toBe(false);

    // Clicking the remaining category should remove it resulting in empty list
    component.onCategorySelect('Gasolina');
    expect(component.selectedCategories()).toEqual([]);
  });

  it('should restore filters from localStorage on initialization if present (including legacy string selectedCategory)', () => {
    const savedState = {
      timeRange: 'last_3_months',
      selectedCategory: 'Comida',
      selectedType: 'Gasto único',
      searchQuery: 'Mercadona',
    };
    localStorage.setItem('finanzas_filters_state', JSON.stringify(savedState));

    const restoredFixture = TestBed.createComponent(DashboardComponent);
    const restoredComp = restoredFixture.componentInstance;

    expect(restoredComp.timeRange()).toBe('last_3_months');
    expect(restoredComp.selectedCategories()).toEqual(['Comida']);
    expect(restoredComp.selectedType()).toBe('Gasto único');
    expect(restoredComp.searchQuery()).toBe('Mercadona');
  });

  it('should filter records by custom date range', () => {
    const rec1: FinancialRecord = {
      id: 'rec-1',
      name: 'Compra 10 Mayo',
      cantidad: 15,
      categoria: 'Comida',
      tipo: 'Gasto único',
      fecha: new Date(2026, 4, 10),
      fechaString: '10/05/2026',
    };
    const rec2: FinancialRecord = {
      id: 'rec-2',
      name: 'Compra 20 Mayo',
      cantidad: 25,
      categoria: 'Comida',
      tipo: 'Gasto único',
      fecha: new Date(2026, 4, 20),
      fechaString: '20/05/2026',
    };
    const rec3: FinancialRecord = {
      id: 'rec-3',
      name: 'Compra 10 Junio',
      cantidad: 35,
      categoria: 'Comida',
      tipo: 'Gasto único',
      fecha: new Date(2026, 5, 10),
      fechaString: '10/06/2026',
    };

    component.allRecords.set([rec1, rec2, rec3]);
    component.timeRange.set('custom');
    component.selectedCategories.set([]);
    component.selectedType.set('all');
    component.searchQuery.set('');

    // Range: 2026-05-15 to 2026-05-25 (only rec2 matches)
    component.setCustomStartDate('2026-05-15');
    component.setCustomEndDate('2026-05-25');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].id).toBe('rec-2');

    // Only Start Date (2026-05-20 onwards -> rec2 and rec3)
    component.setCustomStartDate('2026-05-20');
    component.customEndDate.set('');
    expect(component.filteredRecords().length).toBe(2);

    // Only End Date (up to 2026-05-12 -> rec1)
    component.customStartDate.set('');
    component.setCustomEndDate('2026-05-12');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].id).toBe('rec-1');
  });

  it('should enforce date limits between minimum and maximum date inputs', () => {
    component.customStartDate.set('2026-05-10');
    component.customEndDate.set('2026-05-20');

    // Trying to set start date greater than end date caps it at end date
    component.setCustomStartDate('2026-05-25');
    expect(component.customStartDate()).toBe('2026-05-20');

    // Valid start date change
    component.setCustomStartDate('2026-05-05');
    expect(component.customStartDate()).toBe('2026-05-05');

    // Trying to set end date smaller than start date caps it at start date
    component.setCustomEndDate('2026-05-01');
    expect(component.customEndDate()).toBe('2026-05-05');
  });

  it('should persist filter changes to localStorage via effect', () => {
    component.timeRange.set('last_year' as any); // fallback test or standard
    component.setTimeRange('custom');
    component.setCustomStartDate('2026-01-01');
    component.setCustomEndDate('2026-02-01');
    component.selectedCategories.set(['Gasolina']);
    component.selectedType.set('Ingreso');
    component.searchQuery.set('Repsol');

    fixture.detectChanges();

    const stored = JSON.parse(localStorage.getItem('finanzas_filters_state') || '{}');
    expect(stored.timeRange).toBe('custom');
    expect(stored.customStartDate).toBe('2026-01-01');
    expect(stored.customEndDate).toBe('2026-02-01');
    expect(stored.selectedCategories).toEqual(['Gasolina']);
    expect(stored.selectedType).toBe('Ingreso');
    expect(stored.searchQuery).toBe('Repsol');
  });

  it('should export current view balances and records to CSV format', () => {
    const today = new Date();
    component.allRecords.set([
      {
        id: 'rec-1',
        name: 'Sueldo Octubre',
        cantidad: 2500,
        categoria: 'Nómina',
        fecha: today,
        fechaString: '2026-10-01',
        tipo: 'Ingreso',
      },
      {
        id: 'rec-2',
        name: 'Alquiler',
        cantidad: 800,
        categoria: 'Piso',
        fecha: today,
        fechaString: '2026-10-02',
        tipo: 'Gasto recurrente',
      },
    ]);

    fixture.detectChanges();

    let createdBlob: Blob | null = null;
    let appendedLink: any = null;
    let clicked = false;

    const originalCreateElement = document.createElement.bind(document);
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;

    window.URL.createObjectURL = vi.fn((blob: Blob) => {
      createdBlob = blob;
      return 'blob:http://localhost/fake-url';
    });
    window.URL.revokeObjectURL = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = () => {
          clicked = true;
        };
        appendedLink = el;
      }
      return el;
    });

    component.exportCsv();

    expect(clicked).toBe(true);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(appendedLink.getAttribute('download')).toMatch(/^finanzas_export_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(createdBlob).toBeTruthy();

    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });
});
