Documento donde alojaré todos los prompt utilizados y comentaré que es lo que mejor funciona en cada caso.

Prompts generales:

-Tengo una web compuesta por un html al que se le ha instalado tailwind v4, mediante tailwind y un pequeño script se ha añadido un botón para poner el dark mode, si mediante el inspector del navegador se comprueba que la clase dark se aplica bien en el html pero el aspecto de la web no cambia a que se puede deber.

-sabiendo que en mi css compilado me salen las clases dark y que según el inspector de la web se están aplicando correctamente en el html, que mas puede estar causando que en la web no se vea ningún cambio al pulsar el botón dark-mode.

Prompts para Claude mediante los cuales he descartado todas las posibles causas del error dark-mode:

-centrémonos en la causa 2, muestrame un ejemplo sencillo de como debo poner el .dark si empleo un script para aplicarlo al final del body
-que diferencia hay con mi script si también activa la clase dark, mi script es: <!-- SCRIPT DARK MODE -->
-en mi archivo input.css tengo: @import "tailwindcss"; @variant dark (&:where(.dark, .dark *));

-Cuando intento ejecutar tailwind me arroja el siguiente error: (mensaje del shell).

Observaciones: 

A la hora de meter prompts es muy util mandar junto al prompt el trozo de codigo al que nos referimos para que la ia sepa exactamente que esta pasando.