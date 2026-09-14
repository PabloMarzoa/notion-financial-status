import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styleUrl: './app.css',
})
export class App implements OnInit {
  private seoService = inject(SeoService);
  protected readonly title = signal('finanzas');

  ngOnInit(): void {
    this.seoService.initDefaultMeta();
  }
}

