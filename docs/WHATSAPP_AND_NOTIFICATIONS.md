# 📲 Notificaciones, Rastreo en Tiempo Real y WhatsApp

Arquitectura de comunicación y notificaciones para **Marea Negra - Aguachiles**.

---

## 📑 Tabla de Contenidos
1. [Envío Automático de WhatsApp al Cliente](#1-envío-automático-de-whatsapp-al-cliente)
2. [Pantalla de Rastreo en Vivo (`/pedido/[id]`)](#2-pantalla-de-rastreo-en-vivo-pedidoid)
3. [Notificaciones Push del Sistema Operativo](#3-notificaciones-push-del-sistema-operativo)
4. [Notificaciones KDS a Cocina y Salón](#4-notificaciones-kds-a-cocina-y-salón)

---

## 1. Envío Automático de WhatsApp al Cliente

Cuando una comanda se marca como **"¡Listo! 🔔"** en la pantalla de Cocina (`/admin/pantalla`) o en el tablero Kanban (`/admin/pedidos`), el sistema dispara automáticamente la Server Action `notificarPedidoListoCliente(pedidoId)`.

### Formato del Mensaje Despachado:
```
🌊 ¡TU PEDIDO DE MAREA NEGRA ESTÁ LISTO! 🦐🔥

Hola [Nombre del Cliente], tu orden ya salió de cocina y está fresca y lista:

🧾 Folio de Pedido: #[ID]
💰 Total: $[Total] MXN
📍 Entrega: Pasa a mostrador a recoger (o chofer DiDi/Uber)

👇 Consulta tu comanda y estatus en vivo aquí:
https://marea-negra.com/pedido/[ID]

¡Buen provecho y gracias por tu preferencia en Marea Negra - Aguachiles! 🌶️
```

### Modos de Operación:
1. **Modo Background Silencioso (Meta WhatsApp Cloud API)**:
   - Configurando `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_ID` en el `.env`, el servidor despacha el mensaje en segundo plano directamente al celular del cliente sin abrir ventanas.
   - Meta incluye **1,000 conversaciones gratuitas al mes**.
2. **Modo 1-Click Universal (Fallback Gratuito)**:
   - Si no hay API externa configurada, el sistema abre la ventana de WhatsApp con el número del cliente y la plantilla completa pre-cargada lista para enviar con 1 solo toque.
   - **Costo $0.00 MXN e ilimitado**.

---

## 2. Pantalla de Rastreo en Vivo (`/pedido/[id]`)

Permite a los comensales seguir la preparación de su comanda en tiempo real:
- **Supabase Realtime (PostgreSQL Changes)**: Actualización reactiva sin necesidad de recargar la página (`nuevo` ➔ `preparando` ➔ `listo` ➔ `entregado`).
- **Campana Sonora (Web Audio API)**: Generación acústica de un timbre de alta fidelidad que suena automáticamente en el altavoz del dispositivo al estar listo el pedido.
- **Título de Pestaña Dinámico**: La pestaña del navegador parpadea con `🔔 ¡PEDIDO LISTO! — Marea Negra`.

---

## 3. Notificaciones Push del Sistema Operativo

Integrado mediante **Web Notification API**:
- Si el cliente tiene el teléfono bloqueado o se encuentra navegando en otra aplicación (Instagram, TikTok, llamadas), el sistema operativo le muestra una **notificación flotante**:
  - *Título*: 🔔 ¡Tu pedido de Marea Negra está LISTO! 🦐
  - *Cuerpo*: Folio #104: Tu orden ya salió de cocina y está fresca. ¡Pasa a recogerla!
- Al tocar la notificación, redirige al usuario a su comanda en vivo.

---

## 4. Notificaciones KDS a Cocina y Salón

- **Alerta Sonora de Comandas Nuevas**: Cuando entra un pedido desde el menú público o código QR de mesa, el KDS emite un sonido distintivo para alertar al equipo de cocina.
- **Semáforo de Tiempos**:
  - 🟢 **Verde**: Menos de 10 minutos en preparación.
  - 🟡 **Amarillo**: 10 a 20 minutos.
  - 🔴 **Rojo**: Más de 20 minutos (atención urgente requerida).
