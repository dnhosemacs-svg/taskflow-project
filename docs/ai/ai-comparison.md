Documento para comparar ChatGPT con Claude en donde mostrare un prompt y a continuación mi comparación de las respuestas recibidas por ambas IA.

Explicaciones de aspectos técnicos:

Prompt: Explica en que consiste el diseño responsivo cuando tratamos de desarrollar un sitio web.

Respuesta ChatGPT: El diseño responsivo (Responsive Web Design) es una técnica de desarrollo web que permite que un sitio web se adapte automáticamente a diferentes tamaños de pantalla y dispositivos, como computadoras, tablets y teléfonos móviles.

El objetivo es que la página se vea bien y sea fácil de usar en cualquier dispositivo, sin necesidad de crear versiones separadas del sitio.

1. Adaptación a diferentes tamaños de pantalla

    En el diseño responsivo, el contenido y los elementos de la página cambian su tamaño y posición dependiendo del dispositivo.

        Ejemplo:

        En computadora → el contenido puede mostrarse en varias columnas.
        En tablet → el contenido puede reducirse a dos columnas.
        En móvil → normalmente se muestra en una sola columna para facilitar la lectura.

2. Principales técnicas del diseño responsivo

    1. Grid o rejillas flexibles

        e utilizan unidades relativas en lugar de tamaños fijos.

        Ejemplos de unidades:

        %
        em
        rem
        vw / vh

    2. Media Queries (consultas de medios)

        Las media queries de CSS permiten aplicar estilos diferentes según el tamaño del dispositivo.

        Ejemplo básico:

        @media (max-width: 768px) {
            body {
                background-color: lightgray;
            }
        }

    3. Imágenes y elementos flexibles

        Las imágenes también deben adaptarse al tamaño del contenedor.

        Ejemplo:

        img {
            max-width: 100%;
            height: auto;
        }

    4. Diseño Mobile First

        Una práctica común es diseñar primero para móviles y luego escalar a pantallas más grandes.

        Ventajas:

        Mejor rendimiento en móviles
        Código más limpio
        Experiencia optimizada para la mayoría de usuarios

3. Ventajas del diseño responsivo

    -Mejor experiencia de usuario
    -Un solo sitio para todos los dispositivos
    -Mejor posicionamiento SEO
    -Menor mantenimiento del sitio
    -Adaptación automática a nuevos tamaños de pantalla

En resumen:
El diseño responsivo consiste en crear páginas web que se ajustan automáticamente al tamaño de la pantalla mediante CSS flexible, media queries e imágenes adaptables, garantizando que el sitio sea usable y visualmente correcto en cualquier dispositivo.

Respuesta Claude: El diseño responsivo (o responsive design) es una técnica de desarrollo web que permite que un sitio web se adapte y se vea correctamente en cualquier dispositivo, ya sea un ordenador de escritorio, una tableta o un teléfono móvil, sin importar el tamaño de su pantalla.

Principios fundamentales

    1. Cuadrículas fluidas (Fluid Grids)

    En lugar de usar medidas fijas en píxeles, el diseño responsivo emplea unidades relativas como porcentajes. Así, los elementos de la página se estiran o encogen proporcionalmente según el ancho disponible.

    2. Imágenes y medios flexibles

    Las imágenes y vídeos también se escalan para no desbordarse de su contenedor. Esto se logra típicamente con reglas CSS simples como max-width: 100%.

    3. Media Queries (Consultas de medios)

    Son reglas CSS que aplican estilos diferentes según las características del dispositivo, principalmente el ancho de la pantalla. Por ejemplo:

        /* Estilos para pantallas pequeñas (móvil) */
        @media (max-width: 768px) {
            .menu {
                display: none;
            }
        }

Enfoques de diseño
Existen dos filosofías principales a la hora de implementarlo:

    Mobile First: se diseña primero para el móvil y luego se añaden estilos para pantallas más grandes. Es el enfoque más recomendado hoy en día.
    Desktop First: se diseña primero para escritorio y luego se adapta hacia pantallas más pequeñas.

¿Por qué es importante?

    Experiencia de usuario: garantiza que cualquier persona pueda navegar cómodamente desde cualquier dispositivo.
    SEO: Google prioriza en sus resultados los sitios que son responsivos y están optimizados para móvil.
    Mantenimiento: en lugar de tener dos sitios separados (uno para móvil y otro para escritorio), se gestiona uno solo.
    Alcance: más del 60% del tráfico web mundial proviene de dispositivos móviles.

Herramientas que facilitan el diseño responsivo
    Frameworks como Bootstrap o Tailwind CSS ya incorporan sistemas de cuadrículas y clases responsivas predefinidas, lo que acelera mucho el desarrollo.

En resumen, el diseño responsivo no es una característica opcional, sino un estándar esencial en el desarrollo web moderno.

Comparación personal: En mi opinión con chatgpt se organiza algo mejor la información, ya que presenta la respuesta como una lista de puntos y facilita profundizar mas en uno concreto en caso que se desee, claude arroja mas texto y por otro lado lo veo más explicativo que chatgpt.
Por otro lado en lo que se refiere a ejemplos chatgpt arroja un ejemplo de cada punto mientras que claude se ha centrado más en la explicación
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

Prompt: Explica brevemente que es una API y como la puedo implementar.

Respuesta ChatGPT: Una API (Application Programming Interface) es un conjunto de reglas y métodos que permiten que diferentes aplicaciones o sistemas se comuniquen entre sí.

En otras palabras, una API funciona como un intermediario que permite que un programa solicite información o servicios a otro programa sin conocer cómo está construido internamente.

Ejemplo sencillo:
Una aplicación del clima puede usar una API para obtener datos meteorológicos de un servidor externo.

¿Cómo se implementa una API?

Existen dos formas principales de usar o implementar una API:

1. Consumir una API (usar una API existente)

    Tu aplicación envía peticiones HTTP a un servidor y recibe datos normalmente en JSON.

    Ejemplo en JavaScript:

    fetch("https://api.ejemplo.com/usuarios")
        .then(response => response.json())
        .then(data => console.log(data));

2. Crear tu propia API

    Se desarrolla un servidor que expone endpoints (rutas) para que otros programas puedan acceder a datos o servicios.

    Ejemplo básico con Node.js y Express:

    const express = require("express");
    const app = express();

    app.get("/usuarios", (req, res) => {
        res.json([{ nombre: "Juan" }, { nombre: "Ana" }]);
    });

    app.listen(3000, () => {
        console.log("API funcionando en puerto 3000");
    });

En resumen:
Una API permite que distintas aplicaciones se comuniquen entre sí mediante solicitudes y respuestas, normalmente usando HTTP. Se puede consumir una API existente o crear una propia con un servidor que exponga endpoints.

Respuesta Claude: ¿Qué es una API?

Una API (Application Programming Interface o Interfaz de Programación de Aplicaciones) es un conjunto de reglas y protocolos que permite que dos aplicaciones se comuniquen entre sí. Funciona como un intermediario o "puente" que permite que un programa solicite datos o funcionalidades de otro.
Un ejemplo cotidiano: cuando usas una app del tiempo, esta no genera los datos meteorológicos ella misma, sino que los solicita a un servicio externo a través de una API.

¿Cómo implementar una API?
Hay dos perspectivas: consumir una API existente o crear la tuya propia.

1. Consumir una API (la más común)

    La mayoría de APIs web funcionan con el protocolo REST y se consultan mediante peticiones HTTP. 
    Ejemplo en JavaScript:

    fetch("https://api.ejemplo.com/usuarios")
        .then(response => response.json())
        .then(data => console.log(data));

2. Crear tu propia API
    Puedes construir una API con distintos lenguajes. Un ejemplo sencillo con Node.js + Express:

    const express = require("express");
    const app = express();

    // Endpoint que devuelve una lista de usuarios
    app.get("/usuarios", (req, res) => {
        res.json([{ id: 1, nombre: "Ana" }, { id: 2, nombre: "Carlos" }]);
    });

    app.listen(3000, () => console.log("API corriendo en el puerto 3000"));

Conceptos clave a tener en cuenta

    Concepto: Descripción

    Endpoint: La URL específica donde se accede a un recurso (/usuarios, /productos)
    Métodos: HTTPGET (leer), POST (crear), PUT (actualizar), DELETE (eliminar)
    JSON: El formato de datos más usado para enviar y recibir información
    Autenticación: Muchas APIs requieren una clave (API Key) o token para acceder

En resumen, una API es el mecanismo estándar para conectar servicios y aplicaciones, y dominar su uso es una habilidad fundamental en el desarrollo web moderno.

Comparación personal: En este caso ambas respuestas con bastante parecidas, ambas han dado una definición similar y un ejemplo de cada método para implementar una api.
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

Prompt: Explica que es el DOM y como se usa.

Respuesta ChatGPT: El DOM (Document Object Model) es una representación estructurada de una página web en forma de árbol de objetos que el navegador crea a partir del HTML.

Gracias al DOM, JavaScript puede acceder, modificar y manipular los elementos de una página web (texto, imágenes, estilos, etc.) dinámicamente.

¿Cómo funciona el DOM?

Cuando el navegador carga un archivo HTML:

    1. Lee el HTML
    2. Lo convierte en un árbol de nodos
    3. Cada etiqueta se convierte en un objeto del DOM

    Ejemplo de estructura:

    html
    ├── head
    └── body
        ├── h1
        └── p

¿Cómo se usa el DOM?

1. Seleccionar elementos

    JavaScript puede seleccionar elementos del HTML.

    const titulo = document.getElementById("titulo");

    Otros métodos comunes:

        getElementById()
        querySelector()
        querySelectorAll()
        getElementsByClassName()

2. Modificar contenido

    Se puede cambiar el contenido de un elemento.
    document.getElementById("titulo").textContent = "Nuevo título";

3. Cambiar estilos

    También se pueden modificar estilos CSS.
    document.getElementById("titulo").style.color = "blue";

4. Manejar eventos

    El DOM permite responder a acciones del usuario.
    document.getElementById("boton").addEventListener("click", function() {
        alert("Has hecho clic");
    });

En resumen:
El DOM es la estructura que representa el HTML de una página como un árbol de objetos, permitiendo que JavaScript acceda y manipule los elementos de la página para hacerla interactiva.

Respuesta Claude: ¿Qué es el DOM?
El DOM (Document Object Model o Modelo de Objetos del Documento) es una representación estructurada en forma de árbol de todos los elementos de una página HTML. Cuando el navegador carga una página web, convierte el HTML en este modelo, permitiendo que JavaScript pueda leer y manipular el contenido, la estructura y los estilos de la página de forma dinámica.

    document
    └── html
        ├── head
        │   └── title
        └── body
            ├── h1
            ├── p
            └── div
                └── button

¿Cómo se usa el DOM?
1. Seleccionar elementos

    // Por ID
    const titulo = document.getElementById("titulo");

    // Por clase
    const items = document.getElementsByClassName("item");

    // Con selectores CSS (el más usado hoy en día)
    const boton = document.querySelector(".btn");
    const todosLosBotones = document.querySelectorAll(".btn");

2. Modificar contenido y estilos

    const titulo = document.querySelector("h1");

    // Cambiar texto
    titulo.textContent = "Nuevo título";

    // Cambiar HTML interno
    titulo.innerHTML = "<span>Título con etiqueta</span>";

    // Cambiar estilos
    titulo.style.color = "red";
    titulo.style.fontSize = "24px";

    // Agregar o quitar clases CSS
    titulo.classList.add("activo");
    titulo.classList.remove("oculto");
    titulo.classList.toggle("resaltado");

3. Crear y eliminar elementos

    // Crear un nuevo elemento
    const nuevoParrafo = document.createElement("p");
    nuevoParrafo.textContent = "Este párrafo fue creado con JavaScript";

    // Agregarlo al DOM
    document.body.appendChild(nuevoParrafo);

    // Eliminar un elemento
    const elementoViejo = document.querySelector(".obsoleto");
    elementoViejo.remove();

4. Escuchar eventos
    Una de las funcionalidades más importantes del DOM es reaccionar a las acciones del usuario.

    const boton = document.querySelector("#miBoton");

    boton.addEventListener("click", () => {
    alert("¡Botón presionado!");
    });

    // Otros eventos comunes
    input.addEventListener("keyup", (e) => console.log(e.target.value));
    formulario.addEventListener("submit", (e) => e.preventDefault());

Ejemplo práctico completo

<button id="btn">Agregar elemento</button>
<ul id="lista"></ul>

<script>
  const boton = document.getElementById("btn");
  const lista = document.getElementById("lista");
  let contador = 1;

  boton.addEventListener("click", () => {
    const nuevoItem = document.createElement("li");
    nuevoItem.textContent = `Elemento ${contador++}`;
    lista.appendChild(nuevoItem);
  });
</script>

Resumen rápido

    Acción: Método
    
    Seleccionar un elemento: querySelector()
    Cambiar texto: textContent
    Modificar estilos: style / classList
    Crear elementos: createElement()
    Escuchar eventos: addEventListener()

Comparación Personal: En este caso me parece curioso como a diferencia del primer prompt claude ha dado mas ejemplos que chatgpt y chatgpt ha explicado más en cada punto.
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

Funciones en lenguaje natural para comparar implementación:

Prompt: Necesito una función para convertir grados celsius a fahrenheit.

Respuesta ChatGPT: Para convertir grados Celsius a Fahrenheit se utiliza esta fórmula:

    F = (C * 9/5) + 32

Donde:

    C = temperatura en Celsius 
    F = temperatura en Fahrenheit

Función en JavaScript

    function celsiusAFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    // Ejemplo de uso
    console.log(celsiusAFahrenheit(25)); // 77

Explicación rápida:

1. Multiplicamos los grados Celsius por 9/5.
2. Sumamos 32.
3. El resultado es la temperatura en Fahrenheit.

Respuesta Claude: Aquí tienes la función:

    function celsiusAFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    // Ejemplos de uso
    console.log(celsiusAFahrenheit(0));   // 32°F
    console.log(celsiusAFahrenheit(100)); // 212°F
    console.log(celsiusAFahrenheit(37));  // 98.6°F

La fórmula es (°C × 9/5) + 32. Si también necesitas la conversión inversa:

    function fahrenheitACelsius(fahrenheit) {
        return (fahrenheit - 32) * 5/9;
    }

Comparación de código: En este caso el código en sí es igual, claude me ha dado un ejemplo para hacer la conversión al reves y chatgpt ha explicado mejor el funcionamiento de la función.
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

Prompt: Necesito una función para buscar palabras dentro de un texto y que me diga si la palabra buscada existe, y en caso de que exista, que me cuente todas las veces que ésta se repita.

Respuesta de chapGPT: Función para buscar y contar palabras

    function buscarPalabra(texto, palabra) {
        const palabras = texto.toLowerCase().split(" ");
        const objetivo = palabra.toLowerCase();

        let contador = 0;

        for (let p of palabras) {
            if (p === objetivo) {
            contador++;
            }
        }

        if (contador > 0) {
            return `La palabra existe y aparece ${contador} veces.`;
        } else {
            return "La palabra no existe en el texto.";
        }
    }

    // Ejemplo
    const texto = "hola mundo hola javascript hola programador";
    console.log(buscarPalabra(texto, "hola"));

Cómo funciona

1. Convierte el texto a minúsculas para evitar problemas con mayúsculas/minúsculas.
2. Divide el texto en palabras usando split(" ").
3. Recorre cada palabra con un bucle.
4. Si coincide con la palabra buscada, incrementa el contador.

Al final:

Si el contador > 0 → indica cuántas veces aparece.
Si no → indica que no existe.

Respuesta Claude: Aquí tienes la función:

    function buscarPalabra(texto, palabra) {
        const regex = new RegExp(`\\b${palabra}\\b`, "gi");
        const coincidencias = texto.match(regex);

        if (!coincidencias) {
            return `La palabra "${palabra}" no fue encontrada en el texto.`;
        }

        return `La palabra "${palabra}" fue encontrada ${coincidencias.length} vez/veces.`;
    }

    // Ejemplos de uso
    const texto = "El gato está en el tejado. El gato duerme mucho. Me gustan los gatos.";

    console.log(buscarPalabra(texto, "gato"));   // encontrada 2 veces
    console.log(buscarPalabra(texto, "gatos"));  // encontrada 1 vez
    console.log(buscarPalabra(texto, "perro"));  // no encontrada

Algunas notas sobre la función:

1. \b delimita la búsqueda a palabras completas, por lo que "gato" y "gatos" se cuentan por separado.
2. g recorre todo el texto para contar todas las repeticiones.
3. i hace la búsqueda insensible a mayúsculas y minúsculas, por lo que "Gato" y "gato" se cuentan igual.

Si quieres ignorar esa distinción entre singular/plural o variantes, puedes quitar los delimitadores \b y buscar coincidencias parciales:

    function buscarPalabraParcial(texto, palabra) {
        const regex = new RegExp(palabra, "gi");
        const coincidencias = texto.match(regex);

        if (!coincidencias) {
            return `La palabra "${palabra}" no fue encontrada en el texto.`;
        }

        return `La palabra "${palabra}" fue encontrada ${coincidencias.length} vez/veces.`;
    }

    console.log(buscarPalabraParcial(texto, "gato")); // encontrada 3 veces (gato, gato, gatos)

Comparación de código: En este caso me ha gustado más la opción de Claude, ya que ha pensado más en cómo buscar las palabras y ha propuesto una alternativa para distinguir singular y plural y la función que arroja tiene menos líneas haciendo practicamente lo mismo.
Claude ha usado más la entrada del texto y así con solo un if hace todo el trabajo.
----------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------

Prompt: Necesito una función que haga aparecer un pop-up al pulsar un botón con el mensaje: Sorpresa!!!

Respuesta ChatGPT: Puedes hacerlo fácilmente con HTML y JavaScript usando un botón que ejecute una función que muestre un alert (pop-up).

Ejemplo sencillo

<!DOCTYPE html>
<html>
<head>
  <title>Pop-up sorpresa</title>
</head>
<body>

<button onclick="mostrarSorpresa()">Pulsa aquí</button>

<script>
function mostrarSorpresa() {
  alert("¡Sorpresa!!!");
}
</script>

</body>
</html>

Cómo funciona 

1. Se crea un botón en HTML.
2. El botón tiene onclick="mostrarSorpresa()", que ejecuta la función al hacer clic.
3. La función mostrarSorpresa() usa alert() para mostrar el pop-up con el mensaje.

Cuando el usuario pulsa el botón aparecerá la ventana emergente con:¡Sorpresa!!!

Respuesta Claude: Aquí tienes el código completo:

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pop-up</title>
</head>
<body>

  <button onclick="mostrarPopup()">¡Pulsa aquí!</button>

  <script>
    function mostrarPopup() {
      alert("¡Sorpresa!!!");
    }
  </script>

</body>
</html>

Si prefieres un pop-up más estilizado en lugar del alert() nativo del navegador, aquí tienes una versión con CSS:

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pop-up</title>
  <style>
    /* Fondo oscuro detrás del pop-up */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      justify-content: center;
      align-items: center;
    }

    .overlay.activo {
      display: flex;
    }

    /* Caja del pop-up */
    .popup {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .popup h2 {
      margin-bottom: 20px;
      font-size: 28px;
    }

    .popup button {
      padding: 10px 24px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    }
  </style>
</head>
<body>

  <button onclick="mostrarPopup()">¡Pulsa aquí!</button>

  <!-- Pop-up -->
  <div class="overlay" id="overlay">
    <div class="popup">
      <h2>¡Sorpresa!!! 🎉</h2>
      <button onclick="cerrarPopup()">Cerrar</button>
    </div>
  </div>

  <script>
    function mostrarPopup() {
      document.getElementById("overlay").classList.add("activo");
    }

    function cerrarPopup() {
      document.getElementById("overlay").classList.remove("activo");
    }
  </script>

</body>
</html>

La diferencia entre ambas opciones es que alert() es rápido y sencillo pero usa el estilo predeterminado del navegador, mientras que la versión con CSS te da control total sobre el diseño y la experiencia del usuario.

Comparación de código: En este caso el código inicial es muy similar, como siempre Claude hace otra alternativa mejorando en este caso el aspecto y por otra parte el chatgpt ha dado una pequeña explicación de lo que hace el código.