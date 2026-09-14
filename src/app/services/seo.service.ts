import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  url?: string;
  imageUrl?: string;
  type?: string;
}

const DEFAULT_SEO: Required<SeoConfig> = {
  title: 'Control de Finanzas | Dashboard Personal sincronizado con Notion',
  description:
    'Gestiona y analiza tus finanzas personales en tiempo real con sincronización bidireccional en Notion o prueba el modo interactivo de demostración.',
  keywords:
    'finanzas personales, dashboard financiero, notion, control de gastos, ahorro, presupuesto, finanzas demo',
  author: 'Pablo Marzoa',
  url: 'https://finanzas.pmarzoa.dev/',
  imageUrl: 'https://finanzas.pmarzoa.dev/icon.svg',
  type: 'website',
};

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  initDefaultMeta(): void {
    this.updateMeta(DEFAULT_SEO);
    this.injectStructuredData();
  }

  updateMeta(config: SeoConfig): void {
    const merged: Required<SeoConfig> = { ...DEFAULT_SEO, ...config };

    this.titleService.setTitle(merged.title);

    // Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: merged.description });
    this.metaService.updateTag({ name: 'keywords', content: merged.keywords });
    this.metaService.updateTag({ name: 'author', content: merged.author });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph / Facebook
    this.metaService.updateTag({ property: 'og:title', content: merged.title });
    this.metaService.updateTag({ property: 'og:description', content: merged.description });
    this.metaService.updateTag({ property: 'og:type', content: merged.type });
    this.metaService.updateTag({ property: 'og:url', content: merged.url });
    this.metaService.updateTag({ property: 'og:image', content: merged.imageUrl });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Control de Finanzas' });
    this.metaService.updateTag({ property: 'og:locale', content: 'es_ES' });

    // Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: merged.title });
    this.metaService.updateTag({ name: 'twitter:description', content: merged.description });
    this.metaService.updateTag({ name: 'twitter:image', content: merged.imageUrl });

    this.updateCanonicalUrl(merged.url);
  }

  updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head?.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  injectStructuredData(): void {
    const scriptId = 'structured-data-financial-app';
    let script = this.document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.document.head?.appendChild(script);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Control de Finanzas',
      alternateName: 'Notion Financial Status',
      url: 'https://finanzas.pmarzoa.dev/',
      description:
        'Aplicación web moderna para control y análisis de finanzas personales sincronizada con bases de datos de Notion y con modo demo interactivo.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires modern web browser.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      author: {
        '@type': 'Person',
        name: 'Pablo Marzoa',
      },
    };

    script.textContent = JSON.stringify(schema, null, 2);
  }
}
