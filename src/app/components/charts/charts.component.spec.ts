import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartsComponent } from './charts.component';
import { FinancialStats } from '../../models/financial-record.model';

describe('ChartsComponent', () => {
  let component: ChartsComponent;
  let fixture: ComponentFixture<ChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate maxMonthlyAmount correctly', () => {
    const stats: FinancialStats = {
      totalIngresos: 3000,
      totalGastos: 1500,
      totalGastoRecurrente: 800,
      totalGastoUnico: 700,
      balanceNeto: 1500,
      tasaAhorro: 50,
      recordCount: 5,
      categoryBreakdown: [
        { category: 'Comida', total: 500, count: 2, percentage: 33.3, color: '#10b981' },
      ],
      monthlyBreakdown: [
        { monthKey: '2026-07', label: 'jul 2026', ingresos: 1200, gastos: 800, balance: 400 },
        { monthKey: '2026-08', label: 'ago 2026', ingresos: 2500, gastos: 1100, balance: 1400 },
      ],
    };

    component.stats = stats;
    expect(component.maxMonthlyAmount()).toBe(2500);
  });

  it('should calculate bar width percentage accurately', () => {
    expect(component.getBarWidth(500, 1000)).toBe(50);
    expect(component.getBarWidth(0, 1000)).toBe(0);
    expect(component.getBarWidth(2000, 1000)).toBe(100);
    expect(component.getBarWidth(100, 0)).toBe(0);
  });

  it('should render message when no categories exist', () => {
    component.stats = {
      totalIngresos: 0,
      totalGastos: 0,
      totalGastoRecurrente: 0,
      totalGastoUnico: 0,
      balanceNeto: 0,
      tasaAhorro: 0,
      recordCount: 0,
      categoryBreakdown: [],
      monthlyBreakdown: [],
    };
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No hay gastos registrados');
  });
});
