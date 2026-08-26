import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinancialRecord,
  TransactionType,
  Category,
  CATEGORIES_LIST,
} from '../../models/financial-record.model';

@Component({
  selector: 'app-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-modal.component.html',
})
export class CreateModalComponent implements OnInit {
  @Output() save = new EventEmitter<Omit<FinancialRecord, 'id' | 'raw'>>();
  @Output() close = new EventEmitter<void>();

  readonly categories = CATEGORIES_LIST;
  readonly types: TransactionType[] = ['Gasto único', 'Gasto recurrente', 'Ingreso'];

  name = '';
  cantidad: number | null = null;
  categoria: Category = 'Comida';
  tipo: TransactionType = 'Gasto único';
  dateString = ''; // YYYY-MM-DD

  isSaving = signal<boolean>(false);

  ngOnInit() {
    this.dateString = this.formatToInputDate(new Date());
  }

  private formatToInputDate(d: Date): string {
    const validDate = new Date(d);
    if (isNaN(validDate.getTime())) return new Date().toISOString().split('T')[0];
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  createRecord() {
    if (!this.name.trim() || this.cantidad === null || this.cantidad <= 0) return;

    this.isSaving.set(true);

    const parts = this.dateString.split('-');
    let parsedDate = new Date();
    if (parts.length === 3) {
      parsedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }

    const day = parsedDate.getDate();
    const month = parsedDate.getMonth() + 1;
    const year = parsedDate.getFullYear();
    const formattedDisplayDate = `${day}/${month}/${year}`;

    const newRecord: Omit<FinancialRecord, 'id' | 'raw'> = {
      name: this.name.trim(),
      cantidad: Math.abs(Number(this.cantidad) || 0),
      categoria: this.categoria,
      tipo: this.tipo,
      fecha: parsedDate,
      fechaString: formattedDisplayDate,
    };

    this.save.emit(newRecord);
  }

  closeModal() {
    this.close.emit();
  }
}
