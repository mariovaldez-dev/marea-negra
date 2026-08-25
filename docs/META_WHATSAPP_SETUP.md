# 📲 Guía Paso a Paso: Configurar Meta WhatsApp Cloud API (1,000 Mensajes Gratis al Mes)

Guía completa para conectar la API oficial de WhatsApp en **Marea Negra - Aguachiles**.

---

## ⏱️ Tiempo estimado: 5 minutos

---

### Paso 1: Crear una cuenta en Meta for Developers
1. Entra a **[developers.facebook.com](https://developers.facebook.com)**.
2. Inicia sesión con tu cuenta de Facebook.
3. En la esquina superior derecha, haz clic en **"Mis apps (My Apps)"**.
4. Haz clic en el botón verde **"Crear app (Create App)"**.

---

### Paso 2: Configurar la Aplicación
1. Selecciona el caso de uso: **"Otro (Other)"** y haz clic en *Siguiente*.
2. Selecciona el tipo de app: **"Negocio (Business)"** y haz clic en *Siguiente*.
3. En **Nombre de la app**, escribe: `Marea Negra Bot`.
4. Ingresa tu correo de contacto y haz clic en **"Crear app"**.

---

### Paso 3: Agregar el producto de WhatsApp
1. En el panel principal de tu app, busca el recuadro que dice **WhatsApp**.
2. Haz clic en el botón **"Configurar (Set up)"**.

---

### Paso 4: Obtener tus Credenciales (Las 2 llaves para tu `.env`)
En el menú izquierdo ve a **WhatsApp** ➔ **Inicio rápido (API Setup)**. Verás una pantalla con dos datos clave:

1. 🔑 **Token de acceso temporal (Access Token)**: Una cadena larga que empieza con `EAA...`.
2. 🆔 **Identificador de número de teléfono (Phone number ID)**: Un número largo (ejemplo: `109284918274910`).

---

### Paso 5: Probar tu primer mensaje de prueba
1. En esa misma pantalla, en la sección **"Paso 1: Enviar y recibir mensajes"**:
2. En el campo **"Para (To)"**, selecciona *Administrar lista de números de teléfono* y agrega tu celular personal con código de país (ej. `+52 667 123 4567`).
3. Te llegará un código de 6 dígitos por WhatsApp para confirmar que es tu número.
4. Haz clic en **"Enviar mensaje (Send test message)"** y verás cómo te llega un mensaje oficial de prueba de Meta.

---

### Paso 6: Pegar las credenciales en tu `.env`
Abre tu archivo `.env` o `.env.local` en el proyecto y pega las dos claves:

```env
# Meta WhatsApp Cloud API
WHATSAPP_API_TOKEN=EAAG...tu_token_aqui...
WHATSAPP_PHONE_ID=109284918274910
```

---

### Paso 7: Obtener un Token Permanente (Para que no expire)
El token de prueba de la pantalla principal dura 24 horas. Para generar un **Token Permanente que dure para siempre**:

1. Entra a **[business.facebook.com/settings](https://business.facebook.com/settings)** (Configuración del negocio).
2. En el menú izquierdo, ve a **Usuarios** ➔ **Usuarios del sistema (System Users)**.
3. Haz clic en **Agregar (Add)**, ponle de nombre `MareaNegraAdmin` con rol **Administrador**.
4. Haz clic en **"Generar nuevo token"**:
   - Selecciona tu app `Marea Negra Bot`.
   - En permisos, marca con casilla: **`whatsapp_business_messaging`** y **`whatsapp_business_management`**.
5. Copia el token generado y pégalo en tu `WHATSAPP_API_TOKEN` en tu `.env`.

---

### ✅ ¡Listo!
A partir de este momento, cada vez que en Cocina o en Pedidos marques una comanda como **"¡Listo!"**, el servidor enviará automáticamente el WhatsApp al cliente en segundo plano de forma 100% oficial y dentro de tus **1,000 mensajes gratis mensuales**.
