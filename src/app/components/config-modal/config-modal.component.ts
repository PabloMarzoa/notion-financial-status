import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 relative overflow-hidden">
        
        <!-- Background Gradient Glow -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold tracking-tight text-white">Configuración Notion API</h3>
              <p class="text-xs text-slate-400">Conecta tu base de datos directamente</p>
            </div>
          </div>
          <button (click)="closeModal()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="py-5 space-y-4 text-sm">
          <div>
            <label class="block font-medium text-slate-300 mb-1">
              Notion Internal Integration Token <span class="text-emerald-400">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="tempToken"
              placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition font-mono text-xs"
            />
            <p class="text-xs text-slate-400 mt-1">
              Crea una integración en <a href="https://www.notion.so/my-integrations" target="_blank" class="text-emerald-400 underline hover:text-emerald-300">notion.so/my-integrations</a> y dale acceso a tu base de datos.
            </p>
          </div>

          <div>
            <label class="block font-medium text-slate-300 mb-1">
              Database ID <span class="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="tempDbId"
              placeholder="p. ej. 3b84e723375b80b0a32bce9ccec7385a"
              class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition font-mono text-xs"
            />
            <p class="text-xs text-slate-400 mt-1">
              El ID de 32 caracteres que aparece en la URL de tu base de datos de Notion.
            </p>
          </div>

          <div class="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs text-slate-300 flex items-start space-x-2">
            <span class="text-emerald-400 text-base leading-none">💡</span>
            <span>
              <strong>Nota:</strong> El token se guarda localmente en tu navegador (<code class="text-emerald-300">localStorage</code>) y se envía de forma segura a través del proxy de la app.
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            (click)="closeModal()"
            class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            (click)="saveAndApply()"
            class="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 rounded-xl transition"
          >
            Guardar y Conectar
          </button>
        </div>

      </div>
    </div>
  `
})
export class ConfigModalComponent {
  @Input() initialToken = '';
  @Input() initialDbId = '';
  @Output() save = new EventEmitter<{ token: string; dbId: string }>();
  @Output() close = new EventEmitter<void>();

  tempToken = '';
  tempDbId = '';

  ngOnInit() {
    this.tempToken = this.initialToken;
    this.tempDbId = this.initialDbId;
  }

  saveAndApply() {
    this.save.emit({
      token: this.tempToken,
      dbId: this.tempDbId,
    });
  }

  closeModal() {
    this.close.emit();
  }
}
