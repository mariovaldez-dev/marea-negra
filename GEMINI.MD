Eres un desarrollador full-stack experto en Next.js 14, Supabase y diseño
UX/UI. Necesito que me crees una aplicación web completa para administrar
mi negocio de mariscos llamado "Marea Negra - Aguachiles & Cocteles",
ubicado en Sinaloa, México.

═══════════════════════════════════════════════════
STACK TÉCNICO
═══════════════════════════════════════════════════

- Framework:     Next.js 14 (App Router)
- Base de datos: Supabase (PostgreSQL)
- Auth:          Supabase Auth (con roles via user_metadata)
- ORM:           Supabase JS Client (@supabase/supabase-js)
- Estilos:       Tailwind CSS + CSS Variables del design system
- Deploy:        Vercel
- Arquitectura:  Monolito — todo en un solo repositorio Next.js
  Server Components para data fetching
  Server Actions para mutaciones (crear/editar/eliminar)
  Route Handlers solo donde sea necesario (webhooks, exports)

Estructura de carpetas:
/app
  /layout.tsx              ← fuentes, providers, navbar
  /(public)
    /page.tsx              ← menú público (cliente)
  /(admin)
    /layout.tsx            ← sidebar admin protegido
    /dashboard/page.tsx
    /pedidos/page.tsx
    /menu/page.tsx
    /inventario/page.tsx
    /caja/page.tsx
  /login/page.tsx
/components
  /ui/                     ← componentes base del design system
  /pedidos/
  /menu/
  /inventario/
  /caja/
/lib
  /supabase/
    /client.ts             ← createBrowserClient
    /server.ts             ← createServerClient
    /middleware.ts
  /actions/                ← Server Actions por módulo
  /types/                  ← tipos TypeScript de toda la app
/supabase
  /migrations/             ← SQL de esquema y seed
  /seed.sql

═══════════════════════════════════════════════════
SUPABASE — ESQUEMA DE BASE DE DATOS
═══════════════════════════════════════════════════

-- PERFILES Y ROLES
create table profiles (
  id uuid references auth.users primary key,
  nombre text,
  rol text check (rol in ('admin', 'empleado')) default 'empleado',
  created_at timestamptz default now()
);

-- CATEGORÍAS DEL MENÚ
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

-- DETALLE DE PEDIDOS
create table pedido_items (
  id serial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  platillo_id int references platillos(id),
  nombre_platillo text,      -- snapshot del nombre al momento del pedido
  precio_unitario numeric(10,2),
  cantidad int default 1
);

-- INSUMOS / INVENTARIO
create table insumos (
  id serial primary key,
  nombre text not null,
  unidad text not null,      -- kg, gr, pza, paquete, litro
  stock_actual numeric(10,3) default 0,
  stock_minimo numeric(10,3) default 0,
  created_at timestamptz default now()
);

-- MOVIMIENTOS DE INVENTARIO
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
  total_sistema numeric(10,2),   -- suma de pedidos entregados del día
  total_real numeric(10,2),      -- lo que había físicamente en caja
  diferencia numeric(10,2),      -- total_real - total_sistema
  notas text,
  cerrado_por uuid references profiles(id),
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table platillos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table insumos enable row level security;
alter table movimientos_inventario enable row level security;
alter table cierres_caja enable row level security;

-- Políticas: menú público solo lectura sin auth
create policy "Menu publico" on platillos
  for select using (true);

-- Todo lo demás requiere auth
create policy "Solo autenticados" on pedidos
  for all using (auth.role() = 'authenticated');

═══════════════════════════════════════════════════
DESIGN SYSTEM EXACTO
═══════════════════════════════════════════════════

En globals.css y tailwind.config.ts usa EXACTAMENTE:

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

Fuentes en layout.tsx (next/font/google):

- Bebas_Neue        → className: font-display   → títulos, logo, precios
- Cormorant_Garamond → className: font-serif    → subtítulos itálicos
- Space_Grotesk     → className: font-sans      → cuerpo, UI, labels

═══════════════════════════════════════════════════
PATRONES DE COMPONENTES (úsalos en toda la app)
═══════════════════════════════════════════════════

PATRÓN 1 — ProductCard (menú público y gestión de menú):

- Fondo #000 con blob radial-gradient azul top-right
- Blob coral bottom-left opacity 0.4
- Tag de estado: border turquesa, texto turquesa, uppercase tiny
- Título en font-display blanco, acento en coral
- Precio en font-display coral grande
- CTA pill: bg-turquesa text-negro font-semibold rounded-full

PATRÓN 2 — ListRow (pedidos, menú del día, inventario):

- Fondo carbon (#111) o blanco hueso (#F7F3EE)
- Dot de color (coral/turquesa/oro) + nombre + badge + valor
- Badge disponible: bg-turquesa/10 text-turquesa border border-turquesa/20
- Badge agotado:    bg-coral/10 text-coral border border-coral/20
- Footer: border-top arena/10, botón oscuro

PATRÓN 3 — NarrativeCard (movimientos inventario, historial caja):

- Fondo #0C0806
- border-left-2 coral (urgente) o turquesa (normal)
- Texto secundario: Cormorant Garamond italic, color arena/50
- Separador: línea oro de 30px

PATRÓN 4 — LuxuryCard (dashboard KPIs, modales, conciliación):

- Fondo #050404
- Textura dots: radial-gradient(rgba(201,168,76,0.03) 1px, transparent 1px) 18px 18px
- Marco: border oro/15 con corners de 12px en oro sólido
- Ornamento: "— ✦ —" texto-oro opacity-40
- Regla: linear-gradient(90deg, transparent, #C9A84C, transparent)
- Precio/KPI: font-display text-oro
- Glow: radial-gradient oro/8 esquina superior derecha

SIDEBAR ADMIN:

- Fondo carbon (#111), border-right oro/5
- Logo MAREA NEGRA en font-display blanco grande
- Subtítulo "— admin —" en Cormorant italic coral
- Nav items: texto arena, hover text-blanco bg-blanco/5
- Item activo: border-left-2 coral, text-blanco
- Iconos: Lucide React

═══════════════════════════════════════════════════
MÓDULOS — DETALLE POR PÁGINA
═══════════════════════════════════════════════════

1. /  MENÚ PÚBLICO (Server Component, sin auth)

   - Header: MAREA NEGRA en font-display + blob de fondo azul marino
   - Tabs por categoría: Aguachiles / Ceviches / Cocteles / Complementos
   - Grid de ProductCards (Patrón 1)
   - Botón flotante "Armar pedido por WhatsApp" que acumula selección
   - Al presionar: abre wa.me con mensaje pre-armado:
     "Hola, quiero ordenar:\n- [platillo] x[cant] $[precio]\nTotal: $[total]"
   - Fetch de platillos con disponible=true desde Supabase
2. /admin/dashboard  (Server Component)

   - 4 LuxuryCards (Patrón 4): Ventas hoy / Pedidos activos /
     Platillo top del día / Alertas de inventario
   - Lista de últimos 5 pedidos con estado badge
   - Accesos rápidos a cada módulo con eyebrow labels turquesa
3. /admin/pedidos  (Client Component con realtime)

   - Supabase Realtime para actualización automática de estados
   - Vista Kanban: 4 columnas (Nuevo/Preparando/Listo/Entregado)
   - Cards con Patrón 2 dentro de columnas Patrón 4
   - Modal nuevo pedido: busca platillos, agrega items, asigna cliente/pago/hora
   - Drag & drop entre columnas para cambiar estado
   - Resumen del día sticky en la parte inferior
4. /admin/menu  (Server + Server Actions)

   - Lista de platillos agrupados por categoría (Patrón 2)
   - Toggle disponible/agotado con Server Action optimista
   - Modal crear/editar platillo: nombre, descripción, precio, emoji, categoría
   - Preview en vivo del ProductCard (Patrón 1) al editar
   - Ordenar por categoría con drag & drop
5. /admin/inventario  (Server Component + Client para movimientos)

   - Lista de insumos con barra de progreso:
     turquesa si stock > mínimo, coral si stock ≤ mínimo
   - Badge "⚠ Stock bajo" en coral cuando aplica
   - Botones: "+ Entrada" y "- Salida" por insumo
   - Modal movimiento: cantidad, motivo
   - Historial de movimientos con Patrón 3 (NarrativeCard)
6. /admin/caja  (Server Component + Server Actions)

   - Formulario de cierre del día:
     inputs para efectivo/transferencia/OXXO recibidos físicamente
   - Cálculo automático del total sistema (suma pedidos entregados del día)
   - Diferencia = total_real - total_sistema con color coral/turquesa
   - LuxuryCards (Patrón 4) para los totales por método
   - Botón "Exportar para WhatsApp" genera texto:
     "Cierre Marea Negra [fecha]\nEfectivo: $X\nTransferencia: $X\nOXXO: $X\nTotal: $X"
   - Historial de cierres en lista Patrón 2

═══════════════════════════════════════════════════
AUTENTICACIÓN CON SUPABASE AUTH
═══════════════════════════════════════════════════

- /login: formulario email + password con diseño dark luxury
- Middleware en middleware.ts que protege todas las rutas /admin/*
- Al hacer login, leer profiles.rol para determinar acceso
- Empleado: ve pedidos e inventario, NO ve caja ni gestión de menú
- Admin: acceso total
- Redirigir cliente no autenticado que intente /admin → /login

middleware.ts:
  import { createServerClient } from '@supabase/ssr'
  // Verificar sesión en cada request a /admin/*
  // Si no hay sesión → redirect a /login
  // Si hay sesión → continuar

═══════════════════════════════════════════════════
DATOS SEMILLA (supabase/seed.sql)
═══════════════════════════════════════════════════

Categorías: Aguachiles, Ceviches y Cocteles, Complementos

Platillos:
  Aguachile Negro   | $149 | 🦐 | Camarón, chile chiltepin, pepino, cebolla morada
  Aguachile Rojo    | $149 | 🌶️  | Camarón, chile de árbol, limón, cilantro
  Aguachile Verde   | $139 | 🥒 | Camarón, chile serrano, pepino, aguacate
  Ceviche Camarón   | $139 | 🍋 | Camarón cocido, jitomate, pepino, cilantro
  Coctel Sinaloa    | $179 | 🐙 | Camarón, pulpo, callo, aguacate, valentina
  Tostadas de Callo | $59  | 🥑 | Callo marinado, mayonesa, aguacate, limón

Insumos base:
  Camarón fresco (kg) | stock: 5 | mínimo: 2
  Pulpo (kg)          | stock: 2 | mínimo: 1
  Callo de hacha (kg) | stock: 1.5 | mínimo: 0.5
  Chile chiltepin (gr)| stock: 500 | mínimo: 100
  Limón (kg)          | stock: 3 | mínimo: 1
  Pepino (pza)        | stock: 10 | mínimo: 5
  Cebolla morada (kg) | stock: 2 | mínimo: 0.5
  Aguacate (pza)      | stock: 8 | mínimo: 4
  Tostadas (paquete)  | stock: 3 | mínimo: 2

═══════════════════════════════════════════════════
GESTIÓN DE IMÁGENES DE PLATILLOS (Supabase Storage)
═══════════════════════════════════════════════════

STORAGE:

- Crear un bucket público en Supabase Storage llamado: "platillos"
- Carpeta sugerida: /platillos/{id-platillo}.webp
- Acceso público sin auth para lectura (menú público lo necesita)
- Solo admin puede subir/eliminar imágenes (RLS en Storage)

POLÍTICAS DE STORAGE:
  -- Lectura pública
  create policy "Imagenes publicas"
    on storage.objects for select
    using ( bucket_id = 'platillos' );

  -- Solo admin puede subir
  create policy "Solo admin sube imagenes"
    on storage.objects for insert
    with check (
      bucket_id = 'platillos'
      and auth.role() = 'authenticated'
    );

  -- Solo admin puede eliminar
  create policy "Solo admin elimina imagenes"
    on storage.objects for delete
    using (
      bucket_id = 'platillos'
      and auth.role() = 'authenticated'
    );

COLUMNA EN TABLA platillos:
  -- Ya incluida en el schema:
  imagen_url text   ← guarda la URL pública del Storage

FLUJO DE SUBIDA (en /admin/menu):

1. Admin abre modal de crear/editar platillo
2. Hay un campo de imagen con dos opciones:
   a) Subir foto desde dispositivo (input type file)
   b) Pegar URL externa (Instagram, Google, etc.)
3. Si sube archivo:
   - Validar: solo jpg/png/webp, máximo 3MB
   - Convertir a webp en el cliente con canvas API
     para optimizar peso antes de subir
   - Subir a Supabase Storage:
     supabase.storage.from('platillos')
     .upload(`${platillo.id}.webp`, file, { upsert: true })
   - Obtener URL pública:
     supabase.storage.from('platillos')
     .getPublicUrl(`${platillo.id}.webp`)
   - Guardar esa URL en platillos.imagen_url
4. Si pega URL externa:
   - Guardar directamente en imagen_url
   - Mostrar preview inmediata

VISUALIZACIÓN EN MENÚ PÚBLICO (/):

- Si el platillo tiene imagen_url:
  Mostrar imagen como fondo de la card con overlay oscuro gradiente:
  linear-gradient(to top, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 100%)
  El nombre, precio y CTA van sobre el overlay en la parte inferior
  Usar next/image con sizes y priority para las primeras 3 cards
- Si NO tiene imagen_url:
  Mostrar fondo con blob radial-gradient (Patrón 1 del design system)
  + emoji del platillo centrado con drop-shadow turquesa
    (fallback elegante que mantiene la identidad visual)

COMPONENTE ImageUploader:

- Drag & drop de archivo o click para seleccionar
- Preview inmediata antes de confirmar
- Indicador de progreso de subida (barra coral → turquesa al completar)
- Botón para eliminar imagen actual
- Mensaje de error si el archivo es muy grande o formato incorrecto
- Skeleton loader mientras carga la imagen

OPTIMIZACIÓN CON NEXT/IMAGE:
  En next.config.js agregar dominio de Supabase Storage:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      }
    ]
  }

  Usar en las cards:
  <Image
    src={platillo.imagen_url}
    alt={platillo.nombre}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />

═══════════════════════════════════════════════════
ENTREGABLE ESPERADO
═══════════════════════════════════════════════════

1. Estructura completa de carpetas del proyecto
2. package.json con todas las dependencias:
   next, @supabase/supabase-js, @supabase/ssr,
   tailwindcss, lucide-react, @hello-pangea/dnd (drag & drop)
3. tailwind.config.ts con el design system completo
4. globals.css con CSS variables y fuentes
5. Esquema SQL completo + seed.sql
6. Código de cada página y componente
7. .env.local.example con las variables de Supabase
8. README en español con instrucciones de setup en Vercel + Supabase

Empieza por:

1. Estructura del proyecto + configuración base
   (package.json, tailwind, globals.css, layout.tsx)
2. Esquema de Supabase + seed
3. Menú público (/)
4. Dashboard (/admin/dashboard)
   Luego continúa módulo por módulo.
