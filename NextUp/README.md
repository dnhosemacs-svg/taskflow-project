# Taskflow-project

NextUp es una aplicación web sencilla que permite escribir tareas que se mostrarán en forma de lista que se quedarán en memoria aunque se cierre la página y se podrán eliminar con un check al terminarlas.

---

## Características principales

-Visualización de lista de tareas.
-Cada tarea tendrá un boton con forma de check para eliminarla.
-Adicionalmente tentremos una barra de búsqueda para que se muestren solo las tareas que coincidan con la búsqueda.
-Dichas tareas se guardan en la memoria interna mediante un script que trabaja a través del DOM.

## Tecnologías utilizadas
- HTML5 para la estructura.
- CSS3 para los estilos y el diseño.
- JavaScript para la captura de texto, el listado de tareas y la eliminaciónm de las mismas.

---

## Tests rápidos (antes de refactorizar)

Hay un mini “test runner” en `tests/test-runner.html` que carga `app.js` con un DOM mínimo y valida:
- Añadir tareas (incluye trim y persistencia)
- Cargar desde `localStorage`
- Filtrar por búsqueda
- Eliminar tareas (incluye el `setTimeout` de la animación)

### Cómo ejecutarlo

- Abre `tests/test-runner.html` en el navegador.
- Si el navegador bloquea `localStorage` al abrir archivos locales, sirve la carpeta `NextUp` con un servidor estático y abre `tests/test-runner.html` desde `http://`.

