# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
