
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App'; // Assuming App.tsx provides a default export
import '@/types'; // Ensure global augmentations from types.ts (e.g., for Window object) are loaded.
import './index.css';

console.log('[index.tsx] Script executing. Attempting to mount App...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}