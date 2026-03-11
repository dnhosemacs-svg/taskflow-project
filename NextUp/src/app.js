/*
  NextUp - Lógica principal (tareas)
  - Conecta el HTML con JavaScript usando IDs.
  - Permite: añadir tareas, eliminarlas, guardarlas en localStorage y buscarlas.
*/

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} text
 */

// ===== Referencias a elementos del DOM (IDs definidos en index.html) =====
const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');

// ===== Estado en memoria (fuente de verdad) =====
// Guardamos cada tarea como objeto: { id: string, text: string }.
/** @type {Task[]} */
let tasks = [];

/**
 * Genera un id único (best-effort) para cada tarea.
 * @returns {string}
 */
function generateTaskId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Crea un objeto tarea.
 * @param {string} text
 * @returns {Task}
 */
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

// Delegación de eventos: un solo listener en la <ul> para manejar acciones por tarea.
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
    return;
  }

  // Botón de editar/guardar: alterna entre modo lectura (span) y modo edición (input).
  const editBtn = event.target.closest('.edit-btn');
  if (editBtn) {
    const li = editBtn.closest('li');
    if (!li) return;

    if (li.dataset.editing === 'true') {
      finishEdit(li);
    } else {
      startEdit(li);
    }
  }
});

// Atajos de teclado durante la edición:
// - Enter: guardar cambios
// - Escape: cancelar y restaurar el texto anterior
taskList.addEventListener('keydown', function(event) {
  const inputEl = event.target.closest('.edit-input');
  if (!inputEl) return;

  const li = inputEl.closest('li');
  if (!li) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    finishEdit(li);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEdit(li);
  }
});

// ===== Crear el elemento <li> de una tarea (utilidad compartida) =====
/**
 * Crea y añade al DOM el elemento `<li>` para una tarea.
 * @param {Task|string} taskOrText
 * @returns {HTMLLIElement}
 */
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

  // Botón para editar el texto de la tarea (sin afectar el flujo actual de crear/borrar).
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.classList.add(
    'edit-btn',
    'cursor-pointer',
    'w-[25px]', 'h-[25px]',
    'flex', 'items-center', 'justify-center',
    'text-primario',
    'dark:text-blue-300'
  );
  editBtn.setAttribute('aria-label', 'Editar');
  editBtn.title = 'Editar';

  // Icono SVG (Bootstrap) - pencil-fill
  const pencilSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pencilSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  pencilSvg.setAttribute('viewBox', '0 0 16 16');
  pencilSvg.setAttribute('fill', 'currentColor');
  pencilSvg.classList.add('w-[18px]', 'h-[18px]');

  const pencilPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pencilPath1.setAttribute('d', 'M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708z');

  const pencilPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pencilPath2.setAttribute('d', 'M.5 13.5V16h2.5l7.373-7.373-2.5-2.5zM11.207 2.5l2.5 2.5-1 1-2.5-2.5z');

  pencilSvg.appendChild(pencilPath1);
  pencilSvg.appendChild(pencilPath2);
  editBtn.appendChild(pencilSvg);

  // Montamos la estructura final: [botón borrar] + [texto] + [editar]
  li.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(editBtn);

  // Insertamos en la lista
  taskList.appendChild(li);

  // Animación de entrada (se aplica después de insertar)
  setTimeout(() => {
    li.classList.remove('opacity-0', 'translate-x-4');
  }, 10);

  return li;
}

// ===== Editar tareas =====
/**
 * Entra en modo edición:
 * - Sustituye el <span> por un <input>
 * - Guarda el texto original para poder cancelar (Escape)
 * - Cambia el botón "Editar" a "Guardar"
 * @param {HTMLLIElement} li
 * @returns {void}
 */
function startEdit(li) {
  const span = li.querySelector('span');
  const editBtn = li.querySelector('.edit-btn');
  if (!span || !editBtn) return;

  li.dataset.editing = 'true';
  li.dataset.originalText = span.textContent ?? '';

  const inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.value = li.dataset.originalText;
  inputEl.classList.add(
    'edit-input',
    'flex-1',
    'px-3', 'py-2',
    'border-2', 'border-primario',
    'rounded-lg',
    'bg-white', 'dark:bg-slate-700',
    'text-texto', 'dark:text-slate-100',
    'shadow-sm',
    'focus:border-texto',
    'transition'
  );

  span.replaceWith(inputEl);
  editBtn.setAttribute('aria-label', 'Guardar');
  editBtn.title = 'Guardar';
  inputEl.focus();
  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
}

/**
 * Finaliza la edición:
 * - Valida y normaliza (trim)
 * - Actualiza el array `tasks` (fuente de verdad) y persiste en `localStorage`
 * - Restaura el <span> y vuelve el botón a "Editar"
 * @param {HTMLLIElement} li
 * @returns {void}
 */
function finishEdit(li) {
  const inputEl = li.querySelector('.edit-input');
  const editBtn = li.querySelector('.edit-btn');
  if (!inputEl || !editBtn) return;

  const newText = inputEl.value.trim();
  if (newText === '') {
    cancelEdit(li);
    return;
  }

  const id = li.dataset.id;
  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks[idx].text = newText;
  }
  saveTasks();

  const span = document.createElement('span');
  span.textContent = newText;
  span.classList.add('flex-1', 'text-inherit');

  inputEl.replaceWith(span);
  editBtn.setAttribute('aria-label', 'Editar');
  editBtn.title = 'Editar';
  li.dataset.editing = 'false';
  delete li.dataset.originalText;

  // Mantiene el filtro consistente si hay texto de búsqueda.
  filterTasks();
}

/**
 * Cancela la edición:
 * - Restaura el texto original
 * - Vuelve a modo lectura sin persistir cambios
 * @param {HTMLLIElement} li
 * @returns {void}
 */
function cancelEdit(li) {
  const inputEl = li.querySelector('.edit-input');
  const editBtn = li.querySelector('.edit-btn');
  if (!inputEl || !editBtn) return;

  const originalText = li.dataset.originalText ?? inputEl.value;

  const span = document.createElement('span');
  span.textContent = originalText;
  span.classList.add('flex-1', 'text-inherit');

  inputEl.replaceWith(span);
  editBtn.setAttribute('aria-label', 'Editar');
  editBtn.title = 'Editar';
  li.dataset.editing = 'false';
  delete li.dataset.originalText;
}

// ===== Crear y añadir una tarea nueva desde el input =====
/**
 * Lee el input, crea la tarea, la renderiza y persiste.
 * @returns {void}
 */
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
/**
 * Persiste el estado actual de tareas en `localStorage`.
 * @returns {void}
 */
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Carga tareas guardadas (si existen) y las renderiza en la lista.
/**
 * Carga tareas desde `localStorage` y las renderiza.
 * Soporta migración desde el formato antiguo (array de strings).
 * @returns {void}
 */
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
/**
 * Filtra tareas en el DOM según el valor de `#search`.
 * @returns {void}
 */
function filterTasks() {
  const searchText = searchInput.value.toLowerCase();
  const items = taskList.getElementsByTagName('li');

  Array.from(items).forEach(li => {
    const span = li.querySelector('span');
    const editInput = li.querySelector('.edit-input');
    const taskTextRaw = (span?.textContent ?? editInput?.value ?? '').toLowerCase();
    const matches = taskTextRaw.includes(searchText);
    li.classList.toggle('hidden', !matches);
    li.style.display = matches ? 'flex' : 'none';
  });
}

// ===== Inicialización =====
// Al cargar la página, restauramos las tareas guardadas.
loadTasks();

