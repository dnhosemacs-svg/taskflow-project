Archivo para documentar mi uso y aprendizaje con Cursor.

Añadiré los atajos de teclado más usados y las partes en las que más me ayude esta herramienta.

Comandos:

Ctrl + K  Inicia el editor inline.
Ctrl + I  Manda latarea al chat para que actúe la ia.
Ctrl + Shift + F  Buscar dentro de los archivos.
Ctrl + Enter  Aceptar los cambios sugeridos por la ia.
Ctrl + Backspace Rechazar los cambios sugeridos por la ia.

Utilidades:

Edición inline: Esta herramienta la usaré para ir modificando partes del código "poco a poco" al ir añadiendo funcionalidades existentes como adecuar estética a las tareas, o aplicar programación responsiva al boton dark-mode.

Para los comentarios ha escaneado mi proyecto y ha identificado cada parte para que sea mucho más fácil de encontrar funciones o elementos de la web.

Respecto al botón he descargado dos svg con los iconos que quería aplicar y cursor ha creado un layout y las mediaquerys necesarias para cumplir mi objetivo de responsive desing.

Consola: Muy útil que por ejemplo al querer lanzar tailwind arroje un error y el mismo chat sepa exactamente de que se trata como por ejemplo si cursor no está posicionado en la carpeta exacta en la que está instalado tailwind y sabe escanear el sistema de carpetas para encontrar la solución.

Refactorización: 

Analizando el código se comprueba que hay varios puntos a mejorar.

1. Dentro de index.html

    CSS inline en <style> para el toggle de tema: conviene moverlo a un archivo CSS.

    JS inline del dark mode dentro del HTML: conviene moverlo a theme.js.

    Carga de scripts: app.js sin defer (mejor defer para desacoplar del orden y no bloquear).


2. Dentro de app.js

    Estado tasks como strings (let tasks = [] y borrado por texto): se rompe con tareas duplicadas.

    Borrado en el listener de taskList (tasks = tasks.filter(...)): debería borrar por id, no por texto del DOM.

    Duplicación de código entre addTask() y createTaskElement() (creación del <li>, botón, imagen, clases, animación).

    Render “incremental” sin función central: mezcla mutación de DOM + actualización de tasks en varias partes (conviene un renderAll()).

    filterTasks(): usa li.style.display (mejor una clase CSS/Tailwind para ocultar/mostrar).

    Variable sin uso: var tamañoImg = 30;.