const { execSync } = require('child_process');
try {
  execSync('npx @insforge/cli db query "DROP POLICY IF EXISTS \\"Public can view company settings by slug\\" ON company_settings;"', {stdio: 'inherit'});
  execSync('npx @insforge/cli db query "CREATE POLICY \\"Public can view company settings by slug\\" ON company_settings FOR SELECT USING (true);"', {stdio: 'inherit'});
  console.log("Success");
} catch (e) {
  console.error(e);
}
