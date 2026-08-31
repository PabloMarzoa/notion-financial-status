import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.clear();
  });

  it('should initialize with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add success toast and remove by id', () => {
    service.success('Operación completada con éxito');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Operación completada con éxito');
    expect(service.toasts()[0].type).toBe('success');

    const id = service.toasts()[0].id;
    service.remove(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should add error, info and warning toasts', () => {
    service.error('Ocurrió un error');
    service.info('Información del sistema');
    service.warning('Alerta');

    expect(service.toasts().length).toBe(3);
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[1].type).toBe('info');
    expect(service.toasts()[2].type).toBe('warning');

    service.clear();
    expect(service.toasts().length).toBe(0);
  });

  it('should automatically remove toast after duration', () => {
    vi.useFakeTimers();
    service.show('Mensaje temporal', 'info', 1000);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });
});
