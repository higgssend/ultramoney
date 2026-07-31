import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://sxwv82iw.us-east.insforge.app',
  anonKey: 'ik_12002a3fd3274a14e562bcce4a015fee'
});

async function run() {
  const { data: clients } = await client.database.from('clients').select('id').limit(1);
  if (!clients || clients.length === 0) return;
  const clientId = clients[0].id;
  
  const { error } = await client.database.from('clients').update({
    creditScore: 100
  }).eq('id', clientId);
  
  console.log('Update with creditScore error:', error);
}

run();
