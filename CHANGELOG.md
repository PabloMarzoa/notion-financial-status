# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2026-10-05

### Fixed
- **Category Filter Dropdown Layering & Stacking Context**: Added relative stacking position and `z-30` to the filters bar container and enhanced popover menu animation (`animate-slide-up`), ensuring the dropdown appears on top of KPI summary cards and chart content.
- **Select Chevron Spacing**: Restyled time range and transaction type dropdowns with consistent `appearance-none`, custom SVG chevrons, and balanced right padding (`pr-8`), matching the spacing and look of the category dropdown.
- **Dropdown Outside-Click Dismissal**: Added `@HostListener('document:click')` to automatically dismiss the category filter menu when clicking outside of it.

---

## [0.5.0] - 2026-10-05

### Added
- **Multi-Category Selection Filter**:
  - The filter toolbar now features an interactive multi-select dropdown button indicating the active selection ("Todas las categorías", single category name, or count of selected categories) with toggle options and a clear action.
  - Clicking any category selects or deselects it in the multi-select array.
  - The category breakdown card in [ChartsComponent](file:///Users/pmarzoa/dev/finanzas/src/app/components/charts/charts.component.ts) now preserves all categories for the selected period rather than hiding non-matching items; non-selected categories are softly dimmed while filtered categories are highlighted with borders and badges.
  - Clicking categories in the chart progress bar or category rows toggles their selection state seamlessly.
  - Transactions table, financial summaries, and CSV exports reflect records matching any of the chosen categories.

---

## [0.4.0] - 2026-10-05

### Added
- **CSV Data & Balances Export**: Added full view export to CSV format with UTF-8 BOM encoding for Excel compatibility. Includes a top summary section with current filter balances (Total Ingresos, Total Gastos, Gasto Recurrente, Gasto Único, Balance Neto, Tasa de Ahorro, and record count) followed by the complete list of filtered transactions (`Fecha,Concepto,Categoría,Tipo,Importe (€)`).
- **Dedicated Actions Toolbar Card**: Relocated main action buttons (`Nuevo Movimiento`, `Exportar CSV`, `Refrescar`, `Configurar`) to a dedicated toolbar card with the same visual style as the filters bar and placed immediately above it.

---

## [0.3.1] - 2026-10-05

### Changed
- **Node.js LTS Upgrade**: Updated runtime and CI environments to Node.js 24 (`v24.21.0`), adding [.nvmrc](file:///Users/pmarzoa/dev/finanzas/.nvmrc) and updating [Dockerfile](file:///Users/pmarzoa/dev/finanzas/Dockerfile) (`node:24-alpine`) and [feature-ci.yml](file:///Users/pmarzoa/dev/finanzas/.github/workflows/feature-ci.yml).
- **Dependencies Upgrade**: Upgraded all project dependencies to latest versions, including Angular packages to `22.2.1`, Vitest to `5.0.3`, Tailwind CSS to `4.3.3`, PostCSS to `8.5.28`, Prettier to `3.9.9`, and pinned TypeScript to `~6.0.3` for Angular compiler compatibility.

---

## [0.3.0] - 2026-10-04

### Added
- **Custom Date Range Filter**: Added a `custom` time range option allowing users to filter movements by specific start and end dates with date pickers, boundary validation, and reset capabilities.
- **New Categories Support**: Added support for `Google`, `YouTube`, `Netflix`, `Préstamo personal`, `Apple`, and `Efectivo` in database schema, models, charts, and modal selectors.
- **Notion Database Pagination**: Implemented recursive pagination in `NotionService` via `expand` and `reduce` operators to retrieve all database records beyond Notion's default 100-record limit.

### Changed
- **Unified Categories & Color Palette**: Centralized category definitions (`CATEGORIES_LIST`) and color assignments (`CATEGORY_COLORS`) in `financial-record.model.ts`, merging predefined categories with any dynamic record categories for dropdowns and filter selectors.

---

## [0.2.0] - 2026-10-04

### Added
- **Filter State Persistence**: Automatically persist active filters (`timeRange`, `selectedCategory`, `selectedType`, and `searchQuery`) to `localStorage` across page reloads using Angular reactive effects with SSR compatibility.

### Changed
- **Newest-to-Oldest Transaction Ordering**: Sorted the transactions table in descending chronological order so the most recent movements appear first.
- **Reload on Edit and Delete**: Automatically trigger data reload (`loadData()`) upon updating or deleting a movement, keeping local and remote state in sync.

---

## [0.1.5] - 2026-09-17

### Fixed
- **Test Runner Configuration & Timeouts in Docker/CI**: Added `vitest.config.ts` configuring `testTimeout` and `hookTimeout` to 30000ms and hooked it to `@angular/build:unit-test` runner via `--runner-config vitest.config.ts`, resolving 5000ms test timeouts during containerized ARM64 Docker builds.
- **Silenced Error Logging in Dashboard Spec**: Mocked `console.error` in dashboard test simulating backend rollback on update failure to keep CI output clean.

---

## [0.1.4] - 2026-09-17

### Added
- **Interactive Category Filtering from Charts**: Clicking on any category in the "Gastos por Categoría" breakdown list or progress bar now applies it as the active category filter (or toggles back to "Todas las categorías" on second click), including visual active indicator badges and highlight styles.

---

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
