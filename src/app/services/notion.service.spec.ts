import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotionService } from './notion.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('NotionService', () => {
  let service: NotionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        NotionService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NotionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty credentials if localStorage is empty', () => {
    expect(service.apiKey()).toBe('');
    expect(service.databaseId()).toBe('');
    expect(service.hasConfiguredCredentials()).toBe(false);
  });

  it('should save and load config in localStorage and signals', () => {
    service.saveConfig('secret_test123', 'db_test456');
    expect(service.apiKey()).toBe('secret_test123');
    expect(service.databaseId()).toBe('db_test456');
    expect(service.hasConfiguredCredentials()).toBe(true);
    expect(localStorage.getItem('finanzas_notion_api_token')).toBe('secret_test123');
    expect(localStorage.getItem('finanzas_notion_db_id')).toBe('db_test456');
  });

  it('should return mock records when no credentials configured', async () => {
    service.saveConfig('', '');
    const records = await new Promise<any[]>((resolve) => {
      service.fetchDatabaseRecords().subscribe((res) => resolve(res));
    });
    expect(records.length).toBeGreaterThan(0);
    expect(service.errorMessage()).toContain('Configura el Notion API Token');
  });

  it('should fetch and parse database records successfully from Notion API', async () => {
    service.saveConfig('secret_abc', '3b84e723375b80b0a32bce9ccec7385a');

    const mockNotionResponse = {
      results: [
        {
          id: 'page-1',
          properties: {
            Name: {
              type: 'title',
              title: [{ plain_text: 'Sueldo' }],
            },
            Cantidad: {
              type: 'number',
              number: 2100.5,
            },
            Categoría: {
              type: 'select',
              select: { name: 'Nómina' },
            },
            Tipo: {
              type: 'select',
              select: { name: 'Ingreso' },
            },
            Fecha: {
              type: 'date',
              date: { start: '2026-08-01' },
            },
          },
        },
        {
          id: 'page-2',
          properties: {
            Name: {
              type: 'title',
              title: [{ plain_text: 'Compra' }],
            },
            Importe: {
              type: 'rich_text',
              rich_text: [{ plain_text: '45,80 €' }],
            },
            Category: {
              type: 'multi_select',
              multi_select: [{ name: 'Comida' }],
            },
            Type: {
              type: 'rich_text',
              rich_text: [{ plain_text: 'Gasto único' }],
            },
            Fecha: {
              type: 'rich_text',
              rich_text: [{ plain_text: '15/08/2026' }],
            },
          },
        },
      ],
    };

    const promise = new Promise<any[]>((resolve) => {
      service.fetchDatabaseRecords().subscribe((records) => resolve(records));
    });

    const req = httpTesting.expectOne('http://localhost:3001/api/notion/databases/3b84e723375b80b0a32bce9ccec7385a/query');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret_abc');
    req.flush(mockNotionResponse);

    const records = await promise;
    expect(records.length).toBe(2);
    expect(records[0].name).toBe('Sueldo');
    expect(records[0].cantidad).toBe(2100.5);
    expect(records[0].categoria).toBe('Nómina');
    expect(records[0].tipo).toBe('Ingreso');

    expect(records[1].name).toBe('Compra');
    expect(records[1].cantidad).toBe(45.8);
    expect(records[1].categoria).toBe('Comida');
    expect(records[1].tipo).toBe('Gasto único');
    expect(service.isConnected()).toBe(true);
  });

  it('should handle API errors and set error message', async () => {
    service.saveConfig('secret_invalid', 'invalid_db');

    const promise = new Promise<any>((resolve, reject) => {
      service.fetchDatabaseRecords().subscribe({
        next: (res) => resolve(res),
        error: (err) => resolve(err),
      });
    });

    const req = httpTesting.expectOne('http://localhost:3001/api/notion/databases/invalid_db/query');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const err = await promise;
    expect(err).toBeTruthy();
    expect(service.errorMessage()).toContain('API Token no válido');
  });

  it('should update a record in Notion API via PATCH', async () => {
    service.saveConfig('secret_abc', 'db_123');

    const recordToUpdate = {
      id: 'page-1234567890',
      name: 'Compra Modificada',
      cantidad: 89.9,
      categoria: 'Comida',
      tipo: 'Gasto único' as const,
      fecha: new Date(2026, 7, 20),
      fechaString: '20/8/2026',
      raw: {
        properties: {
          Name: { type: 'title' },
          Cantidad: { type: 'number' },
          Categoría: { type: 'select' },
          Tipo: { type: 'select' },
          Fecha: { type: 'date' },
        },
      },
    };

    const promise = new Promise<any>((resolve) => {
      service.updateRecord(recordToUpdate).subscribe((res) => resolve(res));
    });

    const req = httpTesting.expectOne('http://localhost:3001/api/notion/pages/page-1234567890');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret_abc');
    expect(req.request.body.properties.Cantidad.number).toBe(89.9);
    req.flush({ id: 'page-1234567890', object: 'page' });

    const result = await promise;
    expect(result.name).toBe('Compra Modificada');
    expect(result.cantidad).toBe(89.9);
  });

  it('should delete (archive) a record in Notion API via PATCH with in_trash', async () => {
    service.saveConfig('secret_abc', 'db_123');

    const promise = new Promise<boolean>((resolve) => {
      service.deleteRecord('page-1234567890').subscribe((res) => resolve(res));
    });

    const req = httpTesting.expectOne('http://localhost:3001/api/notion/pages/page-1234567890');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret_abc');
    expect(req.request.body).toEqual({ in_trash: true });
    req.flush({ id: 'page-1234567890', in_trash: true });

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should create a new record in Notion API via POST', async () => {
    service.saveConfig('secret_abc', 'db_123');

    const newRecordData = {
      name: 'Nuevo Ingreso',
      cantidad: 500,
      categoria: 'Otros',
      tipo: 'Ingreso' as const,
      fecha: new Date(2026, 7, 26),
      fechaString: '26/8/2026',
    };

    const promise = new Promise<any>((resolve) => {
      service.createRecord(newRecordData).subscribe((res) => resolve(res));
    });

    const req = httpTesting.expectOne('http://localhost:3001/api/notion/pages');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret_abc');
    expect(req.request.body.parent.database_id).toBe('db_123');
    expect(req.request.body.properties['Descripción'].title[0].text.content).toBe('Nuevo Ingreso');
    expect(req.request.body.properties['Cantidad'].number).toBe(500);
    expect(req.request.body.properties['Tipo'].select.name).toBe('Ingreso');
    expect(req.request.body.properties['Categoría'].select.name).toBe('Otros');
    expect(req.request.body.properties['Fecha'].date.start).toBeTruthy();

    req.flush({ id: 'page-new-created-id', object: 'page' });

    const result = await promise;
    expect(result.id).toBe('page-new-created-id');
    expect(result.name).toBe('Nuevo Ingreso');
    expect(result.cantidad).toBe(500);
  });
});
