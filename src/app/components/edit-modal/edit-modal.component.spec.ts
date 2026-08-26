import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditModalComponent } from './edit-modal.component';
import { FinancialRecord } from '../../models/financial-record.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EditModalComponent', () => {
  let component: EditModalComponent;
  let fixture: ComponentFixture<EditModalComponent>;

  const mockRecord: FinancialRecord = {
    id: 'test-123',
    name: 'Compra Fruta',
    cantidad: 15.5,
    categoria: 'Comida',
    fecha: new Date(2026, 7, 19),
    fechaString: '19/8/2026',
    tipo: 'Gasto único',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create and initialize fields with record inputs', () => {
    component.record = { ...mockRecord };
    component.ngOnInit();

    expect(component.editName).toBe('Compra Fruta');
    expect(component.editCantidad).toBe(15.5);
    expect(component.editCategoria).toBe('Comida');
    expect(component.editTipo).toBe('Gasto único');
    expect(component.editDateString).toBe('2026-08-19');
  });

  it('should emit save event with updated record data', () => {
    component.record = { ...mockRecord };
    component.ngOnInit();

    let emittedRecord: FinancialRecord | undefined;
    component.save.subscribe((res) => (emittedRecord = res));

    component.editName = 'Compra Supermercado';
    component.editCantidad = 42.9;
    component.editCategoria = 'Comida';
    component.editTipo = 'Gasto recurrente';
    component.editDateString = '2026-08-20';

    component.saveChanges();

    expect(emittedRecord).toBeTruthy();
    expect(emittedRecord?.name).toBe('Compra Supermercado');
    expect(emittedRecord?.cantidad).toBe(42.9);
    expect(emittedRecord?.tipo).toBe('Gasto recurrente');
    expect(emittedRecord?.fechaString).toBe('20/8/2026');
  });

  it('should not emit save event if name is blank', () => {
    component.record = { ...mockRecord };
    component.ngOnInit();

    let emitted = false;
    component.save.subscribe(() => (emitted = true));

    component.editName = '   ';
    component.saveChanges();

    expect(emitted).toBe(false);
  });

  it('should emit close event when cancelled', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.closeModal();
    expect(closed).toBe(true);
  });

  it('should handle delete confirmation flow and emit delete event', () => {
    component.record = { ...mockRecord };
    component.ngOnInit();

    expect(component.isConfirmingDelete()).toBe(false);
    component.promptDelete();
    expect(component.isConfirmingDelete()).toBe(true);

    component.cancelDelete();
    expect(component.isConfirmingDelete()).toBe(false);

    let deletedId = '';
    component.delete.subscribe((id) => (deletedId = id));
    component.confirmDelete();

    expect(component.isDeleting()).toBe(true);
    expect(deletedId).toBe('test-123');
  });
});
