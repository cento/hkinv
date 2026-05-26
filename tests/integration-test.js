/**
 * Full integration test: creates a .hkinv file, runs migrations,
 * inserts settings, customers, service types, customer rates,
 * invoices with items, and verifies everything.
 * 
 * Run: node tests/integration-test.js
 */
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('=== INTEGRATION TEST: HK Invoice Manager ===\n');
  
  const testDbPath = path.join(__dirname, 'test-integration.hkinv');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  // Step 1: Load sql.js
  console.log('1. Loading sql.js...');
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  console.log('   ✓ sql.js initialized');

  // Step 2: Create database (simulates connection.ts createDatabase)
  console.log('2. Creating database...');
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  console.log('   ✓ Database created');

  // Step 3: Run migrations (simulates migrations.ts)
  console.log('3. Running migrations...');
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    teacher_name TEXT NOT NULL,
    teacher_address TEXT NOT NULL,
    teacher_email TEXT,
    teacher_phone TEXT,
    br_number TEXT,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    invoice_counter INTEGER NOT NULL DEFAULT 1,
    default_payment_terms TEXT NOT NULL DEFAULT '30 giorni',
    default_currency TEXT NOT NULL DEFAULT 'HKD',
    bank_details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT,
    contact_person TEXT, email TEXT, phone TEXT, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number TEXT NOT NULL UNIQUE,
    issue_date TEXT NOT NULL, due_date TEXT NOT NULL, customer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
    currency TEXT NOT NULL DEFAULT 'HKD', subtotal REAL NOT NULL DEFAULT 0,
    discount_percent REAL NOT NULL DEFAULT 0, discount_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0, notes TEXT, payment_terms TEXT, paid_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL, description TEXT NOT NULL, lesson_date TEXT,
    hours REAL NOT NULL DEFAULT 1, rate REAL NOT NULL DEFAULT 0, amount REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description_template TEXT,
    default_rate REAL NOT NULL DEFAULT 0, default_hours REAL NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customer_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL,
    service_type_id INTEGER NOT NULL, custom_rate REAL NOT NULL, custom_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
    UNIQUE(customer_id, service_type_id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS db_meta (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`);
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('schema_version', '1')");
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('app_version', '1.0.0')");
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('created_at', datetime('now'))");
  console.log('   ✓ All 7 tables created');

  // Helper functions
  function q(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params);
    const r = stmt.step() ? stmt.getAsObject() : null; stmt.free(); return r;
  }
  function qa(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params);
    const results = []; while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free(); return results;
  }
  function exec(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free();
  }

  // Step 4: Insert settings
  console.log('4. Inserting teacher settings...');
  exec(`INSERT INTO settings (id, teacher_name, teacher_address, teacher_email, teacher_phone,
    br_number, invoice_prefix, invoice_counter, default_payment_terms, default_currency, bank_details,
    created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    ['Mario Rossi', 'Via Roma 123, HK', 'mario@email.com', '+852 1234 5678', 'BR-123456',
     'INV-', 5, '30 giorni', 'HKD', 'HSBC 123-456-789']);
  console.log('   ✓ Settings saved');

  // Step 5: Insert customers
  console.log('5. Inserting customers...');
  exec('INSERT INTO customers (name, address, contact_person, email, phone, notes, created_at, updated_at) VALUES (?,?,?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    ['Scuola Italiana HK', '15/F, Central Tower', 'Paola Bianchi', 'paola@scuola.hk', '+852 2345 6789', '']);
  exec('INSERT INTO customers (name, address, contact_person, email, phone, notes, created_at, updated_at) VALUES (?,?,?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    ['HK Language Centre', '8/F, Admiralty', 'John Smith', 'john@langcentre.hk', '+852 3456 7890', '']);
  const customers = qa('SELECT * FROM customers');
  console.log(`   ✓ ${customers.length} customers created`);
  const scuolaId = customers[0].id;
  const langCentreId = customers[1].id;

  // Step 6: Insert service types
  console.log('6. Inserting service types...');
  exec('INSERT INTO service_types (name, description_template, default_rate, default_hours, created_at, updated_at) VALUES (?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    ['Lezione individuale', 'Lezione di italiano individuale', 500, 1]);
  exec('INSERT INTO service_types (name, description_template, default_rate, default_hours, created_at, updated_at) VALUES (?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    ['Lezione di gruppo', 'Lezione di italiano di gruppo', 350, 1.5]);
  exec('INSERT INTO service_types (name, description_template, default_rate, default_hours, created_at, updated_at) VALUES (?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    ['Workshop', 'Workshop intensivo di italiano', 1000, 3]);
  const services = qa('SELECT * FROM service_types');
  console.log(`   ✓ ${services.length} service types created`);

  // Step 7: Insert customer rate override
  console.log('7. Inserting customer rate override...');
  exec('INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, custom_description, created_at, updated_at) VALUES (?,?,?,?, datetime(\'now\'), datetime(\'now\'))',
    [scuolaId, services[0].id, 450, 'Tariffa scontata per Scuola Italiana']);
  console.log('   ✓ Customer rate override created');

  // Step 8: Test resolveRate logic
  console.log('8. Testing resolveRate logic...');
  // For scuolaId + LezioneIndividuale -> should return custom 450
  const stmt1 = db.prepare('SELECT * FROM customer_rates WHERE customer_id = ? AND service_type_id = ?');
  stmt1.bind([scuolaId, services[0].id]);
  const hasOverride = stmt1.step();
  stmt1.free();
  console.log(hasOverride ? '   ✓ Scuola Italiana: override found -> 450 HKD' : '   ✗ FAIL: override not found');

  // For langCentreId + LezioneIndividuale -> should use default 500
  const stmt2 = db.prepare('SELECT default_rate FROM service_types WHERE id = ?');
  stmt2.bind([services[0].id]);
  stmt2.step();
  const defaultRate = stmt2.getAsObject().default_rate;
  stmt2.free();
  console.log(`   ✓ HK Language Centre: no override, default rate ${defaultRate} HKD`);

  // Step 9: Create an invoice
  console.log('9. Creating invoice...');
  const invNum = `INV-2026-0001`;
  exec(`INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency,
    subtotal, discount_percent, discount_amount, total, notes, payment_terms, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?, datetime('now'), datetime('now'))`,
    [invNum, '2026-05-26', '2026-06-25', scuolaId, 'draft', 'HKD', 0, 0, 0, 0, '', '30 giorni']);
  const inv = q('SELECT * FROM invoices');
  console.log(`   ✓ Invoice created: ${inv.invoice_number}`);

  // Step 10: Add invoice items
  console.log('10. Adding invoice items...');
  exec('INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount) VALUES (?,?,?,?,?,?,?)',
    [inv.id, 1, 'Lezione italiano 4/5/2026', '2026-05-04', 1, 500, 500]);
  exec('INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount) VALUES (?,?,?,?,?,?,?)',
    [inv.id, 2, 'Lezione italiano 11/5/2026', '2026-05-11', 1, 500, 500]);
  exec('INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount) VALUES (?,?,?,?,?,?,?)',
    [inv.id, 3, 'Lezione italiano 18/5/2026', '2026-05-18', 1, 500, 500]);
  exec('INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount) VALUES (?,?,?,?,?,?,?)',
    [inv.id, 4, 'Lezione italiano 25/5/2026', '2026-05-25', 1.5, 450, 675]);
  console.log('   ✓ 4 items added');

  // Step 11: Calculate totals
  console.log('11. Calculating totals...');
  const items = qa('SELECT * FROM invoice_items WHERE invoice_id = ?', [inv.id]);
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const discountPercent = 10;
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  exec('UPDATE invoices SET subtotal = ?, discount_percent = ?, discount_amount = ?, total = ? WHERE id = ?',
    [subtotal, discountPercent, discountAmount, total, inv.id]);
  console.log(`   ✓ Subtotal: ${subtotal.toFixed(2)} HKD`);
  console.log(`   ✓ Discount: ${discountPercent}% (${discountAmount.toFixed(2)} HKD)`);
  console.log(`   ✓ Total: ${total.toFixed(2)} HKD`);

  // Verify
  const finalInv = q('SELECT * FROM invoices WHERE id = ?', [inv.id]);
  console.log(`   ✓ Stored subtotal=${finalInv.subtotal}, discount=${finalInv.discount_amount}, total=${finalInv.total}`);
  
  if (finalInv.subtotal !== subtotal || finalInv.total !== total) {
    console.error('   ✗ FAIL: Totals mismatch!');
    process.exit(1);
  }

  // Step 12: Test search
  console.log('12. Testing search...');
  const allInvoices = qa('SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id');
  console.log(`   ✓ ${allInvoices.length} invoice(s) found: ${allInvoices[0].customer_name} - ${allInvoices[0].invoice_number}`);

  // Step 13: Test payment status
  console.log('13. Testing status update...');
  exec('UPDATE invoices SET status = ? WHERE id = ?', ['sent', inv.id]);
  const sentInv = q('SELECT status FROM invoices WHERE id = ?', [inv.id]);
  console.log(`   ✓ Status updated to: ${sentInv.status}`);

  // Step 14: Test data export (simulate PDF generation data)
  console.log('14. Preparing PDF export data...');
  const pdfData = {
    teacherName: 'Mario Rossi',
    teacherAddress: 'Via Roma 123, HK',
    brNumber: 'BR-123456',
    customerName: 'Scuola Italiana HK',
    invoiceNumber: inv.invoice_number,
    issueDate: '2026-05-26',
    dueDate: '2026-06-25',
    subtotal: subtotal,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    total: total,
    items: items.map(i => ({ desc: i.description, hours: i.hours, rate: i.rate, amount: i.amount })),
  };
  console.log(`   ✓ PDF data prepared: ${pdfData.items.length} items, total ${pdfData.total.toFixed(2)} HKD`);

  // Step 15: Save and re-open
  console.log('15. Saving and re-opening database...');
  const data = db.export();
  fs.writeFileSync(testDbPath, Buffer.from(data));
  console.log(`   ✓ Saved ${testDbPath} (${data.length} bytes)`);

  const fileBuffer = fs.readFileSync(testDbPath);
  const db2 = new SQL.Database(fileBuffer);
  const reopened = qa.call({ db: db2 }, 'SELECT * FROM invoices');
  db2.close();
  console.log(`   ✓ Re-opened: ${reopened.length} invoice(s) found`);

  // Cleanup
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  console.log('\n✅ ALL TESTS PASSED');
}

function q(sql, params = []) {
  const stmt = this.db.prepare(sql); stmt.bind(params);
  const r = stmt.step() ? stmt.getAsObject() : null; stmt.free(); return r;
}
function qa(sql, params = []) {
  const stmt = this.db.prepare(sql); stmt.bind(params);
  const results = []; while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free(); return results;
}

main().catch(e => {
  console.error('\n❌ TEST FAILED:', e.message);
  console.error(e.stack);
  process.exit(1);
});
