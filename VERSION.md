# Changelog

## v0.1.1 (2026-05-30)

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
