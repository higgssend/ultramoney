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

// Unregister any leftover Service Workers from previous PWA build
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((name) => caches.delete(name));
  });
}

// Global handler for Vite chunk loading errors (occurs after deployments when old chunks are deleted)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (posible nueva versión). Recargando página...');
  event.preventDefault();
  if (!sessionStorage.getItem('um_reloaded')) {
    sessionStorage.setItem('um_reloaded', 'true');
    window.location.reload();
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