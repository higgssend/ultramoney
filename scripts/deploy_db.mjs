import { execSync } from 'child_process';
import fs from 'fs';

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  
  `CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    assigned_route TEXT,
    performance INTEGER DEFAULT 0,
    active_routes INTEGER DEFAULT 0,
    collections NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own employees" ON public.employees FOR ALL USING (auth.uid() = lender_id);`,

  `CREATE TABLE IF NOT EXISTS public.collector_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    collector_id TEXT,
    collector_name TEXT,
    client_id TEXT,
    client_name TEXT,
    loan_id TEXT,
    date TEXT,
    status TEXT,
    promised_date TEXT,
    amount_collected NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.collector_visits ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own collector visits" ON public.collector_visits FOR ALL USING (auth.uid() = lender_id);`,

  `CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own client notes" ON public.client_notes FOR ALL USING (auth.uid() = lender_id);`,

  `CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own client documents" ON public.client_documents FOR ALL USING (auth.uid() = lender_id);`,

  `CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    initial_amount NUMERIC NOT NULL,
    expected_amount NUMERIC,
    final_cash_count NUMERIC,
    difference NUMERIC,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own cash shifts" ON public.cash_shifts FOR ALL USING (auth.uid() = lender_id);`,

  `CREATE TABLE IF NOT EXISTS public.loan_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    duration_weeks INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    loan_type TEXT NOT NULL,
    closing_cost NUMERIC,
    closing_cost_mode TEXT,
    payment_day INTEGER,
    request_date TEXT NOT NULL,
    status TEXT NOT NULL,
    collateral JSONB,
    loan_destination TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own loan requests" ON public.loan_requests FOR ALL USING (auth.uid() = lender_id);`
];

async function run() {
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Executing query ${i + 1}/${statements.length}...`);
    try {
      // Pass the SQL string directly to the command (escaping double quotes)
      const escapedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
      execSync(`npx @insforge/cli db query "${escapedSql}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed on query ${i + 1}`, e.message);
    }
  }
  
  console.log("Done deploying missing tables.");
}

run();
