Aquí se expondrán alguynos problemas que intentaré resolver mediante IA.

Primero se resolverán sin ayuda y luego se comparará mi solución con la solución que me arroje la IA.

En el problema 1 no era capaz de resorverlo sin ia, comprobé toda la configuración en tailwind.config.js y el código de mi input.css pero hasta que cursor no ha analizado un error que me salía por consola no se pudo solucionar el problema 1.

En el problema 2 pensé directamente en poner iuna restricción para no poder introducir tareas repetidas que era ujna solución sencilla y rápida, pero al preguntar a la ia me propuso identificar las tareas mediante id y de esa forma se pueden añadir y borrar sin conflictos entre ellas, al tener la ayuda de la ia se ha tardado bastante menos y la solución me parece más interesante ya que hay usuarios que pueden necesitar tener tareas repetidas por cualquier motivo.

En el problema 3 no era un problemaoriginalmente, pero a la hora de refactorizar y hacer test para comprobar funcionalidades me dí cuenta que podría mejorar el código para que funcione sin problema aunque tailwind no esté en ejecución mediante style.

------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------

Problema1: El botón del modo oscuro no funciona.

IA: ChatGPT y Claude.

Prompt: Tengo una web compuesta por un html al que se le ha instalado tailwind v4, mediante tailwind y un pequeño script se ha añadido un botón para poner el dark mode, si mediante el inspector del navegador se comprueba que la clase dark se aplica bien en el html pero el aspecto de la web no cambia a que se puede deber.

Causas posibles:

-Las clases dark: deben estar presentes en el HTML [DESESTIMADA]
    Clases puestas en cada elemento
-Tailwind v4 usa @variant dark en lugar de darkMode: 'class' [DESESTIMADA]
    En input.css está la línea: @variant dark (&:where(.dark, .dark *));
-El selector de la clase .dark debe estar en el elemento raíz [DESESTIMADA]
    Mi script aplica .dark en document.documentElement
-Conflicto con @layer o CSS personalizado que sobreescribe [DESESTIMADA]
    El CSS usado en el HTML es output.css
-Configuración incorrecta de darkMode en tailwind.config.js [DESESTIMADA]
    darkMode: "class", //añadido en tailwind.config.js
-Tailwind no detecta las clases dark: al compilar [DESESTIMADA]
    En mi output.css existen las clases.dark
-El botón solo cambia la clase pero no el CSS compilado [DESESTIMADA]
    En mi output.css existen las clases.dark
-Estás usando Tailwind por CDN y falta la configuración [DESESTIMADA]
    Tengo tailwind v4 instalado en el proyecto y funciona para el aspecto de la web.

Después de comprobar todos los puntos ChatGPT ha propuesto una prueba para ver de donde viene el problema.
    <div class="bg-white dark:bg-black text-black dark:text-white p-10">
        TEST DARK MODE
    </div>
A raiz de esta prueba determinamos que el problema es de copnfiguración.
Mediante Claude he revisado la configuración y al ejecutar el comando npx tailwindcss -i ./input.css -o ./output.css --watch he visto que arrojaba el error de que el ejecutable de tailwind no esta en la carpeta .bin por lo que he procedidio a reinstalar completamente el CLI, priomer eliminando las dependencias y luegho volviendo a instalarlas y funciona perfectamente el modo oscuro.
Comandos usados propuestos por Claude:
<!--Desinstalar dependencias-->
-Remove-Item node_modules -Recurse -Force
-Remove-Item package-lock.json
<!--Reinstalar node y Tailwind-->
-npm install
-npm install -D tailwindcss @tailwindcss/cli
<!--Ejecutar Tailwind para que genere CSS-->
-npx tailwindcss -i ./input.css -o ./output.css --watch

------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------

Problema 2: Al borrar una tarea a veces se elimina otra (o la incorrecta).

IA: Cursor / Claude.

Prompt: Viendo mi @NextUp/index.html y @NextUp/src/app.js: al borrar una tarea, si hay dos con el mismo texto se borra la incorrecta, a que causas puede deberse y como se solucionarían.

Causas posibles:

-El evento de borrado no está bien vinculado al botón [DESESTIMADA]
    Cada botón tenía su listener y el target era el correcto.
-El array se actualiza pero el DOM no (o al revés) [DESESTIMADA]
    Se actualizaba ambos, pero usando el texto como identificador.
-Identificar tareas solo por texto es ambiguo cuando hay duplicados [CONFIRMADA]
    Sin ID único, no hay forma fiable de saber qué tarea borrar.

Solución aplicada:
-Se cambió el modelo de datos: tasks pasó de ser array de strings a array de objetos { id, text }, con IDs únicos generados por generateTaskId().
-Cada <li> tiene ahora un atributo data-id. El manejador de borrado usa li.dataset.id para filtrar la tarea en el array y eliminarla del DOM, de modo que solo se borra la tarea correcta.
-loadTasks() migra automáticamente los datos antiguos de localStorage (array de strings) al nuevo formato (array de objetos) para no perder datos al actualizar.

------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------

Problema 3: El filtro All / Active / Done no se comportaba igual en la app y en los tests.

IA: Cursor.

Prompt: Viendo mi @NextUp/src/app.js y mis tests: el filtro All/Active/Done oculta tareas con la clase hidden de Tailwind, pero en los tests (sin Tailwind) no funciona igual. Modifica el filtro para que funcione igual con y sin Tailwind y actualiza los tests para comprobar la visibilidad, sin cambiar la funcionalidad original.

Causas posibles:

-Los tests no cargan Tailwind [DESESTIMADA]
    El objetivo era que los tests fueran válidos sin depender del CSS completo.
-El filtro solo modificaba la clase, no el estilo calculado [CONFIRMADA]
    En un entorno sin Tailwind, hidden no cambia display; el elemento sigue visible.

Solución aplicada:
-filterTasks() ahora hace dos cosas: aplica la clase hidden (para Tailwind) y asigna explícitamente style.display a cada <li> (flex o none según corresponda). Así el estado visible/oculto es el mismo con o sin Tailwind.
-En tests/tests.js, visibleLiTexts() usa getComputedStyle(li).display para decidir si una tarea está visible, alineando los tests con el comportamiento real de la app.