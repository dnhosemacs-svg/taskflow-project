/*
  NextUp - Lógica principal (tareas)
  - Conecta el HTML con JavaScript usando IDs.
  - Permite: añadir tareas, eliminarlas, guardarlas en localStorage y buscarlas.
  - Requiere que existan en el DOM los IDs definidos en index.html / test-runner (formulario, entrada, elemento, search, proyectos, etc.).
*/

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} text
 * @property {string} projectId
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {number} createdAt
 */

// ===== Referencias a elementos del DOM (IDs definidos en index.html) =====
const form = document.getElementById('formulario');
const input = document.getElementById('entrada');
const taskList = document.getElementById('elemento');
const searchInput = document.getElementById('search');
const pendingSection = document.getElementById('pending-section');
const searchSection = document.getElementById('search-section');
const activeProjectNameEl = document.getElementById('active-project-name');
const activeProjectNameDesktopEl = document.getElementById('active-project-name-desktop');
const projectListEl = document.getElementById('project-list');
const projectListMobileEl = document.getElementById('project-list-mobile');
const projectSelectMobileEl = document.getElementById('project-select-mobile');
const projectAddBtn = document.getElementById('project-add');
const projectAddMobileBtn = document.getElementById('project-add-mobile');
const projectDrawerEl = document.getElementById('project-drawer');
const projectDrawerOpenBtn = document.getElementById('project-drawer-open');
const projectDrawerCloseBtn = document.getElementById('project-drawer-close');
const projectDrawerBackdropEl = document.getElementById('project-drawer-backdrop');
const projectModalEl = document.getElementById('project-modal');
const projectModalBackdropEl = document.getElementById('project-modal-backdrop');
const projectModalForm = document.getElementById('project-modal-form');
const projectModalInput = document.getElementById('project-modal-input');
const projectModalCancelBtn = document.getElementById('project-modal-cancel');
const projectModalTitleEl = document.getElementById('project-modal-title');
const projectModalSubmitBtn = document.getElementById('project-modal-submit');
const moveTaskModalEl = document.getElementById('move-task-modal');
const moveTaskModalBackdropEl = document.getElementById('move-task-modal-backdrop');
const moveTaskModalCancelBtn = document.getElementById('move-task-modal-cancel');
const moveTaskModalConfirmBtn = document.getElementById('move-task-modal-confirm');
const moveTaskModalListEl = document.getElementById('move-task-modal-list');
const moveTaskModalTasknameEl = document.getElementById('move-task-modal-taskname');

// Modo de renombrado de proyectos:
// - true: edición inline (usado en la app principal)
// - false: modal (compatibilidad con test-runner)
const inlineProjectRename =
  typeof document !== 'undefined' &&
  document.documentElement?.dataset?.inlineProjectRename === 'true';

// Lista (UI) donde mostramos "Tareas completadas" de esta sesión.
// Importante: estas tareas NO se guardan en localStorage, por lo que al recargar desaparecen.
const completedList = document.getElementById('completed');

// Título asociado a la sección de completadas.
// Se muestra/oculta automáticamente según haya o no haya tareas completadas.
const completedHeading = document.getElementById('completed-heading');

// ===== Mensaje "sin resultados" (búsqueda) =====
// Se crea dinámicamente (sin tocar el HTML) y se muestra cuando el filtro no devuelve coincidencias.
let noResultsEl = document.getElementById('no-results');

// ===== Drag & drop (reordenar tareas pendientes) =====
/** @type {string|null} */
let draggedTaskId = null;

// ===== Touch / Pointer reorder (mobile-friendly) =====
/** @type {{ id: string, li: HTMLLIElement, pointerId: number } | null} */
let touchDragState = null;

/** @type {number|null} */
let touchDragLongPressTimer = null;

/**
 * Asegura que existe el elemento de UI `#no-results` justo debajo del buscador.
 * Si ya existe, lo reutiliza.
 * @returns {HTMLElement|null}
 */

// ===== Touch Events fallback (Safari/iOS antiguos o entornos sin Pointer Events fiables) =====
/** @type {{ id: string, li: HTMLLIElement, touchId: number } | null} */
let legacyTouchDragState = null;

/** @type {number|null} */
let legacyTouchLongPressTimer = null;

/** @type {{ x: number, y: number } | null} */
let legacyTouchStartPoint = null;

// ===== Scroll lock durante reorder (evita que se mueva la página) =====
let reorderScrollLocked = false;
let reorderScrollY = 0;

/**
 * Bloquea/desbloquea el scroll del documento (robusto en iOS).
 * @param {boolean} locked
 * @returns {void}
 */
function setReorderScrollLock(locked) {
  if (locked === reorderScrollLocked) return;
  reorderScrollLocked = locked;

  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  if (locked) {
    reorderScrollY = window.scrollY || window.pageYOffset || 0;
    root.classList.add('is-reordering');

    // iOS/Safari: fijar body para congelar scroll.
    body.style.position = 'fixed';
    body.style.top = `-${reorderScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  } else {
    root.classList.remove('is-reordering');

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';

    if (reorderScrollY) window.scrollTo(0, reorderScrollY);
    reorderScrollY = 0;
  }
}

function ensureNoResultsElement() {
  if (noResultsEl) return noResultsEl;
  if (!searchInput) return null;

  const el = document.createElement('div');
  el.id = 'no-results';
  el.textContent = 'No hay ninguna tarea con ese nombre';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.className = 'no-results';
  el.style.display = 'none';

  searchInput.insertAdjacentElement('afterend', el);
  noResultsEl = el;
  return el;
}

// ===== Estado en memoria (fuente de verdad) =====
/** @type {Task[]} */
let tasks = [];

/** @type {Project[]} */
let projects = [];

/** @type {string|null} */
let activeProjectId = null;

// Tareas "eliminadas" durante la sesión (NO se persisten).
// Al recargar la página desaparecen, cumpliendo el comportamiento pedido.
/** @type {Task[]} */
let completedTasks = [];

// Persistencia v2 (proyectos + tareas + UI).
// - `STORAGE_KEY`: estado actual (versionado).
// - `LEGACY_TASKS_KEY`: compatibilidad para migrar instalaciones antiguas que solo guardaban tareas.
const STORAGE_KEY = 'nextup_state_v2';
const LEGACY_TASKS_KEY = 'tasks';
const SCHEMA_VERSION = 2;

// Contador de popups visibles (drawer + modales).
// Mientras sea > 0 añadimos la clase `has-popup` al <html> para poder
// ajustar estilos específicos en móvil (por ejemplo, ocultar el botón
// de cambio de tema cuando un popup está abierto).
let openPopupCount = 0;

function setPopupOpen(isOpening) {
  const root = document.documentElement;
  if (!root) return;
  if (isOpening) {
    openPopupCount += 1;
  } else {
    openPopupCount = Math.max(0, openPopupCount - 1);
  }
  if (openPopupCount > 0) {
    root.classList.add('has-popup');
  } else {
    root.classList.remove('has-popup');
  }
}

/**
 * Sincroniza los labels de nombre de proyecto activo (móvil y escritorio).
 * @param {string} name
 * @returns {void}
 */
function updateActiveProjectNameLabels(name) {
  if (activeProjectNameEl) activeProjectNameEl.textContent = name;
  if (activeProjectNameDesktopEl) activeProjectNameDesktopEl.textContent = name;
}

/**
 * Crea el SVG del icono de lápiz usado en los botones de "editar".
 * Se reutiliza tanto en las tareas como en la lista de proyectos para
 * mantener la misma estética.
 * @returns {SVGSVGElement}
 */
function createEditIconSvg() {
  const pencilSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pencilSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  pencilSvg.setAttribute('viewBox', '0 0 16 16');
  pencilSvg.setAttribute('fill', 'currentColor');
  pencilSvg.classList.add('w-[16px]', 'h-[16px]');

  const pencilPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pencilPath1.setAttribute('d', 'M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708z');

  const pencilPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pencilPath2.setAttribute('d', 'M.5 13.5V16h2.5l7.373-7.373-2.5-2.5zM11.207 2.5l2.5 2.5-1 1-2.5-2.5z');

  pencilSvg.appendChild(pencilPath1);
  pencilSvg.appendChild(pencilPath2);
  return pencilSvg;
}

/**
 * Genera un id único (best-effort) para entidades.
 * @returns {string}
 */
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string} name
 * @returns {Project}
 */
function createProject(name) {
  return { id: generateId(), name: name.trim(), createdAt: Date.now() };
}

/**
 * @param {string} text
 * @param {string} projectId
 * @returns {Task}
 */
function createTask(text, projectId) {
  return { id: generateId(), text, projectId };
}

/**
 * @returns {Project|null}
 */
function getActiveProject() {
  if (!activeProjectId) return null;
  return projects.find(p => p.id === activeProjectId) ?? null;
}

/**
 * @returns {Task[]}
 */
function getVisiblePendingTasks() {
  if (!activeProjectId) return [];
  return tasks.filter(t => t.projectId === activeProjectId);
}

/**
 * @returns {Task[]}
 */
function getVisibleCompletedTasks() {
  if (!activeProjectId) return [];
  return completedTasks.filter(t => t.projectId === activeProjectId);
}

/**
 * Cambia el proyecto activo y sincroniza:
 * - etiqueta del nombre del proyecto (móvil y escritorio)
 * - lista de proyectos (marcando activo)
 * - listas de tareas (pendientes/completadas) filtradas por proyecto
 * @param {string} id
 * @returns {void}
 */
function setActiveProjectId(id) {
  activeProjectId = id;
  const p = getActiveProject();
  const name = p?.name ?? '—';
  updateActiveProjectNameLabels(name);

  renderProjects();
  renderTasksForActiveProject();
}

// Popup de proyectos (móvil): abrir/cerrar. Solo visible en smartphone (en desktop se usa la sidebar).
// Misma lógica que el popup de eliminar: solo el backdrop del propio popup oscurece la pantalla.
const MOBILE_BREAKPOINT_PX = 768;

function openProjectDrawer() {
  if (!projectDrawerEl) return;
  if (window.innerWidth >= MOBILE_BREAKPOINT_PX) return; // solo en pantallas pequeñas
  projectDrawerEl.classList.remove('hidden');
}

function closeProjectDrawer() {
  if (!projectDrawerEl) return;
  projectDrawerEl.classList.add('hidden');
}

/**
 * Modal reutilizable para:
 * - crear proyecto
 * - renombrar proyecto
 *
 * Ventajas vs `prompt()`:
 * - centrado, consistente y responsive
 * - soporta cerrar por backdrop / Esc
 * @returns {Promise<string|null>} nombre (trim) o null si canceló
 */
function openProjectNameModal(options) {
  return new Promise((resolve) => {
    if (!projectModalEl || !projectModalForm || !projectModalInput) {
      const fallback = prompt(options?.title ?? 'Nombre del proyecto:', options?.initialValue ?? '');
      resolve(fallback ? fallback.trim() : null);
      return;
    }

    const cleanup = () => {
      projectModalEl.classList.add('hidden');
      projectModalForm.removeEventListener('submit', onSubmit);
      projectModalCancelBtn?.removeEventListener('click', onCancel);
      projectModalBackdropEl?.removeEventListener('click', onCancel);
      window.removeEventListener('keydown', onKeyDown);
      setPopupOpen(false);
    };

    const finish = (value) => {
      cleanup();
      resolve(value);
    };

    const onCancel = () => finish(null);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    const onSubmit = (e) => {
      e.preventDefault();
      const name = projectModalInput.value.trim();
      if (name === '') return;
      finish(name);
    };

    if (projectModalTitleEl) projectModalTitleEl.textContent = options?.title ?? 'Proyecto';
    if (projectModalSubmitBtn) projectModalSubmitBtn.textContent = options?.submitLabel ?? 'Guardar';
    projectModalInput.value = options?.initialValue ?? '';
    projectModalEl.classList.remove('hidden');
    setPopupOpen(true);
    setTimeout(() => projectModalInput.focus(), 0);
    setTimeout(() => projectModalInput.select(), 0);

    projectModalForm.addEventListener('submit', onSubmit);
    projectModalCancelBtn?.addEventListener('click', onCancel);
    projectModalBackdropEl?.addEventListener('click', onCancel);
    window.addEventListener('keydown', onKeyDown);
  });
}

/**
 * Modal centrado para elegir proyecto destino al mover una tarea.
 * - Evita `prompt()` (inconsistente en móvil y difícil de usar con muchos proyectos).
 * - Devuelve el `projectId` destino o null si canceló.
 * @param {{ taskText: string, projects: Project[] }} options
 * @returns {Promise<string|null>} projectId destino o null si canceló
 */
function openMoveTaskModal(options) {
  return new Promise((resolve) => {
    const fallback = () => {
      const names = options.projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
      const inputRaw = prompt(`Mover a qué proyecto?\n\n${names}\n\nEscribe el número:`);
      if (!inputRaw) return resolve(null);
      const idx = Number.parseInt(inputRaw, 10);
      if (!Number.isFinite(idx) || idx < 1 || idx > options.projects.length) return resolve(null);
      resolve(options.projects[idx - 1].id);
    };

    if (!moveTaskModalEl || !moveTaskModalListEl || !moveTaskModalConfirmBtn) {
      fallback();
      return;
    }

    // Guardamos la selección actual (por defecto: el primer destino disponible).
    let selectedId = options.projects[0]?.id ?? null;

    const cleanup = () => {
      moveTaskModalEl.classList.add('hidden');
      moveTaskModalListEl.innerHTML = '';
      moveTaskModalCancelBtn?.removeEventListener('click', onCancel);
      moveTaskModalBackdropEl?.removeEventListener('click', onCancel);
      moveTaskModalConfirmBtn.removeEventListener('click', onConfirm);
      window.removeEventListener('keydown', onKeyDown);
      // Importante: no usamos setPopupOpen aquí para que el
      // fondo de la página no se oscurezca al abrir/cerrar
      // el popup de mover tareas.
    };

    const finish = (value) => {
      cleanup();
      resolve(value);
    };

    const onCancel = () => finish(null);
    const onConfirm = () => finish(selectedId);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    if (moveTaskModalTasknameEl) moveTaskModalTasknameEl.textContent = options.taskText || '—';
    moveTaskModalListEl.innerHTML = '';
    options.projects.forEach((p) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'modal-option truncate';
      row.textContent = p.name;
      row.addEventListener('click', () => {
        selectedId = p.id;
        // Marcar visualmente la opción seleccionada.
        Array.from(moveTaskModalListEl.querySelectorAll('button')).forEach((b) => {
          b.classList.remove('is-selected');
        });
        row.classList.add('is-selected');
      });
      moveTaskModalListEl.appendChild(row);
    });

    // marcar el primero
    const firstBtn = moveTaskModalListEl.querySelector('button');
    if (firstBtn) firstBtn.click();

    moveTaskModalEl.classList.remove('hidden');
    moveTaskModalCancelBtn?.addEventListener('click', onCancel);
    moveTaskModalBackdropEl?.addEventListener('click', onCancel);
    moveTaskModalConfirmBtn.addEventListener('click', onConfirm);
    window.addEventListener('keydown', onKeyDown);
  });
}

/**
 * Confirmación no-bloqueante (reemplazo de `confirm()`).
 * - No depende de diálogos nativos (que pueden estar bloqueados en algunos entornos).
 * - Crea el modal dinámicamente (sin tocar el HTML).
 * @param {{ message: string, acceptLabel?: string, cancelLabel?: string }} options
 * @returns {Promise<boolean>} true si aceptó, false si canceló
 */
function openConfirmModal(options) {
  return new Promise((resolve) => {
    const fallback = () => {
      try {
        resolve(Boolean(window.confirm(options.message)));
      } catch {
        resolve(false);
      }
    };

    if (!document?.body) {
      fallback();
      return;
    }

    // Reutilizar si ya existe.
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'popup-root fixed inset-0 hidden z-50 items-center justify-center';

      const backdrop = document.createElement('div');
      backdrop.id = 'confirm-modal-backdrop';
      backdrop.className = 'absolute inset-0 bg-black/40';

      const center = document.createElement('div');
      center.className = 'absolute inset-0 flex items-center justify-center p-4';

      const panel = document.createElement('div');
      panel.id = 'confirm-modal-panel';
      panel.className = 'popup-panel popup-panel--modal';

      const msg = document.createElement('div');
      msg.id = 'confirm-modal-message';
      msg.className = 'text-base text-slate-800 dark:text-slate-100';

      const actions = document.createElement('div');
      actions.className = 'row justify-end';

      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'confirm-modal-cancel';
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-ghost';

      const acceptBtn = document.createElement('button');
      acceptBtn.id = 'confirm-modal-accept';
      acceptBtn.type = 'button';
      acceptBtn.className = 'btn btn-eliminar';

      actions.appendChild(cancelBtn);
      actions.appendChild(acceptBtn);
      panel.appendChild(msg);
      panel.appendChild(actions);
      center.appendChild(panel);
      modal.appendChild(backdrop);
      modal.appendChild(center);
      document.body.appendChild(modal);
    }

    const messageEl = document.getElementById('confirm-modal-message');
    const acceptBtn = document.getElementById('confirm-modal-accept');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const backdropEl = document.getElementById('confirm-modal-backdrop');
    const panelEl = document.getElementById('confirm-modal-panel');

    if (!messageEl || !acceptBtn || !cancelBtn || !backdropEl || !panelEl) {
      fallback();
      return;
    }

    messageEl.textContent = options.message;
    cancelBtn.textContent = options.cancelLabel ?? 'Cancelar';
    acceptBtn.textContent = options.acceptLabel ?? 'Aceptar';

    const cleanup = () => {
      modal.classList.add('hidden');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      backdropEl.removeEventListener('click', onCancel);
      window.removeEventListener('keydown', onKeyDown);
      // No tocamos `has-popup` aquí para que el fondo
      // general de la página no se oscurezca al usar
      // el popup genérico de confirmación.
    };

    const finish = (value) => {
      cleanup();
      resolve(value);
    };

    const onCancel = () => finish(false);
    const onAccept = () => finish(true);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onAccept();
    };

    modal.classList.remove('hidden');
    // No marcamos `has-popup` al abrir: solo usamos
    // el propio backdrop del modal para el efecto visual.
    cancelBtn.addEventListener('click', onCancel);
    acceptBtn.addEventListener('click', onAccept);
    backdropEl.addEventListener('click', onCancel);
    window.addEventListener('keydown', onKeyDown);

    // Foco al botón de aceptar para UX/teclado.
    setTimeout(() => acceptBtn.focus(), 0);
  });
}

// ===== Sección: Tareas completadas (solo sesión) =====
/**
 * Asegura que exista una sección de "Tareas completadas".
 * - Si el HTML ya incluye #completed, la reutiliza.
 * - Si no, la crea debajo de la lista de pendientes.
 * @returns {HTMLUListElement|null}
 */
function ensureCompletedList() {
  const existing = document.getElementById('completed');
  if (existing) return /** @type {HTMLUListElement} */ (existing);
  if (!taskList) return null;

  // Creamos el título y la lista "on the fly" para no depender de editar el HTML.
  const heading = document.createElement('h2');
  heading.id = 'completed-heading';
  heading.className = 'section-title section-title--top-gap';
  heading.textContent = 'Tareas completadas';

  const ul = document.createElement('ul');
  ul.id = 'completed';
  ul.className = 'task-list';

  taskList.insertAdjacentElement('afterend', ul);
  ul.insertAdjacentElement('beforebegin', heading);
  return ul;
}

/**
 * Muestra/oculta la sección de completadas según si hay tareas.
 * - Si está vacía: ocultamos el título y la lista.
 * - Si tiene elementos: la mostramos.
 * @returns {void}
 */
function updateCompletedVisibility() {
  const list = document.getElementById('completed');
  const heading = document.getElementById('completed-heading');
  if (!list || !heading) return;

  const hasItems = list.querySelectorAll('li').length > 0;
  heading.classList.toggle('hidden', !hasItems);
  list.classList.toggle('hidden', !hasItems);
}

/**
 * Muestra/oculta la sección de pendientes según si hay tareas en el
 * proyecto activo. Si no hay ninguna tarea pendiente, se esconde
 * tanto el título como la lista, manteniendo la app más limpia.
 * @returns {void}
 */
function updatePendingVisibility() {
  if (!pendingSection || !taskList) return;
  const hasPending = getVisiblePendingTasks().length > 0;
  pendingSection.classList.toggle('hidden', !hasPending);
}

/**
 * Muestra u oculta la barra de búsqueda según haya tareas visibles
 * en el proyecto activo. Si no hay ninguna tarea, el buscador no
 * aporta valor y se esconde para simplificar la interfaz.
 * @returns {void}
 */
function updateSearchVisibility() {
  if (!searchSection) return;
  const hasVisibleTasks =
    getVisiblePendingTasks().length > 0 || getVisibleCompletedTasks().length > 0;
  searchSection.classList.toggle('hidden', !hasVisibleTasks);
}

// Listener para acciones dentro de "Tareas completadas" (delegación de eventos).
// - Botón "volver": regresa la tarea a pendientes y la vuelve a persistir.
// Nota: usamos delegación para evitar añadir listeners por cada <li>.
(completedList ?? ensureCompletedList())?.addEventListener('click', function(event) {
  const restoreBtn = event.target.closest('.restore-btn');
  if (!restoreBtn) return;

  const li = restoreBtn.closest('li');
  if (!li) return;

  // Cada <li> lleva el id de la tarea para mapear UI ↔ estado en memoria.
  const id = li.dataset.id;
  if (!id) return;

  // Buscamos en `completedTasks` (no en localStorage).
  const idx = completedTasks.findIndex(t => t.id === id);
  if (idx === -1) return;

  // Movemos de completadas → pendientes.
  const [restored] = completedTasks.splice(idx, 1);
  tasks.push(restored);
  saveState();
  if (restored.projectId === activeProjectId) createTaskElement(restored);

  // Animación de salida
  li.classList.add('opacity-0', 'translate-x-4');
  setTimeout(() => {
    li.remove();

    // Si era la última completada, ocultamos de nuevo la sección.
    updateCompletedVisibility();

    // Mantiene el filtro consistente si hay texto de búsqueda.
    filterTasks();
    updateSearchVisibility();
    updatePendingVisibility();
  }, 200);
});

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

    // En vez de borrar definitivamente del UI, la movemos a "completadas"
    // (pero sí la eliminamos del array persistido, como hasta ahora).
    //
    // Resultado:
    // - Pendientes (persistido): se elimina de `tasks` + `localStorage`.
    // - Completadas (solo sesión): aparece abajo tachada y se podrá "deshacer".
    if (id) {
      const idx = tasks.findIndex(task => task.id === id);
      if (idx !== -1) {
        const [removed] = tasks.splice(idx, 1);
        completedTasks.push(removed);
        saveState();
        if (removed.projectId === activeProjectId) createCompletedTaskElement(removed);
      } else {
        // Fallback: si no la encontramos en memoria, mantenemos el comportamiento anterior.
        tasks = tasks.filter(task => task.id !== id);
        saveState();
      }
    } else {
      saveState();
    }

    // Animación de salida
    li.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => li.remove(), 200);

    // Mantiene el filtro consistente si hay texto de búsqueda.
    filterTasks();
    updateSearchVisibility();
    updatePendingVisibility();
    return;
  }

  // Mover tarea a otro proyecto.
  const moveBtn = event.target.closest('.move-btn');
  if (moveBtn) {
    const li = moveBtn.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    if (!id) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const currentProjectId = task.projectId;
    const otherProjects = projects.filter(p => p.id !== currentProjectId);
    if (otherProjects.length === 0) {
      alert('Crea otro proyecto para poder mover tareas.');
      return;
    }

    openMoveTaskModal({ taskText: task.text, projects: otherProjects }).then((targetProjectId) => {
      if (!targetProjectId) return;
      task.projectId = targetProjectId;
      saveState();

      // Sale de la lista actual (porque ya no pertenece al proyecto activo).
      li.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => li.remove(), 200);
      filterTasks();
      updateSearchVisibility();
      updatePendingVisibility();
    });
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

// ===== Drag & drop (reordenar pendientes) =====
taskList.addEventListener('dragstart', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const li = target.closest('li.task-item');
  if (!(li instanceof HTMLLIElement)) return;

  if (!canStartDragFromEvent(event, li)) {
    event.preventDefault();
    return;
  }

  draggedTaskId = li.dataset.id ?? null;
  li.classList.add('is-dragging');

  try {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', draggedTaskId ?? '');
      event.dataTransfer.setData('application/x-nextup-task-id', draggedTaskId ?? '');
      event.dataTransfer.effectAllowed = 'move';
    }
  } catch {
    // no-op
  }
});

taskList.addEventListener('dragover', (event) => {
  if (!draggedTaskId) return;
  event.preventDefault();

  const draggingEl = taskList.querySelector('li.task-item.is-dragging');
  if (!(draggingEl instanceof HTMLLIElement)) return;

  const afterEl = getDragAfterElement(taskList, event.clientY);
  if (!afterEl) {
    taskList.appendChild(draggingEl);
  } else if (afterEl !== draggingEl) {
    taskList.insertBefore(draggingEl, afterEl);
  }
});

taskList.addEventListener('drop', (event) => {
  if (!draggedTaskId) return;
  event.preventDefault();
  persistPendingOrderFromDom();
});

taskList.addEventListener('dragend', () => {
  const draggingEl = taskList.querySelector('li.task-item.is-dragging');
  if (draggingEl) draggingEl.classList.remove('is-dragging');
  draggedTaskId = null;
});

// ===== Touch / Pointer reorder (para pantallas táctiles) =====
// HTML5 DnD no es fiable en móvil (especialmente iOS), así que añadimos un fallback por Pointer Events:
// - long-press (~180ms) o arrastre inmediato
// - reordenamiento visual durante el movimiento
// - persistencia al soltar
taskList.addEventListener('pointerdown', (event) => {
  if (!event || typeof event !== 'object') return;
  if (!('pointerType' in event)) return;
  /** @type {PointerEvent} */
  const pe = /** @type {any} */ (event);
  if (!isTouchLikePointer(pe)) return;

  const li = getTaskLiFromPointerEvent(pe);
  if (!li) return;
  if (!canStartDragFromEvent(pe, li)) return;

  // Evitar que el navegador inicie gestos (scroll/zoom) durante reorder.
  // Aun así, no bloqueamos todo: solo cuando se activa el drag.
  const taskId = li.dataset.id;
  if (!taskId) return;

  // Limpiar timer previo si lo hubiera.
  if (touchDragLongPressTimer !== null) {
    clearTimeout(touchDragLongPressTimer);
    touchDragLongPressTimer = null;
  }

  // Long-press para no interferir con scroll.
  touchDragLongPressTimer = window.setTimeout(() => {
    touchDragLongPressTimer = null;
    touchDragState = { id: taskId, li, pointerId: pe.pointerId };
    li.classList.add('is-dragging', 'is-touch-dragging');
    setReorderScrollLock(true);
    try { li.setPointerCapture(pe.pointerId); } catch { /* no-op */ }
  }, 180);
});

taskList.addEventListener('pointermove', (event) => {
  if (!event || typeof event !== 'object') return;
  if (!('pointerType' in event)) return;
  /** @type {PointerEvent} */
  const pe = /** @type {any} */ (event);
  if (!isTouchLikePointer(pe)) return;

  // Si aún no activamos drag, no hacemos nada (permite scroll normal).
  if (!touchDragState) return;
  if (touchDragState.pointerId !== pe.pointerId) return;

  pe.preventDefault();

  const draggingEl = touchDragState.li;
  if (!taskList.contains(draggingEl)) return;

  // Encontrar el <li> objetivo debajo del dedo.
  const elUnder = document.elementFromPoint(pe.clientX, pe.clientY);
  const targetLi = elUnder instanceof Element ? elUnder.closest('li.task-item') : null;
  if (!(targetLi instanceof HTMLLIElement)) return;
  if (targetLi === draggingEl) return;

  // Insertar antes/después según posición del dedo respecto al target.
  const box = targetLi.getBoundingClientRect();
  const before = pe.clientY < (box.top + box.height / 2);
  if (before) {
    taskList.insertBefore(draggingEl, targetLi);
  } else {
    taskList.insertBefore(draggingEl, targetLi.nextSibling);
  }
});

taskList.addEventListener('pointerup', (event) => {
  if (!event || typeof event !== 'object') return;
  if (!('pointerType' in event)) return;
  /** @type {PointerEvent} */
  const pe = /** @type {any} */ (event);
  if (!isTouchLikePointer(pe)) return;

  // Si soltó antes de long-press, cancelar.
  if (touchDragLongPressTimer !== null) {
    clearTimeout(touchDragLongPressTimer);
    touchDragLongPressTimer = null;
  }

  if (!touchDragState) return;
  if (touchDragState.pointerId !== pe.pointerId) return;

  pe.preventDefault();
  persistPendingOrderFromDom();

  touchDragState.li.classList.remove('is-dragging', 'is-touch-dragging');
  try { touchDragState.li.releasePointerCapture(pe.pointerId); } catch { /* no-op */ }
  touchDragState = null;
  setReorderScrollLock(false);
});

taskList.addEventListener('pointercancel', (event) => {
  if (!event || typeof event !== 'object') return;
  if (!('pointerType' in event)) return;
  /** @type {PointerEvent} */
  const pe = /** @type {any} */ (event);
  if (!isTouchLikePointer(pe)) return;

  if (touchDragLongPressTimer !== null) {
    clearTimeout(touchDragLongPressTimer);
    touchDragLongPressTimer = null;
  }
  if (!touchDragState) return;
  if (touchDragState.pointerId !== pe.pointerId) return;

  touchDragState.li.classList.remove('is-dragging', 'is-touch-dragging');
  touchDragState = null;
  setReorderScrollLock(false);
});

// Touch Events fallback (solo si el navegador no usa Pointer Events bien).
// Importante: usamos {passive:false} en move para permitir preventDefault (evitar scroll durante drag).
taskList.addEventListener('touchstart', (event) => {
  // Si Pointer Events ya activó drag, ignorar.
  if (touchDragState) return;
  if (!event.touches || event.touches.length !== 1) return;

  const touch = event.touches[0];
  const target = event.target;
  if (!(target instanceof Element)) return;

  const li = target.closest('li.task-item');
  if (!(li instanceof HTMLLIElement)) return;
  if (!canStartDragFromEvent(event, li)) return;
  const taskId = li.dataset.id;
  if (!taskId) return;

  legacyTouchStartPoint = { x: touch.clientX, y: touch.clientY };

  if (legacyTouchLongPressTimer !== null) {
    clearTimeout(legacyTouchLongPressTimer);
    legacyTouchLongPressTimer = null;
  }

  legacyTouchLongPressTimer = window.setTimeout(() => {
    legacyTouchLongPressTimer = null;
    legacyTouchDragState = { id: taskId, li, touchId: touch.identifier };
    li.classList.add('is-dragging', 'is-touch-dragging');
    setReorderScrollLock(true);
  }, 180);
}, { passive: true });

const onLegacyTouchMoveWindow = (event) => {
  if (touchDragState) return;
  if (!legacyTouchDragState) return;
  if (!event.touches || event.touches.length !== 1) return;

  const touch = event.touches[0];
  if (touch.identifier !== legacyTouchDragState.touchId) return;

  // Clave: bloquear scroll mientras se reordena.
  event.preventDefault();

  const draggingEl = legacyTouchDragState.li;
  if (!taskList.contains(draggingEl)) return;

  const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
  const targetLi = elUnder instanceof Element ? elUnder.closest('li.task-item') : null;
  if (!(targetLi instanceof HTMLLIElement)) return;
  if (targetLi === draggingEl) return;

  const box = targetLi.getBoundingClientRect();
  const before = touch.clientY < (box.top + box.height / 2);
  if (before) taskList.insertBefore(draggingEl, targetLi);
  else taskList.insertBefore(draggingEl, targetLi.nextSibling);
};

const endLegacyTouchDrag = () => {
  if (legacyTouchLongPressTimer !== null) {
    clearTimeout(legacyTouchLongPressTimer);
    legacyTouchLongPressTimer = null;
  }
  legacyTouchStartPoint = null;

  if (!legacyTouchDragState) return;
  persistPendingOrderFromDom();
  legacyTouchDragState.li.classList.remove('is-dragging', 'is-touch-dragging');
  legacyTouchDragState = null;

  window.removeEventListener('touchmove', onLegacyTouchMoveWindow, { capture: true });
  setReorderScrollLock(false);
};

taskList.addEventListener('touchmove', (event) => {
  // Si Pointer Events está manejando, no intervenir.
  if (touchDragState) return;
  if (!event.touches || event.touches.length !== 1) return;

  const touch = event.touches[0];

  // Si aún no activamos drag y el usuario se mueve "mucho", asumimos scroll y cancelamos long-press.
  if (!legacyTouchDragState && legacyTouchLongPressTimer !== null && legacyTouchStartPoint) {
    const dx = Math.abs(touch.clientX - legacyTouchStartPoint.x);
    const dy = Math.abs(touch.clientY - legacyTouchStartPoint.y);
    if (dx + dy > 10) {
      clearTimeout(legacyTouchLongPressTimer);
      legacyTouchLongPressTimer = null;
      legacyTouchStartPoint = null;
    }
    return;
  }

  // Si ya está activo el drag, dejar que el listener global maneje el movimiento.
  if (legacyTouchDragState) {
    // Asegurar que capturamos el movimiento aunque el dedo salga de la lista.
    window.addEventListener('touchmove', onLegacyTouchMoveWindow, { passive: false, capture: true });
    onLegacyTouchMoveWindow(event);
  }
}, { passive: false });

taskList.addEventListener('touchend', (event) => {
  if (touchDragState) return;

  // Si soltó antes de activar long-press, cancelar timer.
  if (legacyTouchLongPressTimer !== null) {
    clearTimeout(legacyTouchLongPressTimer);
    legacyTouchLongPressTimer = null;
  }
  legacyTouchStartPoint = null;

  if (!legacyTouchDragState) return;
  endLegacyTouchDrag();
}, { passive: true });

taskList.addEventListener('touchcancel', () => {
  if (touchDragState) return;
  if (legacyTouchLongPressTimer !== null) {
    clearTimeout(legacyTouchLongPressTimer);
    legacyTouchLongPressTimer = null;
  }
  legacyTouchStartPoint = null;
  if (!legacyTouchDragState) return;
  legacyTouchDragState.li.classList.remove('is-dragging', 'is-touch-dragging');
  legacyTouchDragState = null;
  window.removeEventListener('touchmove', onLegacyTouchMoveWindow, { capture: true });
  setReorderScrollLock(false);
}, { passive: true });

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

// Edición rápida: doble clic sobre el texto de la tarea
// entra en modo edición igual que el botón de lápiz.
taskList.addEventListener('dblclick', function(event) {
  const span = event.target.closest('span');
  if (!span) return;
  const li = span.closest('li');
  if (!li) return;
  if (li.dataset.editing === 'true') return;
  startEdit(li);
});

// ===== Crear el elemento <li> de una tarea (utilidad compartida) =====
/**
 * Crea y añade al DOM el elemento `<li>` para una tarea.
 * @param {Task|string} taskOrText
 * @returns {HTMLLIElement}
 */
function createTaskElement(taskOrText) {
  const task = typeof taskOrText === 'string'
    ? createTask(taskOrText, activeProjectId ?? '')
    : taskOrText;

  // Creamos el <li> con clases (Tailwind) y estado inicial para animación de entrada.
  const li = document.createElement('li');
  li.classList.add('task-item', 'opacity-0', 'translate-x-4');

  // Asociamos el id de la tarea al elemento DOM.
  li.dataset.id = task.id;

  // Permite arrastrar para reordenar.
  // Evitamos iniciar drag desde botones/inputs y mientras se edita (ver listeners abajo).
  li.draggable = true;

  // Botón de borrar (lleva dentro una imagen como icono).
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn', 'icon-btn');

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
  editBtn.classList.add('edit-btn', 'icon-btn');
  editBtn.setAttribute('aria-label', 'Editar');
  editBtn.title = 'Editar';

  // Icono SVG compartido (mismo que en proyectos)
  editBtn.appendChild(createEditIconSvg());

  
  // Botón "mover a proyecto"
  const moveBtn = document.createElement('button');
  moveBtn.type = 'button';
  moveBtn.classList.add('move-btn', 'icon-btn');
  moveBtn.setAttribute('aria-label', 'Mover');
  moveBtn.title = 'Mover a proyecto';

  // Icono SVG estilo "csv file-transfer-line": documento con flecha de transferencia.
  const transferSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  transferSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  transferSvg.setAttribute('viewBox', '0 0 16 16');
  transferSvg.setAttribute('fill', 'none');
  transferSvg.setAttribute('width', '16');
  transferSvg.setAttribute('height', '16');

  // Contorno del documento
  const docPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  docPath.setAttribute(
    'd',
    'M4 2.5A1.5 1.5 0 0 1 5.5 1h3.086a1.5 1.5 0 0 1 1.06.44L12.56 4.354A1.5 1.5 0 0 1 13 5.414V13.5A1.5 1.5 0 0 1 11.5 15h-6A1.5 1.5 0 0 1 4 13.5z'
  );
  docPath.setAttribute('stroke', 'currentColor');
  docPath.setAttribute('stroke-width', '1.2');
  docPath.setAttribute('stroke-linecap', 'round');
  docPath.setAttribute('stroke-linejoin', 'round');

  // Flecha de transferencia (derecha)
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M5 8h5m0 0-1.5-1.5M10 8 8.5 9.5');
  arrowPath.setAttribute('stroke', 'currentColor');
  arrowPath.setAttribute('stroke-width', '1.4');
  arrowPath.setAttribute('stroke-linecap', 'round');
  arrowPath.setAttribute('stroke-linejoin', 'round');

  transferSvg.appendChild(docPath);
  transferSvg.appendChild(arrowPath);
  moveBtn.appendChild(transferSvg);

  // Montamos la estructura final: [botón borrar] + [texto] + [mover] + [editar]
  li.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(moveBtn);
  li.appendChild(editBtn);

  // Insertamos en la lista
  taskList.appendChild(li);

  // Animación de entrada (se aplica después de insertar)
  setTimeout(() => {
    li.classList.remove('opacity-0', 'translate-x-4');
  }, 10);

  return li;
}

/**
 * Devuelve true si este evento debería iniciar drag.
 * Evita drag al interactuar con botones/inputs o mientras se edita.
 * @param {Event} event
 * @param {HTMLLIElement} li
 * @returns {boolean}
 */
function canStartDragFromEvent(event, li) {
  if (!li || li.dataset.editing === 'true') return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest('button')) return false;
  if (target.closest('input, textarea, select')) return false;
  return true;
}

/**
 * Reordena el array `tasks` (solo proyecto activo) según el orden del DOM.
 * @returns {void}
 */
function persistPendingOrderFromDom() {
  if (!activeProjectId || !taskList) return;

  const idsInDomOrder = Array.from(taskList.querySelectorAll('li[data-id]'))
    .map(li => li.dataset.id)
    .filter(Boolean);

  if (idsInDomOrder.length === 0) return;

  const rank = new Map(idsInDomOrder.map((id, idx) => [id, idx]));

  const inProject = [];
  const outsideProject = [];
  tasks.forEach((t) => {
    if (t.projectId === activeProjectId) inProject.push(t);
    else outsideProject.push(t);
  });

  inProject.sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Number.POSITIVE_INFINITY;
    const rb = rank.has(b.id) ? rank.get(b.id) : Number.POSITIVE_INFINITY;
    return ra - rb;
  });

  tasks = outsideProject.concat(inProject);
  saveState();
}

/**
 * Dado el puntero y el contenedor, obtiene el <li> "más cercano" para insertar antes.
 * @param {HTMLElement} container
 * @param {number} clientY
 * @returns {HTMLLIElement|null}
 */
function getDragAfterElement(container, clientY) {
  const draggableElements = Array.from(container.querySelectorAll('li.task-item:not(.is-dragging)'));
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  draggableElements.forEach((child) => {
    const box = child.getBoundingClientRect();
    const offset = clientY - (box.top + box.height / 2);
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: child };
    }
  });

  return /** @type {HTMLLIElement|null} */ (closest.element);
}

/**
 * @param {PointerEvent} event
 * @returns {boolean}
 */
function isTouchLikePointer(event) {
  // En iOS Safari a veces pointerType puede venir vacío/undefined en algunos casos raros,
  // pero si es un PointerEvent, tratamos "pen/touch" como táctil.
  return event.pointerType === 'touch' || event.pointerType === 'pen';
}

/**
 * @param {PointerEvent} event
 * @returns {HTMLLIElement|null}
 */
function getTaskLiFromPointerEvent(event) {
  const t = event.target;
  if (!(t instanceof Element)) return null;
  const li = t.closest('li.task-item');
  return li instanceof HTMLLIElement ? li : null;
}

// ===== Crear el elemento <li> de una tarea completada (solo UI) =====
/**
 * Renderiza una tarea completada (tachada) en la lista inferior.
 * @param {Task} task
 * @returns {HTMLLIElement|null}
 */
function createCompletedTaskElement(task) {
  const list = completedList ?? ensureCompletedList();
  if (!list) return null;

  // Creamos un <li> similar al de pendientes, pero:
  // - el texto va tachado (completada)
  // - no incluimos "editar" ni "borrar", solo "volver a pendientes"
  const li = document.createElement('li');
  li.classList.add('task-item', 'opacity-0', 'translate-x-4');
  li.dataset.id = task.id;

  const span = document.createElement('span');
  span.textContent = task.text;
  span.classList.add('flex-1', 'text-inherit', 'line-through', 'opacity-70');

  // Botón para devolver la tarea a pendientes.
  // Mantiene la misma configuración visual que el botón "Editar" en pendientes,
  // cambiando únicamente el icono (arrow-go-back) y la intención (restore).
  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.classList.add('restore-btn', 'icon-btn');
  restoreBtn.setAttribute('aria-label', 'Volver a pendientes');
  restoreBtn.title = 'Volver a pendientes';

  // Icono SVG (Bootstrap) - arrow-go-back (estilo similar al de editar)
  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  arrowSvg.setAttribute('viewBox', '0 0 16 16');
  arrowSvg.setAttribute('fill', 'currentColor');
  arrowSvg.classList.add('w-[18px]', 'h-[18px]');

  const arrowPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath1.setAttribute('d', 'M7.854 4.146a.5.5 0 0 1 0 .708L5.707 7H11.5a3.5 3.5 0 1 1 0 7h-6a.5.5 0 0 1 0-1h6a2.5 2.5 0 0 0 0-5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z');
  arrowSvg.appendChild(arrowPath1);
  restoreBtn.appendChild(arrowSvg);

  li.appendChild(span);
  li.appendChild(restoreBtn);
  list.appendChild(li);

  // Mostrar/ocultar sección según haya elementos.
  updateCompletedVisibility();

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
  inputEl.classList.add('edit-input', 'field', 'flex-1');

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
  saveState();

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

// Clic fuera de la entrada de edición: equivalente a pulsar Escape.
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!taskList) return;

  // ¿Hay alguna tarea en modo edición?
  const editingLi = taskList.querySelector('li[data-editing="true"]');
  if (!editingLi) return;

  // Si el clic es dentro del propio <li> (incluyendo el input o sus botones), no cancelamos aquí.
  if (editingLi.contains(target)) return;

  // Clic fuera de la tarea que se está editando: cancelar como si fuera Escape.
  cancelEdit(editingLi);
}, true);

// ===== Crear y añadir una tarea nueva desde el input =====
/**
 * Lee el input, crea la tarea, la renderiza y persiste.
 * @returns {void}
 */
function addTask() {
  // Leemos el texto, quitando espacios de inicio/fin.
  const text = input.value.trim();
  if (text === "") return;

  if (!activeProjectId) return;
  const task = createTask(text, activeProjectId);
  tasks.push(task);
  createTaskElement(task);
  saveState();
  input.value = "";
  updateSearchVisibility();
  updatePendingVisibility();
}

// ===== Persistencia (localStorage) =====
// Guardamos un único objeto (state v2) para poder soportar:
// - múltiples proyectos (cada tarea pertenece a un proyecto)
// - migraciones futuras (versionado por `schemaVersion`)
function saveState() {
  const state = {
    schemaVersion: SCHEMA_VERSION,
    projects,
    tasks,
    ui: { activeProjectId }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Mantener sincronizado el almacenamiento legacy que pueden seguir usando
  // algunos tests o entornos antiguos.
  try {
    const legacyTasks = tasks.map(t => ({
      id: t.id,
      text: t.text,
      projectId: t.projectId
    }));
    localStorage.setItem(LEGACY_TASKS_KEY, JSON.stringify(legacyTasks));
  } catch {
    // Si algo falla (por ejemplo, localStorage no disponible en el entorno
    // de test), no rompemos el flujo principal de guardado.
  }
}

// Backward-compatible aliases (tests / legacy harness).
function saveTasks() {
  saveState();
}

function clearLegacyIfMigrated() {
  // Mantener por compatibilidad: no borramos siempre, pero evitamos inconsistencias.
  // Si existe el state nuevo, dejamos el legacy como fallback histórico.
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.schemaVersion === SCHEMA_VERSION) {
        projects = Array.isArray(parsed.projects) ? parsed.projects : [];
        tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        activeProjectId = parsed.ui?.activeProjectId ?? null;
        return;
      }
    } catch {
      // si el JSON está corrupto, caemos a migración/estado vacío
    }
  }

  // Migración desde la versión antigua: localStorage.tasks
  // Antes NextUp guardaba únicamente tareas. Para no perder datos:
  // - creamos un proyecto por defecto
  // - asignamos `projectId` a todas las tareas legacy
  const legacy = localStorage.getItem(LEGACY_TASKS_KEY);
  const defaultProject = createProject('Mi proyecto');
  projects = [defaultProject];
  activeProjectId = defaultProject.id;

  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        tasks = parsed.map(text => createTask(String(text), defaultProject.id));
      } else if (Array.isArray(parsed)) {
        // Soporta objetos antiguos {id,text} sin projectId
        tasks = parsed.map(t => {
          const text = typeof t?.text === 'string' ? t.text : String(t);
          const id = typeof t?.id === 'string' ? t.id : generateId();
          return { id, text, projectId: defaultProject.id };
        });
      } else {
        tasks = [];
      }
    } catch {
      tasks = [];
    }
  } else {
    tasks = [];
  }

  saveState();
  clearLegacyIfMigrated();
}

// Backward-compatible alias (tests / legacy harness).
function loadTasks() {
  loadState();
  ensureAtLeastOneProject();
  renderProjects();
  setActiveProjectId(activeProjectId);
}

/**
 * Garantiza que siempre exista al menos un proyecto y que `activeProjectId`
 * apunte a un proyecto válido.
 * @returns {void}
 */
function ensureAtLeastOneProject() {
  // La app siempre necesita un proyecto activo. Si no hay ninguno:
  // - creamos uno por defecto y lo activamos
  if (projects.length === 0) {
    const p = createProject('Mi proyecto');
    projects = [p];
    activeProjectId = p.id;
  }
  if (!activeProjectId || !projects.some(p => p.id === activeProjectId)) {
    activeProjectId = projects[0]?.id ?? null;
  }
}

/**
 * Renderiza la lista de proyectos (desktop + móvil) y sincroniza:
 * - marcado de proyecto activo
 * - botones de renombrar/eliminar
 * @returns {void}
 */
function renderProjects() {
  // Eliminar proyecto implica borrar todas sus tareas:
  // - pendientes (persistidas)
  // - completadas de sesión (UI)
  const deleteProjectById = (id) => {
    projects = projects.filter(pr => pr.id !== id);
    tasks = tasks.filter(t => t.projectId !== id);
    completedTasks = completedTasks.filter(t => t.projectId !== id);

    ensureAtLeastOneProject();
    saveState();
    setActiveProjectId(activeProjectId);
  };

  const renderInto = (ul) => {
    if (!ul) return;
    ul.innerHTML = '';

    projects
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((p) => {
        const li = document.createElement('li');
        li.className = 'project-row';

        const isInDrawerList = ul === projectListMobileEl;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `project-btn truncate${p.id === activeProjectId ? ' is-active' : ''}`;
        btn.textContent = p.name;

        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.className = 'icon-btn project-edit-btn';
        renameBtn.title = 'Renombrar';
        renameBtn.setAttribute('aria-label', 'Renombrar');

        // Icono de lápiz (mismo dibujo que en el botón de editar tareas),
        // creado directamente con createElementNS y tamaño fijo.
        const projEditSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        projEditSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        projEditSvg.setAttribute('viewBox', '0 0 16 16');
        projEditSvg.setAttribute('fill', 'currentColor');
        projEditSvg.setAttribute('width', '18');
        projEditSvg.setAttribute('height', '18');

        const projPencilPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        projPencilPath1.setAttribute('d', 'M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708z');

        const projPencilPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        projPencilPath2.setAttribute('d', 'M.5 13.5V16h2.5l7.373-7.373-2.5-2.5zM11.207 2.5l2.5 2.5-1 1-2.5-2.5z');

        projEditSvg.appendChild(projPencilPath1);
        projEditSvg.appendChild(projPencilPath2);
        renameBtn.appendChild(projEditSvg);

        // Renombrado vía modal (compatibilidad con test-runner)
        const handleRenameWithModal = () => {
          const wasDrawerOpen = isInDrawerList && projectDrawerEl && !projectDrawerEl.classList.contains('hidden');
          if (wasDrawerOpen) {
            closeProjectDrawer();
          }
          openProjectNameModal({ title: 'Renombrar proyecto', submitLabel: 'Guardar', initialValue: p.name })
            .then((trimmed) => {
              if (!trimmed) {
                if (wasDrawerOpen) {
                  openProjectDrawer();
                }
                return;
              }
              p.name = trimmed;
              saveState();
              renderProjects();
              const active = getActiveProject();
              updateActiveProjectNameLabels(active?.name ?? '—');
              if (wasDrawerOpen) {
                openProjectDrawer();
              }
            });
        };

        // Renombrado inline (UX mejorada para la app principal)
        const handleRenameInline = () => {
          if (li.dataset.editing === 'true') return;
          li.dataset.editing = 'true';

          const originalName = p.name;

          const input = document.createElement('input');
          input.type = 'text';
          input.value = originalName;
          input.classList.add('field', 'w-full', 'project-edit-input');

          li.replaceChild(input, btn);

          const finish = (nextName) => {
            if (li.dataset.editing !== 'true') return;
            li.dataset.editing = 'false';

            const trimmed = String(nextName ?? '').trim();
            li.replaceChild(btn, input);

            if (!trimmed || trimmed === originalName) return;

            p.name = trimmed;
            saveState();
            renderProjects();
            const active = getActiveProject();
            updateActiveProjectNameLabels(active?.name ?? '—');
          };

          const cancel = () => {
            if (li.dataset.editing !== 'true') return;
            li.dataset.editing = 'false';
            li.replaceChild(btn, input);
          };

          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              finish(input.value);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          });

          input.addEventListener('blur', () => {
            finish(input.value);
          });

          input.focus();
          input.setSelectionRange(0, input.value.length);
        };

        const handleRename = inlineProjectRename ? handleRenameInline : handleRenameWithModal;

        // Botón lápiz: renombrar (visible sobre todo en móvil).
        renameBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleRename();
        });

        // Click en el proyecto:
        // - 1 clic: cambiar proyecto activo
        // - 2 clics (detalle === 2): entrar en modo edición inline
        btn.addEventListener('click', (e) => {
          if (li.dataset.editing === 'true') return;
          if (e.detail === 2) {
            e.preventDefault();
            e.stopPropagation();
            handleRename();
            return;
          }
          setActiveProjectId(p.id);
          closeProjectDrawer();
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        // En claro se mantiene rojo; en oscuro igual que el resto.
        delBtn.className = 'icon-btn text-red-600';
        delBtn.title = 'Eliminar';
        delBtn.setAttribute('aria-label', 'Eliminar');

        // Icono SVG tipo "delete-bin-line", creado con createElementNS y tamaño fijo.
        const trashSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        trashSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        trashSvg.setAttribute('viewBox', '0 0 16 16');
        trashSvg.setAttribute('fill', 'none');
        trashSvg.setAttribute('width', '18');
        trashSvg.setAttribute('height', '18');

        const trashPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trashPath.setAttribute('d', 'M5.5 5.5V12M8 5.5V12M10.5 5.5V12M3 3.5h10M6 2h4l1 1.5H5L6 2zM4 3.5L4.5 13a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1L12 3.5');
        trashPath.setAttribute('stroke', 'currentColor');
        trashPath.setAttribute('stroke-width', '1.4');
        trashPath.setAttribute('stroke-linecap', 'round');
        trashPath.setAttribute('stroke-linejoin', 'round');

        trashSvg.appendChild(trashPath);
        delBtn.appendChild(trashSvg);
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasDrawerOpen = isInDrawerList && projectDrawerEl && !projectDrawerEl.classList.contains('hidden');
          if (wasDrawerOpen) {
            closeProjectDrawer();
          }
          openConfirmModal({
            message: `¿Eliminar ${p.name}?`,
            acceptLabel: 'Eliminar',
            cancelLabel: 'Cancelar'
          }).then((ok) => {
            if (!ok) {
              if (wasDrawerOpen) {
                openProjectDrawer();
              }
              return;
            }
            // Borrado confirmado: elimina proyecto y todas sus tareas.
            deleteProjectById(p.id);
            if (wasDrawerOpen) {
              openProjectDrawer();
            }
          });
        });

        li.appendChild(btn);
        li.appendChild(renameBtn);
        li.appendChild(delBtn);
        ul.appendChild(li);
      });
  };

  renderInto(projectListEl);
  renderInto(projectListMobileEl);

  // Sincronizar dropdown móvil (cambio rápido de proyecto).
  if (projectSelectMobileEl) {
    projectSelectMobileEl.innerHTML = '';
    projects
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((p) => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        if (p.id === activeProjectId) option.selected = true;
        projectSelectMobileEl.appendChild(option);
      });
  }
}

/**
 * Crea un proyecto nuevo a través del modal centrado,
 * lo persiste y lo marca como activo.
 * @returns {void}
 */
function addProjectFromPrompt() {
  // Modo inline (app principal): crear proyecto directamente en la lista como un input editable.
  if (inlineProjectRename && (projectListEl || projectListMobileEl)) {
    const wasDrawerOpen = projectDrawerEl && !projectDrawerEl.classList.contains('hidden');
    const targetUl = wasDrawerOpen && projectListMobileEl ? projectListMobileEl : projectListEl;
    if (!targetUl) return;

    // Evitar múltiples ediciones concurrentes.
    const existingEditing = targetUl.querySelector('li[data-editing="true"]');
    if (existingEditing) return;

    const li = document.createElement('li');
    li.className = 'project-row';
    li.dataset.editing = 'true';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nuevo proyecto...';
    input.classList.add('field', 'w-full', 'project-edit-input');

    li.appendChild(input);
    targetUl.insertBefore(li, targetUl.firstChild);

    const finish = (value) => {
      if (li.dataset.editing !== 'true') return;
      li.dataset.editing = 'false';

      const name = String(value ?? '').trim();
      if (!name) {
        li.remove();
        return;
      }

      const p = createProject(name);
      projects.push(p);
      saveState();
      setActiveProjectId(p.id);
    };

    const cancel = () => {
      if (li.dataset.editing !== 'true') return;
      li.dataset.editing = 'false';
      li.remove();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(input.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    input.addEventListener('blur', () => {
      finish(input.value);
    });

    input.focus();
    input.setSelectionRange(0, input.value.length);
    return;
  }

  // Modo modal (test-runner y compatibilidad): abrir modal centrado como antes.
  const wasDrawerOpen = projectDrawerEl && !projectDrawerEl.classList.contains('hidden');
  if (wasDrawerOpen) {
    closeProjectDrawer();
  }
  openProjectNameModal({ title: 'Crear proyecto', submitLabel: 'Crear', initialValue: '' })
    .then((trimmed) => {
      if (!trimmed) {
        if (wasDrawerOpen) {
          openProjectDrawer();
        }
        return;
      }
      const p = createProject(trimmed);
      projects.push(p);
      saveState();
      setActiveProjectId(p.id);
      if (wasDrawerOpen) {
        openProjectDrawer();
      }
    });
}

/**
 * Renderiza las tareas pendientes y completadas del proyecto activo
 * y aplica visibilidad correcta (completadas + filtro de búsqueda).
 * @returns {void}
 */
function renderTasksForActiveProject() {
  // Render “por proyecto”: la UI muestra solo las tareas del proyecto activo.
  taskList.innerHTML = '';
  const completed = document.getElementById('completed');
  if (completed) completed.innerHTML = '';

  getVisiblePendingTasks().forEach(task => createTaskElement(task));
  getVisibleCompletedTasks().forEach(task => createCompletedTaskElement(task));

  updateCompletedVisibility();
  filterTasks();
  updateSearchVisibility();
  updatePendingVisibility();
}

// ===== Filtro/búsqueda =====
// Muestra/oculta cada <li> según si su texto contiene lo que se escribe en el buscador.
/**
 * Filtra tareas en el DOM según el valor de `#search`.
 * @returns {void}
 */
function filterTasks() {
  const searchText = searchInput.value.toLowerCase();
  const pendingItems = taskList.getElementsByTagName('li');
  const completed = document.getElementById('completed');
  const completedItems = completed ? completed.getElementsByTagName('li') : [];
  const messageEl = ensureNoResultsElement();
  let matchCount = 0;

  const applyFilter = (li) => {
    const span = li.querySelector('span');
    const editInput = li.querySelector('.edit-input');
    const taskTextRaw = (span?.textContent ?? editInput?.value ?? '').toLowerCase();
    const matches = taskTextRaw.includes(searchText);
    if (matches) matchCount += 1;
    li.classList.toggle('hidden', !matches);
    li.style.display = matches ? 'flex' : 'none';
  };

  Array.from(pendingItems).forEach(applyFilter);
  Array.from(completedItems).forEach(applyFilter);

  if (messageEl) {
    const hasQuery = searchText.trim().length > 0;
    const show = hasQuery && matchCount === 0;
    messageEl.style.display = show ? 'block' : 'none';
  }
}

// ===== Inicialización =====
// Al cargar la página, restauramos las tareas guardadas.
loadState();
ensureAtLeastOneProject();

// Wire de UI de proyectos (si existe en el HTML)
projectAddBtn?.addEventListener('click', addProjectFromPrompt);
projectAddMobileBtn?.addEventListener('click', addProjectFromPrompt);
projectDrawerOpenBtn?.addEventListener('click', openProjectDrawer);
projectDrawerCloseBtn?.addEventListener('click', closeProjectDrawer);
projectDrawerBackdropEl?.addEventListener('click', closeProjectDrawer);
projectSelectMobileEl?.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  if (!target.value) return;
  setActiveProjectId(target.value);
});

// En pantallas grandes el drawer no se usa; al redimensionar a desktop, cerrarlo.
window.addEventListener('resize', () => {
  if (window.innerWidth >= MOBILE_BREAKPOINT_PX && projectDrawerEl && !projectDrawerEl.classList.contains('hidden')) {
    closeProjectDrawer();
  }
});

// Cerrar/cancelar todos los popups al hacer clic fuera de cualquier panel.
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  // Si el clic ha sido dentro de algún panel de popup, no hacemos nada.
  if (target.closest('#project-drawer-content, #project-modal-panel, #move-task-modal-panel, #confirm-modal-panel')) {
    return;
  }

  // Drawer de proyectos
  if (projectDrawerEl && !projectDrawerEl.classList.contains('hidden')) {
    closeProjectDrawer();
  }

  // Modal crear/renombrar proyecto
  projectModalCancelBtn?.click();

  // Modal mover tarea
  moveTaskModalCancelBtn?.click();

  // Modal de confirmación genérico
  const confirmCancelBtn = document.getElementById('confirm-modal-cancel');
  confirmCancelBtn?.click();
}, true);

renderProjects();
setActiveProjectId(activeProjectId);

