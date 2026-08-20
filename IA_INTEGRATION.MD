
Eres un desarrollador full-stack experto en Next.js 14, Supabase,
y diseño UX/UI. Necesito que construyas una aplicación web completa
para administrar mi negocio de mariscos llamado
"Marea Negra - Aguachiles & Cocteles", ubicado en Sinaloa, México.

═══════════════════════════════════════════════════
STACK TÉCNICO
═══════════════════════════════════════════════════

- Framework:     Next.js 14 (App Router)
- Base de datos: Supabase (PostgreSQL)
- Auth:          Supabase Auth (roles via user_metadata)
- ORM:           Supabase JS Client (@supabase/supabase-js)
- Estilos:       Tailwind CSS + CSS Variables del design system
- Deploy:        Vercel
- Arquitectura:  Monolito — todo en un solo repositorio Next.js
  Server Components para data fetching
  Server Actions para mutaciones
  Route Handlers solo para webhooks y exports

Dependencias principales:
  next, @supabase/supabase-js, @supabase/ssr,
  tailwindcss, lucide-react, framer-motion,
  @hello-pangea/dnd, replicate, @anthropic-ai/sdk,
  firebase, firebase-admin

Estructura de carpetas:
/app
  /layout.tsx
  /(public)
    /page.tsx                ← menú público
  /(admin)
    /layout.tsx              ← sidebar protegido
    /dashboard/page.tsx
    /pedidos/page.tsx
    /menu/page.tsx
    /inventario/page.tsx
    /caja/page.tsx
    /contenido/page.tsx      ← generador de contenido IA
  /login/page.tsx
/components
  /ui/                       ← design system base
  /pedidos/
  /menu/
  /inventario/
  /caja/
  /contenido/
    /PostPreview.tsx         ← mockup visual IG/FB
    /ContentCalendar.tsx     ← calendario semanal
    /GeneratorForm.tsx       ← formulario de generación
/lib
  /supabase/
    /client.ts
    /server.ts
  /firebase/
    /client.ts
    /admin.ts
  /actions/
    /pedidos.ts
    /contenido.ts
  /replicate.ts              ← generación de imágenes
  /caption-generator.ts      ← generación de captions
  /telegram.ts               ← notificaciones
  /whatsapp.ts               ← CallMeBot
  /notifications.ts          ← FCM push
  /scheduler.ts              ← horario inteligente
  /types/
/supabase
  /migrations/
  /seed.sql
/public
  /manifest.json             ← PWA
  /cursors/
    /camaron.png
    /camaron-click.png
  /firebase-messaging-sw.js
  /icons/

═══════════════════════════════════════════════════
DESIGN SYSTEM EXACTO
═══════════════════════════════════════════════════

:root {
  --negro:    #080808;
  --carbon:   #111111;
  --coral:    #E8430A;
  --turquesa: #2ABFBF;
  --azul:     #0D3B5E;
  --arena:    #D4C5A9;
  --blanco:   #F7F3EE;
  --oro:      #C9A84C;
}

// tailwind.config.ts
colors: {
  negro:    '#080808',
  carbon:   '#111111',
  coral:    '#E8430A',
  turquesa: '#2ABFBF',
  azul:     '#0D3B5E',
  arena:    '#D4C5A9',
  blanco:   '#F7F3EE',
  oro:      '#C9A84C',
}

Fuentes (next/font/google):
  Bebas_Neue          → font-display  → títulos, logo, precios
  Cormorant_Garamond  → font-serif    → subtítulos itálicos
  Space_Grotesk       → font-sans     → cuerpo, UI, labels

═══════════════════════════════════════════════════
PATRONES DE COMPONENTES
═══════════════════════════════════════════════════

PATRÓN 1 — ProductCard:
  Fondo #000 con blob radial azul top-right y coral bottom-left
  Tag de estado en turquesa, título en blanco con acento coral
  Precio en font-display coral, CTA pill en turquesa

PATRÓN 2 — ListRow:
  Fondo carbon o blanco hueso
  Dot de color + nombre + badge + valor
  Badge disponible: bg-turquesa/10 border-turquesa/20
  Badge agotado: bg-coral/10 border-coral/20

PATRÓN 3 — NarrativeCard:
  Fondo #0C0806, border-left-2 coral o turquesa
  Texto secundario Cormorant italic arena/50

PATRÓN 4 — LuxuryCard:
  Fondo #050404, textura dots oro/3 cada 18px
  Marco border oro/15 con corners 12px en oro sólido
  Ornamento "— ✦ —" oro opacity-40
  Regla linear-gradient oro, KPIs en font-display oro

SIDEBAR ADMIN:
  Fondo carbon, border-right oro/5
  Logo MAREA NEGRA font-display blanco
  Subtítulo "— admin —" Cormorant italic coral
  Nav: texto arena, hover text-blanco bg-blanco/5
  Activo: border-left-2 coral text-blanco
  Iconos: Lucide React

═══════════════════════════════════════════════════
SUPABASE — ESQUEMA COMPLETO
═══════════════════════════════════════════════════

-- PERFILES
create table profiles (
  id uuid references auth.users primary key,
  nombre text,
  rol text check (rol in ('admin','empleado')) default 'empleado',
  created_at timestamptz default now()
);

-- CATEGORÍAS
create table categorias (
  id serial primary key,
  nombre text not null,
  orden int default 0
);

-- PLATILLOS
create table platillos (
  id serial primary key,
  categoria_id int references categorias(id),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  emoji text,
  disponible boolean default true,
  imagen_url text,
  created_at timestamptz default now()
);

-- PEDIDOS
create table pedidos (
  id serial primary key,
  cliente_nombre text not null,
  cliente_telefono text,
  estado text check (estado in (
    'nuevo','preparando','listo','entregado','cancelado'
  )) default 'nuevo',
  metodo_pago text check (metodo_pago in (
    'efectivo','transferencia','oxxo'
  )),
  hora_recogida time,
  total numeric(10,2),
  notas text,
  created_at timestamptz default now()
);

-- DETALLE PEDIDOS
create table pedido_items (
  id serial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  platillo_id int references platillos(id),
  nombre_platillo text,
  precio_unitario numeric(10,2),
  cantidad int default 1
);

-- INSUMOS
create table insumos (
  id serial primary key,
  nombre text not null,
  unidad text not null,
  stock_actual numeric(10,3) default 0,
  stock_minimo numeric(10,3) default 0,
  created_at timestamptz default now()
);

-- MOVIMIENTOS INVENTARIO
create table movimientos_inventario (
  id serial primary key,
  insumo_id int references insumos(id),
  tipo text check (tipo in ('entrada','salida')),
  cantidad numeric(10,3),
  motivo text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- CIERRES DE CAJA
create table cierres_caja (
  id serial primary key,
  fecha date not null unique,
  total_efectivo numeric(10,2) default 0,
  total_transferencia numeric(10,2) default 0,
  total_oxxo numeric(10,2) default 0,
  total_sistema numeric(10,2),
  total_real numeric(10,2),
  diferencia numeric(10,2),
  notas text,
  cerrado_por uuid references profiles(id),
  created_at timestamptz default now()
);

-- FCM TOKENS
create table fcm_tokens (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  token text not null unique,
  updated_at timestamptz default now()
);

-- FOTOS DE REFERENCIA VISUAL
create table style_references (
  id serial primary key,
  platillo_id int references platillos(id),
  imagen_url text not null,
  es_activa boolean default true,
  created_at timestamptz default now()
);

-- CONTENIDO GENERADO CON IA
create table contenido_generado (
  id serial primary key,
  platillo_id int references platillos(id),
  tipo text check (tipo in ('feed','story','reel')),
  tono text check (tono in ('intenso','fresco','promocional')),
  imagen_url text,
  caption text,
  hashtags text,
  cta text,
  estado text check (estado in (
    'borrador','aprobado','programado','publicado','fallido'
  )) default 'borrador',
  fecha_publicar timestamptz,
  publicado_ig boolean default false,
  publicado_fb boolean default false,
  hora_sugerida text,
  razon_hora text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- RLS en todas las tablas
alter table profiles               enable row level security;
alter table platillos              enable row level security;
alter table pedidos                enable row level security;
alter table pedido_items           enable row level security;
alter table insumos                enable row level security;
alter table movimientos_inventario enable row level security;
alter table cierres_caja           enable row level security;
alter table fcm_tokens             enable row level security;
alter table style_references       enable row level security;
alter table contenido_generado     enable row level security;

-- Menú público sin auth
create policy "Menu publico"
  on platillos for select using (true);

-- Todo lo demás requiere auth
create policy "Solo autenticados pedidos"
  on pedidos for all
  using (auth.role() = 'authenticated');

create policy "Solo autenticados contenido"
  on contenido_generado for all
  using (auth.role() = 'authenticated');

create policy "Usuario gestiona sus tokens"
  on fcm_tokens for all
  using (auth.uid() = user_id);

═══════════════════════════════════════════════════
IMÁGENES — SUPABASE STORAGE
═══════════════════════════════════════════════════

Buckets públicos a crear:
  "platillos"    ← fotos reales de platillos
  "referencias"  ← fotos de referencia de estilo
  "contenido"    ← imágenes generadas por IA

Políticas:
  Lectura pública en los 3 buckets
  Solo autenticados pueden subir y eliminar

Flujo de subida:

1. Validar: solo jpg/png/webp, máximo 3MB
2. Convertir a webp con canvas API
3. Subir a Supabase Storage con upsert: true
4. Guardar URL pública en la tabla correspondiente

En next.config.js:
  images.remotePatterns: *.supabase.co

═══════════════════════════════════════════════════
MÓDULOS — DETALLE POR PÁGINA
═══════════════════════════════════════════════════

1. / — MENÚ PÚBLICO (Server Component, sin auth)
   Header: MAREA NEGRA font-display + blob azul marino
   Tabs por categoría con indicador coral activo
   Grid de ProductCards (Patrón 1)
   Cards con imagen real si existe, blob + emoji si no
   Botón flotante "Armar pedido por WhatsApp"
   Al presionar: abre wa.me con mensaje pre-armado:
   "Hola Marea Negra! Quiero ordenar:

   - {platillo} x{cant} ${precio}
     Total: ${total}"
     Camarón flotante animado solo en móvil (Framer Motion)
     Slogan visible: "¡Al vrgazo!, como nos gusta."
2. /admin/dashboard
   4 LuxuryCards (Patrón 4):
   Ventas hoy / Pedidos activos /
   Platillo top del día / Alertas inventario
   Lista últimos 5 pedidos con estado badge
   Banner si hay más de 2 días sin contenido programado:
   "⚠️ Tienes X días sin contenido. [✨ Generar]"
   Card de onboarding PWA (primera vez):
   Instrucciones para instalar en iOS y Android
   Accesos rápidos a módulos con eyebrow turquesa
3. /admin/pedidos (Realtime con Supabase)
   Kanban: Nuevo / Preparando / Listo / Entregado
   Cards Patrón 2 dentro de columnas Patrón 4
   Modal nuevo pedido: busca platillos, cliente, pago, hora
   Drag & drop entre columnas para cambiar estado
   Al cambiar estado → notifica por Telegram + FCM push
   Resumen del día sticky: total ventas + por método de pago
4. /admin/menu
   Lista platillos agrupados por categoría (Patrón 2)
   Toggle disponible/agotado con Server Action optimista
   Modal crear/editar: nombre, descripción, precio,
   emoji, categoría, imagen (upload o URL externa)
   Preview en vivo del ProductCard al editar (Patrón 1)
   Subida de imagen: validar → webp → Supabase Storage
5. /admin/inventario
   Lista insumos con barra de progreso:
   turquesa si stock > mínimo, coral si stock ≤ mínimo
   Badge "⚠ Stock bajo" en coral
   Botones "+ Entrada" y "- Salida" por insumo
   Modal movimiento: cantidad + motivo
   Historial con NarrativeCard (Patrón 3)
6. /admin/caja
   Formulario cierre del día:
   inputs efectivo/transferencia/OXXO recibidos
   Cálculo automático total sistema (pedidos entregados)
   Diferencia con color: turquesa si ok, coral si falta
   LuxuryCards para totales por método (Patrón 4)
   Botón "Exportar para WhatsApp":
   "Cierre Marea Negra {fecha}
   Efectivo: ${x}
   Transferencia: ${x}
   OXXO: ${x}
   Total: ${x}
   Diferencia: ${x}"
   Historial de cierres en Patrón 2
7. /admin/contenido — GENERADOR DE CONTENIDO IA
   3 tabs: Generar / Programado / Referencias

  TAB GENERAR:
    Dropdown platillos (datos reales de BDD):
      SELECT platillos JOIN categorias desde Supabase
    Tipo: [Feed] [Story] [Reel] → pills toggle
    Tono: [Intenso] [Fresco] [Promocional] → pills toggle
    Botón "✨ Generar con IA" (LuxuryCard Patrón 4)

    Al presionar:
      1. Loading: "La marea está generando... 🌊"
      2. Server Action generarContenido():
         a. Query platillo + categoría + style_references
         b. Construir prompts automáticamente con esos datos
         c. Llamar Replicate API (Flux 1.1 Pro)
            → imagen_url de style_references como referencia
         d. Subir imagen generada a bucket "contenido"
         e. Llamar Anthropic API (claude-3-5-haiku)
            → caption con voz Marea Negra
         f. calcularHoraOptima(tipo, tono)
         g. Guardar en contenido_generado como borrador
      3. Mostrar PostPreview

    COMPONENTE PostPreview:
      Tab IG y Tab FB con mockup visual real
      Simular exactamente el feed de IG:
        Header con avatar + "mareanegra.aguachiles"
        Imagen generada en proporción correcta
        Botones IG simulados (❤️ 💬 ✈️ 🔖)
        Caption + hashtags reales generados
        Hora sugerida con explicación:
          "📅 Martes 24 jun · 11:30 AM
           💡 Antes de la comida — mayor antojo"

      Botones de acción:
        [✓ Aprobar y programar] → turquesa
        [↺ Regenerar imagen]    → solo repite Replicate
        [✎ Editar caption]      → textarea inline editable
        [✕ Descartar]           → elimina borrador

      Admin puede cambiar la hora manualmente
      con date/time picker si no le gusta la sugerida

  TAB PROGRAMADO — Calendario semanal:
    Vista 7 días con posts programados
    Color por estado:
      turquesa = programado
      coral    = publicado
      oro      = pendiente aprobación
    Click → abre PostPreview para editar
    Drag & drop para cambiar fecha/hora
    Días vacíos resaltados en rojo suave
    Botón "Reutilizar" en posts publicados:
      Toma imagen existente → genera nuevo caption
      Sin llamar a Replicate → ahorra costo

  TAB REFERENCIAS:
    Grid de fotos de referencia subidas
    Botón "Agregar foto de referencia"
    Info: "Sube 10-15 fotos reales de tus platillos.
    La IA las usará para mantener tu estilo visual."

  FUNCIÓN calcularHoraOptima(tipo, tono):
    Menú del día / disponibilidad → 10:00 AM
    Platillo / producto:
      Si hora actual < 12 → 11:30 AM (antes comida)
      Si hora actual >= 12 → 18:30 PM (antes cena)
    Promoción / oferta → 09:00 AM (urgencia matutina)
    Storytelling / marca → 19:00 PM (prime time)
    Reel / video → 18:00 PM
    Viernes cualquier tipo → adelantar 30 min
    Sábado → 11:00 AM
    Domingo → 20:00 PM o no sugerir

    Retornar junto con razon_hora:
    {
      fecha: Date,
      hora: string,
      razon: "Antes de la comida — mayor probabilidad de antojo"
    }

═══════════════════════════════════════════════════
APIS EXTERNAS
═══════════════════════════════════════════════════

REPLICATE — /lib/replicate.ts
  npm install replicate
  Modelo: black-forest-labs/flux-1.1-pro
  Parámetros:
    prompt: construido automáticamente con datos de BDD
    aspect_ratio: '1:1' feed, '9:16' story/reel
    output_format: 'webp'
    output_quality: 95
    image_prompt: URL de style_reference activa
    image_prompt_strength: 0.3

ANTHROPIC — /lib/caption-generator.ts
  npm install @anthropic-ai/sdk
  Modelo: claude-3-5-haiku-20241022
  System: community manager Marea Negra
  Slogan: "¡Al vrgazo!, como nos gusta."
  Respuesta SOLO en JSON:
    { caption, hashtags, cta }
  Datos del prompt: vienen de BDD (nombre, descripcion,
    precio, emoji del platillo seleccionado)

MAKE.COM WEBHOOK — al aprobar contenido:
  POST a MAKE_WEBHOOK_URL con:
    { imagen_url, caption, hashtags,
      fecha_publicar, tipo,
      publicar_ig: true, publicar_fb: true,
      contenido_id }
  Make.com:
    Espera hasta fecha_publicar
    → Publica en IG vía Meta API
    → Publica en FB vía Meta API
    → POST a /api/contenido/marcar-publicado
    → Notifica a Telegram

TELEGRAM — /lib/telegram.ts
  Notifica en cada evento:
  🌊 Nuevo pedido → detalle completo
  ✅ Post publicado en IG y FB
  ⚠️ Stock bajo en inventario
  💰 Cierre de caja del día

CALLMEBOT — /lib/whatsapp.ts
  URL: https://api.callmebot.com/whatsapp.php
  Parámetros: phone, text (con +), apikey
  Usar para: notificaciones de pedidos a WhatsApp

FCM + PWA — Push notifications
  /public/firebase-messaging-sw.js
  /lib/firebase/client.ts + admin.ts
  Hook useNotifications() en sidebar admin
  Notificar en: nuevo pedido + post publicado
  PWA manifest con tema coral #E8430A
  Instrucciones de instalación en dashboard

═══════════════════════════════════════════════════
AUTENTICACIÓN
═══════════════════════════════════════════════════

/login: formulario email + password dark luxury
middleware.ts protege todas las rutas /admin/*
Roles desde profiles.rol:
  admin    → acceso total
  empleado → pedidos e inventario únicamente
             NO ve caja ni contenido ni gestión menú
Redirect no autenticado → /login

═══════════════════════════════════════════════════
ANIMACIONES (Framer Motion)
═══════════════════════════════════════════════════

CURSOR CAMARÓN (solo desktop, hover devices):
  CustomCursor.tsx — emoji 🦐 sigue al mouse
  Spring stiffness: 400, damping: 28
  Hover en botón/link: scale 1.4, rotate 20deg

HERO PÚBLICO:
  Badge → fade + slide arriba, delay 0s
  "MAREA NEGRA" → letra por letra, stagger 0.04s
  Tagline → fade + slide derecha, delay 0.7s
  Botones → slide abajo, stagger 0.1s entre cada uno
  whileHover scale 1.03, whileTap scale 0.97

CAMARÓN FLOTANTE MÓVIL (block md:hidden):
  y: [0, -24, 0], rotate: [0, 12, -8, 0]
  duration: 3.5s, repeat: Infinity
  whileTap: scale 1.3, rotate 360

NAVBAR:
  scrollY > 20 → bg-negro/80 backdrop-blur-md
  Logo: text-4xl → text-2xl con transición suave

CARDS DE PLATILLOS:
  Desktop: whileInView fade + y:48→0, stagger index*0.1
  Móvil: carrusel horizontal snap-x, whileTap scale 0.97
  Dots indicadores con IntersectionObserver

RIPPLE BUTTON:
  RippleButton.tsx — efecto táctil en todos los CTAs
  onTouchStart → span animado desde punto de touch

VIBRACIÓN HÁPTICA:
  Botón WhatsApp: navigator.vibrate([25, 15, 50])
  Feedback visual: mostrar ✓ por 800ms antes de abrir

WAVE DECORATION:
  Olas 🌊 animadas al final del hero
  translateX: 0 → -50%, duration 10s, linear, infinite

PARALLAX HERO:
  useScroll + useTransform
  Título: y 0%→-20%, opacity 1→0 al scroll
  Fondo blobs: y 0%→15% (más lento que contenido)

prefers-reduced-motion: respetar siempre
  Si true → solo fades, sin movimiento

LazyMotion + domAnimation para optimizar bundle

═══════════════════════════════════════════════════
DATOS SEMILLA (supabase/seed.sql)
═══════════════════════════════════════════════════

Categorías: Aguachiles / Ceviches y Cocteles / Complementos

Platillos:
  Aguachile Negro   | $149 | 🦐 | Camarón, chile chiltepin,
                                   pepino, cebolla morada
  Aguachile Rojo    | $149 | 🌶️  | Camarón, chile de árbol,
                                   limón, cilantro
  Aguachile Verde   | $139 | 🥒 | Camarón, chile serrano,
                                   pepino, aguacate
  Ceviche Camarón   | $139 | 🍋 | Camarón cocido, jitomate,
                                   pepino, cilantro, limón
  Coctel Sinaloa    | $179 | 🐙 | Camarón, pulpo, callo,
                                   aguacate, valentina
  Tostadas de Callo | $59  | 🥑 | Callo marinado, mayonesa,
                                   aguacate, limón

Insumos:
  Camarón fresco  | kg  | stock: 5   | mínimo: 2
  Pulpo           | kg  | stock: 2   | mínimo: 1
  Callo de hacha  | kg  | stock: 1.5 | mínimo: 0.5
  Chile chiltepin | gr  | stock: 500 | mínimo: 100
  Limón           | kg  | stock: 3   | mínimo: 1
  Pepino          | pza | stock: 10  | mínimo: 5
  Cebolla morada  | kg  | stock: 2   | mínimo: 0.5
  Aguacate        | pza | stock: 8   | mínimo: 4
  Tostadas        | paq | stock: 3   | mínimo: 2

═══════════════════════════════════════════════════
VARIABLES DE ENTORNO (.env.local.example)
═══════════════════════════════════════════════════

# Supabase

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Replicate

REPLICATE_API_TOKEN=

# Anthropic

ANTHROPIC_API_KEY=

# Firebase Client

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Telegram

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# CallMeBot WhatsApp

WA_PHONE=
WA_APIKEY=

# Make.com

MAKE_WEBHOOK_URL=

═══════════════════════════════════════════════════
ENTREGABLE ESPERADO
═══════════════════════════════════════════════════

1. Estructura completa de carpetas
2. package.json con todas las dependencias
3. tailwind.config.ts con design system completo
4. globals.css con variables CSS y fuentes
5. Esquema SQL completo + seed.sql
6. Código de cada página y componente
7. Todas las funciones de lib/
8. .env.local.example con todas las variables
9. README en español con:
   - Setup de Supabase (tablas + storage + RLS)
   - Setup de Firebase (FCM + PWA)
   - Setup de Make.com (escenario IG + FB)
   - Setup de Telegram bot
   - Deploy en Vercel paso a paso

ORDEN DE GENERACIÓN:

1. Configuración base (package.json, tailwind,
   globals.css, layout.tsx, middleware.ts)
2. Supabase schema + seed.sql
3. Design system components (/components/ui/)
4. Menú público (/)
5. Auth + Login (/login)
6. Dashboard (/admin/dashboard)
7. Pedidos (/admin/pedidos)
8. Menú admin (/admin/menu)
9. Inventario (/admin/inventario)
10. Caja (/admin/caja)
11. Contenido IA (/admin/contenido)
12. Animaciones + cursor camarón
13. FCM + PWA (notificaciones push)
14. Integraciones externas (Telegram, CallMeBot,
    Make.com webhook)
15. README completo
