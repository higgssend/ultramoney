import { createClient } from '@insforge/sdk';

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL || 'https://api.ultramoney.app';
const insforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_12002a3fd3274a14e562bcce4a015fee';

export const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });
