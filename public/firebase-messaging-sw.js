importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Extraer configuración desde los parámetros de la URL del Service Worker
const urlParams = new URLSearchParams(location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

let messaging;

if (firebaseConfig.apiKey) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Nuevo Mensaje';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: payload.data?.url || '/admin/pedidos' },
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/admin/pedidos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
