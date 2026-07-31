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