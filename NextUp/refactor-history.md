# Historial de refactor de NextUp

Este archivo documenta, paso a paso, los cambios de refactorización que vamos realizando sobre la app.

## 2026-03-10

- **`index.html` → extraer CSS inline del toggle de tema**
  - Se movió todo el bloque `<style>` responsable del botón `#theme-toggle` a un archivo separado: `theme-toggle.css`.
  - `index.html` ahora lo importa con `<link rel="stylesheet" href="theme-toggle.css">`.

- **`index.html` → extraer JS inline de modo oscuro**
  - Se movió la lógica inline de dark mode (gestión de clase `dark` en `<html>`, lectura/escritura de `localStorage` y actualización de texto/icono del botón) a un archivo nuevo: `theme.js`.
  - Se eliminaron del HTML las funciones y el `addEventListener` que estaban embebidos en un `<script>` al final del `body`.

- **Carga de scripts → uso de `defer`**
  - Se cambiaron los scripts al final de `index.html` para que carguen así:
    - `theme.js` con `defer`.
    - `app.js` con `defer`.
  - Esto evita bloquear el render inicial y asegura que el DOM esté listo cuando se ejecute la lógica.

- **`app.js` → unificación de creación de `<li>`**
  - Se extrajo la lógica repetida de creación de elementos de tarea a una única función `createTaskElement(text)` que:
    - Construye el `<li>` con sus clases Tailwind, botón `.delete-btn`, imagen e interior `<span>`.
    - Inserta el elemento en la lista y aplica la animación de entrada.
  - `addTask()` ahora delega en `createTaskElement(text)` para no duplicar estructura y estilos.

- **`app.js` + tests → modelo de tareas con IDs**
  - `tasks` deja de ser un array de strings y pasa a ser un array de objetos `{ id, text }`, generando IDs únicos con `generateTaskId()`.
  - `createTaskElement()` ahora recibe o bien una string o bien un objeto tarea, asigna `data-id` al `<li>` y coloca el texto desde `task.text`.
  - El manejador de borrado usa `li.dataset.id` para filtrar `tasks` por `id`, evitando problemas con tareas duplicadas.
  - `loadTasks()` migra automáticamente desde el formato antiguo de `localStorage` (array de strings) al nuevo (array de objetos).
  - En `tests/tests.js`, el helper `readStoredTasks()` se actualiza para devolver siempre un array de textos, independientemente del formato interno guardado.

- **`app.js` + tests → filtro con clase y compatibilidad con `display`**
  - `filterTasks()` ahora alterna la clase `hidden` y además actualiza explícitamente `style.display` (`flex`/`none`) para cada `<li>`, asegurando que funcione tanto con Tailwind como en el entorno mínimo de tests.
  - En `tests/tests.js`, `visibleLiTexts()` usa `getComputedStyle(li).display` para determinar qué tareas están visibles, manteniendo los tests alineados con el comportamiento real.

- **Estructura de carpetas en `NextUp/`**
  - Se creó `src/` para JavaScript:
    - `src/app.js`
    - `src/theme.js`
  - Se creó `styles/` para CSS:
    - `styles/input.css`
    - `styles/output.css` (generado por Tailwind)
    - `styles/theme-toggle.css`
  - `index.html` y `Imagenes/` se mantienen en la raíz de `NextUp/`.
  - Se actualizaron rutas en `index.html` y `tests/test-runner.html` para apuntar a `src/` y `styles/`.
  - Se actualizó `tailwind.config.js` para escanear `index.html`, `src/**/*.js` y `styles/**/*.css`.
  - Se añadieron scripts en `package.json` para generar `styles/output.css` (`npm run build:css` / `npm run watch:css`).

- **JSDoc en funciones clave**
  - Se añadieron anotaciones JSDoc en `src/app.js` y `src/theme.js` para mejorar autocompletado, documentación y seguridad durante refactors (tipos, params, returns y efectos secundarios).

## 2026-03-17

- **Drag & drop (desktop)**
  - Reordenar tareas pendientes arrastrándolas dentro de la lista.
  - Mover tareas a proyectos soltándolas sobre un proyecto.
  - Soltar sobre `+ Proyecto` crea un proyecto nuevo automáticamente y mueve la tarea.

- **Reordenación táctil (móvil/tablet)**
  - Long‑press + arrastre con elemento flotante y placeholder.
  - Bloqueo de scroll robusto (incluye prevención global de `touchmove` durante reorder).
  - Refactor del subsistema táctil: `setupTouchReorder(...)` devuelve `destroy()`; constantes configurables para long‑press y threshold; scroll lock encapsulado en `reorderScrollLock`.

- **Completar por clic**
  - Clic simple en el texto de una tarea la marca como completada.
  - Doble clic mantiene edición: cancela el completado pendiente y entra en modo edición.

- **UI**
  - El botón `.move-btn` se muestra solo en móvil (en desktop se favorece el drag & drop).

- **Búsqueda**
  - Se añadió el selector `#search-status` para filtrar resultados entre **todas / pendientes / completadas** dentro de la búsqueda.

- **Tema**
  - El botón `#theme-toggle` se movió al `header` y se posiciona a la derecha sin afectar el centrado del título.

## 2026-03-18

- **Reducir “ruido” en `index.html` (sin cambiar el contrato de IDs)**
  - Se eliminaron comentarios redundantes y bloques de explicación que ya estaban documentados en `ANALISIS_NEXTUP.md`.
  - Se reemplazaron grupos repetidos de utilidades (flex/alineación/márgenes) por una clase reutilizable nueva: `.section-head`.

- **`styles/components.css`: limpieza y robustez**
  - Se corrigió un bloque de media queries anidadas (CSS inválido) para que los estilos responsive de `.card-app` sean deterministas.
  - Se añadió `.section-head` para centralizar layout de encabezados de sección y evitar repetición en HTML.

- **`styles/theme-toggle.css`: micro-limpieza**
  - Se eliminó un salto de línea sobrante en el bloque de iconos del toggle.

