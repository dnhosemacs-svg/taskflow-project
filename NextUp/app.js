// Elementos del programa

const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');
let tasks = []; // Lista gloval de tareas (Array)
var tamañoImg = 30;

// Eventos

form.addEventListener('submit', function(event) {
  event.preventDefault(); // Evita que recargue la página
  addTask();
});

searchInput.addEventListener('input', filterTasks); // Escuchar entrada de búsqueda

taskList.addEventListener('click', function(event) {
  const deleteBtn = event.target.closest('.delete-btn');
  if (deleteBtn) {
    const li = deleteBtn.parentElement;
    const text = li.querySelector('span').textContent;
    tasks = tasks.filter(task => task !== text);
    saveTasks();
    li.remove();
  }
});


searchInput.addEventListener('input', filterTasks);

// Funciones

function addTask() {
  const text = input.value.trim();
  if (text === "") return; // evita tareas vacías

  const li = document.createElement('li');
  li.classList.add('task-item');

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.width = tamañoImg;

  deleteBtn.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;

  li.appendChild(deleteBtn);
  li.appendChild(span);

  taskList.appendChild(li);
  tasks.push(text);
  saveTasks();
  input.value = "";
}

function createTaskElement(text) {
  const li = document.createElement('li');
  li.classList.add('task-item');

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.width = tamañoImg;

  deleteBtn.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;

  li.appendChild(deleteBtn);
  li.appendChild(span);

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