---
name: dribbble-bento-design-system
description: Estándar maestro de diseño UI/UX estilo Bento Grid Minimalista de Dribbble / Linear para Marea Negra. Define la arquitectura visual de tarjetas, cápsulas 3D, badges, matrices de puntos, widgets oscuros Apple-style, paletas en español y cobertura total de Dark y Light mode para transformar todos los módulos del sistema.
---

# 🎨 Dribbble Bento Design System · Marea Negra Standard

Este skill establece el estándar visual y técnico de interfaz para todos los módulos de **Marea Negra** (Dashboard, Pedidos, Mesas, Pantalla de Cocina, Menú, Inventario, Caja, Clientes, Empleados, Horarios y Cupones).

---

## 💎 1. Filosofía & Principios de Diseño

1. **Lenguaje en Español 100%**: Todo texto, etiqueta, métrica, botón, tooltip y estado debe estar en **español natural y profesional de Sinaloa / México**.
2. **Badges con Color Sólido 100% (Sin traslúcidos lavados)**:
   - Los badges de estado, porcentajes y etiquetas deben ser de **color sólido al 100%** (`#16A34B` Verde Esmeralda/Bosque Sólido, `bg-coral`, `bg-turquesa`, `bg-amber-500`) con **fuente blanca pura `text-white`** y tipografía mono/sans bold, manteniendo contraste impecable tanto en Light como en Dark mode. Prohibido usar fondos traslúcidos lavados estilo `bg-emerald-500/10` para tags principales.
3. **Geometría Ultra-Suave (Superellipse)**:
   - Tarjetas principales: `rounded-[32px]` con padding `p-6 sm:p-7`.
   - Mini widgets y sub-cards: `rounded-2xl` o `rounded-3xl` con padding `p-4 sm:p-5`.
   - Botones y pills de acción: `rounded-full`.
3. **Dual Theme (Light #F5F5F5 & Dark #080808 / #111111)**:
   - **Light Mode**: Fondos neutros `#F5F5F5` con tarjetas blancas puras `bg-white`, bordes `border-black/5` o `border-black/10`, sombras suaves `shadow-sm` y textos `#080808` / `#666666`.
   - **Dark Mode**: Fondos ultra oscuros `#080808`, tarjetas `bg-[#111111]`, bordes `border-white/10`, textos `text-blanco` y acentos neón controlados.
4. **Cero Genéricos**: Prohibido el look genérico de Tailwind o IA. Toda card debe tener jerarquía visual editorial, micro-badges y tipografía contrastada.

---

## 📐 2. Anatomía de Componentes Bento

### A. Cabeceras con Pill Selectors & Filtros
```tsx
<div className="flex items-center justify-between gap-4">
  <h2 className="text-xl sm:text-2xl font-sans font-bold text-negro dark:text-blanco tracking-tight">
    {titulo}
  </h2>
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-negro dark:text-blanco transition-all cursor-pointer">
      <span>Semana</span>
      <ChevronDown className="w-3.5 h-3.5 text-negro/70 dark:text-blanco/70" />
    </div>
    <button
      type="button"
      className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-full text-negro dark:text-blanco transition-all"
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
    </button>
  </div>
</div>
```

### B. Gráfico de Barras Cápsula 3D (Overall Sales)
- Barras gruesas en cápsula `rounded-2xl` color Coral `#F55331` o Mostaza `#ECC94B`.
- Badges flotantes superiores con porcentaje `+24%`, `+36%` en tipografía mono.
- Contenedores de fondo con cápsula suave `bg-black/[0.03] dark:bg-white/[0.04]` y labels inferiores en carrusel de meses/días (`Ene`, `Feb` o `Lun`, `Mar`).

### C. Tarjeta de Origen / Desglose de Canales (Source)
- Línea guía vertical lateral `border-l-2 border-black/10 dark:border-white/10 pl-3.5`.
- Cápsulas duales side-by-side de altura `h-8 sm:h-9` con esquinas `rounded-2xl`:
  - **Mostaza `#ECC94B`** (`Salón & Mesas`) + **Verde Sólido `#16A34B`** (`Domicilio / WhatsApp`).
  - **Púrpura `#855BFA`** (`Efectivo`) + **Coral `#F85938`** (`Transferencia / OXXO`).
- Textos y porcentajes dentro de las barras con truncado y legibilidad perfecta.

### D. Sub-Widgets y Mini Cards
- **Mini Stat Cards**: Fondo `bg-black/[0.02] dark:bg-white/[0.02]`, bordes sutiles, métrica grande y barra de progreso fina.
- **Widgets Oscuros (Estilo Apple Watch / Dynamic Island)**: Fondo `bg-[#0D0E10]`, textos blancos, badges turquesa/oro y selector de días en píldoras circulares.

### E. Matriz de Transacciones (Dot Scatter Grid)
- Puntos redondeados en columnas agrupadas simulando la actividad del turno con intensidades escalonadas de Coral (`bg-coral`, `bg-coral/60`, `bg-coral/30`).

### F. Tarjeta 3D Ultra Dark con Cortina Texturizada (Club VIP / Retención)
- Fondo `bg-[#0B0C0E]` con gradiente radial y textura estriada.
- Número gigante `84%` en sans-black.
- Paginación vertical de puntos y botón inferior pill blanco (`Ver Todo`).

---

## 🔄 3. Regla de Cobertura Obligatoria para Nuevos Módulos

Al migrar o rediseñar cualquier módulo al estilo Bento:
1. Reemplazar tablas planas o listas genéricas por **Bento Grids modulares**.
2. Adaptar **100% de los Skeletons (`loading.tsx`)** para que reflejen la forma idéntica de la Bento Grid.
3. Asegurar contraste perfecto tanto en Light Mode (`#F5F5F5` con tarjetas blancas) como en Dark Mode (`#080808` con `#111111`).
4. Conectar todas las métricas y pills a **datos reales de Supabase** (nunca valores estáticos hardcodeados sin fallback).
