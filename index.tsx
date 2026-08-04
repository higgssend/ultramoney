import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global handler for Vite chunk loading errors (occurs after deployments when old chunks are deleted)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (posible nueva versión). Recargando página...');
  event.preventDefault();
  window.location.reload();
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
    window.location.reload();
  }
});

// Register PWA Service Worker for automatic background updates
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión detectada. Actualizando silenciosamente...');
    updateSW(true); // Forzar actualización automática sin preguntar
  },
  onOfflineReady() {
    console.log('App is ready for offline use.');
  },
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