import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { FinancialRecord, TransactionType, Category } from '../models/financial-record.model';

const NOTION_API_VERSION = '2022-06-28';
const STORAGE_KEY_TOKEN = 'finanzas_notion_api_token';
const STORAGE_KEY_DB_ID = 'finanzas_notion_db_id';

@Injectable({
  providedIn: 'root',
})
export class NotionService {
  private http = inject(HttpClient);

  readonly apiKey = signal<string>(this.getStoredApiKey());
  readonly databaseId = signal<string>(this.getStoredDatabaseId());
  readonly isConnected = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  private lastPropertiesSchema: Record<string, any> = {};

  private getStoredApiKey(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY_TOKEN) || '';
    }
    return '';
  }

  private getStoredDatabaseId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY_DB_ID) || '';
    }
    return '';
  }

  saveConfig(token: string, dbId: string): void {
    const cleanToken = token.trim();
    const cleanDbId = dbId.trim();

    if (typeof window !== 'undefined' && window.localStorage) {
      if (cleanToken) {
        localStorage.setItem(STORAGE_KEY_TOKEN, cleanToken);
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }

      if (cleanDbId) {
        localStorage.setItem(STORAGE_KEY_DB_ID, cleanDbId);
      } else {
        localStorage.removeItem(STORAGE_KEY_DB_ID);
      }
    }

    this.apiKey.set(cleanToken);
    this.databaseId.set(cleanDbId);
    this.errorMessage.set(null);
  }

  hasConfiguredCredentials(): boolean {
    return !!this.apiKey().trim() && !!this.databaseId().trim();
  }

  fetchDatabaseRecords(): Observable<FinancialRecord[]> {
    const token = this.apiKey().trim();
    const dbId = this.databaseId().trim();

    if (!token || !dbId) {
      this.errorMessage.set('Configura el Notion API Token y el Database ID para conectar.');
      return of(this.getMockRecords());
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    });

    const url = `http://localhost:3001/api/notion/databases/${dbId}/query`;

    return this.http.post<any>(url, {}, { headers }).pipe(
      map((response) => {
        this.isLoading.set(false);
        this.isConnected.set(true);
        const results = response?.results || [];
        if (results.length > 0 && results[0].properties) {
          this.lastPropertiesSchema = { ...results[0].properties };
        }
        return this.parseNotionResults(results);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        let errorMsg = 'Error al conectar con Notion';
        if (err.status === 401) {
          errorMsg = 'API Token no válido o sin permisos en la base de datos.';
        } else if (err.status === 404) {
          errorMsg = 'Base de datos no encontrada. Revisa el ID o comparte la base con la integración.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        this.errorMessage.set(errorMsg);
        console.error('Notion API Error:', err);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  updateRecord(record: FinancialRecord): Observable<FinancialRecord> {
    const token = this.apiKey().trim();

    if (!token || !record.id || record.id.length < 10) {
      // Si estamos en modo Mock o no hay token real
      return of(record);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    });

    const url = `http://localhost:3001/api/notion/pages/${record.id}`;

    // Construir properties dinámicamente según lo que tenía el objeto original si existe
    const properties: any = {};
    const rawProps = record.raw?.properties || {};

    // 1. Nombre
    const titleKey = Object.keys(rawProps).find((k) => rawProps[k]?.type === 'title') || 'Name';
    properties[titleKey] = {
      title: [
        {
          text: {
            content: record.name,
          },
        },
      ],
    };

    // 2. Cantidad / Importe
    const cantidadKey = this.findPropertyKey(rawProps, ['cantidad', 'importe', 'amount', 'precio', 'monto']) || 'Cantidad';
    const existingAmountType = rawProps[cantidadKey]?.type || 'number';
    if (existingAmountType === 'number') {
      properties[cantidadKey] = { number: record.cantidad };
    } else {
      properties[cantidadKey] = {
        rich_text: [{ text: { content: record.cantidad.toString() } }],
      };
    }

    // 3. Categoría
    const catKey = this.findPropertyKey(rawProps, ['categoria', 'categoría', 'category']) || 'Categoría';
    const existingCatType = rawProps[catKey]?.type || 'select';
    if (existingCatType === 'select') {
      properties[catKey] = { select: { name: record.categoria } };
    } else if (existingCatType === 'multi_select') {
      properties[catKey] = { multi_select: [{ name: record.categoria }] };
    } else {
      properties[catKey] = { rich_text: [{ text: { content: record.categoria } }] };
    }

    // 4. Tipo
    const tipoKey = this.findPropertyKey(rawProps, ['tipo', 'type']) || 'Tipo';
    const existingTipoType = rawProps[tipoKey]?.type || 'select';
    if (existingTipoType === 'select') {
      properties[tipoKey] = { select: { name: record.tipo } };
    } else if (existingTipoType === 'status') {
      properties[tipoKey] = { status: { name: record.tipo } };
    } else {
      properties[tipoKey] = { rich_text: [{ text: { content: record.tipo } }] };
    }

    // 5. Fecha
    const fechaKey = this.findPropertyKey(rawProps, ['fecha', 'date']) || 'Fecha';
    const existingFechaType = rawProps[fechaKey]?.type || 'date';
    const formattedIsoDate = this.formatIsoDate(record.fecha);
    if (existingFechaType === 'date') {
      properties[fechaKey] = { date: { start: formattedIsoDate } };
    } else {
      properties[fechaKey] = { rich_text: [{ text: { content: record.fechaString } }] };
    }

    const payload = { properties };

    return this.http.patch<any>(url, payload, { headers }).pipe(
      map((response) => {
        return {
          ...record,
          raw: response,
        };
      }),
      catchError((err) => {
        console.error('Error updating page in Notion:', err);
        return throwError(() => err);
      })
    );
  }

  deleteRecord(recordId: string): Observable<boolean> {
    const token = this.apiKey().trim();

    if (!token || !recordId || recordId.length < 10) {
      // Si estamos en modo Mock o no hay token real
      return of(true);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    });

    const url = `http://localhost:3001/api/notion/pages/${recordId}`;
    const payload = { in_trash: true };

    return this.http.patch<any>(url, payload, { headers }).pipe(
      map(() => true),
      catchError((err) => {
        console.error('Error archiving/deleting page in Notion:', err);
        return throwError(() => err);
      })
    );
  }

  createRecord(recordData: Omit<FinancialRecord, 'id' | 'raw'>): Observable<FinancialRecord> {
    const token = this.apiKey().trim();
    const dbId = this.databaseId().trim();

    const newLocalId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const fallbackRecord: FinancialRecord = {
      ...recordData,
      id: newLocalId,
    };

    if (!token || !dbId) {
      return of(fallbackRecord);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    });

    const url = `http://localhost:3001/api/notion/pages`;
    const formattedIsoDate = this.formatIsoDate(recordData.fecha);

    const schema = this.lastPropertiesSchema;

    // Detectar clave del título (priorizar coincidencia exacta de 'Descripción', 'Name', o la detectada en el schema)
    const titleKey =
      (schema ? Object.keys(schema).find((k) => schema[k]?.type === 'title') : null) ||
      'Descripción';

    // Detectar clave de Cantidad
    const cantidadKey =
      (schema ? this.findPropertyKey(schema, ['cantidad', 'importe', 'amount', 'precio', 'monto']) : null) ||
      'Cantidad';
    const amountType = schema[cantidadKey]?.type || 'number';

    // Detectar clave de Categoría
    const catKey =
      (schema ? this.findPropertyKey(schema, ['categoria', 'categoría', 'category']) : null) ||
      'Categoría';
    const catType = schema[catKey]?.type || 'select';

    // Detectar clave de Tipo
    const tipoKey =
      (schema ? this.findPropertyKey(schema, ['tipo', 'type']) : null) ||
      'Tipo';
    const tipoType = schema[tipoKey]?.type || 'select';

    // Detectar clave de Fecha
    const fechaKey =
      (schema ? this.findPropertyKey(schema, ['fecha', 'date']) : null) ||
      'Fecha';
    const fechaType = schema[fechaKey]?.type || 'date';

    const properties: any = {
      [titleKey]: {
        title: [
          {
            type: 'text',
            text: { content: recordData.name },
          },
        ],
      },
    };

    if (amountType === 'number') {
      properties[cantidadKey] = { number: recordData.cantidad };
    } else {
      properties[cantidadKey] = {
        rich_text: [{ type: 'text', text: { content: recordData.cantidad.toString() } }],
      };
    }

    if (catType === 'select') {
      properties[catKey] = { select: { name: recordData.categoria } };
    } else if (catType === 'multi_select') {
      properties[catKey] = { multi_select: [{ name: recordData.categoria }] };
    } else {
      properties[catKey] = { rich_text: [{ type: 'text', text: { content: recordData.categoria } }] };
    }

    if (tipoType === 'select') {
      properties[tipoKey] = { select: { name: recordData.tipo } };
    } else if (tipoType === 'status') {
      properties[tipoKey] = { status: { name: recordData.tipo } };
    } else {
      properties[tipoKey] = { rich_text: [{ type: 'text', text: { content: recordData.tipo } }] };
    }

    if (fechaType === 'date') {
      properties[fechaKey] = { date: { start: formattedIsoDate } };
    } else {
      properties[fechaKey] = { rich_text: [{ type: 'text', text: { content: recordData.fechaString } }] };
    }

    const payload = {
      parent: {
        database_id: dbId,
      },
      properties,
    };

    return this.http.post<any>(url, payload, { headers }).pipe(
      map((response) => {
        return {
          ...recordData,
          id: response.id || newLocalId,
          raw: response,
        };
      }),
      catchError((err) => {
        console.error('Error creating page in Notion:', err);
        return throwError(() => err);
      })
    );
  }

  private findPropertyKey(props: any, candidateNames: string[]): string | null {
    const keys = Object.keys(props);
    for (const cand of candidateNames) {
      const match = keys.find((k) => k.toLowerCase().trim() === cand.toLowerCase());
      if (match) return match;
    }
    return null;
  }

  private parseNotionResults(results: any[]): FinancialRecord[] {
    return results.map((item) => {
      const props = item.properties || {};

      // 1. Nombre / Concepto
      const titlePropKey = Object.keys(props).find(
        (key) => props[key]?.type === 'title'
      );
      const name =
        titlePropKey && props[titlePropKey]?.title?.length > 0
          ? props[titlePropKey].title.map((t: any) => t.plain_text).join('')
          : 'Sin título';

      // 2. Cantidad (Número o Texto con comas/puntos)
      let cantidad = 0;
      const cantidadProp = this.findProperty(props, ['cantidad', 'importe', 'amount', 'precio', 'monto']);
      if (cantidadProp) {
        if (cantidadProp.type === 'number') {
          cantidad = cantidadProp.number || 0;
        } else if (cantidadProp.type === 'rich_text') {
          const rawText = cantidadProp.rich_text?.map((t: any) => t.plain_text).join('') || '';
          cantidad = this.parseNumericString(rawText);
        } else if (cantidadProp.type === 'formula') {
          cantidad = cantidadProp.formula?.number || 0;
        }
      }

      // 3. Categoría (select, multi_select, rich_text)
      let categoria: Category = 'Otros';
      const categoriaProp = this.findProperty(props, ['categoria', 'categoría', 'category']);
      if (categoriaProp) {
        if (categoriaProp.type === 'select') {
          categoria = categoriaProp.select?.name || 'Otros';
        } else if (categoriaProp.type === 'multi_select' && categoriaProp.multi_select?.length) {
          categoria = categoriaProp.multi_select[0]?.name || 'Otros';
        } else if (categoriaProp.type === 'rich_text') {
          categoria = categoriaProp.rich_text?.map((t: any) => t.plain_text).join('') || 'Otros';
        }
      }

      // 4. Tipo: "Gasto recurrente", "Gasto único", "Ingreso"
      let tipo: TransactionType = 'Gasto único';
      const tipoProp = this.findProperty(props, ['tipo', 'type']);
      if (tipoProp) {
        let val = '';
        if (tipoProp.type === 'select') {
          val = tipoProp.select?.name || '';
        } else if (tipoProp.type === 'rich_text') {
          val = tipoProp.rich_text?.map((t: any) => t.plain_text).join('') || '';
        } else if (tipoProp.type === 'status') {
          val = tipoProp.status?.name || '';
        }

        if (val.toLowerCase().includes('ingreso')) {
          tipo = 'Ingreso';
        } else if (val.toLowerCase().includes('recurrente')) {
          tipo = 'Gasto recurrente';
        } else {
          tipo = 'Gasto único';
        }
      }

      // 5. Fecha: en formato DD/MM/YYYY o date ISO
      let fecha = new Date();
      let fechaString = '';
      const fechaProp = this.findProperty(props, ['fecha', 'date']);
      if (fechaProp) {
        if (fechaProp.type === 'date' && fechaProp.date?.start) {
          fecha = new Date(fechaProp.date.start);
          fechaString = this.formatDate(fecha);
        } else if (fechaProp.type === 'rich_text') {
          const rawDate = fechaProp.rich_text?.map((t: any) => t.plain_text).join('') || '';
          fecha = this.parseDateString(rawDate);
          fechaString = rawDate;
        } else if (fechaProp.type === 'created_time') {
          fecha = new Date(fechaProp.created_time);
          fechaString = this.formatDate(fecha);
        }
      }

      return {
        id: item.id,
        name,
        cantidad: Math.abs(cantidad),
        categoria,
        fecha,
        fechaString: fechaString || this.formatDate(fecha),
        tipo,
        raw: item,
      };
    });
  }

  private findProperty(props: any, candidateNames: string[]): any {
    const key = this.findPropertyKey(props, candidateNames);
    return key ? props[key] : null;
  }

  private parseNumericString(val: string): number {
    if (!val) return 0;
    let clean = val.replace(/[^0-9.,-]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  private parseDateString(str: string): Date {
    if (!str) return new Date();
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  formatDate(d: Date): string {
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMockRecords(): FinancialRecord[] {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return [
      {
        id: '1',
        name: 'Nómina Empresa',
        cantidad: 2450.0,
        categoria: 'Nómina',
        fecha: new Date(currentYear, currentMonth, 1),
        fechaString: `1/${currentMonth + 1}/${currentYear}`,
        tipo: 'Ingreso',
      },
      {
        id: '2',
        name: 'Alquiler Piso',
        cantidad: 750.0,
        categoria: 'Piso',
        fecha: new Date(currentYear, currentMonth, 2),
        fechaString: `2/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '3',
        name: 'Compra Mercadona',
        cantidad: 86.45,
        categoria: 'Comida',
        fecha: new Date(currentYear, currentMonth, 5),
        fechaString: `5/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '4',
        name: 'Suscripción Netflix & Disney',
        cantidad: 22.98,
        categoria: 'Netflix',
        fecha: new Date(currentYear, currentMonth, 10),
        fechaString: `10/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '5',
        name: 'Gasolina Repsol',
        cantidad: 65.2,
        categoria: 'Gasolina',
        fecha: new Date(currentYear, currentMonth, 12),
        fechaString: `12/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '6',
        name: 'Seguro Médico Sanitas',
        cantidad: 54.0,
        categoria: 'Sanitas',
        fecha: new Date(currentYear, currentMonth, 15),
        fechaString: `15/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '7',
        name: 'Cena Restaurante con Amigos',
        cantidad: 48.5,
        categoria: 'Ocio',
        fecha: new Date(currentYear, currentMonth, 18),
        fechaString: `18/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '8',
        name: 'Pedido Amazon',
        cantidad: 39.99,
        categoria: 'Amazon',
        fecha: new Date(currentYear, currentMonth, 20),
        fechaString: `20/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '9',
        name: 'Almacenamiento iCloud',
        cantidad: 2.99,
        categoria: 'iCloud',
        fecha: new Date(currentYear, currentMonth, 22),
        fechaString: `22/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '10',
        name: 'Factura Móvil Fibra y Teléfono',
        cantidad: 42.0,
        categoria: 'Teléfono',
        fecha: new Date(currentYear, currentMonth, 24),
        fechaString: `24/${currentMonth + 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '11',
        name: 'Nómina Mes Anterior',
        cantidad: 2450.0,
        categoria: 'Nómina',
        fecha: new Date(currentYear, currentMonth - 1, 1),
        fechaString: `1/${currentMonth}/${currentYear}`,
        tipo: 'Ingreso',
      },
      {
        id: '12',
        name: 'Alquiler Piso Mes Anterior',
        cantidad: 750.0,
        categoria: 'Piso',
        fecha: new Date(currentYear, currentMonth - 1, 2),
        fechaString: `2/${currentMonth}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
      {
        id: '13',
        name: 'Revisión y Taller Coche',
        cantidad: 210.0,
        categoria: 'Coche',
        fecha: new Date(currentYear, currentMonth - 1, 14),
        fechaString: `14/${currentMonth}/${currentYear}`,
        tipo: 'Gasto único',
      },
      {
        id: '14',
        name: 'Seguro Coche Anual',
        cantidad: 320.0,
        categoria: 'Seguro coche',
        fecha: new Date(currentYear, currentMonth - 2, 8),
        fechaString: `8/${currentMonth - 1}/${currentYear}`,
        tipo: 'Gasto recurrente',
      },
    ];
  }
}
