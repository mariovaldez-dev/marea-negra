---
name: dual-theme-complete-component-coverage
description: >-
  Estándar obligatorio de cobertura total de componentes para diseño Dark & Light Mode.
  Garantiza que al diseñar o rediseñar interfaces se adapten sistemáticamente todos los
  componentes del módulo: páginas, layouts, modales, formularios, dropdowns, badges,
  notificaciones y fundamentalmente TODOS los skeletons y estados de carga (loading.tsx).
---

# 🌓 Estándar de Cobertura Total de Componentes (Dark & Light Mode)

Al diseñar, rediseñar o ajustar la estética de cualquier pantalla, módulo o flujo de la aplicación, **es una regla estricta e innegociable considerar y actualizar el 100% de los componentes visuales y estados de ciclo de vida**, evitando que queden componentes huérfanos o con estilos fijos de un solo modo.

---

## 📋 1. Matriz de Componentes Obligatorios por Módulo

Cada vez que se trabaje en un módulo (ej. Dashboard, Pedidos, Menú, Inventario, Caja, Clientes), se debe verificar la adaptación dual en cada uno de estos elementos:

| Categoría | Componentes a Auditar | Tokens Light Mode | Tokens Dark Mode |
| :--- | :--- | :--- | :--- |
| **1. Carga & Skeletons** | `loading.tsx`, Skeletons en línea, Grid loaders, Image loaders | `bg-black/10`, `bg-black/5`, `border-black/10` | `bg-white/10`, `bg-white/5`, `border-white/10` |
| **2. Superficies Base** | Page root, Layouts, Aside/Sidebar, Header, Main container | `bg-[#F5F5F5]`, `bg-white`, `border-black/10` | `bg-[#080808]`, `bg-[#111111]`, `border-white/10` |
| **3. Tarjetas & Filas** | KPI Cards, StatCards, ListRows, Tables, Kanban Columns | `bg-white`, `text-[#171717]`, `shadow-sm` | `bg-[#111111]`, `text-[#F7F3EE]`, `border-white/10` |
| **4. Modales & Drawers** | Diálogos emergentes, Drawers móviles, Confirmation prompts | `bg-white`, `backdrop-blur-sm bg-black/60` | `bg-[#111111]`, `backdrop-blur-sm bg-black/80` |
| **5. Formularios** | Inputs, Textareas, Selects, Checkboxes, File uploaders | `bg-black/5 text-[#171717] border-black/10` | `bg-white/5 text-[#F7F3EE] border-white/10` |
| **6. Micro-UI** | Chips, Pills, Badges de estado, Tags, Tooltips | `bg-slate-100 text-slate-700 border-slate-200` | `bg-white/10 text-arena/80 border-white/10` |
| **7. Avisos & Banners** | PWA banners, Permisos de voz/notificación, Offline warning | Fondos suaves translúcidos con bordes sutiles | Fondos oscuros elegantes con bordes de contraste |

---

## ⚡ 2. Reglas de Oro para Skeletons (`loading.tsx`)

1. ❌ **PROHIBIDO** usar fondos negros fijos (`bg-[#050404]`, `bg-carbon`, `bg-[#111111]`, `text-blanco`) dentro de skeletons o archivos `loading.tsx`. Si el usuario navega en Light Mode, la pantalla parpadeará en negro antes de cargar.
2. ❌ **PROHIBIDO** usar esquinas u ornamentos rígidos fijos (ej. `gold-border-corner`, `bg-dots-pattern`) que no pertenezcan al sistema minimalista activo.
3. ✅ **OBLIGATORIO** usar bloques de pulso con opacidad dual:
   ```tsx
   // Contenedor de tarjeta skeleton
   <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-5 animate-pulse shadow-sm">
     {/* Barra de título */}
     <div className="w-32 h-4 bg-black/10 dark:bg-white/10 rounded-lg" />
     {/* Barra de descripción */}
     <div className="w-48 h-3 bg-black/5 dark:bg-white/5 rounded-md mt-2" />
   </div>
   ```

---

## 🪟 3. Reglas para Modales y Formularios

1. **Backdrop:** Siempre usar `bg-black/60 backdrop-blur-sm` para enfocar la atención sin cegar al usuario en ninguno de los dos modos.
2. **Cuerpo del Modal:** `bg-white dark:bg-[#111111] text-negro dark:text-blanco border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl`.
3. **Selects nativos y dropdowns:** 
   - En CSS global o inline, asegurar que las `<option>` tengan fondo y texto explícito según el modo:
     `select option { background-color: #FFFFFF; color: #171717; }`
     `html.dark select option { background-color: #111111; color: #F7F3EE; }`

---

## 🏷️ 4. Reglas para Chips, Tags y Badges

1. Los chips de historial o etiquetas nunca deben tener fondos negros sólidos (`bg-black` / `bg-carbon`) en Light Mode.
2. Usar combinaciones de fondo suave + texto de alto contraste:
   - **Éxito:** `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
   - **Alerta / Urgente:** `bg-coral/10 text-coral border border-coral/20`
   - **Información / Cyan:** `bg-turquesa/10 text-turquesa border border-turquesa/20`
   - **Neutro:** `bg-black/5 text-negro/70 dark:bg-white/5 dark:text-arena/70 border border-black/5 dark:border-white/5`

---

## 🔍 5. Checklist de Validación antes de dar por terminado un Módulo

- [ ] ¿Se verificó `page.tsx` en Light Mode y Dark Mode?
- [ ] ¿Se verificó el archivo `loading.tsx` asociado en ambos modos?
- [ ] ¿Los modales de crear/editar/eliminar se abrieron y probaron en ambos temas?
- [ ] ¿Los botones de acción rápida, filtros y tabs tienen contraste nítido?
- [ ] ¿Se eliminaron todos los estilos hardcodeados del tema opuesto o de temas antiguos deprecados?
