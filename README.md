# Marea Negra - Aguachiles & Cocteles 🦐🌶️

Aplicación web monolítica full-stack diseñada para la administración integral y menú público del negocio de mariscos **Marea Negra**, ubicado en Sinaloa, México.

---

## 🎨 Design System: "Marea Oscura"

Inspirado en la tensión entre la oscuridad abisal del Océano Pacífico y la intensidad del chile seco al comal.

- **Paleta de Colores**:
  - `Negro Abisal`: `#080808`
  - `Carbón Comal`: `#111111`
  - `Coral Fuego`: `#E8430A`
  - `Turquesa Pacífico`: `#2ABFBF`
  - `Azul Abisal`: `#0D3B5E`
  - `Arena Costa`: `#D4C5A9`
  - `Blanco Espuma`: `#F7F3EE`
  - `Oro Chile Seco`: `#C9A84C`
- **Tipografías**:
  - Títulos, Logo & Precios: `Bebas Neue` (`font-display`)
  - Subtítulos & Notaciones: `Cormorant Garamond` (`font-serif`)
  - Interfaz & Cuerpo: `Space Grotesk` (`font-sans`)

---

## 🚀 Stack Técnico

- **Framework**: Next.js 14 (App Router, Server Components & Server Actions)
- **Estilos**: Tailwind CSS + CSS Variables
- **Base de Datos & Auth**: Supabase (PostgreSQL, Supabase Auth con RLS)
- **Almacenamiento de Imágenes**: Supabase Storage (Bucket público `platillos` con compresión cliente WebP)
- **Drag & Drop**: `@hello-pangea/dnd` para el tablero Kanban de Pedidos
- **Iconos**: `lucide-react`
- **Despliegue**: Vercel

---

## 📁 Estructura del Proyecto

```
/marea-negra
├── /app
│   ├── layout.tsx              ← Fuentes Google, metadata SEO y providers
│   ├── globals.css             ← Variables CSS y utilidades Marea Oscura
│   ├── /(public)
│   │   └── page.tsx            ← Menú público interactivo y pedido por WhatsApp
│   ├── /(admin)
│   │   ├── layout.tsx          ← Sidebar administrativo con control de roles
│   │   ├── dashboard/page.tsx  ← KPIs y resumen general de operaciones
│   │   ├── pedidos/page.tsx    ← Tablero Kanban en tiempo real con Drag & Drop
│   │   ├── menu/page.tsx       ← Gestión de catálogo, toggle disponibilidad y editor
│   │   ├── inventario/page.tsx ← Control de insumos, barra de stock y bitácora
│   │   └── caja/page.tsx       ← Arqueo diario, conciliación y exportación WhatsApp
│   └── /login
│       └── page.tsx            ← Inicio de sesión dark luxury
├── /components
│   ├── /ui/                    ← Pattern Library (ProductCard, ListRow, NarrativeCard, LuxuryCard)
│   ├── /pedidos/               ← Componente KanbanBoard con Supabase Realtime
│   ├── /menu/                  ← Componentes MenuManager e ImageUploader (WebP client canvas)
│   ├── /inventario/            ← InventoryManager con medidores visuales
│   └── /caja/                  ← CajaManager con conciliación matemática
├── /lib
│   ├── /actions/               ← Server Actions (pedidos, menú, inventario, caja)
│   ├── /supabase/              ← SSR Clients (client, server, middleware)
│   └── /types/                 ← Interfaces TypeScript completas
├── /supabase
│   ├── /migrations/            ← DDL SQL completo con RLS y Storage
│   └── seed.sql                ← Categorías, mariscos e insumos semilla
└── README.md
```

---

## ⚡ Setup e Instalación Local

### 1. Clonar e Instalar Dependencias

```bash
cd /Users/mariovaldezdev/marea-negra
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Llena las variables con las credenciales de tu proyecto en Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Ejecutar Migraciones SQL en Supabase

1. Ve al panel de control de Supabase → **SQL Editor**.
2. Ejecuta el archivo `supabase/migrations/01_schema.sql` para crear las tablas, activar RLS, configurar triggers y las políticas del Storage bucket `platillos`.
3. Ejecuta el archivo `supabase/seed.sql` para poblar las categorías, los platillos icónicos y el stock base de insumos.

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el Menú Público y [http://localhost:3000/login](http://localhost:3000/login) para el Panel Administrativo.

---

## 🌐 Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Agrega las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Despliega con el comando build por defecto (`npm run build`).

---

© 2026 Marea Negra - Aguachiles & Cocteles.
