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

