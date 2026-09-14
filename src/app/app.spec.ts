import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { SeoService } from './services/seo.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the app and initialize SEO', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const seo = TestBed.inject(SeoService);
    const spy = vi.spyOn(seo, 'initDefaultMeta');

    fixture.detectChanges();
    expect(app).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('should render router outlet and dashboard component', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain('Control de Finanzas');
  });
});

