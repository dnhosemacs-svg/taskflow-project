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

