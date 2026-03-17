# Taskflow-project · NextUp

NextUp es una aplicación web para gestionar tareas de forma sencilla pero potente.  
Permite crear tareas organizadas por proyectos, buscarlas, marcarlas como completadas (con opción de deshacer) y trabajar en modo claro u oscuro, manteniendo el estado en `localStorage` aunque cierres la página.

---

## Características principales

- **Lista de tareas por proyecto**:  
  - Las tareas se agrupan por proyecto.  
  - Puedes cambiar de proyecto desde la barra lateral (escritorio) o desde el panel de proyectos (móvil).

- **Gestión de proyectos**:  
  - Crear nuevos proyectos.  
  - Renombrar proyectos mediante un modal centrado.  
  - Eliminar proyectos (se eliminan también sus tareas asociadas).  
  - Mover tareas entre proyectos mediante drag & drop (escritorio) o modal de selección (móvil).

- **Añadir y editar tareas**:  
  - Campo de texto para añadir nuevas tareas al proyecto activo.  
  - Edición en línea de una tarea (icono de lápiz):  
    - `Enter` guarda los cambios y actualiza `localStorage`.  
    - `Escape` cancela y restaura el texto original.

- **Completar tareas (soft delete)**:  
  - Un **clic simple sobre el texto** de una tarea la marca como completada.  
  - El botón de eliminar también mueve la tarea a completadas (misma lógica).  
  - Las tareas completadas se muestran tachadas y con un botón de “volver a pendientes”.  
  - Esta sección solo existe durante la sesión actual (no se persiste en `localStorage`), pero las pendientes sí se actualizan.

- **Reordenar tareas (arrastrar y soltar)**:
  - En **escritorio** puedes reordenar las tareas pendientes arrastrándolas dentro de la lista.
  - En **móvil/tablet** se usa long‑press (mantener pulsado) y arrastre con elemento flotante + placeholder (compatible con iOS/Android).

- **Mover tareas a proyectos por drag & drop (escritorio)**:
  - Arrastra una tarea y suéltala sobre un proyecto en la lista de proyectos para moverla.
  - Si la sueltas sobre **`+ Proyecto`**, se crea automáticamente un proyecto nuevo (“Nuevo proyecto”, “Nuevo proyecto 2”, …) y se mueve ahí.

- **Búsqueda en tiempo real**:  
  - Barra de búsqueda que filtra tanto tareas pendientes como completadas del proyecto activo.  
  - Incluye un selector para filtrar por estado: **todas / pendientes / completadas**.  
  - Muestra un mensaje de “No hay ninguna tarea con ese nombre” si no hay coincidencias.

- **Persistencia en `localStorage` (estado v2)**:  
  - Estado versionado que guarda proyectos, tareas y el proyecto activo.  
  - Migración automática desde el formato antiguo que solo guardaba una lista de tareas simples.

- **Modo claro / modo oscuro**:  
  - Botón en el **header** (alineado a la derecha) para alternar el tema (claro/oscuro) con texto e icono reactivos.  
  - El tema se recuerda en `localStorage` (`theme`) y respeta `prefers-color-scheme` la primera vez.  
  - Se basa en la clase `dark` sobre `<html>` para activar estilos `dark:*` (Tailwind).

---

## Tecnologías utilizadas

- **HTML5** para la estructura de la aplicación y los modales.  
- **CSS3 + Tailwind (compilado a `styles/output.css`)** para el diseño responsivo y el modo oscuro.  
- **JavaScript** para:
  - Captura de texto y creación de tareas.  
  - Gestión de proyectos y movimiento de tareas entre proyectos.  
  - Persistencia en `localStorage` con un estado versionado.  
  - Búsqueda en tiempo real y manejo de la sección de completadas.  
  - Drag & drop: reordenar tareas, mover tareas a proyectos en escritorio y arrastre táctil en móvil/tablet.
  - Gestión del tema (modo claro/oscuro) desde `src/theme.js`.

---

## Tests rápidos (después del refactor)

Hay un mini “test runner” en `tests/test-runner.html` que carga `src/app.js` con un DOM mínimo y valida la funcionalidad principal de NextUp:

- Añadir tareas (incluye `trim` y persistencia).  
- Cargar desde `localStorage` (incluida la migración desde el formato legacy).  
- Filtrar por búsqueda en la lista de tareas.  
- Completar tareas (soft delete) y restaurarlas a pendientes.  
- Edición en línea de tareas (guardar/cancelar).  
- Gestión de proyectos: filtrado por proyecto activo, renombrar, borrar y mover tareas entre proyectos mediante modal.

### Cómo ejecutarlo

- Abre `tests/test-runner.html` en el navegador.  
- Si el navegador bloquea `localStorage` al abrir archivos locales, sirve la carpeta `NextUp` con un servidor estático y abre `tests/test-runner.html` desde `http://`.

---

## Ejemplos de uso (pendiente de completar)

En mi caso he estado usando NextUp de manera funcional en mi navegador, tengo un proyecto creado con cada punto de la actividad a realizar y dentro de cada punto tengo las tareas que se piden, marcandolas según las hago.

Esta página puede venir bien para un sin fin de cosas, administrar el hopgar con tareas de limpieza, listas de la compra o tareas pendientes.

### Ejemplo 1: crear tu primer proyecto y tarea

-Con abrir la página se nos crea por defecto "Mi proyecto" donde podemos añadir tareas directamente.
-Además podemos renombrar y crear tantos proyectos como queramos, cada uno con sus respectivas tareas.

### Ejemplo 2: organizar tareas por proyectos

-Al tener varios proyectos es posible que o bien estos compartan una tarea o bien nos equivoquemos al añadir una tarea al proyecto equivocado.
 - En móvil: hay un botón para moverla mediante un modal.
 - En escritorio: puedes arrastrar la tarea y soltarla sobre el proyecto destino (o sobre `+ Proyecto` para crear uno nuevo).

### Ejemplo 3: usar la búsqueda y las tareas completadas

-Tenemos la posibilidad de buscar tareas por texto, en el caso de tener una lista mas extensa de tareas puede ser un problema encontrar la tarea concreta, además se ha tenido en cuenta que se puede completar una tarea por error y po rello el buscador encuentra tanto las tareas por completar como las completadas para poder revertir el error.

### Ejemplo 4: completar rápido (sin botones)

-Con un clic simple sobre el texto de una tarea pendiente, la tarea pasa a completadas (y podrás restaurarla).
