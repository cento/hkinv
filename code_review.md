# Project Review — HK Invoice Manager v0.1.1

Full-stack audit performed on 2026-05-30. Last updated: 2026-05-30 (fix round 1 completed on `dev` branch, commit `c2127c1`). Scope: architecture, source code, tests, CI/CD, UX, security, and feature analysis.

---

## Overall Score: 7.2 / 10 (+0.9 after fix round 1)

Solid foundation with clean architecture. All critical and important bugs fixed, test coverage significantly improved. Remaining items are architecture improvements, UX polish, new features, and tech debt.

| Category | Score | Issues | Fixed |
|----------|-------|--------|-------|
| Critical bugs | 🔴 | 5 | **✅ 5/5** |
| Important bugs | 🟠 | 7 | **✅ 7/7** |
| Architecture | 🟡 | 5 | 0/5 |
| Code quality | 🟢 | 8 | 0/8 |
| UX/UI | 🔵 | 11 | 0/11 |
| New features | 🟣 | 11 | 0/11 |

---

## 🔴 CRITICAL BUGS — ✅ All Fixed (commit c2127c1)

### 1. `backup.ts` reads wrong localStorage key → backup indicator broken forever
**File:** `src/database/backup.ts:58,67`

**Fix applied:** Delegated to `getStoredBackupFileName()` from `fsa.ts` instead of hardcoded localStorage key. `isBackupConfigured()` and `getBackupFileName()` now use the same key (`BACKUP_META_KEY = 'hkinv-backup-meta'`) as the rest of the app.

---

### 2. `saveDatabase()` discards async OPFS write promise → data loss
**File:** `src/database/connection.ts:19-23`

**Fix applied:** Added write queue (`saveQueue: Promise<void>`) that serializes all OPFS writes. Each call to `saveDatabase()` chains behind the previous one, preventing races. Error caught via `.catch()`. `closeIfOpen()` awaits queue before closing old db instance.

---

### 3. `paid_date` never set → payment tracking silently broken
**Files:** `src/pages/InvoiceEditPage.tsx`, `src/database/invoices.ts`

**Fix applied:** In `handleSave()`, when `finalStatus === 'paid'`, `paid_date = new Date().toISOString().split('T')[0]` is added to update/create data. When status changes away from `'paid'`, `paid_date` is set to `null`.

---

### 4. File picker fallback Promise never resolves on cancel → UI blocked
**File:** `src/database/fsa.ts:96-109`

**Fix applied:** Added `window.addEventListener('focus', onFocus)` that resolves the Promise with `null` after 500ms (if `onchange` hasn't already fired). Cleanup function removes the listener to prevent double resolution.

---

### 5. Create/Open database don't close previous instance → WASM memory leak
**File:** `src/database/connection.ts:25-33, 47-58`

**Fix applied:** Added `closeIfOpen()` helper that awaits the save queue, closes the current `db` instance, and nulls all references. Called at the top of both `createDatabase()` and `openDatabase()`.

---

## 🟠 IMPORTANT BUGS — ✅ All Fixed (commit c2127c1)

### 6. Dashboard draft count includes cancelled invoices
**File:** `src/pages/DashboardPage.tsx:101`

**Fix applied:** Added `totalDraft` calculated with `.filter(i => i.status === 'draft').length` instead of the formula `totalInvoices - totalSent - totalPaid` which counted cancelled as drafts.

---

### 7. Migrations re-run every database open (missing `stmt.step()`)
**File:** `src/database/migrations.ts:98-104`

**Fix applied:** `queryOne()` now calls `stmt.step()` before `getAsObject()`. If no row is found, returns `undefined` immediately. `getAppliedVersion()` correctly returns the stored version instead of `NaN`.

---

### 8. Full DB export + backup on every single CRUD call
**File:** `src/services/dbService.ts:10-14`

**Fix applied:** Backup debounced with 2-second timer — only the last `notifySaveAll()` in a burst triggers a backup. Removed redundant `saveDatabase()` call from `notifySaveAll()` (individual DB functions already call it).

---

### 9. Form snapshot captured before template items load → always "dirty"
**File:** `src/pages/InvoiceEditPage.tsx:109-128, 165-169`

**Fix applied:** Added `templateReady` and `dataReady` state flags. Snapshot effect now waits for `templateReady === true` (new invoice) or `dataReady === true` (existing invoice) before capturing. Template sets `setTemplateReady(true)` in its `finally` block. Existing invoice loader sets `setDataReady(true)` after all data arrives.

---

### 10. Settings save button has no visible text
**File:** `src/pages/SettingsPage.tsx:114-115`

**Fix applied:** Added `{t('common.save')}` between the Button tags.

---

### 11. `writeOPFSFile` leaks writable stream on error
**File:** `src/database/opfs.ts:23-29`

**Fix applied:** Wrapped `writable.write(data)` in try/finally — `writable.close()` is always called, even if write throws.

---

### 12. Hardcoded English strings bypass i18n
**Files:** `src/pages/WelcomePage.tsx:143,155,100`, `src/components/Layout.tsx:53-54,85,106-109`

**Fix applied:** Added 8 new i18n keys to `it.json`/`en.json` (`welcome.continueWith`, `welcome.continueExisting`, `welcome.setBackup`, `welcome.backupConfigured`, `layout.saved`, `layout.autoBackupDone`, `layout.backupNotConfigured`, `layout.saveToFile`, `layout.backupEnabled`). Replaced all hardcoded strings with `t()` calls. Added `useTranslation()` to `BackupIndicator` component which was missing it.

---

## 🟡 ARCHITECTURE IMPROVEMENTS

### 13. 1.2 MB single JS chunk
**File:** `vite.config.ts`

The entire app (React, MUI, routers, i18next, sql.js glue) bundles into one file. Vite warns about chunks >500kB. On slower connections, first paint is delayed.

**Fix:**
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
        'vendor-pdf': ['jspdf', 'jspdf-autotable'],
      }
    }
  }
}
```

---

### 14. No route-level lazy loading
**File:** `src/App.tsx`

All 8 page components are statically imported. Users on the Dashboard still download the code for InvoiceEditPage, ServiceTypesPage, etc.

**Fix:** Use `React.lazy()` and `<Suspense>`:
```tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
```

---

### 15. Database test files test SQL, not production code
**Files:** `tests/unit/database/customers.test.ts`, `invoices.test.ts`, `serviceTypes.test.ts`, `customerRates.test.ts`, `settings.test.ts`

These files import `createTestDb` and helpers, then write raw SQL. They never call `createCustomer()`, `getAllCustomers()`, etc. They prove that SQLite works, not that the application functions work.

**Fix:** Rewrite tests to call actual production functions. The `ipc-integration.test.ts` already demonstrates the correct pattern.

---

### 16. Helpers.ts duplicates the entire schema
**File:** `tests/unit/database/helpers.ts`

`createTestDb()` manually creates all 7 tables with inline SQL. It imports `runMigrations` but never calls it. When a migration adds a column, the developer must remember to update `helpers.ts` separately or tests will use a stale schema.

**Fix:** Replace the inline schema with a call to `runMigrations(db)`.

---

### 17. Zero test coverage for fsa.ts and connection.ts
**Files:** `src/database/fsa.ts` (11 exported functions, 0 tests), `src/database/connection.ts` (8 functions, 0 tests via API)

The existing `connection.test.ts` tests OPFS save/load but never calls `createDatabase()`, `openDatabase()`, `importDatabase()`, `closeDatabase()`, `isDatabaseOpen()`, or `getDbPath()`.

**Fix:** Add unit tests for pure functions; mock File System Access API for fsa.ts. At minimum, `getStoredBackupFileName()`, `clearStoredBackupHandle()`, and `supportsFSA()` are pure logic.

---

## 🟢 CODE QUALITY IMPROVEMENTS

### 18. ESLint toolchain 2 major versions behind
- ESLint: 8.57.1 (latest: 9.x)
- typescript-eslint: 5.62.0 (latest: 8.x)
- Missing `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- `.eslintrc.json` references `plugin:import/electron` (dead since Electron is gone)

---

### 19. sql.js pinned without caret: `"sql.js": "1.11"`
Latest is 1.14.1. Missing bugfixes and WASM performance improvements.

---

### 20. Orphaned `@playwright/test` dependency
No E2E tests, no `playwright.config.ts`, no `test:e2e` script. Adds ~50MB to `node_modules`.

---

### 21. No lint step in CI
`build.yml` runs `tsc`, `vitest`, and `vite build` but never `npm run lint`. Lint errors can merge undetected.

---

### 22. No test coverage configuration
No `@vitest/coverage-v8`, no coverage `provider` in `vitest.config.ts`. Impossible to measure or enforce coverage.

---

### 23. No Content-Security-Policy
Neither `serve.ps1` headers nor `index.html` meta tags include CSP. Defense-in-depth against XSS is absent.

---

### 24. `dbService.ts` uses `as any` on every call
All `data: Record<string, unknown>` parameters are cast: `customers.createCustomer(data as any)`. TypeScript type safety is bypassed at the service boundary. Invalid data shapes crash at runtime.

---

### 25. AGENTS.md + SETUP-GITHUB.md describe deleted Electron architecture
Both files reference `src/main.ts`, `forge.config.ts`, IPC bridge, Playwright E2E tests, and Squirrel installer. None of this exists anymore. These are the local reference docs for AI assistants and developers.

---

### 26. Dead files and directories
- `vite.renderer.config.ts` — leftover Electron config, nothing references it
- `main.py`, `pyproject.toml`, `.python-version`, `uv.lock` — Python project template scaffolding unrelated to this TypeScript app
- `resources/`, `scripts/`, `src/types/` — empty directories from Electron architecture
- `tsconfig.json` defines `paths: { "@/*": ["src/*"] }` but nothing uses `@/` imports, and Vite has no `resolve.alias` for it

---

## 🔵 UX/UI IMPROVEMENTS

### 27. No onboarding wizard
A first-time user sees "Create new archive" but has no idea what to do next. There's no guided walkthrough.

**Implement:** 3-step stepper after creation: (1) Your profile, (2) First customer, (3) First invoice.

---

### 28. No global search / command palette
`useKeyboardShortcuts` exists but is never imported in any page. The AGENTS.md mentions `Ctrl+F` for search, but nothing implements it.

**Implement:** Cmd+K dialog with fuzzy matching across invoices (by number) and customers (by name).

---

### 29. No undo for destructive actions
Deleting an invoice or customer is permanent. Only a success toast is shown.

**Implement:** 5-second "Undo" action in the snackbar, keeping the deleted record in memory.

---

### 30. No React Error Boundary
A render-time error causes a white screen. No recovery UI.

**Implement:** `<ErrorBoundary>` with recovery buttons (Reload page, Export data).

---

### 31. InvoiceEditPage has no loading state
When opening an existing invoice, the form renders empty while async data loads. Users briefly see blank fields.

**Implement:** Skeleton or `CircularProgress` overlay until all data (invoice, items, customers, settings) arrives.

---

### 32. Dashboard has no empty state
A new user sees "0" across all stat cards with no guidance.

**Implement:** When `totalInvoices === 0`, show a welcome CTA with "Create your first invoice" button.

---

### 33. DataGrid fixed height of 500px
List pages use `sx={{ height: 500 }}`. On small screens (768px), 500px leaves no room for filters and headers. On large screens, space is wasted.

**Implement:** `height: calc(100vh - 280px)` or flex-based fill.

---

### 34. InvoiceFilters horizontal overflow at 1080px
7 filter fields at ~1080px total, wrapped on smaller screens.

**Implement:** Collapsible "Advanced filters" section — show search + status by default, expand for date/amount ranges.

---

### 35. No confirmation for deleting customer rates
`CustomerRatesTable.tsx` deletes rates instantly on click with no dialog.

**Implement:** Add `ConfirmDialog`.

---

### 36. No email validation in CustomerDialog
The email field has `type="email"` but no regex validation. Users can save `foo@`.

**Implement:** Email regex validation.

---

### 37. No validation for invoice items before save
`validateInvoiceItem` exists in `validators.ts` but is never called. Users can save items with empty description and 0 hours/rate.

**Implement:** Validate each item in `handleSave`, highlight problematic rows.

---

### 38. Silent load failures
`InvoicesPage`, `CustomersPage`, `DashboardPage`, `SettingsPage` all catch load errors with `console.error(err)` only. The user sees an empty page with no explanation.

**Implement:** Show error state with "Failed to load data. Retry?" button.

---

### 39. Raw error messages: `String(err)`
All pages display errors as `String(err)` which can produce `[object Object]` or stack traces.

**Implement:** `formatError()` utility to extract meaningful messages.

---

### 40. Keyboard shortcuts defined but never wired
`useKeyboardShortcuts.ts` exports a hook, but no page calls it. Shortcuts from AGENTS.md (Ctrl+N, Ctrl+S, Ctrl+E, Ctrl+F) don't work.

**Implement:** Wire shortcuts in each page.

---

### 41. Missing aria-labels on icon-only buttons
Delete buttons in `InvoiceItemsTable`, `ServiceTypesPage`, `CustomerRatesTable`, dark mode toggle, and backup/save buttons have no `aria-label`.

**Implement:** Add `aria-label={t(...)}` to all icon-only buttons.

---

### 42. No skip-to-content link
Keyboard users must tab through the sidebar to reach main content.

**Implement:** Visually-hidden "Skip to content" link.

---

### 43. Settings: no inline validation feedback
Clicking Save with empty required fields silently does nothing — no error message, no red highlight.

**Implement:** Add `error` and `helperText` to required TextFields.

---

### 44. DataGrid navigation not keyboard-accessible
`InvoicesPage` uses `onRowDoubleClick`. Keyboard users cannot trigger navigation.

**Implement:** Add "Open" button in actions column, or handle `Enter` key.

---

## 🟣 NEW FEATURES

### 45. Recurring invoices
Auto-generate invoices on a schedule for the same students/schools each month. Add `recurring` flag and `interval` to schema. Generate drafts for the current period based on previous month's template.

**Value for user:** Eliminates monthly manual work.

---

### 46. Direct email send
Pre-fill email client with PDF attachment. `mailto:` with subject/body, or SMTP config in settings.

**Value for user:** 4-step workflow → 1 click.

---

### 47. Payment reminders
Templates for overdue invoice reminders (polite → firm). Badge in sidebar for overdue count. Email generation.

**Value for user:** Solves the #1 freelancer pain point.

---

### 48. Tax reports (HK Salaries Tax)
Annual/quarterly income summary for HK tax year (Apr 1 – Mar 31). Exportable CSV/PDF. Filter by `paid_date`.

**Value for user:** Saves hours of spreadsheet work at tax time.

---

### 49. Multi-currency support
USD, EUR, CNY in addition to HKD. Exchange rate settings. HKD-equivalent totals on dashboard.

**Value for user:** International schools increasingly pay in non-HKD currencies.

---

### 50. Lesson / hours tracking
Calendar-based lesson log: date, duration, customer, service type. Import into invoices automatically.

**Value for user:** Bridges the biggest workflow gap — lessons are tracked separately (notebook, spreadsheet) and manually transferred to invoices.

---

### 51. Command palette (Cmd+K)
Fuzzy search across invoices and customers. Instant navigation. Power-user pattern.

**Value for user:** Speed and discoverability.

---

### 52. Inline PDF preview
Render PDF in a dialog before exporting. Use `pdf.js` or canvas from jsPDF output.

**Value for user:** Confidence before sending.

---

### 53. Batch operations
Select multiple invoices, mark as paid, export PDFs, or send reminders in bulk.

**Value for user:** Month-end efficiency.

---

### 54. Data import from CSV/Excel
Import customers and past invoices with column mapping UI and validation.

**Value for user:** Migration path from spreadsheet-based invoicing.

---

### 55. Cloud backup
Google Drive / Dropbox / OneDrive sync. OAuth integration. Survives device loss.

**Value for user:** Data safety without manual file management.

---

## 📊 TEST COVERAGE MAP — 240 tests, 28 files

### Well-covered (production functions tested directly)
- `ipc-integration.test.ts` — settings CRUD, customers CRUD, invoices CRUD, invoice items, service types, customer rates, validators, paid_date lifecycle
- `invoices-advanced.test.ts` — createInvoiceWithNumber auto-numbering, counter increment, UNIQUE retry (10 attempts), getLastInvoiceForCustomer null, search by status/date, recalculation with discount, empty items array
- `connection.test.ts` — module state before/after init (`isDatabaseOpen`, `getDbPath`, `getDatabase` throws)
- `fsa.test.ts` — pure functions (`supportsFSA`, `getStoredBackupFileName`, `clearStoredBackupHandle`, `downloadBlob`)
- `format.test.ts` — all 5 exported functions covered (formatHKD, formatDate, formatDateISO, parseHKD, todayISO, calculateDueDate edge cases)
- `validators.test.ts` — all 5 validators with edge cases (phone format, BR length, empty/spaces, zero/negative values)

### Partially covered (raw SQL, not production functions)
- `customers.test.ts` — tests SQL, not `createCustomer()` / `getAllCustomers()` / etc.
- `invoices.test.ts` — tests SQL, not `createInvoice()` / `recalculateInvoiceTotals()` / etc.
- `serviceTypes.test.ts` — tests SQL, not production functions
- `customerRates.test.ts` — tests SQL, not `setCustomerRate()` / `resolveRate()`
- `settings.test.ts` — 1 of 6 tests uses production functions

### Still not covered
- `src/services/dbService.ts` — 30+ methods, 0 tests
- `src/components/InvoiceItemsTable.tsx` — 0 tests
- `src/components/CustomerRatesTable.tsx` — 0 tests
- `src/pages/CustomerDetailPage.tsx` — 0 tests
- WASM-dependent connection.ts functions (`createDatabase`, `openDatabase`, `importDatabase`, `closeDatabase`, `saveDatabase`) — blocked by sql.js WASM path in vitest

### Acts as a test for production code (despite name)
- `ipc-integration.test.ts` — should be renamed to `database-integration.test.ts`

---

## 🔐 SECURITY

| Issue | Severity |
|-------|----------|
| No CSP headers in `serve.ps1` or `index.html` | Medium |
| No `X-Content-Type-Options` / `X-Frame-Options` | Low |
| `serve.ps1` — `Cache-Control: no-cache` even on hashed assets | Low |
| Missing font MIME types in `serve.ps1` (`.woff`, `.woff2`, `.ttf`) | Low |
| Zero npm vulnerabilities (positive finding) | — |

---

## ⚡ PERFORMANCE

| Issue | Impact |
|-------|--------|
| 1.2 MB single JS chunk | High — delays first paint on slow connections |
| No lazy loading for pages | Medium — unused page code always downloaded |
| No compression plugin for build | Low — uncompressed assets served by `serve.ps1` |
| `html2canvas` bundled via jsPDF (202 KB) | Low — dead weight if not using `jspdf.html()` |
| Full DB export on every CRUD call | Medium — UI jank during save operations |
| Mixed static + dynamic imports of `connection.ts` | Low — dynamic imports are pointless, module already in main chunk |

---

## 🏗️ TECH DEBT SUMMARY

| Item | Effort | Status |
|------|--------|--------|
| AGENTS.md describes Electron (must rewrite) | 30 min | ⏳ open |
| ESLint + typescript-eslint upgrade | 1-2 hours | ⏳ open |
| Remove dead Python/files/directories | 15 min | ⏳ open |
| Convert `as any` casts to proper types in `dbService.ts` | 1 hour | ⏳ open |
| Rewrite database tests to call production functions | 2-3 hours | ⏳ open |
| Add tests for `fsa.ts` and `connection.ts` | 2 hours | ✅ **done** (38 new tests) |
| Add coverage configuration | 15 min | ⏳ open |
| Fix `tsconfig.json` (dead paths, redundant rules) | 15 min | ⏳ open |
| Remove orphaned `@playwright/test` | 5 min | ⏳ open |

---

## 📋 PRIORITY MATRIX — Post-fix round 1

```
                     HIGH IMPACT                LOW IMPACT
HIGH URGENCY    ⚡ Arch 13-17               🟢 Code quality 18-26
                🔵 UX 27-32                 🔵 UX 38-44

LOW URGENCY     🟣 New features 45-55       (remaining)
```

All 12 bugs (🔴1-5, 🟠6-12) resolved. Remaining work is architecture, UX, tech debt, and features.

---

This review was generated by a full-stack audit of 52 source files, build configuration, CI/CD workflow, and UX analysis across all pages and components.

**Updated 2026-05-30 — Fix round 1 on `dev` (c2127c1):** 12/12 bugs fixed, 38 new regression tests added (202 → 240). Remaining items: architecture improvements, UX polish, new features, and tech debt cleanup.
