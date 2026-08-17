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

// Register and auto-update PWA Service Worker for installed mobile/desktop users
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión detectada. Actualizando PWA automáticamente...');
    void updateSW(true);
  },
  onOfflineReady() {
    console.log('UltraMoney listo para funcionar sin conexión.');
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

// Fallback for Service Worker chunk load errors that might not be caught by vite:preloadError
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason && 
    event.reason.message && 
    (event.reason.message.includes('Failed to fetch dynamically imported module') || 
     event.reason.message.includes('Ha fallado la carga del módulo') ||
     event.reason.message.includes('ServiceWorker'))
  ) {
    console.warn('Chunk load error detected. Recargando página...');
    event.preventDefault();
    
    // Si el ServiceWorker está corrupto, lo eliminamos a la fuerza
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

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