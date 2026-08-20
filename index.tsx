import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { registerSW } from 'virtual:pwa-register';

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Purge ALL old Service Workers and their caches before registering
//         a new one. This ensures users with stale PWA installs (like accounts
//         where the SW was serving outdated auth code) get a clean slate.
// ─────────────────────────────────────────────────────────────────────────────
async function purgeOldServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));

    // Also clear all PWA/workbox caches so no stale JS is served
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    console.log('[UltraMoney] SW y caches anteriores eliminados.');
  } catch (e) {
    console.warn('[UltraMoney] Error al limpiar SW/caches:', e);
  }
}

// Check if this is the first visit after a forced purge flag was set
const SW_PURGE_KEY = 'um_sw_purged_v2';
if (!sessionStorage.getItem(SW_PURGE_KEY)) {
  sessionStorage.setItem(SW_PURGE_KEY, 'true');
  void purgeOldServiceWorkers();
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Register a fresh Service Worker for PWA functionality
// ─────────────────────────────────────────────────────────────────────────────
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[UltraMoney] Nueva versión detectada. Actualizando PWA automáticamente...');
    void updateSW(true);
  },
  onOfflineReady() {
    console.log('[UltraMoney] UltraMoney listo para funcionar sin conexión.');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Check for updates periodically every 20 minutes
      setInterval(() => {
        void registration.update();
      }, 20 * 60 * 1000);

      // Check for updates when resuming/focusing the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          void registration.update();
        }
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Fallback for Service Worker chunk load errors
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason && 
    event.reason.message && 
    (event.reason.message.includes('Failed to fetch dynamically imported module') || 
     event.reason.message.includes('Ha fallado la carga del módulo') ||
     event.reason.message.includes('ServiceWorker'))
  ) {
    console.warn('[UltraMoney] Chunk load error detected. Recargando página...');
    event.preventDefault();
    
    // Eliminar SWs corruptos a la fuerza
    void purgeOldServiceWorkers();

    if (!sessionStorage.getItem('um_reloaded')) {
      sessionStorage.setItem('um_reloaded', 'true');
      setTimeout(() => window.location.reload(), 500);
    }
  }
});



const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);