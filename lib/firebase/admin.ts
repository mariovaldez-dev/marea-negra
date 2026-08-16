import * as admin from 'firebase-admin'

interface PedidoNotif {
  id: number
  cliente: string
  total: number
  horaRecogida: string | null
  metodoPago: string | null
  items: string[]
}

// Inicializar la app Admin solo una vez
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Manejar escapes de línea en la clave privada
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Error inicializando Firebase Admin', error)
  }
}

export async function enviarNotificacion(token: string, pedido: PedidoNotif) {
  const horaTexto = pedido.horaRecogida ? `${pedido.horaRecogida.slice(0, 5)} hrs` : 'Lo antes posible'
  
  const message = {
    token,
    notification: {
      title: `🌊 ¡Nuevo Pedido #${pedido.id}!`,
      body: `${pedido.cliente} · $${pedido.total.toFixed(0)} MXN · ${horaTexto}`,
    },
    data: {
      pedidoId: String(pedido.id),
      url: '/admin/pedidos',
    },
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'pedidos',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  }

  try {
    await admin.messaging().send(message)
  } catch (error) {
    console.error('Error enviando notificación a token', token, error)
  }
}

export async function enviarATodos(tokens: string[], pedido: PedidoNotif) {
  if (!tokens || tokens.length === 0) return
  
  const promises = tokens.map((token) => enviarNotificacion(token, pedido))
  await Promise.allSettled(promises)
}
