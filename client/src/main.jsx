import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Unregister old service workers and clear caches (Android fix)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Step 1: Unregister ALL existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        console.log('Unregistering old SW:', registration);
        await registration.unregister();
      }

      // Step 2: Clear ALL caches
      const cacheNames = await caches.keys();
      for (let cacheName of cacheNames) {
        console.log('Deleting cache:', cacheName);
        await caches.delete(cacheName);
      }

      // Step 3: Register the NEW service worker
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('New SW Registered!', reg);

      // Step 4: Force reload to fetch fresh resources if this is first cleanup
      if (sessionStorage.getItem('sw_cleaned') !== 'true') {
        sessionStorage.setItem('sw_cleaned', 'true');
        console.log('Reloading for fresh resources...');
        window.location.reload();
      }

      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    } catch (err) {
      console.error('SW cleanup/registration failed:', err);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
