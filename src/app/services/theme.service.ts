import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY_THEME = 'finanzas_theme_preference';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());

    if (this.isBrowser && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        const stored = localStorage?.getItem(STORAGE_KEY_THEME);
        if (!stored) {
          const newTheme: ThemeMode = e.matches ? 'dark' : 'light';
          this.setTheme(newTheme, false);
        }
      });
    }

    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  private getInitialTheme(): ThemeMode {
    if (this.isBrowser && typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  }

  setTheme(theme: ThemeMode, persist = true): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    if (persist && this.isBrowser && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    }
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme, true);
  }

  private applyTheme(theme: ThemeMode): void {
    if (this.isBrowser && typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }
}

