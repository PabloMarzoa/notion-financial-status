import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinancialRecord,
  TransactionType,
  Category,
  CATEGORIES_LIST,
} from '../../models/financial-record.model';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {
  @Input({ required: true }) record!: FinancialRecord;
  @Output() save = new EventEmitter<FinancialRecord>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  readonly categories = CATEGORIES_LIST;
  readonly types: TransactionType[] = ['Gasto único', 'Gasto recurrente', 'Ingreso'];

  editName = '';
  editCantidad = 0;
  editCategoria: Category = 'Otros';
  editTipo: TransactionType = 'Gasto único';
  editDateString = ''; // YYYY-MM-DD for HTML input type="date"

  isSaving = signal<boolean>(false);
  isConfirmingDelete = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  ngOnInit() {
    if (this.record) {
      this.editName = this.record.name;
      this.editCantidad = this.record.cantidad;
      this.editCategoria = this.record.categoria;
      this.editTipo = this.record.tipo;
      this.editDateString = this.formatToInputDate(this.record.fecha);
    }
  }

  private formatToInputDate(d: Date): string {
    const validDate = new Date(d);
    if (isNaN(validDate.getTime())) return new Date().toISOString().split('T')[0];
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  saveChanges() {
    if (!this.editName.trim()) return;

    this.isSaving.set(true);

    const parts = this.editDateString.split('-');
    let parsedDate = new Date();
    if (parts.length === 3) {
      parsedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }

    const day = parsedDate.getDate();
    const month = parsedDate.getMonth() + 1;
    const year = parsedDate.getFullYear();
    const formattedDisplayDate = `${day}/${month}/${year}`;

    const updatedRecord: FinancialRecord = {
      ...this.record,
      name: this.editName.trim(),
      cantidad: Math.abs(Number(this.editCantidad) || 0),
      categoria: this.editCategoria,
      tipo: this.editTipo,
      fecha: parsedDate,
      fechaString: formattedDisplayDate,
    };

    this.save.emit(updatedRecord);
  }

  promptDelete() {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete() {
    this.isConfirmingDelete.set(false);
  }

  confirmDelete() {
    this.isDeleting.set(true);
    this.delete.emit(this.record.id);
  }

  closeModal() {
    this.close.emit();
  }
}
