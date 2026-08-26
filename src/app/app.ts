import { Component, signal } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  template: `<app-dashboard></app-dashboard>`,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('finanzas');
}
