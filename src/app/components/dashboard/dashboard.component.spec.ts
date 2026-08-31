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

    // Filtro por categoría
    component.selectedCategory.set('Comida');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].categoria).toBe('Comida');

    // Filtro por búsqueda
    component.selectedCategory.set('all');
    component.searchQuery.set('repsol');
    expect(component.filteredRecords().length).toBe(1);
    expect(component.filteredRecords()[0].name).toBe('Gasolina Repsol');
  });

  it('should update config and reload on onSaveConfig', () => {
    const saveSpy = vi.spyOn(notionService, 'saveConfig');
    component.onSaveConfig({ token: 'secret_123', dbId: 'db_456' });

    expect(saveSpy).toHaveBeenCalledWith('secret_123', 'db_456');
    expect(component.showConfigModal()).toBe(false);
  });

  it('should select record for edit and update it locally on save', () => {
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
    const updated = component.allRecords().find((r) => r.id === 'item-1');
    expect(updated?.name).toBe('Compra Editada');
    expect(updated?.cantidad).toBe(35.5);
  });

  it('should remove record locally on onDeleteRecord', () => {
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
    expect(component.allRecords().length).toBe(0);
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

    component.onSaveRecord({ ...originalRecord, name: 'Gasto Modificado Invalido' });

    expect(toastErrorSpy).toHaveBeenCalled();
    // Rollback check: original record should be restored
    expect(component.allRecords()[0].name).toBe('Gasto Original');
  });
});
