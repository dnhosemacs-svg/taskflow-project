/*
  NextUp - Lógica principal (tareas)
  - Conecta el HTML con JavaScript usando IDs.
  - Permite: añadir tareas, eliminarlas, guardarlas en localStorage y buscarlas.
*/

// ===== Referencias a elementos del DOM (IDs definidos en index.html) =====
const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');

// ===== Estado en memoria (fuente de verdad) =====
// Aquí guardamos el listado de tareas como strings.
let tasks = [];

// Nota: esta variable no se usa actualmente (no afecta al funcionamiento).
var tamañoImg = 30;

// ===== Eventos de UI =====
// Al enviar el formulario: evitamos recargar la página y añadimos la tarea.
form.addEventListener('submit', function(event) {
  event.preventDefault();
  addTask();
});

// Al escribir en el buscador: filtramos la lista en tiempo real.
searchInput.addEventListener('input', filterTasks);

// Delegación de eventos: un solo listener en la <ul> para detectar clicks en botones de borrar.
taskList.addEventListener('click', function(event) {
  // Buscamos si el click ocurrió (o burbujeó) desde un elemento con clase `.delete-btn`.
  const deleteBtn = event.target.closest('.delete-btn');
  if (deleteBtn) {
    // El <li> es el contenedor de la tarea. Dentro hay un <span> con el texto.
    const li = deleteBtn.parentElement;
    const text = li.querySelector('span').textContent;

    // Quitamos la tarea del array y persistimos el nuevo estado.
    tasks = tasks.filter(task => task !== text);
    saveTasks();

    // Animación de salida
    li.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => li.remove(), 200);
  }
});

// ===== Crear y añadir una tarea nueva desde el input =====
function addTask() {
  // Leemos el texto, quitando espacios de inicio/fin.
  const text = input.value.trim();
  if (text === "") return;

  // Creamos el <li> con clases (Tailwind) y estado inicial para animación de entrada.
  const li = document.createElement('li');
  li.classList.add(
    'task-item', 'flex', 'items-center', 'gap-2', 'py-2', 'px-3',
    'bg-white', 'dark:bg-slate-700', 'rounded-lg', 'shadow-sm', 'transition-all', 'duration-200',
    'opacity-0', 'translate-x-4'
  );

  // Botón de borrar (lleva dentro una imagen como icono).
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn', 'cursor-pointer');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.className = "w-[25px] h-[25px] rounded-full"; // ← tamaño corregido

  deleteBtn.appendChild(img);

  // Texto visible de la tarea.
  const span = document.createElement('span');
  span.textContent = text;
  span.classList.add('flex-1', 'text-inherit');

  // Montamos la estructura final: [botón borrar] + [texto]
  li.appendChild(deleteBtn);
  li.appendChild(span);

  // Insertamos en la lista y actualizamos estado + persistencia.
  taskList.appendChild(li);
  tasks.push(text);
  saveTasks();
  input.value = "";

  // Animación de entrada
  setTimeout(() => {
    li.classList.remove('opacity-0', 'translate-x-4');
  }, 10);
}

// ===== Crear un <li> para una tarea existente (usado al cargar desde localStorage) =====
function createTaskElement(text) {
  const li = document.createElement('li');
  li.classList.add(
    'task-item', 'flex', 'items-center', 'gap-2', 'py-2', 'px-3',
    'bg-white', 'dark:bg-slate-700', 'rounded-lg', 'shadow-sm', 'transition-all', 'duration-200',
    'opacity-0', 'translate-x-4'
  );

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn', 'cursor-pointer');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.className = "w-[25px] h-[25px] rounded-full"; // ← tamaño corregido

  deleteBtn.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;
  span.classList.add('flex-1', 'text-inherit');

  li.appendChild(deleteBtn);
  li.appendChild(span);

  taskList.appendChild(li);

  // Animación de entrada al cargar
  setTimeout(() => {
    li.classList.remove('opacity-0', 'translate-x-4');
  }, 10);
}

// ===== Persistencia (localStorage) =====
// Guarda el array `tasks` como JSON en el navegador.
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Carga tareas guardadas (si existen) y las renderiza en la lista.
function loadTasks() {
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
    tasks.forEach(task => createTaskElement(task));
  }
}

// ===== Filtro/búsqueda =====
// Muestra/oculta cada <li> según si su texto contiene lo que se escribe en el buscador.
function filterTasks() {
  const searchText = searchInput.value.toLowerCase();
  const items = taskList.getElementsByTagName('li');

  Array.from(items).forEach(li => {
    const taskText = li.querySelector('span').textContent.toLowerCase();
    li.style.display = taskText.includes(searchText) ? "flex" : "none";
  });
}

// ===== Inicialización =====
// Al cargar la página, restauramos las tareas guardadas.
loadTasks();
