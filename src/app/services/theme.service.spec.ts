import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should initialize with dark or light based on matchMedia when no localStorage', () => {
    service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBeDefined();
    expect(['light', 'dark']).toContain(service.currentTheme());
  });

  it('should load theme from localStorage if stored', () => {
    localStorage.setItem('finanzas_theme_preference', 'light');
    service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should toggle theme and update localStorage and document classes', () => {
    localStorage.setItem('finanzas_theme_preference', 'dark');
    service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe('dark');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
    expect(localStorage.getItem('finanzas_theme_preference')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
    expect(localStorage.getItem('finanzas_theme_preference')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should set theme without persisting when persist is false', () => {
    service = TestBed.inject(ThemeService);
    service.setTheme('light', false);
    expect(service.currentTheme()).toBe('light');
    expect(localStorage.getItem('finanzas_theme_preference')).toBeNull();
  });

  it('should handle matchMedia system preference when localStorage is empty', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('light'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    service = TestBed.inject(ThemeService);
    expect(service.currentTheme()).toBe('light');
    window.matchMedia = originalMatchMedia;
  });
});
