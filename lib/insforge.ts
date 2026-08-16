import { createClient } from '@insforge/sdk';

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL || 'https://sxwv82iw.us-east.insforge.app';
const insforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_12002a3fd3274a14e562bcce4a015fee';

export const insforge = createClient({ 
  baseUrl: insforgeUrl, 
  anonKey: insforgeKey,
  isServerMode: false 
});

// Restore persisted access token immediately upon app boot to maintain persistent session in PWAs and browsers
if (typeof window !== 'undefined') {
  try {
    const savedToken = localStorage.getItem('um_access_token');
    if (savedToken) {
      insforge.setAccessToken(savedToken);
    }
  } catch (err) {
    console.warn('Unable to restore access token from localStorage:', err);
  }
}

