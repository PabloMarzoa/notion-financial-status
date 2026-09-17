# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-09-17

### Fixed
- **Prevent Demo Mode Flash on SSG Load**: Added immediate `<head>` check in `index.html` that marks `html.has-notion-credentials` before initial render, hiding pre-rendered SSG demo banners and demo badge immediately if Notion credentials exist in `localStorage`.

---

## [0.1.2] - 2026-09-17

### Fixed
- **Initial Load State**: Prevented brief flicker of Demo mode (banner and status badge) on application load when Notion credentials are already configured in local storage.

---

## [0.1.1] - 2026-09-17

### Added
- **Feature Branch CI Workflow**: Added `.github/workflows/feature-ci.yml` to automatically run `pnpm install`, coverage tests, and `pnpm run build` on `feature/**` pushes and PRs.

### Changed
- **Package Manager**: Switched package manager from `npm` to `pnpm` (`v12.4.2`), generating `pnpm-lock.yaml` and updating [angular.json](file:///Users/pmarzoa/dev/finanzas/angular.json), [Dockerfile](file:///Users/pmarzoa/dev/finanzas/Dockerfile), [AGENTS.md](file:///Users/pmarzoa/dev/finanzas/AGENTS.md), and skills.

---

## [0.1.0] - 2026-09-14

### Added
- **SEO & Pre-rendering (SSG/SSR)**: Configured static site pre-rendering via `@angular/ssr` and Angular application builder (`main.server.ts`, `app.config.server.ts`).
- **Demo Mode Pre-rendering**: Publicly pre-rendered HTML includes full interactive demo data and KPI statistics so search engines and social crawlers can index real content without blank screens.
- **Dynamic SEO Service**: Implemented `SeoService` to manage page titles, meta descriptions, Open Graph, Twitter Cards, canonical link, and Schema.org `WebApplication` JSON-LD structured data.
- **Search Engine Discovery**: Added `robots.txt` and `sitemap.xml` in public assets.
- **Platform-Safe APIs**: Refactored `ThemeService` and `NotionService` with `PLATFORM_ID` and `isPlatformBrowser` guards to ensure safe SSR execution in Node.js environments.
- **Client Hydration**: Enabled non-destructive client hydration via `provideClientHydration()`.

---

## [0.0.8] - 2026-09-02

### Fixed
- **Responsive Top & Bottom Padding**: Preserved standard responsive paddings on desktop/tablet/mobile screens while combining with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` via CSS `calc()` in `.pt-safe` and `.pb-safe`.

---

## [0.0.7] - 2026-09-02

### Changed
- **Monthly Evolution Grouping**: Grouped monthly evolution comparison directly by the selected time range intervals (e.g. 1 month for current/last month, 3 groups for last 3 months, etc.) in chronological order.

---

## [0.0.6] - 2026-09-02

### Changed
- **Monthly Evolution Window**: Changed monthly evolution chart computation to consistently display the last 4 calendar months (in chronological order) regardless of the specific time filter selected for the KPI summary cards.

---

## [0.0.5] - 2026-09-02

### Fixed
- **iOS Home Screen Safe Area Padding**: Added `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` utilities to prevent header from clipping under the iOS dynamic island / status bar when launched from the Home Screen.

---

## [0.0.4] - 2026-09-02

### Added
- **Previous Month Filter**: Added `"Mes pasado"` (`last_month`) option to time range dropdown filters and computed signals in dashboard.

---

## [0.0.3] - 2026-08-31

### Added
- **User Feedback & Notifications**: Integrated `ToastService` providing real-time visual feedback (success, error, info, warning) for backend operations.
- **Rollback on API Errors**: Added automatic local state rollback if creating, updating, or deleting records fails in Notion.
- **Skills & Versioning Guidelines**: Added mandatory skill for semantic version bumps in `package.json` and English `CHANGELOG.md` maintenance.

---

## [0.0.2] - 2026-08-28

### Added
- **Light & Dark Theme**: Added `ThemeService` with system preference auto-detection (`prefers-color-scheme`), manual toggle in header, and `localStorage` persistence.
- **Tailwind v4 Dark Mode**: Configured `@custom-variant dark` in `styles.css`.
- **Skeleton Loading State**: Added animated skeleton placeholders (`animate-pulse`) for KPI cards, category breakdown, and monthly evolution chart during data fetch.
- **Custom Branding & Icons**: Added custom emerald SVG app icon (`icon.svg`), updated `favicon.ico`, and configured PWA `manifest.json` and `apple-touch-icon`.
- **Title Gradient Animation**: Added smooth left-to-right animated gradient on the main dashboard header title.
- **Standardized Cursors**: Ensured interactive elements (buttons, links, table rows) show `cursor: pointer` while static text uses `cursor: default`.

### Changed
- Simplified header by removing database ID text.
- Converted time interval filter buttons into a dropdown `<select>` aligned to the left alongside category, type, and search filters.

---

## [0.0.1] - 2026-08-26

### Added
- Initial release of the Notion Financial Status dashboard.
- Full CRUD operations with Notion API integration and Express proxy server (`server.js`).
- Dynamic KPI metric calculation (Income, Expenses, Savings Rate, Net Balance).
- Responsive charts for category expense breakdown and monthly cash flow evolution.
- Demo mode with sample mock financial data.
- Docker configuration (`Dockerfile`, `docker-compose.yml`) and automated CI/CD deployment workflow.
