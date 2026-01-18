# Changelog

All notable changes to the Fullstack Project Starter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Bootstrap scaffolding:** Complete project setup with quality gates
  - Biome for linting and formatting (replaces ESLint + Prettier)
  - Vitest for testing with inventory drift detection
  - Husky pre-commit hooks for automated quality checks
  - File length checker (300-line limit enforcement)
- **Inventory files:** Drift detection for endpoints, components, and modules
  - `tests/endpoint-inventory.json` - 8 API endpoints
  - `tests/component-inventory.json` - 16 UI + 2 feature components
  - `tests/module-inventory.json` - Core modules by directory
- **Documentation:** Complete docs/ folder structure
  - `ARCHITECTURE.md` - System design and data flow
  - `DEV_ENVIRONMENT.md` - Local development setup
  - `CONTRIBUTING.md` - Code standards and workflow
  - `TROUBLESHOOTING.md` - Debugging methodology
  - `INTEGRATIONS.md` - External service documentation
  - `DECISIONS.md` - Architecture decision records
- **README:** Comprehensive project documentation with setup guide

### Changed
- **Code formatting:** All source files reformatted with Biome
- **TypeScript:** Fixed TableMeta type augmentation in columns.tsx

---

## [0.1.0] - 2026-01-18

### Added
- **Todo CRUD:** Create, read, update, delete todos
- **Authentication:** Clerk integration for user auth
- **Email notifications:** Resend integration for transactional email
  - Email on todo completion (Queue example)
  - Daily summary email (Cron example)
- **CSV Export:** Export todos to R2 bucket
- **Tech stack:**
  - React 19 + React Router v7 (SSR)
  - Hono on Cloudflare Workers
  - Cloudflare D1 (database), R2 (storage), Queues
  - Tailwind CSS v4 + shadcn/ui

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-01-18 | Initial todo app with Cloudflare stack |

---

*Last Updated: 2026-01-18*
