# Changelog

## v0.3.0 (2026-06-01)

### PWA — Progressive Web App
- **Install button**: "Install App" in sidebar and WelcomePage, works even in dev mode via fallback timer
- **File handler**: double-click `.hkinv` in Explorer → PWA opens and imports the archive automatically
- **App shortcuts**: right-click on desktop icon → New Invoice, Dashboard, Customers
- **Web Share API**: "Share" button on invoice page opens native share sheet (email, WhatsApp, etc.) with PDF attached
- **Service worker**: auto-unregisters on localhost to prevent stale chunk errors, disabled in dev mode
- **Ctrl+C fix**: server now stops reliably via `CancelKeyPress` handler + `Pending()` polling, no "Terminate batch job?" prompt

### Tests (354 total, +12)
- `useFileHandler` (4): launch consumer registration, unavailable, file handling, empty files
- Manifest validation (5): required fields, file_handlers, shortcuts, URLs, icons
- Web Share API (3): feature detection, canShare, file sharing

---

## v0.2.0 (2026-06-01)

### PWA — Progressive Web App
- **Installable**: manifest.json + service worker — install as standalone desktop app from Chrome/Edge
- **Offline support**: Workbox precaches all 30 assets (2.7 MB including sql.js WASM)
- **Auto-update**: new version downloads in background, applied on next refresh
- **Icons**: 192×192 and 512×512 blue PNG icons
- **Theme**: standalone display mode, theme color #1a73e8, dark background
- **Ctrl+C fix**: serve.ps1 now stops gracefully with Ctrl+C

---

## v0.1.7 (2026-06-01)

### Major
- **HK$ currency formatting everywhere**: all amounts now show `HK$1,500.00` (with proper grouping) instead of `1500.00 HKD`
- **Invoice number collision detection**: `generateInvoiceNumber` now checks existing invoices before assigning a number — deleted numbers are never reused
- **Undo delete for invoices**: after deleting an invoice, a snackbar with "Undo" button appears for 5 seconds to recover the deleted invoice
- **Error handling**: all `console.error` catch blocks now show user-facing toast notifications via `formatError()`

### Tests (342 total, +15)
- `formatError` (5): Error.message, strings, JSON objects, numbers, circular references
- `useUndoDelete` hook (5): schedule, undo, timeout, close, no-op safety
- Invoice number collision (5): free number, skip existing, skip multiple, never reuse deleted, many collisions

---

## v0.1.6 (2026-05-31)

### Major Features
- **Type-safe dbService**: all `Record<string, unknown>` and `as any` casts replaced with real TypeScript interfaces from database modules
- **Archive/Backup separation**: opening a file no longer auto-configures it as backup; archive and backup are fully independent concepts
- **Dashboard archive & backup info**: shows archive name and backup name (if configured) at the top of the Dashboard
- **Backup warnings**: Dashboard alerts when no backup is configured, or when backup file is the same as the archive
- **Onboarding wizard**: 3-step guided dialog (teacher info → first customer → first invoice) appears after creating a new archive
- **Dashboard empty state**: CTA to create first invoice when no invoices exist

### Validation
- **Invoice item validation**: empty items, zero hours, or negative rates now block save (was defined but never called)
- **GridRowSelectionModel fix**: batch selection in InvoicesPage now correctly uses MUI X v9 `{type, ids: Set}` API

### UI/UX
- **"Cloud Backup" renamed to "Backup & Sync"**: better description — it's a local file that can be synced via cloud folders
- **Backup name interpolation fixed**: "Backing up to: {name}" now shows the actual filename
- **ESLint: 58→0 warnings**: all dead code, duplicate imports, empty catch blocks, and react-refresh issues resolved
- **useEffect dependencies**: 4 missing dependency warnings fixed (CustomerRatesTable, Layout, InvoiceEditPage)

### Tests (288→327, +39)
- Dashboard: archive section, backup warnings, empty state, backup configured/not configured
- WelcomePage: archive/backup independence, no auto-backup on file open
- OnboardingWizard: 8 tests (render, 3 steps, skip, finish, navigation)
- ServiceTypesPage: delete blocked when in use, allowed when free
- CustomersPage: render, new button
- Layout BackupIndicator: renders when db is open
- ErrorBoundary: crash catching, reload, custom fallback
- formatHKD: 5 tests for proper HK$ formatting
- Various utility tests (generateInvoiceNumber, calculateDueDate, parseHKD, formatDate)

### Dev Experience
- `.reasonix/` added to `.gitignore`
- 0 ESLint errors, 0 ESLint warnings, 0 TSC errors
- 327 tests passing across 44 files

---

## v0.1.4 (2026-05-30)

### New Features
- **Tax reports**: HK tax year report (Apr 1 – Mar 31) with annual/quarterly views. Shows teacher info, customer breakdown, and individual invoice details. Export CSV or PDF with professional layout.
- **Invoice PDF preview**: Preview invoices as PDF in a dialog before exporting. Available from the invoice edit page toolbar.
- **Batch operations**: Select multiple invoices via checkboxes and mark as paid/sent or export all selected as PDFs in one click.
- **Cloud backup page**: Dedicated settings page to set up, change, or remove backup location. "Save to Drive" opens the native file picker (Google Drive folder if installed) or downloads directly as fallback.

### UI Improvements
- **Error Boundary**: If a page crashes, shows a recovery message with Reload button instead of a white screen. Resets automatically when navigating to a different page.
- **Loading state**: Invoice edit page shows a spinner overlay while loading data or saving.

### Bug Fixes
- **Tax year filter**: default now shows the correct current HK tax year (2025-04-01 → 2026-03-31 or as applicable)
- **Missing paid_date**: old invoices marked as paid without a date are now included in the tax report
- **DataGrid checkbox crash**: fixed "currentSelection.ids is not iterable" error when using batch selection
- **PDF arrow character**: replaced Unicode → with dash in tax PDF (jsPDF doesn't support Unicode arrows)
- **Backup fallback**: when the file picker isn't available, the app now directly downloads the database file
- **ErrorBoundary closing tag**: fixed missing JSX closing tag that caused Vite build to fail

### Tests
- 38 new tests across 9 new files (280 total)
- Full coverage for: InvoiceItemsTable, CustomerRatesTable, CustomerDetailPage, ErrorBoundary, PDFPreviewDialog, TaxReportsPage, CloudBackupPage, dbService, batch operations

---

## v0.1.3 (2026-05-30)

### Bug Fixes
- **Continue with button**: fixed double text and interpolation issue; shows the most recent archive filename from history
- **Invoice number field**: no longer overwritten by auto-generated number when user has already typed manually
- **Invoice number auto-generated**: respects user edits — won't overwrite if user already typed a custom number

### UI Polish
- **First-run guidance**: WelcomePage shows a quick guide explaining how to create/open an archive
- **Continue with button**: shows the actual archive filename (most recent from history or backup name)

---

## v0.1.2 (2026-05-30)

### Bug Fixes
- **Backup indicator now works**: toolbar correctly shows when backup is configured (was reading wrong localStorage key)
- **No more data loss on rapid saves**: database writes are serialized, preventing race conditions
- **Payment tracking works**: `paid_date` is now set when an invoice status changes to "Paid", and cleared when changed away
- **File picker no longer hangs**: if you cancel the file dialog, the UI recovers immediately instead of blocking forever
- **No memory leaks**: creating/opening a new archive properly closes the previous database instance
- **Draft count is accurate**: cancelled invoices are no longer counted as drafts on the Dashboard
- **Database opens faster**: migrations no longer re-run on every startup (was a regression from the initial webapp migration)
- **Backup doesn't slow you down**: auto-backup is debounced — saving an invoice with 5 items triggers 1 backup instead of 9
- **Form detects real changes only**: creating a new invoice from template doesn't falsely show "unsaved changes"
- **Settings Save button is visible**: the icon-only button now has a "Save" label
- **Full bilingual support**: all UI strings use translations (Italian/English)
- **CSP no longer blocks sql.js**: added `'unsafe-eval'` to Content-Security-Policy — required by WebAssembly

### Improved Performance
- **Faster page loads**: code is split into separate chunks (React, MUI, PDF) — only what you need loads
- **Faster navigation**: each page loads on demand via `React.lazy()` — no more downloading the whole app at once
- **Installation is faster**: removed orphaned Playwright dependency (saves ~50MB in `node_modules`)

### Security
- **Content-Security-Policy** headers added to protect against XSS
- **X-Content-Type-Options** and **X-Frame-Options** headers added

### Developer Experience
- ESLint upgraded with React hooks and React Refresh plugins
- SQLite version unpinned to receive minor updates
- Added test coverage configuration
- Lint checks run in CI
- Removed 9 obsolete Electron/Python files

### Accessibility
- **Skip to content** link for keyboard users
- **Aria labels** on all icon-only buttons (dark mode, backup, delete, export)
- **DataGrid rows** navigable with Enter/click (not just double-click)

### UI Polish
- **Filters collapse**: search and status always visible; date range, customer, and price are in an expandable section
- **DataGrid fills the screen**: no more fixed 500px height — list pages use the full viewport
- **Delete confirmation for custom rates**: clicking Delete on a customer rate now asks for confirmation
- **Email validation**: the customer dialog validates email format before saving
- **Settings inline errors**: required fields show red highlight and error message when left empty
- **User-friendly error messages**: new `formatError()` utility prevents raw stack traces in toast notifications
- **Better Visual Studio Code settings**: updated `.vscode/settings.json` for a smoother development experience

### New Tests (38 added, 242 total)
- Database connection lifecycle (`isDatabaseOpen`, `getDbPath`, `getDatabase`)
- File System Access pure functions (`supportsFSA`, localStorage helpers)
- Invoice auto-numbering and UNIQUE constraint retry logic
- Format utilities edge cases (`parseHKD`, `todayISO`, `calculateDueDate`)
- Validator edge cases (phone, BR number, hours/rate boundaries)
- All database CRUD tests now call production functions instead of raw SQL

---

## v0.1.0 (2026-05-27)

Initial release. Browser-based webapp (migrated from Electron).

- Create, manage, and export HKD invoices
- Customer address book with per-customer rate overrides
- Service type rate cards (global profiles)
- PDF export with Hong Kong IRD compliance
- Dashboard with financial summary
- Dark/Light mode toggle
- Bilingual Italian/English
- OPFS browser storage + File System Access API backup
- Auto-backup every 5 minutes
- PowerShell TCP server launcher (no dependencies)
- 196 unit tests
