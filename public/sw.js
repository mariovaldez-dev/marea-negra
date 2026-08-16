// Service Worker para Notificaciones Web Push Nativa en Marea Negra (Safari, Chrome, Brave)

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Escuchar notificaciones Push enviadas desde el servidor o eventos de fondo
self.addEventListener('push', (event) => {
  let data = {
    title: '¡NUEVO PEDIDO RECIBIDO! 🦐',
    body: 'Se ha registrado una nueva comanda en Marea Negra.',
    icon: '/favicon.ico',
    url: '/admin/pedidos',
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/admin/pedidos',
    },
    actions: [
      { action: 'open', title: 'Ver Pedidos 📋' },
      { action: 'close', title: 'Cerrar ✖' },
    ],
    tag: 'marea-negra-nuevo-pedido',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Responder al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const targetUrl = event.notification.data?.url || '/admin/pedidos'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
