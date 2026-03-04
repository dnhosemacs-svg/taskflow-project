// Elementos del programa

const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');
let tasks = []; // Lista gloval de tareas (Array)

// Eventos

form.addEventListener('submit', function(event) {
  event.preventDefault(); // Evita que recargue la página
  addTask();
});

searchInput.addEventListener('input', filterTasks); // Escuchar entrada de búsqueda

taskList.addEventListener('click', function(event) {
  if (event.target.classList.contains('delete-btn')) {
    const li = event.target.parentElement; // el <li> que contiene el botón
    const text = li.firstChild.textContent; // texto de la tarea
    tasks = tasks.filter(task => task !== text); // elimina la tarea del array
    saveTasks(); // guarda los cambios en memoria local
    li.remove(); // elimina la tarea del DOM
  }
});

searchInput.addEventListener('input', filterTasks);

// Funciones

function addTask() { // Crear tareas mediante inputg de formulario
  const text = input.value.trim();
  if (text === "") return; // evita tareas vacías

  // Crear el elemento li
  const li = document.createElement('li');
  li.textContent = text;

  // Crear botón de eliminar
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = "X";
  deleteBtn.classList.add('delete-btn');
  
  li.appendChild(deleteBtn); // Añadir el botón al li
  taskList.appendChild(li); // Añadir el li a la lista
  tasks.push(text); // Añadir al array
  saveTasks(); //Guardar en memoria local
  input.value = ""; // Limpiar input
}

function createTaskElement(text) { //Gerera un li desde el texto de la memória
  const li = document.createElement('li');
  li.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = "X";
  deleteBtn.classList.add('delete-btn');

  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

function saveTasks() { // Guardar datos en memoria local
    localStorage.setItem('tasks', JSON.stringify(tasks)); 
}

function loadTasks() { // Cargar tareas que esten en memoria al recargar
  const storedTasks = localStorage.getItem('tasks');

  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
    tasks.forEach(task => {createTaskElement(task);
    });
  }
}

function filterTasks() { // Recorrer todas las tareas y borrar las que coincidan
  const searchText = searchInput.value.toLowerCase();
  const items = taskList.getElementsByTagName('li');

  Array.from(items).forEach(li => {
    const taskText = li.firstChild.textContent.toLowerCase();

    if (taskText.includes(searchText)) {
      li.style.display = "block"; // mostrar
    } else {
      li.style.display = "none"; // ocultar
    }
  });
}

loadTasks(); // llamada de funciones al recargar la pagina