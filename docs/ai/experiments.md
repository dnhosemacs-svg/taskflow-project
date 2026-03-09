Aquí se expondrán alguynos problemas que intentaré resolver mediante IA.

Primero se resolverán sin ayuda y luego se comparará mi solución con la solución que me arroje la IA.

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