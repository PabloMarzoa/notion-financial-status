import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { SeoService } from './seo.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeoService, Title, Meta],
    });
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize default metadata and inject structured data', () => {
    service.initDefaultMeta();

    expect(titleService.getTitle()).toContain('Control de Finanzas');

    const desc = metaService.getTag('name="description"');
    expect(desc?.content).toContain('finanzas personales');

    const ogTitle = metaService.getTag('property="og:title"');
    expect(ogTitle?.content).toContain('Control de Finanzas');

    const twitterCard = metaService.getTag('name="twitter:card"');
    expect(twitterCard?.content).toBe('summary_large_image');

    const jsonLd = document.getElementById('structured-data-financial-app');
    expect(jsonLd).toBeTruthy();
    expect(jsonLd?.textContent).toContain('WebApplication');
  });

  it('should allow updating metadata dynamically', () => {
    service.updateMeta({
      title: 'Custom Title',
      description: 'Custom description for page',
      url: 'https://finanzas.pmarzoa.dev/demo',
    });

    expect(titleService.getTitle()).toBe('Custom Title');
    expect(metaService.getTag('name="description"')?.content).toBe('Custom description for page');
    expect(metaService.getTag('property="og:url"')?.content).toBe('https://finanzas.pmarzoa.dev/demo');

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://finanzas.pmarzoa.dev/demo');
  });
});
