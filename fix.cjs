const { execSync } = require('child_process');
try {
  execSync('npx @insforge/cli db query "DROP POLICY IF EXISTS \\"Admins have full access to roles\\" ON roles;"', {stdio: 'inherit'});
  execSync('npx @insforge/cli db query "DROP POLICY IF EXISTS \\"Employees can view roles\\" ON roles;"', {stdio: 'inherit'});
  execSync('npx @insforge/cli db query "CREATE POLICY \\"Enable all for authenticated users on roles\\" ON roles FOR ALL USING (auth.role() = \'authenticated\');"', {stdio: 'inherit'});
  console.log("Success");
} catch (e) {
  console.error(e);
}
