/**
 * Quick database initialization test
 * Run: node tests/db-test.js
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('1. Loading sql.js WASM...');
  const SQL = await initSqlJs();
  console.log('   ✓ sql.js initialized');

  console.log('2. Creating in-memory database...');
  const db = new SQL.Database();
  console.log('   ✓ Database created');

  console.log('3. Running PRAGMA...');
  db.run('PRAGMA foreign_keys = ON');
  console.log('   ✓ PRAGMA ok');

  console.log('4. Creating table...');
  db.run(`CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  console.log('   ✓ Table created');

  console.log('5. Inserting data...');
  db.run('INSERT INTO test (name) VALUES (?)', ['Hello World']);
  const stmt = db.prepare('SELECT * FROM test');
  while (stmt.step()) {
    const row = stmt.getAsObject();
    console.log('   Row:', JSON.stringify(row));
  }
  stmt.free();
  console.log('   ✓ Insert + select ok');

  console.log('6. Exporting database...');
  const data = db.export();
  console.log(`   ✓ export() OK, size: ${data.length} bytes`);

  console.log('7. Saving to file...');
  const testPath = path.join(__dirname, 'test-output.hkinv');
  fs.writeFileSync(testPath, Buffer.from(data));
  console.log(`   ✓ Saved to ${testPath}`);

  console.log('8. Re-opening saved file...');
  const fileBuffer = fs.readFileSync(testPath);
  const db2 = new SQL.Database(fileBuffer);
  const stmt2 = db2.prepare('SELECT * FROM test');
  while (stmt2.step()) {
    const row = stmt2.getAsObject();
    console.log('   Row:', JSON.stringify(row));
  }
  stmt2.free();
  db2.close();
  console.log('   ✓ Re-open ok');

  // Cleanup
  db.close();
  fs.unlinkSync(testPath);
  console.log('\n✅ ALL TESTS PASSED');
}

main().catch(e => {
  console.error('❌ ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
