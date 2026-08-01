const fs = require('fs');
const { execSync } = require('child_process');

let sql = fs.readFileSync('refactor_arch.sql', 'utf8');
// Remove comments
sql = sql.replace(/--.*/g, '');

const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

for (const q of queries) {
  try {
    const escaped = q.replace(/"/g, '\\"').replace(/\n/g, ' ');
    console.log(`Running: ${escaped.substring(0, 50)}...`);
    execSync(`npx @insforge/cli db query "${escaped};"`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed on query: ${q}`);
  }
}
console.log("Migration complete.");
