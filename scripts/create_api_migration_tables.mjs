import { execSync } from 'child_process';
import fs from 'fs';

const statements = [
  `CREATE TABLE IF NOT EXISTS public.migration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    status TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `ALTER TABLE public.migration_history ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own migration history" ON public.migration_history FOR ALL USING (auth.uid() = user_id);`,

  `CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
  );`,
  `ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY "Users can manage own api keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);`
];

async function run() {
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Executing query ${i + 1}/${statements.length}...`);
    try {
      const escapedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
      execSync(`npx @insforge/cli db query "${escapedSql}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed on query ${i + 1}`, e.message);
    }
  }
  
  console.log("Done creating migration and api tables.");
}

run();
