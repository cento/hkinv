# HK Invoice Manager

Invoice management for freelance teachers in Hong Kong. Desktop app for Windows to create, manage, and export HKD invoices for lessons at private schools. Compliant with Hong Kong IRD requirements. Bilingual Italian/English.

## Features

### Invoices
- Create invoices pre-filled from the previous one (customer, line items structure)
- Dynamic line items with description, date, hours, hourly rate — amount calculated automatically
- Percentage discount on subtotal
- Status workflow: Draft → Sent → Paid → Cancelled
- Duplicate any invoice with a new progressive number
- Combined filters by date range, customer, status, price range, invoice number
- Auto-numbering: `PREFIX-YEAR-XXXX` with a progressive counter

### Customers
- Full CRUD address book
- Customer detail page with invoice history
- **Per-customer rate overrides** on top of global rate cards

### Payment Profiles
- Create rate cards per service type: "Individual lesson", "Group lesson", "Workshop"
- Each profile has: name, default description, hourly rate, default hours
- When adding a line item, selecting a service type auto-fills description, rate, and hours
- Override any rate per customer

### Teacher Profile
- Name, address, email, phone
- Business Registration Number (optional — required by some HK schools)
- Customizable invoice prefix
- Default payment terms
- Bank details for PDF output

### PDF Export
- Professional A4 layout with "FATTURA"/"INVOICE" header (matches UI language)
- Supplier info (teacher data + BR number if set)
- Customer info
- Line items table: description, date, hours, rate, amount
- Subtotal, discount, total in HKD
- Payment terms and bank details in footer

### Internationalization
- Full Italian and English translations (200+ keys each)
- Instant toggle from the sidebar
- Language persists across restarts
- PDF follows the selected UI language

### Data Portability & Backup
- All data in a single `.hkinv` file (SQLite)
- **Automatic daily backup**: `myarchive.backup-YYYY-MM-DD.hkinv`
- Copy the file to USB/drive/email — open it on another PC
- **App and data are separate**: update the app, your data stays intact

### Dark Mode
- Toggle light/dark theme from the sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, MUI v9 |
| Desktop | Electron 42 (contextIsolation) |
| Database | sql.js 1.11 (SQLite via WASM, `.hkinv` files) |
| PDF | jsPDF 4 + jspdf-autotable |
| i18n | react-i18next + i18next |
| Routing | react-router-dom v7 |
| Build | Electron Forge 7 + Vite 6 |
| Tests | Vitest (unit) + Playwright (E2E) |

## Getting Started

```powershell
git clone <repo-url>
cd hkinv
npm install
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch app in dev mode (hot reload) |
| `npm run package` | Package into `out/hkinv-win32-x64/` |
| `npm run make` | Generate `.exe` installer in `out/make/squirrel.windows/x64/` |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:all` | Unit + E2E |

## First Run

1. Launch the app
2. Click **"Create new archive"**
3. Choose a name and location for your `.hkinv` file
4. Fill in the teacher profile wizard
5. Start adding customers and invoices!

Already have a `.hkinv` file? Use **"Open existing archive"**.

## Updating Without Losing Data

App and data are fully separated. When a new version is released:

1. Install the new app (replaces app files, does not touch your data)
2. Open your `.hkinv` file with the new app
3. The built-in migration system checks `db_meta.schema_version` and runs any needed additive SQL migrations automatically — no data is ever altered or removed.

## Hong Kong Invoice Compliance

Hong Kong has no mandatory invoice format (no VAT/GST). For a freelance sole proprietor, an IRD-compliant invoice includes:

| Field | Source |
|-------|--------|
| "Invoice" heading | PDF header |
| Unique invoice number | `invoice_number` |
| Issue date | `issue_date` |
| Supplier name/address | `settings` |
| Customer name/address | `customers` |
| Service description | `invoice_items` |
| Amount in HKD | `total` |
| Payment terms | `payment_terms` |
| BR Number (optional) | `settings.br_number` |

Record retention: 7 years (IRD requirement).

## License

MIT
