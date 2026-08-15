-- Enable Full Public Read & Essential Public Write RLS for Public Portals, Receipts, Statements, Documents, Payment Links & POS
-- This guarantees that unauthenticated clients and visitors can view their receipts, loans, accounts, vouchers, and statements.

-- 1. Clients
DROP POLICY IF EXISTS "public_portal_clients_read" ON clients;
DROP POLICY IF EXISTS "public_clients_read" ON clients;
CREATE POLICY "public_clients_read" ON clients
  FOR SELECT
  TO public
  USING (true);

-- 2. Bank Accounts (for Payment Links & Public Portals)
DROP POLICY IF EXISTS "public_bank_accounts_read" ON bank_accounts;
CREATE POLICY "public_bank_accounts_read" ON bank_accounts
  FOR SELECT
  TO public
  USING (true);

-- 3. Loans
DROP POLICY IF EXISTS "public_portal_loans_read" ON loans;
DROP POLICY IF EXISTS "public_loans_read" ON loans;
CREATE POLICY "public_loans_read" ON loans
  FOR SELECT
  TO public
  USING (true);

-- 4. Transactions (Receipts & Statement of Account)
DROP POLICY IF EXISTS "public_portal_transactions_read" ON transactions;
DROP POLICY IF EXISTS "public_transactions_read" ON transactions;
CREATE POLICY "public_transactions_read" ON transactions
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "public_transactions_insert" ON transactions;
CREATE POLICY "public_transactions_insert" ON transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 5. Company Settings (Branding & Contact Info)
DROP POLICY IF EXISTS "public_company_settings_read" ON company_settings;
DROP POLICY IF EXISTS "Allow public read company_settings" ON company_settings;
CREATE POLICY "public_company_settings_read" ON company_settings
  FOR SELECT
  TO public
  USING (true);

-- 6. Client Documents
DROP POLICY IF EXISTS "public_portal_client_documents_read" ON client_documents;
DROP POLICY IF EXISTS "public_client_documents_read" ON client_documents;
CREATE POLICY "public_client_documents_read" ON client_documents
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "public_client_documents_insert" ON client_documents;
CREATE POLICY "public_client_documents_insert" ON client_documents
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 7. Vault Collaterals / Guarantees
DROP POLICY IF EXISTS "public_vault_collaterals_read" ON vault_collaterals;
CREATE POLICY "public_vault_collaterals_read" ON vault_collaterals
  FOR SELECT
  TO public
  USING (true);

-- 8. Loan Requests (Merchant POS & Public Applications)
DROP POLICY IF EXISTS "public_loan_requests_read" ON loan_requests;
CREATE POLICY "public_loan_requests_read" ON loan_requests
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "public_loan_requests_insert" ON loan_requests;
CREATE POLICY "public_loan_requests_insert" ON loan_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 9. Merchant Partners (POS Store Details)
DROP POLICY IF EXISTS "public_merchant_partners_read" ON merchant_partners;
CREATE POLICY "public_merchant_partners_read" ON merchant_partners
  FOR SELECT
  TO public
  USING (true);

-- 10. Bank Deposits (Vouchers upload)
DROP POLICY IF EXISTS "public_bank_deposits_read" ON bank_deposits;
CREATE POLICY "public_bank_deposits_read" ON bank_deposits
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "public_bank_deposits_insert" ON bank_deposits;
CREATE POLICY "public_bank_deposits_insert" ON bank_deposits
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 11. Inventory (Equipment & Serial Numbers in Financing)
DROP POLICY IF EXISTS "public_inventory_read" ON inventory;
CREATE POLICY "public_inventory_read" ON inventory
  FOR SELECT
  TO public
  USING (true);

-- 12. Notifications (Activity Alerts)
DROP POLICY IF EXISTS "public_notifications_read" ON notifications;
CREATE POLICY "public_notifications_read" ON notifications
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "public_notifications_insert" ON notifications;
CREATE POLICY "public_notifications_insert" ON notifications
  FOR INSERT
  TO public
  WITH CHECK (true);
