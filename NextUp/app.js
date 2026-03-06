const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');
let tasks = [];
var tamañoImg = 30;

form.addEventListener('submit', function(event) {
  event.preventDefault();
  addTask();
});

searchInput.addEventListener('input', filterTasks);

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

function addTask() {
  const text = input.value.trim();
  if (text === "") return;

  const li = document.createElement('li');
  li.classList.add('task-item', 'flex', 'items-center', 'gap-2', 'py-2');

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn', 'ml-2', 'bg-transparent', 'border-none', 'p-0', 'cursor-pointer');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.classList.add('w-6', 'h-6', 'block', 'rounded-full');

  deleteBtn.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;
  span.classList.add('flex-1');

  li.appendChild(deleteBtn);
  li.appendChild(span);

  taskList.appendChild(li);
  tasks.push(text);
  saveTasks();
  input.value = "";
}

function createTaskElement(text) {
  const li = document.createElement('li');
  li.classList.add('task-item', 'flex', 'items-center', 'gap-2', 'py-2');

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn', 'ml-2', 'bg-transparent', 'border-none', 'p-0', 'cursor-pointer');

  const img = document.createElement('img');
  img.src = 'Imagenes/boton.png';
  img.alt = 'Eliminar';
  img.classList.add('w-6', 'h-6', 'block', 'rounded-full');

  deleteBtn.appendChild(img);

  const span = document.createElement('span');
  span.textContent = text;
  span.classList.add('flex-1');

  li.appendChild(deleteBtn);
  li.appendChild(span);

  taskList.appendChild(li);
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
    tasks.forEach(task => createTaskElement(task));
  }
}

function filterTasks() {
  const searchText = searchInput.value.toLowerCase();
  const items = taskList.getElementsByTagName('li');

  Array.from(items).forEach(li => {
    const taskText = li.querySelector('span').textContent.toLowerCase();
    li.style.display = taskText.includes(searchText) ? "flex" : "none";
  });
}

loadTasks();
