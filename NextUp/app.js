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
// Guardamos cada tarea como objeto: { id: string, text: string }.
let tasks = [];

// Genera un id único sencillo para cada tarea.
function generateTaskId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTask(text) {
  return { id: generateTaskId(), text };
}

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
    const li = deleteBtn.closest('li');
    if (!li) return;

    const id = li.dataset.id;

    // Quitamos la tarea del array y persistimos el nuevo estado.
    if (id) {
      tasks = tasks.filter(task => task.id !== id);
    }
    saveTasks();

    // Animación de salida
    li.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => li.remove(), 200);
  }
});

// ===== Crear el elemento <li> de una tarea (utilidad compartida) =====
function createTaskElement(taskOrText) {
  const task = typeof taskOrText === 'string'
    ? createTask(taskOrText)
    : taskOrText;

  // Creamos el <li> con clases (Tailwind) y estado inicial para animación de entrada.
  const li = document.createElement('li');
  li.classList.add(
    'task-item', 'flex', 'items-center', 'gap-2', 'py-2', 'px-3',
    'bg-white', 'dark:bg-slate-700', 'rounded-lg', 'shadow-sm', 'transition-all', 'duration-200',
    'opacity-0', 'translate-x-4'
  );

  // Asociamos el id de la tarea al elemento DOM.
  li.dataset.id = task.id;

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
  span.textContent = task.text;
  span.classList.add('flex-1', 'text-inherit');

  // Montamos la estructura final: [botón borrar] + [texto]
  li.appendChild(deleteBtn);
  li.appendChild(span);

  // Insertamos en la lista
  taskList.appendChild(li);

  // Animación de entrada (se aplica después de insertar)
  setTimeout(() => {
    li.classList.remove('opacity-0', 'translate-x-4');
  }, 10);

  return li;
}

// ===== Crear y añadir una tarea nueva desde el input =====
function addTask() {
  // Leemos el texto, quitando espacios de inicio/fin.
  const text = input.value.trim();
  if (text === "") return;

  const task = createTask(text);
  tasks.push(task);
  createTaskElement(task);
  saveTasks();
  input.value = "";
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
    const parsed = JSON.parse(storedTasks);

    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      // Formato antiguo: array de strings → migramos a objetos.
      tasks = parsed.map(text => createTask(text));
    } else if (Array.isArray(parsed)) {
      tasks = parsed;
    } else {
      tasks = [];
    }

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
