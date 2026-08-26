import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySummary, FinancialStats } from '../../models/financial-record.model';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6">
      
      <!-- Card: Desglose por Categorías -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base 2xl:text-lg font-semibold text-white tracking-tight">Gastos por Categoría</h3>
            <p class="text-xs text-slate-400">Distribución de los gastos en el período</p>
          </div>
          <span class="text-xs font-mono px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 whitespace-nowrap">
            {{ stats?.categoryBreakdown?.length || 0 }} categorías
          </span>
        </div>

        <div *ngIf="stats?.categoryBreakdown && stats!.categoryBreakdown.length > 0; else noCategories">
          <!-- Stacked Progress Bar -->
          <div class="h-3.5 sm:h-4 w-full bg-slate-800 rounded-full flex overflow-hidden mb-5 sm:mb-6 shadow-inner">
            <div
              *ngFor="let cat of stats!.categoryBreakdown"
              [style.width.%]="cat.percentage"
              [style.background-color]="cat.color"
              [title]="cat.category + ': ' + cat.percentage + '% (' + cat.total.toFixed(2) + '€)'"
              class="h-full transition-all duration-500 hover:opacity-80 relative group"
            ></div>
          </div>

          <!-- Category List & Badges (Adaptive grid on Ultrawide) -->
          <div class="space-y-2.5 sm:space-y-3 max-h-72 sm:max-h-80 2xl:max-h-96 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            <div
              *ngFor="let cat of stats!.categoryBreakdown"
              class="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 transition"
            >
              <div class="flex items-center space-x-2.5 sm:space-x-3">
                <span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md shadow-sm flex-shrink-0" [style.background-color]="cat.color"></span>
                <span class="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px] sm:max-w-[180px] 2xl:max-w-none">{{ cat.category }}</span>
                <span class="text-[11px] sm:text-xs text-slate-400">({{ cat.count }} movs)</span>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-xs sm:text-sm font-semibold text-white font-mono">{{ cat.total | number : '1.2-2' }} €</div>
                <div class="text-[10px] sm:text-xs text-slate-400">{{ cat.percentage }}%</div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noCategories>
          <div class="py-12 text-center text-slate-500 text-xs sm:text-sm">
            No hay gastos registrados en este período.
          </div>
        </ng-template>
      </div>

      <!-- Card: Evolución Mensual -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base 2xl:text-lg font-semibold text-white tracking-tight">Evolución Mensual</h3>
            <p class="text-xs text-slate-400">Comparativa Ingresos vs Gastos</p>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs">
            <span class="flex items-center space-x-1">
              <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400"></span>
              <span class="text-slate-300">Ingresos</span>
            </span>
            <span class="flex items-center space-x-1">
              <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400"></span>
              <span class="text-slate-300">Gastos</span>
            </span>
          </div>
        </div>

        <div *ngIf="stats?.monthlyBreakdown && stats!.monthlyBreakdown.length > 0; else noMonths">
          <div class="space-y-3 sm:space-y-4 max-h-72 sm:max-h-80 2xl:max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div
              *ngFor="let m of stats!.monthlyBreakdown"
              class="p-2.5 sm:p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/80"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-300">{{ m.label }}</span>
                <span
                  class="text-[11px] sm:text-xs font-mono font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
                  [ngClass]="m.balance >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
                >
                  Balance: {{ m.balance >= 0 ? '+' : '' }}{{ m.balance | number : '1.2-2' }} €
                </span>
              </div>

              <!-- Bar visual -->
              <div class="space-y-1.5 text-xs">
                <div class="flex items-center space-x-2">
                  <span class="w-12 sm:w-14 text-slate-400 text-[10px] sm:text-[11px] flex-shrink-0">Ingresos:</span>
                  <div class="flex-1 bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
                    <div
                      class="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      [style.width.%]="getBarWidth(m.ingresos, maxMonthlyAmount())"
                    ></div>
                  </div>
                  <span class="w-16 sm:w-20 text-right font-mono text-emerald-400 text-[10px] sm:text-[11px] flex-shrink-0">
                    +{{ m.ingresos | number : '1.0-0' }} €
                  </span>
                </div>

                <div class="flex items-center space-x-2">
                  <span class="w-12 sm:w-14 text-slate-400 text-[10px] sm:text-[11px] flex-shrink-0">Gastos:</span>
                  <div class="flex-1 bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
                    <div
                      class="bg-rose-400 h-full rounded-full transition-all duration-500"
                      [style.width.%]="getBarWidth(m.gastos, maxMonthlyAmount())"
                    ></div>
                  </div>
                  <span class="w-16 sm:w-20 text-right font-mono text-rose-400 text-[10px] sm:text-[11px] flex-shrink-0">
                    -{{ m.gastos | number : '1.0-0' }} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noMonths>
          <div class="py-12 text-center text-slate-500 text-xs sm:text-sm">
            Sin datos mensuales suficientes en este rango.
          </div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(51, 65, 85, 0.8);
      border-radius: 4px;
    }
  `]
})
export class ChartsComponent {
  @Input() stats: FinancialStats | null = null;

  maxMonthlyAmount = computed(() => {
    if (!this.stats?.monthlyBreakdown) return 100;
    let max = 100;
    for (const m of this.stats.monthlyBreakdown) {
      if (m.ingresos > max) max = m.ingresos;
      if (m.gastos > max) max = m.gastos;
    }
    return max;
  });

  getBarWidth(amount: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(0, (amount / max) * 100));
  }
}
