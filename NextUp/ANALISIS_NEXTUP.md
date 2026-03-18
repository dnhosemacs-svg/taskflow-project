# NextUp — Guía clara del código (HTML + JS + CSS)

## 1) Qué hace NextUp (visión general)
**NextUp es una app de tareas por proyectos** que funciona completamente en el navegador.

- **Permite**: crear/renombrar/eliminar proyectos, cambiar de proyecto, agregar tareas, editar tareas, mover tareas entre proyectos, “eliminar” tareas (en realidad pasan a completadas de la sesión), buscar tareas por texto.
- **Guarda (persistente)**: proyectos, tareas pendientes y el proyecto activo en `localStorage`.
- **No guarda (solo sesión)**: las tareas completadas (desaparecen al recargar).
- **Tema claro/oscuro**: se aplica con la clase `dark` en el `<html>` y se recuerda en `localStorage`.
- **Drag & drop**:
  - Reordenar tareas pendientes por arrastre (desktop).
  - Reordenar en táctil con long‑press + elemento flotante (móvil/tablet).
  - En desktop, mover tareas a otro proyecto soltándolas sobre un proyecto (o sobre `+ Proyecto` para crear uno nuevo y moverla).

---

## 2) Partes importantes del código (por archivo)

### `index.html` (estructura de la UI)
Es el “contrato” de la app: define IDs que luego el JavaScript usa para leer/escribir.

- **Tema**
  - Botón (en el header): `#theme-toggle` (texto `#theme-toggle-text` e icono `#theme-toggle-icon`)
- **Proyectos**
  - Desktop: `#project-list` + botón `#project-add`
  - Móvil: selector `#project-select-mobile`, drawer `#project-drawer` (abrir `#project-drawer-open`, cerrar `#project-drawer-close`) y lista `#project-list-mobile`
  - Modal crear/renombrar: `#project-modal` (form `#project-modal-form`, input `#project-modal-input`, botones cancelar/submit)
- **Tareas**
  - Agregar: form `#formulario`, input `#entrada`
  - Buscar: select `#search-status` + input `#search`
  - Pendientes: lista `#elemento`
  - Completadas: lista `#completed`
  - Modal mover tarea: `#move-task-modal` (lista `#move-task-modal-list`, confirmar/cancelar)

### `src/theme.js` (modo oscuro)
Hace 3 cosas:

1. **Inicializa el tema**:
   - Si existe `localStorage.theme`, lo usa.
   - Si no existe, usa la preferencia del sistema (`prefers-color-scheme`).
2. **Actualiza el botón** (texto, icono y `aria-label`) según el tema actual.
3. **Alterna el tema** al hacer click, guardando `localStorage.theme`.

### `src/app.js` (lógica principal)
Aquí está casi todo: datos, persistencia, render y eventos.

#### a) Estado (la “fuente de verdad”)
- `projects`: proyectos (persistidos)
- `tasks`: tareas pendientes (persistidas)
- `activeProjectId`: id del proyecto activo (persistido)
- `completedTasks`: tareas completadas **solo en memoria** (no persistido)

#### b) Persistencia (localStorage)
- Clave principal: `nextup_state_v2` (estado versionado)
- Compatibilidad: también escribe `tasks` (legacy) para entornos antiguos/tests.
- `loadState()` además **migra** instalaciones viejas que solo tenían `tasks`:
  - crea un proyecto por defecto
  - asigna `projectId` a todas las tareas legacy

#### c) Renderizado (pintar desde el estado)
- `renderProjects()`: reconstruye listas de proyectos (desktop y móvil) y el dropdown móvil.
- `renderTasksForActiveProject()`: reconstruye pendientes + completadas del proyecto activo.
- Reglas de limpieza visual:
  - `updatePendingVisibility()` (oculta pendientes si no hay)
  - `updateCompletedVisibility()` (oculta completadas si no hay)
  - `updateSearchVisibility()` (oculta buscador si no aporta)

#### d) Acciones del usuario (eventos)
- **Agregar tarea** (`addTask()`): crea tarea → la añade a `tasks` → la pinta → guarda.
- **Editar tarea** (`startEdit/finishEdit/cancelEdit`): cambia `span` ↔ `input` y al guardar actualiza `tasks` + guarda.
- **Completar tarea (clic en texto)**:
  - un clic simple sobre el `<span>` agenda el completado (con un delay pequeño para no romper el doble clic)
  - el doble clic cancela el completado pendiente y entra en edición
- **“Eliminar” tarea** (click en `.delete-btn`):
  - quita de `tasks` (sí se guarda)
  - mete en `completedTasks` (no se guarda)
  - la muestra en “completadas” con opción de restaurar
- **Restaurar** (click en `.restore-btn` en completadas):
  - pasa de `completedTasks` → `tasks` y guarda
- **Mover tarea** (click en `.move-btn`):
  - abre modal para elegir proyecto destino
  - cambia `task.projectId` y guarda
  - quita el `<li>` de la vista actual (ya no pertenece al proyecto activo)
- **Mover tarea por drag & drop (desktop)**:
  - arrastrar una tarea y soltarla sobre un proyecto en la lista de proyectos actualiza `task.projectId`
  - soltar sobre `+ Proyecto` crea un proyecto automáticamente y mueve la tarea a ese proyecto
- **Buscar** (`filterTasks()`): no cambia datos; solo muestra/oculta `<li>` según texto.
  - Además aplica el filtro de estado seleccionado en `#search-status`: todas / pendientes / completadas.

### `styles/components.css` (componentes visuales)
Centraliza estilos reutilizables y estados:

- Modo oscuro depende de `html.dark ...`
- Popups/drawers usan `.popup-root`, `.popup-backdrop`, `.popup-panel`
- Existe un modo “hay popup abierto” con `html.has-popup` que oscurece el fondo y (en móvil) oculta el botón de tema.
- Drag & drop:
  - `.task-item[draggable="true"]`, `.task-item.is-dragging` para desktop
  - `.task-floating` + `.task-placeholder` + `html.is-reordering` para arrastre táctil y bloqueo de scroll
  - `.move-btn` se muestra solo en móvil (en desktop se usa drag & drop para mover tareas a proyectos)
 - Utilidades internas (para reducir “ruido” en HTML):
   - `.section-head` para encabezados de sección consistentes (título + acción)

---

## 3) Flujo lógico (sin ruido)
1. **Arranca**
   - `theme.js`: aplica tema inicial y configura el toggle.
   - `app.js`: carga estado → asegura proyecto activo → pinta proyectos → pinta tareas del proyecto activo.
2. **Interacción típica**
   - Usuario hace una acción (agregar/editar/mover/cambiar proyecto).
   - Se actualiza el estado en memoria.
   - Se guarda (si afecta a `projects/tasks/activeProjectId`).
   - Se actualiza la UI (repintado total o cambios puntuales) y se re‑aplica búsqueda/visibilidad.

---

## 4) Dependencias, funciones clave y relaciones

### Dependencias (sin librerías externas en JS)
- **DOM + IDs del HTML**: la app depende de que existan `#formulario`, `#entrada`, `#elemento`, `#search`, IDs de proyectos, etc.
- **localStorage**: persistencia de estado y tema.
- **CSS**:
  - `styles/output.css` (compilado por Tailwind)
  - `styles/components.css` (componentes)
  - `styles/theme-toggle.css` (detalle del toggle)

### Funciones clave (núcleo mental)
- **Persistencia**: `loadState()`, `saveState()`, `ensureAtLeastOneProject()`
- **Contexto**: `setActiveProjectId()`, `getVisiblePendingTasks()`, `getVisibleCompletedTasks()`
- **Render**: `renderProjects()`, `renderTasksForActiveProject()`
- **Tareas**: `addTask()`, `createTaskElement()`, `createCompletedTaskElement()`, `startEdit()/finishEdit()/cancelEdit()`
- **Búsqueda**: `filterTasks()`, `ensureNoResultsElement()`
- **Modales**: `openProjectNameModal()`, `openMoveTaskModal()`, `openConfirmModal()`

---

## 5) Puntos confusos / posibles problemas
- **IDs que se buscan pero no existen en el HTML actual**: `#active-project-name` y `#active-project-name-desktop`. No rompe (hay checks), pero sugiere “restos” o UI incompleta.
- **El botón de “eliminar” no elimina “definitivo”**: mueve a completadas de sesión. El naming (`delete-btn`) puede confundir.
- **Completadas no persistentes**: es intencional, pero sorprende si esperas historial.
- **La búsqueda filtra el DOM** (no el array): funciona, pero obliga a acordarse de llamar `filterTasks()` tras cambios para mantener consistencia.
- **`has-popup` se usa de forma parcial**: algunos popups ajustan el fondo “global” y otros solo usan su backdrop; la intención queda mezclada.
- **`app.js` es un “monolito”**: mezcla estado + persistencia + UI + modales + accesibilidad. Para aprenderlo, ayuda tener un mapa (abajo).
- **CSS inválido si reaparece**: evita media queries anidadas (no están soportadas en CSS nativo). Se corrigió en `styles/components.css` para que no haya comportamientos “fantasma” según navegador.

---

## 6) Versión simplificada (conceptual, sin código)
Piensa NextUp como 4 bloques:

1. **Estado**
   - `state = { projects, tasks, activeProjectId, completedSessionOnly }`
2. **Persistencia**
   - `loadState()` al iniciar
   - `saveState()` después de cada cambio real en datos
   - tema separado: `loadTheme()/saveTheme()`
3. **Render (pintar UI desde el estado)**
   - `renderProjects(state)`
   - `renderTasks(state, activeProjectId)`
   - `updateVisibility(state)`
   - `applySearchFilter(query)`
4. **Acciones (eventos del usuario)**
   - cada acción: **actualiza estado → guarda (si aplica) → renderiza**

---

## 7) Mapa de “renderización” (estado → acciones → guardado → UI)

### 7.1 Fuente de verdad (datos)
- **Persistente**: `projects`, `tasks`, `activeProjectId`
- **Solo sesión**: `completedTasks`

### 7.2 Acciones (qué cambia y qué se repinta)

#### A) Inicio de app
- **load**: `loadState()` → `ensureAtLeastOneProject()` → `renderProjects()` → `setActiveProjectId(...)`
- **render**: `renderTasksForActiveProject()` (limpia listas y vuelve a pintar)

#### B) Cambiar proyecto
- **evento**: click en un proyecto / change en dropdown móvil
- **datos**: `activeProjectId = id`
- **persistencia**: `saveState()` *no siempre se llama aquí directamente*, pero el id activo se guarda en el estado cuando se llama `saveState()` por otras acciones; aun así, el UI se sincroniza siempre.
- **render**:
  - `renderProjects()` (marca activo)
  - `renderTasksForActiveProject()` (pinta solo tareas del proyecto activo)

#### C) Agregar tarea
- **evento**: submit del form
- **datos**: `tasks.push(newTask)`
- **persistencia**: `saveState()`
- **render**:
  - añade un `<li>` (no repinta todo)
  - `updateSearchVisibility()` + `updatePendingVisibility()`
  - si hay búsqueda activa, se re‑aplica `filterTasks()`

#### D) Editar tarea (guardar/cancelar)
- **evento**: click en lápiz / Enter / Escape / click fuera
- **datos**:
  - guardar: cambia `tasks[idx].text`
  - cancelar: no cambia datos
- **persistencia**: guardar → `saveState()`
- **render**: cambia el `<li>` (span/input) + `filterTasks()` para mantener coherencia

#### D.1) Completar tarea (clic en texto)
- **evento**: clic simple sobre el texto de la tarea
- **datos**:
  - quita de `tasks` (persistente)
  - añade a `completedTasks` (solo sesión)
- **persistencia**: `saveState()`
- **render**:
  - anima y quita el `<li>` de pendientes
  - crea `<li>` en completadas
  - `updateCompletedVisibility()` + `updatePendingVisibility()` + `updateSearchVisibility()` + `filterTasks()`

#### E) “Eliminar” tarea (pasar a completadas)
- **evento**: click en `.delete-btn`
- **datos**:
  - quita de `tasks` (persistente)
  - añade a `completedTasks` (solo sesión)
- **persistencia**: `saveState()` (por el cambio en `tasks`)
- **render**:
  - anima y quita el `<li>` de pendientes
  - crea `<li>` en completadas
  - `updateCompletedVisibility()` + `updatePendingVisibility()` + `updateSearchVisibility()`
  - `filterTasks()`

#### F) Restaurar completada
- **evento**: click en `.restore-btn`
- **datos**:
  - quita de `completedTasks` (sesión)
  - vuelve a `tasks` (persistente)
- **persistencia**: `saveState()`
- **render**:
  - crea `<li>` en pendientes si corresponde al proyecto activo
  - quita `<li>` de completadas
  - `updateCompletedVisibility()` + `updatePendingVisibility()` + `updateSearchVisibility()`
  - `filterTasks()`

#### G) Mover tarea a otro proyecto
- **evento**: click en `.move-btn` → modal → confirmar
- **datos**: `task.projectId = targetProjectId`
- **persistencia**: `saveState()`
- **render**:
  - quita el `<li>` de la lista actual (ya no corresponde)
  - `updateSearchVisibility()` + `updatePendingVisibility()` + `filterTasks()`

#### H) Reordenar pendientes / mover por drag (desktop)
- **evento**: drag & drop nativo HTML5
- **datos**:
  - reordenar: se persiste el orden del proyecto activo leyendo el orden del DOM
  - mover a proyecto: se actualiza `task.projectId` al soltar sobre un proyecto o sobre `+ Proyecto`
- **persistencia**: `saveState()`

#### I) Búsqueda con filtro de estado
- **evento**: input en `#search` y cambio en `#search-status`
- **datos**: no cambia arrays; solo afecta visibilidad en DOM
- **render**: muestra/oculta `<li>` y secciones según texto y estado (todas/pendientes/completadas)

### 7.3 Regla mental rápida
Si cambia **proyectos/tareas/activo** → **guardar** → **actualizar UI** (repintar o modificar puntual) → **ajustar filtro + visibilidad**.

