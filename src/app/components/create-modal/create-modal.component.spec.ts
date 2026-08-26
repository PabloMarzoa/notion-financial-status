import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateModalComponent } from './create-modal.component';
import { FinancialRecord } from '../../models/financial-record.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('CreateModalComponent', () => {
  let component: CreateModalComponent;
  let fixture: ComponentFixture<CreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateModalComponent);
    component = fixture.componentInstance;
  });

  it('should create and initialize today date', () => {
    component.ngOnInit();
    expect(component.dateString).toBeTruthy();
    expect(component.categoria).toBe('Comida');
    expect(component.tipo).toBe('Gasto único');
  });

  it('should emit save event with new record data', () => {
    component.ngOnInit();

    let emittedData: Omit<FinancialRecord, 'id' | 'raw'> | undefined;
    component.save.subscribe((data) => (emittedData = data));

    component.name = 'Pago Internet';
    component.cantidad = 45;
    component.categoria = 'Teléfono';
    component.tipo = 'Gasto recurrente';
    component.dateString = '2026-08-26';

    component.createRecord();

    expect(emittedData).toBeTruthy();
    expect(emittedData?.name).toBe('Pago Internet');
    expect(emittedData?.cantidad).toBe(45);
    expect(emittedData?.categoria).toBe('Teléfono');
    expect(emittedData?.tipo).toBe('Gasto recurrente');
    expect(emittedData?.fechaString).toBe('26/8/2026');
  });

  it('should not emit save event if name or amount is invalid', () => {
    component.ngOnInit();

    let emitted = false;
    component.save.subscribe(() => (emitted = true));

    // Nombre vacío
    component.name = '  ';
    component.cantidad = 20;
    component.createRecord();
    expect(emitted).toBe(false);

    // Cantidad cero o nula
    component.name = 'Compra';
    component.cantidad = 0;
    component.createRecord();
    expect(emitted).toBe(false);
  });

  it('should emit close event when cancelled', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.closeModal();
    expect(closed).toBe(true);
  });
});
